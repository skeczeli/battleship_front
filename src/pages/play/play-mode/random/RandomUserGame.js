import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import GameBoard from "components/Board";
import { useUser } from "contexts/UserContext";
import "styles/game.css";
import "styles/enhanced-board.css";

function RandomUserGame() {
  const location = useLocation();
  const { gameId } = useParams();
  const { user, playerId, isReady } = useUser();
  const navigate = useNavigate();

  const [playerBoard, setPlayerBoard] = useState(
    location.state?.playerBoard || null
  );
  const [opponentBoard, setOpponentBoard] = useState(
    Array(10)
      .fill()
      .map(() => Array(10).fill(null))
  );
  const [sunkShips, setSunkShips] = useState({ player: [], opponent: [] });
  const [gameStatus, setGameStatus] = useState("Cargando partida...");
  const [isPlayerTurn, setIsPlayerTurn] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [winner, setWinner] = useState(null);

  const { playerBoard: initialBoard } = location.state || {};
  const [initialBoardState, setInitialBoardState] = useState(initialBoard);

  const stompClient = useRef(null);
  const stompInitialized = useRef(false);

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

  const handleGameEvent = useCallback(
    (data) => {
      switch (data.type) {
        case "GAME_START":
          setGameStarted(true);
          const isMyTurn = data.turn === playerId;
          setIsPlayerTurn(isMyTurn);
          setGameStatus(isMyTurn ? "Tu turno" : "Turno del oponente");
          break;
        case "SHOT_RESULT":
          const isOwn = data.playerId === playerId;

          if (isOwn) {
            setOpponentBoard((prev) =>
              prev.map((row, r) =>
                row.map((cell, c) =>
                  r === data.row && c === data.col ? data.hit : cell
                )
              )
            );
            if (data.shipSunk) {
              setSunkShips((prev) => ({
                ...prev,
                opponent: [...prev.opponent, "unknown"],
              }));
            }
          } else {
            setPlayerBoard((prev) =>
              prev.map((row, r) =>
                row.map((cell, c) =>
                  r === data.row && c === data.col ? data.hit : cell
                )
              )
            );
            if (data.shipSunk) {
              setSunkShips((prev) => ({
                ...prev,
                player: [...prev.player, "unknown"],
              }));
            }
          }

          if (data.gameOver) {
            setGameOver(true);
            setWinner(data.winner === playerId);
            setGameStatus(
              data.winner === playerId ? "¡Ganaste!" : "¡Perdiste!"
            );
          } else {
            setIsPlayerTurn(data.nextTurn === playerId);
            setGameStatus(
              data.nextTurn === playerId ? "Tu turno" : "Turno del oponente"
            );
          }
          break;
        case "GAME_ABANDONED":
          setGameStatus("El oponente abandonó la partida");
          setGameOver(true);
          setWinner(true);
          sessionStorage.removeItem("isFirstPlayer");
          sessionStorage.removeItem("joinedAlready");

          break;
        case "ERROR":
          setGameStatus("Error: " + data.message);
          break;
        default:
          break;
      }
    },
    [playerId]
  );

  useEffect(() => {
    if (!isReady || !gameId || !playerId || stompInitialized.current) return;
    stompInitialized.current = true;

    const socket = new SockJS("http://localhost:8080/ws");
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
    });

    client.onConnect = () => {
      console.log("✅ Conectado al WebSocket");

      // Suscribirse al topic del juego
      client.subscribe(`/topic/game/${gameId}`, (msg) => {
        const data = JSON.parse(msg.body);
        console.log("📩 Evento recibido:", data);
        handleGameEvent(data);
      });

      const resume = () => {
        console.log("🟢 Ejecutando resume()");
        console.log("Usando gameId:", gameId);
        console.log("Usando playerId:", playerId);
        fetch(
          `http://localhost:8080/api/game/resume/multiplayer/${gameId}/${playerId}`
        )
          .then((res) => {
            if (!res.ok) throw new Error("No se encontró la partida");
            return res.json();
          })
          .then((data) => {
            if (data.status === "WAITING_FOR_OPPONENT") {
              setGameStatus("Esperando a que el oponente se una...");
              return;
            }

            console.log("🔄 Estado reanudado:", data);
            setPlayerBoard(mapBoardToNames(data.playerBoard));
            setOpponentBoard(data.opponentBoard);
            setSunkShips(data.sunkShips);
            setGameOver(data.gameOver);
            setWinner(data.winner === playerId);
            setIsPlayerTurn(data.turn === playerId && !data.gameOver);
            setGameStatus(
              data.gameOver
                ? data.winner === playerId
                  ? "¡Ganaste!"
                  : "¡Perdiste!"
                : data.turn === playerId
                ? "Tu turno"
                : "Turno del oponente"
            );
            setGameStarted(true);
          })
          .catch((err) => {
            console.error("❌ Error al reanudar la partida:", err);
            setGameStatus("Error al reanudar la partida. Empezá una nueva.");
            sessionStorage.removeItem("sessionId"); // remove rest???
          });
      };

      const joinedAlready = sessionStorage.getItem("joinedAlready") === "true";

      if (
        !joinedAlready &&
        sessionStorage.getItem("isFirstPlayer") === "false" &&
        initialBoardState
      ) {
        // Jugador 2: hace join y luego resume
        console.log("Jugador 2 se une enviando su board:", initialBoardState);
        client.publish({
          destination: `/app/game/multiplayer/${gameId}/join`,
          body: JSON.stringify({ playerId, board: initialBoardState }),
        });

        sessionStorage.setItem("joinedAlready", "true");

        setTimeout(() => {
          setInitialBoardState(null); // Limpiar después de haber dado tiempo a enviar
          resume();
        }, 300); // espero para que el back pueda procesar el join
      } else {
        // Jugador 1 o recarga → solo resume
        resume();
      }
    };

    client.onStompError = (err) => {
      console.error("❌ Error STOMP:", err);
    };

    client.activate();
    stompClient.current = client;

    return () => {
      stompClient.current?.deactivate();
      stompClient.current = null;
      stompInitialized.current = false;
    };
  }, [isReady, gameId, playerId, handleGameEvent]);

  const handleCellClick = (row, col) => {
    if (!isPlayerTurn || gameOver || opponentBoard?.[row]?.[col] !== null)
      return;
    stompClient.current?.publish({
      destination: `/app/game/multiplayer/${gameId}/shot`,
      body: JSON.stringify({ row, col, playerId }),
    });
    setIsPlayerTurn(false);
    setGameStatus("Esperando respuesta...");
  };

  const handleExitGame = () => {
    stompClient.current?.publish({
      destination: `/app/game/multiplayer/${gameId}/abandon`,
      body: JSON.stringify({ playerId }),
    });
    sessionStorage.removeItem("isFirstPlayer");
    sessionStorage.removeItem("joinedAlready");

    navigate("/");
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

  if (!playerBoard || !opponentBoard || !gameStarted) {
    return (
      <div className="game-container">
        <h2>{gameStatus}</h2>
      </div>
    );
  }

  return (
    <div className="game-container bots-setup-container">
      {" "}
      {/* ← Agregar clase bots-setup-container */}
      <h2>Modo Multijugador Aleatorio</h2>
      {/* ← Agregar info del jugador */}
      <div className="player-info">
        <p>
          Jugando como:{" "}
          <span className={user ? "auth-player" : "guest-player"}>
            {user?.username || "Invitado"}
          </span>
        </p>
      </div>
      {/* ← Mejorar estado del juego */}
      <div className="game-status">
        <p className={gameOver ? (winner ? "win-status" : "lose-status") : ""}>
          {gameStatus}
        </p>
      </div>
      {/* ← Agregar contador de barcos */}
      {renderShipCounter()}
      <div className="boards-container">
        <div className="board-section">
          <h3>Tu tablero</h3>
          <div className="board-wrapper">
            {" "}
            {/* ← Agregar wrapper */}
            <GameBoard
              board={playerBoard}
              isPlayerBoard={true}
              onCellClick={() => {}}
              sunkShips={sunkShips.player}
              isGameMode={true}
            />
          </div>
        </div>
        <div className="board-section">
          <h3>Tablero del oponente</h3>
          <div className="board-wrapper">
            {" "}
            {/* ← Agregar wrapper */}
            <GameBoard
              board={opponentBoard}
              isPlayerBoard={false}
              onCellClick={handleCellClick}
              isPlayerTurn={isPlayerTurn}
              sunkShips={sunkShips.opponent}
              isGameMode={true}
            />
          </div>
        </div>
      </div>
      {/* ← Mejorar botón de salida */}
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

export default RandomUserGame;
