import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import GameBoard from "components/Board";
import { useUser } from "contexts/UserContext";
import "styles/game.css";
import "styles/enhanced-board.css";

function BotsGame() {
  const { gameId } = useParams();
  const { user, playerId, isReady } = useUser();
  const navigate = useNavigate();

  const [playerBoard, setPlayerBoard] = useState(null);
  const [opponentBoard, setOpponentBoard] = useState(null);
  const [sunkShips, setSunkShips] = useState({ player: [], opponent: [] });
  const [lastShot, setLastShot] = useState(null);
  const [shotHistory, setShotHistory] = useState([]);
  const [gameStatus, setGameStatus] = useState("Cargando...");
  const [isPlayerTurn, setIsPlayerTurn] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [gameConfig, setGameConfig] = useState(null);

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
      6: "fragata",
      7: "superportaaviones"
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
    sessionStorage.removeItem("playerBoard");
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

      setShotHistory((prev) => [
        ...prev,
        {
          row: data.row,
          col: data.col,
          hit: data.hit,
          player: "player",
          message: data.shipSunk ? "¡Hundiste un barco!" : undefined,
        },
      ]);

      if (data.gameOver && data.winner === playerId) {
        handleGameOver(data.winner);
        return;
      }

      // Turno del bot
      if (data.rowBot !== undefined && data.colBot !== undefined) {
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

          setShotHistory((prev) => [
            ...prev,
            {
              row: data.rowBot,
              col: data.colBot,
              hit: data.hitBot,
              player: "opponent",
              message: data.shipSunkBot
                ? "¡El oponente hundió tu barco!"
                : undefined,
            },
          ]);

          if (data.gameOver) return handleGameOver(data.winner);

          setIsPlayerTurn(true);
          setGameStatus("Tu turno");
        }, 100);
      }
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

      // Hacer el fetch después de establecer conexión WebSocket
      fetch(`http://localhost:8080/api/game/resume/${gameId}/${playerId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.error !== undefined) {
            setGameStatus(data.error);
            navigate("/");
            return;
          }
          setPlayerBoard(mapBoardToNames(data.playerBoard));
          setOpponentBoard(data.botBoard);
          setSunkShips(data.sunkShips);
          setGameOver(data.gameOver);
          setWinner(data.winner === playerId);
          setLastShot(data.lastShot || null);
          setShotHistory(data.shotHistory || []);
          setIsPlayerTurn(data.turn === playerId && !data.gameOver);
          setGameStatus(
            data.gameOver
              ? data.winner === playerId
                ? "¡Ganaste!"
                : "¡Perdiste!"
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

    const savedConfig = JSON.parse(sessionStorage.getItem("gameConfig") || "null");
    setGameConfig(savedConfig);

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
      destination: `/app/game/bot/${gameId}/shot`,
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

  const renderShotHistory = () => {
    if (!shotHistory || shotHistory.length === 0) {
      return (
        <div className="shot-history">
          <h3>Historial de Disparos</h3>
          <div className="history-list">
            <div
              className="history-item"
              style={{
                textAlign: "center",
                color: "#64748b",
                fontStyle: "italic",
              }}
            >
              No hay disparos aún...
            </div>
          </div>
        </div>
      );
    }

    // Mostrar los últimos disparos primero (orden inverso)
    const reversedHistory = [...shotHistory].reverse();

    return (
      <div className="shot-history">
        <h3>Historial de Disparos</h3>
        <div className="history-list">
          {reversedHistory.map((shot, index) => {
            const isHit = shot.hit === "hit";
            const playerText = shot.player === "player" ? "Tú" : "Bot";
            const position = `${String.fromCharCode(65 + shot.col)}${
              shot.row + 1
            }`;
            const originalIndex = shotHistory.length - index; // Número de disparo original

            return (
              <div
                key={`${shot.row}-${shot.col}-${shot.player}-${originalIndex}`}
                className="history-item"
              >
                <div style={{ fontWeight: "600", color: "#475569" }}>
                  #{originalIndex} {playerText} → {position}
                </div>
                <span className={isHit ? "hit" : "miss"}>
                  {isHit ? "IMPACTO" : "AGUA"}
                </span>
                {shot.message && (
                  <div className="shot-message">{shot.message}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

const renderShipCounter = () => {
  // Obtener configuración del juego desde sessionStorage
  const gameConfig = JSON.parse(sessionStorage.getItem("gameConfig") || "{}");
  const totalShips = gameConfig.totalShips;
  
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
    <div className="game-container bots-setup-container">
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
          <div className="board-wrapper">
            <GameBoard
              board={playerBoard}
              boardSize={gameConfig.boardSize}
              isPlayerBoard={true}
              onCellClick={() => {}}
              sunkShips={sunkShips.player}
              isGameMode={true}
              className="player-board"
            />
          </div>
        </div>

        <div className="board-section">
          <h3>Tablero del oponente</h3>
          <div className="board-wrapper">
            <GameBoard
              board={opponentBoard}
              boardSize={gameConfig.boardSize}
              isPlayerBoard={false}
              onCellClick={handleCellClick}
              isPlayerTurn={isPlayerTurn && !gameOver}
              sunkShips={sunkShips.opponent}
              isGameMode={true}
              className="opponent-board"
            />
          </div>
        </div>

        <div className="board-section history-section">
          {renderShotHistory()}
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
