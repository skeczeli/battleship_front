import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Setup from "components/Setup";
import { useUser } from "contexts/UserContext";
import "styles/main.css";
import "styles/bots-setup.css";
import "styles/enhanced-board.css";
import "App.css";
import { useLocation } from "react-router-dom";

function BotsSetup() {
  const navigate = useNavigate();
  const { user, playerId } = useUser();
  const location = useLocation();

  // Estado local para la dificultad
  const [difficulty, setDifficulty] = useState(
    location.state?.difficulty || "simple"
  );

  // Estado para el tamaño del juego
  const [gameSize, setGameSize] = useState("normal");

  // Configuraciones de juego según el tamaño
  const gameConfigs = {
    small: {
      boardSize: 6,
      ships: [
        { type: "destructor", size: 4, count: 1 },
        { type: "submarino", size: 3, count: 1 },
        { type: "lancha", size: 2, count: 1 }
      ],
      totalShips: 3
    },
    normal: {
      boardSize: 10,
      ships: [
        { type: "portaaviones", size: 5, count: 1 },
        { type: "acorazado", size: 4, count: 1 },
        { type: "submarino", size: 3, count: 1 },
        { type: "destructor", size: 3, count: 1 },
        { type: "lancha", size: 2, count: 1 }
      ],
      totalShips: 5
    },
    large: {
      boardSize: 14,
      ships: [
        { type: "portaaviones", size: 5, count: 1 },
        { type: "superportaaviones", size: 6, count: 1 },
        { type: "acorazado", size: 4, count: 1 },
        { type: "submarino", size: 3, count: 1 },
        { type: "destructor", size: 3, count: 1 },
        { type: "fragata", size: 3, count: 1 },
        { type: "lancha", size: 2, count: 1 }
      ],
      totalShips: 7
    }
  };

  const currentConfig = gameConfigs[gameSize];

  const shipMap = {
    portaaviones: 1,
    acorazado: 2,
    submarino: 3,
    destructor: 4,
    lancha: 5,
    fragata: 6,
    superportaaviones: 7
  };

  const mapBoardToIntegers = (board) => {
    return board.map((row) =>
      row.map((cell) => {
        if (cell === null) return null;
        const type = cell.split("-")[0];
        return shipMap[type] ?? null;
      })
    );
  };

  const handleConfirm = async (board, placedShips) => {
    if (placedShips.length < currentConfig.totalShips) {
      alert(`Coloca todos los ${currentConfig.totalShips} barcos antes de empezar el juego.`);
      return;
    }

    const numericBoard = mapBoardToIntegers(board);

    try {
      const response = await fetch("http://localhost:8080/api/game/setup/bot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          board: numericBoard, 
          playerId, 
          difficulty,
          gameSize
        }),
      });

      if (!response.ok) throw new Error("Error al crear el juego.");

      const data = await response.json();
      const { gameId } = data;

      sessionStorage.setItem("playerBoard", JSON.stringify(numericBoard));
      sessionStorage.setItem("gameConfig", JSON.stringify(currentConfig));

      navigate(`/play-mode/bots/game/${gameId}`, {
        state: { 
          gameId, 
          playerBoard: board,
          gameConfig: currentConfig
        },
      });
    } catch (error) {
      console.error(error);
      alert("Ocurrió un problema al comunicarse con el servidor.");
    }
  };

  return (
    <div className="bots-setup-container">
      <div className="setup-header">
        <h2>Modo contra Bot</h2>

        <div className="selectors-container">
          {/* Selector de dificultad - PRIMERO */}
          <div className="difficulty-selector-header">
            <label className="difficulty-label">Dificultad</label>
            <div className="difficulty-options">
              <div
                className={`difficulty-option ${
                  difficulty === "simple" ? "active" : ""
                }`}
                onClick={() => setDifficulty("simple")}
              >
                <div className="difficulty-icon">⚡</div>
                <span>Normal</span>
              </div>
              <div
                className={`difficulty-option ${
                  difficulty === "intelligent" ? "active" : ""
                }`}
                onClick={() => setDifficulty("intelligent")}
              >
                <div className="difficulty-icon">🔥</div>
                <span>Hard</span>
              </div>
            </div>
          </div>

          {/* Selector de tamaño del juego - SEGUNDO */}
          <div className="game-size-selector">
            <label className="size-label">Tamaño del juego</label>
            <div className="size-options">
              <div
                className={`size-option ${gameSize === "small" ? "active" : ""}`}
                onClick={() => setGameSize("small")}
              >
                <div className="size-icon">🎯</div>
                <span>Pequeño</span>
                <small>6x6</small>
              </div>
              <div
                className={`size-option ${gameSize === "normal" ? "active" : ""}`}
                onClick={() => setGameSize("normal")}
              >
                <div className="size-icon">⚓</div>
                <span>Normal</span>
                <small>10x10</small>
              </div>
              <div
                className={`size-option ${gameSize === "large" ? "active" : ""}`}
                onClick={() => setGameSize("large")}
              >
                <div className="size-icon">🚢</div>
                <span>Grande</span>
                <small>14x14</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="player-info">
        <p>
          Jugando como:{" "}
          <span className={user ? "auth-player" : "guest-player"}>
            {user?.username || "Invitado"}
          </span>
        </p>
      </div>

      <Setup 
        onConfirm={handleConfirm} 
        gameConfig={currentConfig}
        boardSize={currentConfig.boardSize}
        key={`setup-${gameSize}-${currentConfig.boardSize}`}
        gameSize={gameSize}
        ships={currentConfig.ships}
      />
    </div>
  );
}

export default BotsSetup;