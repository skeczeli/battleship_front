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
  const handleConfirm = async (board, placedShips) => {
    if (placedShips.length < totalShips) {
      alert("Coloca todos los barcos antes de empezar el juego.");
      return;
    }
  
    try {
      // Enviar tablero al backend Java
      const response = await fetch("http://localhost:8080/api/game/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ board }),  // Aquí mandas el tablero al backend
      });
  
      if (!response.ok) {
        throw new Error("Error al crear el tablero del bot en el servidor.");
      }
  
      const data = await response.json();
  
      // Aquí navegas pasando tu tablero y el tablero que generó Java
      navigate("/play-mode/bots/game", { 
        state: { 
          playerBoard: data.playerBoard,
          botBoard: data.botBoard 
        } 
      });
  
    } catch (error) {
      console.error(error);
      alert("Ocurrió un problema al comunicarse con el servidor.");
    }
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
