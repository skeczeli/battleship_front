import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Setup from "components/Setup";
import { useUser } from "contexts/UserContext";
import "styles/main.css";
import "styles/bots-setup.css";
import "styles/enhanced-board.css";
import "App.css";

const shipMap = {
  portaaviones: 1,
  acorazado: 2,
  submarino: 3,
  destructor: 4,
  lancha: 5,
  fragata: 6,
  superportaaviones: 7,
};

const gameConfigs = {
  small: {
    boardSize: 6,
    ships: [
      { type: "destructor", size: 4, count: 1 },
      { type: "submarino", size: 3, count: 1 },
      { type: "lancha", size: 2, count: 1 },
    ],
    totalShips: 3,
  },
  normal: {
    boardSize: 10,
    ships: [
      { type: "portaaviones", size: 5, count: 1 },
      { type: "acorazado", size: 4, count: 1 },
      { type: "submarino", size: 3, count: 1 },
      { type: "destructor", size: 3, count: 1 },
      { type: "lancha", size: 2, count: 1 },
    ],
    totalShips: 5,
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
      { type: "lancha", size: 2, count: 1 },
    ],
    totalShips: 7,
  },
};

function RandomUserSetup() {
  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";
  const navigate = useNavigate();
  const { user, playerId } = useUser();
  const [gameSize, setGameSize] = useState("normal");
  const [passkey, setPasskey] = useState(null);

  const currentConfig = gameConfigs[gameSize];

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
      alert(
        `Coloca todos los ${currentConfig.totalShips} barcos antes de empezar el juego.`
      );
      return;
    }
    if (!passkey) {
      alert("Por favor, ingresa una clave de partida.");
      return;
    }

    const numericBoard = mapBoardToIntegers(board);

    try {
      const waitingResponse = await fetch(
        `${API_BASE_URL}/api/game/waiting/private?boardSize=${currentConfig.boardSize}&passkey=${passkey}`
      );
      const waitingData = await waitingResponse.json();

      if (!waitingResponse.ok)
        throw new Error("Error al consultar la sala de espera");

      let gameId;

      if (waitingData.status === "WAITING_FOR_PLAYER") {
        gameId = waitingData.gameId;
        sessionStorage.setItem("isFirstPlayer", "false");
        sessionStorage.setItem("joinedAlready", "false");
        sessionStorage.setItem("gameConfig", JSON.stringify(currentConfig));

        navigate(`/play-mode/random/game/${gameId}`, {
          state: {
            playerBoard: numericBoard,
            gameId,
            playerId,
          },
        });
      } else {
        const response = await fetch(
          "http://localhost:8080/api/game/setup/multiplayer/private",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              board: numericBoard,
              playerId,
              passkey: passkey,
            }),
          }
        );

        if (!response.ok) throw new Error("No se pudo crear la sala");

        const data = await response.json();
        gameId = data.gameId;

        sessionStorage.setItem("isFirstPlayer", "true");
        sessionStorage.setItem("gameConfig", JSON.stringify(currentConfig));

        navigate(`/play-mode/random/game/${gameId}`, {
          state: {
            playerBoard: board,
            gameId,
            playerId,
          },
        });
      }
    } catch (error) {
      console.error(error);
      alert("Error al comunicarse con el servidor");
    }
  };

  return (
    <div className="bots-setup-container">
      <div className="setup-header">
        <h2>Modo Multijugador Aleatorio</h2>

        {/* Contenedor de selectores alineados verticalmente */}
        <div className="selectors-container">
          {/* Selector de tamaño del juego */}
          <div className="game-size-selector">
            <label className="size-label">Tamaño del juego</label>
            <div className="size-options">
              <div
                className={`size-option ${
                  gameSize === "small" ? "active" : ""
                }`}
                onClick={() => setGameSize("small")}
              >
                <div className="size-icon">🎯</div>
                <span>Pequeño</span>
                <small>6x6</small>
              </div>
              <div
                className={`size-option ${
                  gameSize === "normal" ? "active" : ""
                }`}
                onClick={() => setGameSize("normal")}
              >
                <div className="size-icon">⚓</div>
                <span>Normal</span>
                <small>10x10</small>
              </div>
              <div
                className={`size-option ${
                  gameSize === "large" ? "active" : ""
                }`}
                onClick={() => setGameSize("large")}
              >
                <div className="size-icon">🚢</div>
                <span>Grande</span>
                <small>14x14</small>
              </div>
            </div>
          </div>

          {/* Botón para asignar oponente según nivel */}
          <div className="level-matching-option">
            <label className="level-label">Clave de partida</label>
            <span className="level-icon">{"🤫"}</span>
            <input
              type="text"
              className="level-input"
              placeholder="Clave de partida"
              value={passkey || ""}
              onChange={(e) => setPasskey(e.target.value)}
            />
            <small className="level-description">
              {"Define la clave para tu partida privada."}
            </small>
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
        requirePasskey={true}
        passkey={passkey}
      />
    </div>
  );
}

export default RandomUserSetup;
