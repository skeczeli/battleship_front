import React from "react";
import { useNavigate } from "react-router-dom";
import Setup from "components/Setup";
import { getPlayerId } from "services/PlayerService";
import { useUser } from "contexts/UserContext";
import "styles/main.css";
import "App.css";

function RandomUserSetup() {
  const navigate = useNavigate();
  const { user, isReady } = useUser();
  const totalShips = 5;

  // Añadir el mapeo de barcos (igual que en BotsSetup)
  const shipMap = {
    portaaviones: 1,
    acorazado: 2,
    submarino: 3,
    destructor: 4,
    lancha: 5,
  };

  const mapBoardToIntegers = (board) => {
    return board.map((row) =>
      row.map((cell) => (cell === null ? null : shipMap[cell] ?? null))
    );
  };

  const handleConfirm = async (board, placedShips) => {
    if (!isReady) {
      alert("Esperando información del jugador...");
      return;
    }

    if (placedShips.length < totalShips) {
      alert("Coloca todos los barcos antes de empezar el juego.");
      return;
    }

    const playerId = getPlayerId(user);
    const numericBoard = mapBoardToIntegers(board);

    console.log("Tablero visual (con nombres):", board);
    console.log("Tablero convertido a IDs:", numericBoard);

    try {
      const response = await fetch("http://localhost:8080/api/game/setup/multiplayer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          board: numericBoard, // Enviar el tablero numérico
          playerId,
          sessionId: null // null para crear nueva sala
        }),
      });

      if (!response.ok) throw new Error("Error al crear el juego.");
      
      const data = await response.json();
      const { gameId, status } = data;

      // Guardar el tablero numérico (consistente con BotsSetup)
      sessionStorage.setItem("playerBoard", JSON.stringify(numericBoard));

      if (status === "WAITING_FOR_PLAYER") {
        navigate(`/play-mode/random/game/${gameId}`, {
          state: { 
            gameId, 
            playerBoard: board, // Pasar el tablero original para visualización
            status: "WAITING_FOR_OPPONENT",
            isCreator: true
          },
        });
      } else if (status === "GAME_STARTED") {
        navigate(`/play-mode/random/game/${gameId}`, {
          state: { 
            gameId, 
            playerBoard: board, // Pasar el tablero original para visualización
            status: "GAME_READY",
            isCreator: false
          },
        });
      }
    } catch (error) {
      console.error(error);
      alert("Ocurrió un problema al comunicarse con el servidor.");
    }
  };

  const handleJoinGame = async (gameIdToJoin, board, placedShips) => {
    if (!isReady) {
      alert("Esperando información del jugador...");
      return;
    }

    if (placedShips.length < totalShips) {
      alert("Coloca todos los barcos antes de unirte al juego.");
      return;
    }

    if (!gameIdToJoin || gameIdToJoin.trim() === "") {
      alert("Por favor, ingresa un ID de juego válido.");
      return;
    }

    const playerId = getPlayerId(user);
    const numericBoard = mapBoardToIntegers(board);

    console.log("Tablero visual (con nombres):", board);
    console.log("Tablero convertido a IDs:", numericBoard);

    try {
      const response = await fetch("http://localhost:8080/api/game/setup/multiplayer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          board: numericBoard, // Enviar el tablero numérico
          playerId,
          sessionId: gameIdToJoin.trim()
        }),
      });

      if (!response.ok) {
        if (response.status === 400) {
          throw new Error("No se pudo unir a la sala. Puede que esté llena o no exista.");
        }
        throw new Error("Error al unirse al juego.");
      }
      
      const data = await response.json();
      const { gameId, status } = data;

      // Guardar el tablero numérico
      sessionStorage.setItem("playerBoard", JSON.stringify(numericBoard));

      if (status === "GAME_STARTED") {
        navigate(`/play-mode/random/game/${gameId}`, {
          state: { 
            gameId, 
            playerBoard: board, // Pasar el tablero original para visualización
            status: "GAME_READY",
            isCreator: false
          },
        });
      } else {
        alert("Error inesperado al unirse al juego.");
      }
    } catch (error) {
      console.error(error);
      alert(error.message || "Ocurrió un problema al comunicarse con el servidor.");
    }
  };

  if (!isReady) {
    return (
      <div className="setup-container">
        <h2>Cargando...</h2>
      </div>
    );
  }

  return (
    <div className="setup-container">
      <h2>Modo Multijugador</h2>
      <div className="player-info">
        <p>
          Jugando como:{" "}
          <span className={user ? "auth-player" : "guest-player"}>
            {user?.username || "Invitado"}
          </span>
        </p>
      </div>
      
      <div className="multiplayer-options">
        <div className="option-section">
          <h3>Crear nueva partida</h3>
          <p>Crea una nueva sala y espera a que se una otro jugador</p>
          <Setup 
            onConfirm={handleConfirm} 
            buttonText="Crear Partida"
            showJoinOption={false}
          />
        </div>
        
        <div className="option-divider">
          <span>O</span>
        </div>
        
        <div className="option-section">
          <h3>Unirse a partida existente</h3>
          <p>Ingresa el ID de una partida existente para unirte</p>
          <Setup 
            onConfirm={(board, placedShips, gameIdToJoin) => handleJoinGame(gameIdToJoin, board, placedShips)} 
            buttonText="Unirse a Partida"
            showJoinOption={true}
          />
        </div>
      </div>
      
      <div className="setup-instructions">
        <h4>Instrucciones:</h4>
        <ul>
          <li><strong>Crear partida:</strong> Coloca tus barcos y crea una nueva sala. Se te dará un ID que puedes compartir.</li>
          <li><strong>Unirse a partida:</strong> Coloca tus barcos, ingresa el ID de la partida y únete a la sala.</li>
          <li>Una vez que ambos jugadores estén listos, el juego comenzará automáticamente.</li>
        </ul>
      </div>
    </div>
  );
}

export default RandomUserSetup;