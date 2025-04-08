// Setup.js
import React, { useState } from "react";
import "../styles/setup.css";

// Definición de barcos
const ships = [
  { id: "portaaviones", name: "Portaaviones", size: 5 },
  { id: "acorazado", name: "Acorazado", size: 4 },
  { id: "submarino", name: "Submarino", size: 3 },
  { id: "destructor", name: "Destructor", size: 3 },
  { id: "lancha", name: "Lancha", size: 2 },
];

/**
 * Componente para la lista de barcos.
 * Permite seleccionar un barco y resaltar el seleccionado.
 */
function ShipList({ ships, selectedShip, onSelectShip }) {
  return (
    <div className="ship-list">
      <h3>Barcos</h3>
      <ul>
        {ships.map((ship) => (
          <li
            key={ship.id}
            onClick={() => onSelectShip(ship)}
            className={
              selectedShip && selectedShip.id === ship.id ? "selected" : ""
            }
          >
            {ship.name} ({ship.size})
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Componente que representa cada celda del tablero.
 */
function GridCell({ row, col, onClick, isSelected }) {
  return (
    <div
      className={`grid-cell ${isSelected ? "cell-selected" : ""}`}
      onClick={() => onClick(row, col)}
    />
  );
}

/**
 * Componente que muestra el tablero 10x10.
 */
function Board({ board, onCellClick }) {
  return (
    <div className="board">
      {board.map((rowArr, rowIdx) => (
        <div key={rowIdx} className="board-row">
          {rowArr.map((cell, colIdx) => (
            <GridCell
              key={`${rowIdx}-${colIdx}`}
              row={rowIdx}
              col={colIdx}
              onClick={onCellClick}
              isSelected={cell}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Componente principal del setup de Battleship.
 */
function Setup() {
  // Inicializa el tablero 10x10
  const initialBoard = Array.from({ length: 10 }, () => Array(10).fill(false));
  const [board, setBoard] = useState(initialBoard);
  const [selectedShip, setSelectedShip] = useState(null);

  // Función para manejar el click sobre una celda
  const handleCellClick = (row, col) => {
    const newBoard = board.map((r, rowIndex) =>
      r.map((cell, colIndex) =>
        rowIndex === row && colIndex === col ? !cell : cell
      )
    );
    setBoard(newBoard);
  };

  return (
    <div className="setup-container">
      <ShipList
        ships={ships}
        selectedShip={selectedShip}
        onSelectShip={setSelectedShip}
      />
      <Board board={board} onCellClick={handleCellClick} />
    </div>
  );
}

export default Setup;
