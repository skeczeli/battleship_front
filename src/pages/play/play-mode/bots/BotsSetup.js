import React from "react";
import { useNavigate } from "react-router-dom";
import Setup from "components/Setup";
import {
  getPlayerId,
  getPlayerDisplayName,
  isGuestPlayer,
} from "services/PlayerService";
import "styles/main.css";
import "App.css";

function BotsSetup() {
  const navigate = useNavigate();
  const totalShips = 5;
  const playerId = getPlayerId(); // Obtenemos el ID del jugador de forma consistente

  const handleConfirm = async (board, placedShips) => {
    if (placedShips.length < totalShips) {
      alert("Coloca todos los barcos antes de empezar el juego.");
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/api/game/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ board, playerId }),
      });

      if (!response.ok) throw new Error("Error al crear el juego.");

      const data = await response.json();
      const { gameId } = data;

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
          <span className={isGuestPlayer() ? "guest-player" : "auth-player"}>
            {getPlayerDisplayName()}
          </span>
        </p>
      </div>
      <Setup onConfirm={handleConfirm} />
    </div>
  );
}

export default BotsSetup;
