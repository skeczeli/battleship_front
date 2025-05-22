import React, { useState, useEffect, useRef } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import GameBoard from "components/Board";
import { useUser } from "contexts/UserContext";
import "styles/game.css";

function BotsGame() {
  const location = useLocation();
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { user, playerId, isReady } = useUser();

  const initialPlayerBoard =
    location.state?.playerBoard ||
    JSON.parse(sessionStorage.getItem("playerBoard") || "null");

  const [playerBoard, setPlayerBoard] = useState(initialPlayerBoard || null);
  const [opponentBoard, setOpponentBoard] = useState(
    Array(10)
      .fill()
      .map(() => Array(10).fill(null))
  );

  const [gameStatus, setGameStatus] = useState("Conectando...");
  const [isPlayerTurn, setIsPlayerTurn] = useState(false);
  const [lastShot, setLastShot] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [sunkShips, setSunkShips] = useState({ player: [], opponent: [] });

  const stompClient = useRef(null);
  const connectedRef = useRef(false);

  useEffect(() => {
    if (!isReady) return;

    if (!playerId) {
      alert("Identidad del jugador no disponible");
      navigate("/play-mode/bots/setup");
      return;
    }

    if (!initialPlayerBoard) {
      alert("No hay configuración de tablero.");
      navigate("/play-mode/bots/setup");
      return;
    }

    if (!gameId) {
      alert("ID de juego no disponible");
      navigate("/play-mode/bots/setup");
      return;
    }
  }, [isReady, playerId, initialPlayerBoard, gameId, navigate]);

  useEffect(() => {
    if (!isReady || !initialPlayerBoard || !gameId || !playerId) return;
    if (connectedRef.current) return;
    connectedRef.current = true;

    console.log(`Conectando al juego ${gameId} como jugador ${playerId}`);

    const socket = new SockJS("http://localhost:8080/ws");

    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    const handleShotResult = (data) => {
      const newOpponentBoard = [...opponentBoard];
      const { row, col, hit, gameOver, winner } = data;
      newOpponentBoard[row][col] = hit;
      setOpponentBoard(newOpponentBoard);

      console.log(data);

      if (data.shipSunk) {
        setSunkShips((prev) => ({
          ...prev,
          opponent: [...prev.opponent, data.shipId],
        }));
      }

      setLastShot({
        row,
        col,
        hit,
        player: "player",
        message: data.shipSunk ? "¡Hundiste un barco!" : undefined,
      });

      if (gameOver) {
        handleGameOver(winner);
        return;
      }

      setTimeout(() => {
        const newPlayerBoard = [...playerBoard];
        const { rowBot, colBot, hitBot, gameOverBot } = data;
        newPlayerBoard[rowBot][colBot] = hitBot;
        setPlayerBoard(newPlayerBoard);

        if (data.shipSunkBot) {
          setSunkShips((prev) => ({
            ...prev,
            player: [...prev.player, data.shipIdBot],
          }));
        }

        setLastShot({
          row: rowBot,
          col: colBot,
          hit: hitBot,
          player: "opponent",
          message: data.shipSunkBot
            ? "¡El oponente hundió tu barco!"
            : undefined,
        });

        if (gameOverBot) {
          handleGameOver(data.winner);
          return;
        }

        setIsPlayerTurn(true);
        setGameStatus("Tu turno");
      }, 100);
    };

    const handleGameOver = (winnerId) => {
      setGameOver(true);
      setWinner(winnerId === playerId);
      setGameStatus(winnerId === playerId ? "¡Ganaste!" : "¡Perdiste!");
      sessionStorage.removeItem("playerBoard");
    };

    client.onConnect = () => {
      console.log("Conectado al servidor WebSocket");
      setGameStatus("Conectado. Tu turno");
      setIsPlayerTurn(true);

      client.subscribe(`/topic/game/${gameId}`, (message) => {
        const data = JSON.parse(message.body);
        handleShotResult(data);
      });
    };

    client.onStompError = (error) => {
      console.error("Error en la conexión:", error);
      setGameStatus("Error de conexión con el servidor");
    };

    client.activate();
    stompClient.current = client;

    return () => {
      if (stompClient.current && stompClient.current.connected) {
        stompClient.current.deactivate();
        stompClient.current = null;
      }
    };
  }, [
    isReady,
    gameId,
    playerId,
    initialPlayerBoard,
    playerBoard,
    opponentBoard,
  ]);

  const handleCellClick = (row, col) => {
    if (
      !isPlayerTurn ||
      gameOver ||
      ["hit", "miss"].includes(opponentBoard[row][col])
    )
      return;

    if (!stompClient.current || !stompClient.current.connected) {
      alert("No hay conexión con el servidor");
      return;
    }

    stompClient.current.publish({
      destination: `/app/game/${gameId}/shot`,
      body: JSON.stringify({ row, col, playerId, gameId }),
    });

    setIsPlayerTurn(false);
    setGameStatus("Esperando respuesta...");
  };

  const handleExitGame = () => {
    if (stompClient.current && stompClient.current.connected) {
      stompClient.current.publish({
        destination: `/app/game/${gameId}/abandon`,
        body: JSON.stringify({ playerId, gameId }),
      });
      stompClient.current.deactivate();
    }
    sessionStorage.removeItem("playerBoard");
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

  if (!isReady || !playerBoard) {
    return (
      <div className="game-container">
        <h2>{!isReady ? "Cargando jugador..." : "Cargando juego..."}</h2>
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
