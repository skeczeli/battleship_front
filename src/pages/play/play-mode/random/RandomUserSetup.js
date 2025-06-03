import React from "react";
import { useNavigate } from "react-router-dom";
import Setup from "components/Setup";
import { useUser } from "contexts/UserContext";

const shipMap = {
  portaaviones: 1,
  acorazado: 2,
  submarino: 3,
  destructor: 4,
  lancha: 5,
};

function RandomUserSetup() {
  const navigate = useNavigate();
  const { user, playerId } = useUser();
  const totalShips = 5;

  const mapBoardToIntegers = (board) => {
    return board.map((row) =>
      row.map((cell) => (cell === null ? null : shipMap[cell] ?? null))
    );
  };

  const handleConfirm = async (board, placedShips) => {
    if (placedShips.length < totalShips) {
      alert("Coloca todos los barcos antes de empezar el juego.");
      return;
    }

    const numericBoard = mapBoardToIntegers(board);

    try {
      // Primero, consultamos si hay una partida en espera
      const waitingResponse = await fetch(
        "http://localhost:8080/api/game/waiting"
      );
      const waitingData = await waitingResponse.json();
      console.log("Datos de espera:", waitingData);
      if (!waitingResponse.ok)
        throw new Error("Error al consultar la sala de espera");

      let gameId;

      if (waitingData.status === "WAITING_FOR_PLAYER") {
        // Ya hay una sala, nos unimos como jugador 2 → vamos directo al game (sin pasar el board aún)
        gameId = waitingData.gameId;
        console.log("Unirse a la sala existente:", gameId);

        navigate(`/play-mode/random/game/${gameId}`, {
          state: {
            playerBoard: numericBoard,
            gameId,
            playerId,
            isFirstPlayer: false,
          },
        });
      } else {
        console.log("No hay sala existente, creando una nueva...");
        // No hay sala, creamos una
        const response = await fetch(
          "http://localhost:8080/api/game/setup/multiplayer",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ board: numericBoard, playerId }),
          }
        );
        console.log("Respuesta de creación de sala:", response);

        if (!response.ok) throw new Error("No se pudo crear la sala");

        const data = await response.json();
        gameId = data.gameId;
        console.log("Sala creada con éxito:", gameId);

        navigate(`/play-mode/random/game/${gameId}`, {
          state: { playerBoard: board, gameId, playerId, isFirstPlayer: true },
        });
      }
    } catch (error) {
      console.error(error);
      alert("Error al comunicarse con el servidor");
    }
  };

  return (
    <div>
      <h2>Modo Multijugador Aleatorio</h2>
      <div className="player-info">
        <p>
          Jugando como:{" "}
          <span className={user ? "auth-player" : "guest-player"}>
            {user?.username || "Invitado"}
          </span>
        </p>
      </div>
      <Setup onConfirm={handleConfirm} />
    </div>
  );
}

export default RandomUserSetup;
