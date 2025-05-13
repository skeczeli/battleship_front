import React from "react";
import { useNavigate } from "react-router-dom";
import Setup from "components/Setup";
import { getPlayerId } from "services/PlayerService";
import { useUser } from "contexts/UserContext";
import "styles/main.css";
import "App.css";

function BotsSetup() {
  const navigate = useNavigate();
  const totalShips = 5;
  const { user } = useUser();

  const shipMap = {
    portaaviones: 1,
    acorazado: 2,
    submarino: 3,
    destructor: 4,
    fragata: 5,
  };
  
  const mapBoardToIntegers = (board) => {
    return board.map((row) =>
      row.map((cell) =>
        cell === null ? null : shipMap[cell] ?? null
      )
    );
  };
  

  const handleConfirm = async (board, placedShips) => {
    const playerId = getPlayerId(user);

    if (placedShips.length < totalShips) {
      alert("Coloca todos los barcos antes de empezar el juego.");
      return;
    }

    const numericBoard = mapBoardToIntegers(board);

    try {
      const response = await fetch("http://localhost:8080/api/game/setup/bot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ board: numericBoard, playerId }),
      });

      if (!response.ok) throw new Error("Error al crear el juego.");

      const data = await response.json();
      const { gameId } = data;

      sessionStorage.setItem("playerBoard", JSON.stringify(numericBoard));

      // Navegar a la pantalla de juego con los datos necesarios
      navigate(`/play-mode/bots/game/${gameId}`, {
        state: { gameId, playerBoard: board },
      });
    } catch (error) {
      console.error(error);
      alert("Ocurrió un problema al comunicarse con el servidor.");
    }
  };

  return (
    <div>
      <h2>Modo contra Bot</h2>
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

export default BotsSetup;
