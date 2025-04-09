// src/pages/play/play-mode/bots/BotsSetup.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import Setup from "components/Setup";
import "styles/main.css";
import "App.css";

function BotsSetup() {
  const navigate = useNavigate();

  // shipsData total (5 barcos) también lo podrías importar
  const totalShips = 5;

  // Función que se ejecutará cuando Setup confirme
  const handleConfirm = (board, placedShips) => {
    if (placedShips.length < totalShips) {
      alert("Coloca todos los barcos antes de empezar el juego.");
      return;
    }
    // Navegamos a la ruta /play-mode/bots/game, pasando board en el state
    navigate("/play-mode/bots/game", { state: { board } });
  };

  return (
    <div>
      <h2>Modo contra Bot</h2>
      {/* Renderizamos Setup y le pasamos onConfirm */}
      <Setup onConfirm={handleConfirm} />
    </div>
  );
}

export default BotsSetup;
