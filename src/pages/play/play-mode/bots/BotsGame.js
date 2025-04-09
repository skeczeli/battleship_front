import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Board from "components/Board";

function BotsGame() {
  const { state } = useLocation();
  const navigate = useNavigate();

  // La board armada proviene del estado pasado desde Setup (o BotsSetup)
  const boardSet = state?.board;

  // Si no se recibió la board, le avisamos y ofrecemos volver a Setup
  if (!boardSet) {
    return (
      <div>
        <p>
          No se recibió la configuración del tablero. Por favor, vuelve a
          configurarlo.
        </p>
        <button onClick={() => navigate("/play-mode/bots/setup")}>
          Ir a Setup
        </button>
      </div>
    );
  }

  // Generamos un tablero en blanco (10x10 con nulls)
  const blankBoard = Array.from({ length: 10 }, () => Array(10).fill(null));

  return (
    <div>
      <h3>Juego en modo Bots</h3>
      <div
        className="boards-container"
        style={{ display: "flex", gap: "20px" }}
      >
        <div className="board-wrapper">
          <h4>Tu Tablero</h4>
          {/* Renderizamos el tablero armado */}
          <Board
            board={boardSet}
            onCellClick={() => {}}
            highlightedCells={[]}
            onCellHover={() => {}}
            hoveredCell={null}
            onBoardLeave={() => {}}
          />
        </div>
        <div className="board-wrapper">
          <h4>Tablero Enemigo</h4>
          {/* Renderizamos el tablero en blanco */}
          <Board
            board={blankBoard}
            onCellClick={() => {}}
            highlightedCells={[]}
            onCellHover={() => {}}
            hoveredCell={null}
            onBoardLeave={() => {}}
          />
        </div>
      </div>
    </div>
  );
}

export default BotsGame;
