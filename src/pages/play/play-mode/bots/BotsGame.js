import React, { useState, useEffect, useRef } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import GameBoard from "components/Board";
import { getPlayerId } from "services/PlayerService";
import { useUser } from "contexts/UserContext";
import "styles/game.css";

function BotsGame() {
  const location = useLocation();
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const playerId = getPlayerId(user);


  // Obtener el tablero inicial del estado de navegación
  const initialPlayerBoard =
    location.state?.playerBoard ||
    JSON.parse(sessionStorage.getItem("playerBoard") || "null");

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
  const connectedRef = useRef(false);

  // Validar que tenemos el tablero y el gameId
  useEffect(() => {
    if (!playerId) {
      alert("Identidad del jugador no disponible");
      navigate("/play-mode/bots/setup");
    }

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
  }, [playerId, initialPlayerBoard, gameId, navigate]);

  // Inicializar la conexión WebSocket
  useEffect(() => {
    if (!initialPlayerBoard || !gameId) return;
    if (connectedRef.current) return;
    connectedRef.current = true;

    console.log(
      `Conectando al juego ${gameId} como jugador ${
        user?.username || "Invitado"
      }`
    );

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
    const handleShotResult = (data) => {
      // 1. Resolución del disparo del jugador
      const newOpponentBoard = [...opponentBoard];
      const { row, col, hit, gameOver, winner } = data; 
      newOpponentBoard[row][col] = hit;
      setOpponentBoard(newOpponentBoard);

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
        if (winner === null) {
          console.error("Error: Winner is null despite gameOver being true.");
          alert("Error: Winner is null. Please check the game logic.");
          return;
        }
        handleGameOver(winner);
        return;
      }

      // 2. Timeout antes del disparo del bot
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
          handleGameOver(data);
          return;
        }

        setIsPlayerTurn(true);
        setGameStatus(
          "Tu turno"
        );
      }, 2000); // 2s de delay
    };

    // Función para manejar el fin del juego
    const handleGameOver = (winner) => {
      setGameOver(true);
      setWinner(winner === playerId); 
      setGameStatus(winner === playerId ? "¡Ganaste!" : "¡Perdiste!");
      sessionStorage.removeItem("playerBoard");
    };

    // Al establecer conexión
    client.onConnect = () => {
      console.log("Conectado al servidor WebSocket");
      setGameStatus("Conectado. Esperando inicio del juego...");

      setIsPlayerTurn(true);
      setGameStatus("Tu turno");

      // Suscribirse a mensajes del juego
      client.subscribe(`/topic/game/${gameId}`, (message) => {
        const data = JSON.parse(message.body);
        console.log("Mensaje recibido:", data);

        handleShotResult(data); // ya no se recibe data.type, el shotResult avisa si termino el juego.
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
      if (stompClient.current && stompClient.current.connected) {
        stompClient.current.deactivate();
        stompClient.current = null;
        connectedRef.current = false;
      }
    };
  }, [gameId, playerId, initialPlayerBoard, playerBoard, opponentBoard, user]);

  // Manejar click en celda para disparar
  const handleCellClick = (row, col) => {
    // Solo permitir disparar si es el turno del jugador y no hay disparo previo en esa celda
    if (
      !isPlayerTurn ||
      gameOver ||
      ["hit", "miss"].includes(opponentBoard[row][col])
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
    sessionStorage.removeItem("playerBoard");
    navigate("/");
  };

  const renderLastShot = () => {
  if (!lastShot) return null;

  const { row, col, hit, player, message } = lastShot;
  const isHit = hit === "hit";
  const resultText = isHit ? "¡Impacto!" : "Agua";
  const playerText = player === "player" ? "Tu disparo" : "Disparo del oponente";
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
