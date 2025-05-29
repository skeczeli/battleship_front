import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import GameBoard from "components/Board";
import { useUser } from "contexts/UserContext";
import "styles/game.css";

function BotsGame() {
  const { gameId } = useParams();
  const { user, playerId, isReady } = useUser();
  const navigate = useNavigate();

  const [playerBoard, setPlayerBoard] = useState(null);
  const [opponentBoard, setOpponentBoard] = useState(null);
  const [sunkShips, setSunkShips] = useState({ player: [], opponent: [] });
  const [lastShot, setLastShot] = useState(null);
  const [gameStatus, setGameStatus] = useState("Cargando...");
  const [isPlayerTurn, setIsPlayerTurn] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);

  const stompClient = useRef(null);
  const stompInitialized = useRef(false);
  const socket = useRef(null);

  const mapBoardToNames = (board) => {
    const shipIdToName = {
      1: "portaaviones",
      2: "acorazado",
      3: "submarino",
      4: "destructor",
      5: "lancha",
    };
    return board.map((row) =>
      row.map((cell) => {
        if (cell === null) return null;
        if (cell === 0) return "miss";
        if (cell < 0) return "hit";
        return shipIdToName[cell] ?? null;
      })
    );
  };

  const handleGameOver = (winnerId) => {
    setGameOver(true);
    setWinner(winnerId === playerId);
    setGameStatus(winnerId === playerId ? "¡Ganaste!" : "¡Perdiste!");
    sessionStorage.removeItem("playerBoard"); // remove?
  };

  const handleShotResult = useCallback(
    (data) => {
      console.log("🔵 Resultado del disparo recibido:", data);
      setOpponentBoard((prev) => {
        const updated = prev.map((row, r) =>
          row.map((cell, c) =>
            r === data.row && c === data.col ? data.hit : cell
          )
        );
        return updated;
      });

      if (data.shipSunk) {
        setSunkShips((prev) => ({
          ...prev,
          opponent: [...prev.opponent, data.shipId],
        }));
      }

      setLastShot({
        row: data.row,
        col: data.col,
        hit: data.hit,
        player: "player",
        message: data.shipSunk ? "¡Hundiste un barco!" : undefined,
      });

      if (data.gameOver && winner) return handleGameOver(data.winner);

      // Turno del bot
      setTimeout(() => {
        setPlayerBoard((prev) => {
          const updated = prev.map((row, r) =>
            row.map((cell, c) =>
              r === data.rowBot && c === data.colBot ? data.hitBot : cell
            )
          );
          return updated;
        });

        if (data.shipSunkBot) {
          setSunkShips((prev) => ({
            ...prev,
            player: [...prev.player, data.shipIdBot],
          }));
        }

        setLastShot({
          row: data.rowBot,
          col: data.colBot,
          hit: data.hitBot,
          player: "opponent",
          message: data.shipSunkBot
            ? "¡El oponente hundió tu barco!"
            : undefined,
        });

        if (data.gameOver) return handleGameOver(data.winner);

        setIsPlayerTurn(true);
        setGameStatus("Tu turno");
      }, 100);
    },
    [playerId]
  );

  useEffect(() => {
    if (!isReady || !gameId || !playerId || stompInitialized.current) return;

    stompInitialized.current = true;
    console.log(`Conectando al juego ${gameId} como jugador ${playerId}`);

    socket.current = new SockJS("http://localhost:8080/ws");
    const client = new Client({
      webSocketFactory: () => socket.current,
      reconnectDelay: 5000,
    });

    client.onConnect = () => {
      console.log("🟢 WebSocket conectado");

      client.subscribe(`/topic/game/${gameId}`, (message) => {
        const data = JSON.parse(message.body);
        handleShotResult(data);
      });

      // ⚠️ Hacer el fetch *después* de establecer conexión WebSocket
      fetch(`http://localhost:8080/api/game/resume/${gameId}/${playerId}`)
        .then((res) => res.json())
        .then((data) => {
          setPlayerBoard(mapBoardToNames(data.playerBoard));
          setOpponentBoard(data.botBoard);
          setSunkShips(data.sunkShips);
          setGameOver(data.gameOver);
          setWinner(data.winner === playerId);
          setLastShot(data.lastShot || null);
          setIsPlayerTurn(data.turn === playerId && !data.gameOver);
          setGameStatus(
            data.gameOver
              ? "Juego terminado"
              : data.turn === playerId
              ? "Tu turno"
              : "Turno del bot"
          );
          console.log("🟢 Juego reanudado:", data);
        })
        .catch((err) => {
          console.error("🔴 Error al reanudar:", err);
          setGameStatus("Error al cargar el juego");
        });
    };

    client.onStompError = (err) => {
      console.error("🔴 STOMP error:", err);
    };

    client.activate();
    stompClient.current = client;

    return () => {
      stompClient.current?.deactivate();
      stompClient.current = null;
      stompInitialized.current = false;
    };
  }, [isReady, gameId, playerId, handleShotResult]);

  const handleCellClick = (row, col) => {
    if (
      !isPlayerTurn ||
      gameOver ||
      ["hit", "miss"].includes(opponentBoard?.[row]?.[col])
    )
      return;

    stompClient.current?.publish({
      destination: `/app/game/${gameId}/shot`,
      body: JSON.stringify({ row, col, playerId, gameId }),
    });

    setIsPlayerTurn(false);
    setGameStatus("Esperando respuesta...");
  };

  const handleExitGame = () => {
    stompClient.current?.publish({
      destination: `/app/game/bot/${gameId}/abandon`,
      body: JSON.stringify({ playerId, gameId }),
    });
    stompClient.current?.deactivate();
    sessionStorage.removeItem("playerBoard"); // remove?
    navigate("/");
  };

  const renderLastShot = () => {
    if (!lastShot) return null;

    const { row, col, hit, player, message } = lastShot;
    const isHit = hit === "hit";
    const resultText = isHit ? "¡Impacto!" : "Agua";
    const playerText =
      player === "player" ? "Tu disparo" : "Disparo del oponente";
    const position = `[${String.fromCharCode(65 + col)}${row + 1}]`;

    return (
      <div className="last-shot">
        <p>
          {playerText} en {position}:{" "}
          <span className={isHit ? "hit" : "miss"}>{resultText}</span>
        </p>
        {message && <p className="shot-message">{message}</p>}
      </div>
    );
  };

  const renderShipCounter = () => {
    const totalShips = 5;
    return (
      <div className="ship-counter">
        <div className="player-counter">
          <p>
            Tus barcos hundidos:{" "}
            <span className="counter">
              {sunkShips.player.length}/{totalShips}
            </span>
          </p>
        </div>
        <div className="opponent-counter">
          <p>
            Barcos enemigos hundidos:{" "}
            <span className="counter">
              {sunkShips.opponent.length}/{totalShips}
            </span>
          </p>
        </div>
      </div>
    );
  };

  if (!isReady || !playerBoard || !opponentBoard) {
    return (
      <div className="game-container">
        <h2>Cargando juego...</h2>
      </div>
    );
  }

  return (
    <div className="game-container">
      <h2>Batalla Naval - Modo Bot</h2>

      <div className="player-info">
        <p>
          Jugando como:{" "}
          <span className={user ? "auth-player" : "guest-player"}>
            {user?.username || "Invitado"}
          </span>
        </p>
      </div>

      <div className="game-status">
        <p className={gameOver ? (winner ? "win-status" : "lose-status") : ""}>
          {gameStatus}
        </p>
      </div>

      {renderShipCounter()}

      <div className="boards-container">
        <div className="board-section">
          <h3>Tu tablero</h3>
          <GameBoard
            board={playerBoard}
            isPlayerBoard={true}
            onCellClick={() => {}}
            sunkShips={sunkShips.player}
          />
        </div>

        <div className="board-section">
          <h3>Tablero del oponente</h3>
          <GameBoard
            board={opponentBoard}
            isPlayerBoard={false}
            onCellClick={handleCellClick}
            isPlayerTurn={isPlayerTurn && !gameOver}
            sunkShips={sunkShips.opponent}
          />
        </div>
      </div>

      {renderLastShot()}

      {gameOver ? (
        <div className="game-over">
          <h3>
            {winner ? "¡Felicidades! Has ganado" : "Has perdido esta vez"}
          </h3>
          <button onClick={handleExitGame} className="exit-button">
            Salir
          </button>
        </div>
      ) : (
        <button onClick={handleExitGame} className="exit-button">
          Abandonar juego
        </button>
      )}
    </div>
  );
}

export default BotsGame;
