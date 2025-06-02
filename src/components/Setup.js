// Setup.js
import React, { useEffect, useState } from "react";
import "styles/setup.css";
import Board from "./Board";
import ShipList from "./ShipList";
import useBoard from "../hooks/useBoard";

// Definición de barcos
const ships = [
  { id: "portaaviones", name: "Portaaviones", size: 5 },
  { id: "acorazado", name: "Acorazado", size: 4 },
  { id: "submarino", name: "Submarino", size: 3 },
  { id: "destructor", name: "Destructor", size: 3 },
  { id: "lancha", name: "Lancha", size: 2 },
];

/**
 * Componente principal del setup de Battleship.
 */
function Setup({ 
  onConfirm, 
  buttonText = "Confirmar", 
  showJoinOption = false 
}) {
  // Estado para el input del gameId (solo para multiplayer)
  const [gameIdInput, setGameIdInput] = useState("");

  // Cargar datos guardados en localStorage
  const savedState = JSON.parse(localStorage.getItem("setupState") || "{}");

  // Inicializar el hook con los datos guardados
  const {
    board,
    placedShips,
    orientation,
    hoveredCell,
    selectedShip,
    highlightedCells,
    toggleOrientation,
    handleCellClick,
    handleCellHover,
    handleBoardLeave,
    handleRemoveShip,
    handleSelectShip,
    resetBoard,
    canPlaceAtCurrentPosition,
  } = useBoard(savedState.board || null, savedState.placedShips || []);

  // Función para manejar la confirmación del setup
  const handleConfirm = () => {
    if (showJoinOption) {
      // Para multiplayer, pasar también el gameIdInput
      onConfirm(board, placedShips, gameIdInput);
    } else {
      // Para bot, solo pasar board y placedShips
      onConfirm(board, placedShips);
    }
  };

  // Guardar automáticamente en localStorage cuando cambian el tablero o los barcos
  useEffect(() => {
    const data = {
      board,
      placedShips,
      orientation,
    };
    localStorage.setItem("setupState", JSON.stringify(data));
  }, [board, placedShips, orientation]);

  return (
    <div className="setup-container">
      <div className="controls">
        <ShipList
          ships={ships}
          selectedShip={selectedShip}
          onSelectShip={handleSelectShip}
          placedShips={placedShips}
          onRemoveShip={handleRemoveShip}
        />
        <div className="options">
          <button onClick={toggleOrientation}>
            Orientación:{" "}
            {orientation === "horizontal" ? "Horizontal" : "Vertical"}
          </button>
          <button onClick={resetBoard}>Reiniciar</button>
          
          {/* Input para unirse a partida (solo en multiplayer) */}
          {showJoinOption && (
            <div className="join-game-input">
              <label htmlFor="gameId">ID de la partida:</label>
              <input
                type="text"
                id="gameId"
                value={gameIdInput}
                onChange={(e) => setGameIdInput(e.target.value)}
                placeholder="Ingresa el ID de la partida"
                className="game-id-input"
              />
            </div>
          )}
          
          <button
            onClick={handleConfirm}
            disabled={
              placedShips.length < ships.length || 
              (showJoinOption && gameIdInput.trim() === "")
            }
            title={
              placedShips.length < ships.length
                ? "Coloca todos los barcos para continuar"
                : showJoinOption && gameIdInput.trim() === ""
                ? "Ingresa un ID de partida válido"
                : ""
            }
            className="confirm-button"
          >
            {buttonText}
          </button>
        </div>
      </div>

      <div className="board-container">
        <h3>Coloca tus barcos</h3>
        <div className="board-wrapper" onMouseLeave={handleBoardLeave}>
          <Board
            board={board}
            onCellClick={handleCellClick}
            highlightedCells={highlightedCells}
            onCellHover={handleCellHover}
            onBoardLeave={handleBoardLeave}
          />
          {hoveredCell &&
            selectedShip &&
            !placedShips.includes(selectedShip.id) &&
            !canPlaceAtCurrentPosition() && (
              <div className="placement-error">
                No se puede colocar el barco aquí
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

export default Setup;