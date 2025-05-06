import React, { useState, useEffect, useRef } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import GameBoard from "components/Board";
import PlayerService from "services/PlayerService";

function BotsGame() {
  const location = useLocation();
  const { gameId } = useParams();
  const navigate = useNavigate();
  const playerId = PlayerService.getPlayerId();

  // Obtener el tablero inicial del estado de navegación
  const initialPlayerBoard = location.state?.playerBoard;

  // Estados para los tableros
  const [playerBoard, setPlayerBoard] = useState(initialPlayerBoard || null);
  const [opponentBoard, setOpponentBoard] = useState(
    Array(10)
      .fill()
      .map(() => Array(10).fill(null))
  );

  // Estados del juego
  const [gameStatus, setGameStatus] = useState("Conectando...");
  const [isPlayerTurn, setIsPlayerTurn] = useState(false);
  const [lastShot, setLastShot] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);

  // Estado para rastrear los barcos hundidos
  const [sunkShips, setSunkShips] = useState({
    player: [], // IDs de los barcos del jugador que han sido hundidos
    opponent: [], // IDs de los barcos del oponente que han sido hundidos
  });

  // Referencia al cliente STOMP
  const stompClient = useRef(null);

  // Validar que tenemos el tablero y el gameId
  useEffect(() => {
    if (!initialPlayerBoard) {
      alert(
        "No hay configuración de tablero. Volviendo a la pantalla de configuración."
      );
      navigate("/play-mode/bots/setup");
      return;
    }

    if (!gameId) {
      alert("ID de juego no disponible");
      navigate("/play-mode/bots/setup");
      return;
    }
  }, [initialPlayerBoard, gameId, navigate]);

  // Inicializar la conexión WebSocket
  useEffect(() => {
    if (!initialPlayerBoard || !gameId) return;

    console.log(`Conectando al juego ${gameId} como jugador ${playerId}`);

    // Crear conexión SockJS
    const socket = new SockJS("http://localhost:8080/ws");

    // Crear cliente STOMP sobre SockJS
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    // Definir las funciones manejadoras dentro del useEffect
    // Función para manejar el inicio del juego
    const handleGameStart = (data) => {
      setIsPlayerTurn(data.turn === playerId);
      setGameStatus(data.turn === playerId ? "Tu turno" : "Turno del oponente");
    };

    // Función para manejar el resultado de un disparo
    const handleShotResult = (data) => {
      if (data.playerId === playerId) {
        // Actualizar tablero del oponente con nuestro disparo
        const newOpponentBoard = [...opponentBoard];
        const { row, col, hit } = data;
        newOpponentBoard[row][col] = hit ? "hit" : "miss";
        setOpponentBoard(newOpponentBoard);

        // Verificar si se hundió un barco
        if (data.shipSunk) {
          // Agregar el barco a la lista de barcos hundidos del oponente
          setSunkShips((prev) => ({
            ...prev,
            opponent: [...prev.opponent, data.shipId],
          }));

          // Si el servidor proporciona las celdas del barco hundido, las marcamos
          if (data.shipCells) {
            data.shipCells.forEach((cell) => {
              const [r, c] = cell;
              newOpponentBoard[r][c] = "sunk"; // Marca especial para celdas de barcos hundidos
            });
          }
        }

        setLastShot({
          row,
          col,
          hit,
          player: "player",
          message: data.shipSunk ? `¡Hundiste un barco!` : undefined,
        });
      } else {
        // Actualizar nuestro tablero con el disparo del oponente
        const newPlayerBoard = [...playerBoard];
        const { row, col, hit } = data;
        newPlayerBoard[row][col] = hit ? "hit" : "miss";
        setPlayerBoard(newPlayerBoard);

        // Verificar si se hundió un barco del jugador
        if (data.shipSunk) {
          // Agregar el barco a la lista de barcos hundidos del jugador
          setSunkShips((prev) => ({
            ...prev,
            player: [...prev.player, data.shipId],
          }));
        }

        setLastShot({
          row,
          col,
          hit,
          player: "opponent",
          message: data.shipSunk ? `¡El oponente hundió tu barco!` : undefined,
        });
      }

      // Actualizar turno
      setIsPlayerTurn(data.nextTurn === playerId);
      setGameStatus(
        data.nextTurn === playerId ? "Tu turno" : "Turno del oponente"
      );
    };

    // Función para manejar el fin del juego
    const handleGameOver = (data) => {
      setGameOver(true);
      setWinner(data.winner === playerId);
      setGameStatus(data.winner === playerId ? "¡Ganaste!" : "¡Perdiste!");
    };

    // Al establecer conexión
    client.onConnect = () => {
      console.log("Conectado al servidor WebSocket");
      setGameStatus("Conectado. Esperando inicio del juego...");

      // Suscribirse a mensajes del juego
      client.subscribe(`/topic/game/${gameId}`, (message) => {
        const data = JSON.parse(message.body);
        console.log("Mensaje recibido:", data);

        // Manejar diferentes tipos de mensajes
        switch (data.type) {
          case "GAME_START":
            handleGameStart(data);
            break;
          case "SHOT_RESULT":
            handleShotResult(data);
            break;
          case "GAME_OVER":
            handleGameOver(data);
            break;
          default:
            console.log("Tipo de mensaje desconocido:", data.type);
        }
      });

      // Notificar que el jugador está listo -> check?
      client.publish({
        destination: `/app/game/${gameId}/join`,
        body: JSON.stringify({ playerId, gameId }),
      });
    };

    // Manejar errores de conexión
    client.onStompError = (error) => {
      console.error("Error en la conexión:", error);
      setGameStatus("Error de conexión con el servidor");
    };

    // Iniciar conexión
    client.activate();
    stompClient.current = client;

    // Limpiar al desmontar
    return () => {
      if (client.connected) {
        client.deactivate();
      }
    };
  }, [
    gameId,
    playerId,
    initialPlayerBoard,
    playerBoard,
    opponentBoard,
    setPlayerBoard,
    setOpponentBoard,
    setLastShot,
    setIsPlayerTurn,
    setGameStatus,
    setSunkShips,
    setGameOver,
    setWinner,
  ]);

  // Manejar click en celda para disparar
  const handleCellClick = (row, col) => {
    // Solo permitir disparar si es el turno del jugador y no hay disparo previo en esa celda
    if (
      !isPlayerTurn ||
      gameOver ||
      opponentBoard[row][col] === "hit" ||
      opponentBoard[row][col] === "miss" ||
      opponentBoard[row][col] === "sunk"
    ) {
      return;
    }

    // Verificar conexión
    if (!stompClient.current || !stompClient.current.connected) {
      alert("No hay conexión con el servidor");
      return;
    }

    // Enviar disparo al servidor
    stompClient.current.publish({
      destination: `/app/game/${gameId}/shot`,
      body: JSON.stringify({ row, col, playerId, gameId }),
    });

    // Deshabilitar temporalmente el turno hasta recibir respuesta
    setIsPlayerTurn(false);
    setGameStatus("Esperando respuesta...");
  };

  // Manejar abandono de juego
  const handleExitGame = () => {
    if (stompClient.current && stompClient.current.connected) {
      stompClient.current.publish({
        destination: `/app/game/${gameId}/abandon`,
        body: JSON.stringify({ playerId, gameId }),
      });
      stompClient.current.deactivate();
    }
    navigate("/");
  };

  // Renderizar el último disparo
  const renderLastShot = () => {
    if (!lastShot) return null;

    const { row, col, hit, player, message } = lastShot;
    const playerText =
      player === "player" ? "Tu disparo" : "Disparo del oponente";
    const resultText = hit ? "¡Impacto!" : "Agua";
    const position = `[${String.fromCharCode(65 + row)}${col + 1}]`;

    return (
      <div className="last-shot">
        <p>
          {playerText} en {position}:{" "}
          <span className={hit ? "hit" : "miss"}>{resultText}</span>
        </p>
        {message && <p className="shot-message">{message}</p>}
      </div>
    );
  };

  // Renderizar contador de barcos hundidos
  const renderShipCounter = () => {
    const totalShips = 5; // Ajusta este número según la cantidad de barcos en tu juego

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

  // Mostrar pantalla de carga si no hay tablero
  if (!playerBoard) {
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
          <span
            className={
              PlayerService.isGuestPlayer() ? "guest-player" : "auth-player"
            }
          >
            {PlayerService.getPlayerDisplayName()}
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
            onCellClick={() => {}} // No hacemos nada al hacer clic en nuestro tablero
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

      {gameOver && (
        <div className="game-over">
          <h3>
            {winner ? "¡Felicidades! Has ganado" : "Has perdido esta vez"}
          </h3>
          <button onClick={handleExitGame} className="exit-button">
            Salir
          </button>
        </div>
      )}

      {!gameOver && (
        <button onClick={handleExitGame} className="exit-button">
          Abandonar juego
        </button>
      )}
    </div>
  );
}

export default BotsGame;
