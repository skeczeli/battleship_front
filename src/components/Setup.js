// Setup.js
import React, { useState } from "react";
import "../styles/setup.css";
import Board from "./Board";

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
function ShipList({
  ships,
  selectedShip,
  onSelectShip,
  placedShips,
  onRemoveShip,
}) {
  return (
    <div className="ship-list">
      <h3>Barcos</h3>
      <div className="ship-items-container">
        {ships.map((ship) => (
          <div key={ship.id} className="ship-row">
            <div
              onClick={() => onSelectShip(ship)}
              className={`
                  ship-item
                  ${
                    selectedShip && selectedShip.id === ship.id
                      ? "selected"
                      : ""
                  }
                  ${placedShips.includes(ship.id) ? "placed" : ""}
                `}
            >
              {ship.name} ({ship.size}){placedShips.includes(ship.id) && " ✓"}
            </div>

            {placedShips.includes(ship.id) && (
              <button
                className="remove-ship-btn"
                onClick={() => onRemoveShip(ship.id)}
                title="Eliminar barco"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Componente principal del setup de Battleship.
 */
function Setup({ onConfirm }) {
  // Inicializa el tablero 10x10 (null = vacío, string = ID del barco)
  const initialBoard = Array.from({ length: 10 }, () => Array(10).fill(null));

  // Cargar datos guardados en localStorage
  const savedState = JSON.parse(localStorage.getItem("setupState") || "{}");

  const [board, setBoard] = useState(() => {
    if (
      savedState.board &&
      Array.isArray(savedState.board) &&
      savedState.board.length === 10 &&
      savedState.board.every((row) => Array.isArray(row) && row.length === 10)
    ) {
      return savedState.board;
    }
    return initialBoard;
  });

  const [placedShips, setPlacedShips] = useState(() => {
    return Array.isArray(savedState.placedShips) ? savedState.placedShips : [];
  });

  const [orientation, setOrientation] = useState(() => {
    return savedState.orientation === "vertical" ? "vertical" : "horizontal";
  });

  const [selectedShip, setSelectedShip] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null);

  // Calcula las celdas que serían ocupadas por el barco en la posición actual
  const getShipCells = (row, col, ship, shipOrientation) => {
    if (!ship) return [];

    const cells = [];
    for (let i = 0; i < ship.size; i++) {
      const newRow = shipOrientation === "horizontal" ? row : row + i;
      const newCol = shipOrientation === "horizontal" ? col + i : col;

      // Verifica que las celdas estén dentro del tablero
      if (newRow >= 0 && newRow < 10 && newCol >= 0 && newCol < 10) {
        cells.push([newRow, newCol]);
      }
    }
    return cells;
  };

  // Verifica si es posible colocar el barco en esa posición
  const canPlaceShip = (row, col, ship, shipOrientation) => {
    if (!ship) return false;

    const cells = getShipCells(row, col, ship, shipOrientation);

    // Si el número de celdas no coincide con el tamaño del barco, no se puede colocar
    if (cells.length !== ship.size) return false;

    // Verifica que no haya otro barco en esas celdas
    return cells.every(([r, c]) => board[r][c] === null);
  };

  // Función para manejar el click sobre una celda
  const handleCellClick = (row, col) => {
    if (!selectedShip) return;

    // Si el barco ya está colocado, no hacer nada
    if (placedShips.includes(selectedShip.id)) return;

    if (canPlaceShip(row, col, selectedShip, orientation)) {
      const newBoard = [...board.map((row) => [...row])];
      const cells = getShipCells(row, col, selectedShip, orientation);

      cells.forEach(([r, c]) => {
        newBoard[r][c] = selectedShip.id;
      });

      setBoard(newBoard);
      setPlacedShips([...placedShips, selectedShip.id]);
      // Desseleccionar el barco después de colocarlo
      setSelectedShip(null);
      // Limpiar el hoveredCell para evitar el efecto de hover persistente
      setHoveredCell(null);
    }
  };

  // Función para quitar un barco del tablero
  const handleRemoveShip = (shipId) => {
    // Quitar el barco de la lista de barcos colocados
    const newPlacedShips = placedShips.filter((id) => id !== shipId);
    setPlacedShips(newPlacedShips);

    // Eliminar el barco del tablero
    const newBoard = board.map((row) =>
      row.map((cell) => (cell === shipId ? null : cell))
    );
    setBoard(newBoard);

    // Si este era el barco seleccionado, lo deseleccionamos
    if (selectedShip && selectedShip.id === shipId) {
      setSelectedShip(null);
    }
  };

  // Función para cambiar la orientación del barco
  const toggleOrientation = () => {
    setOrientation(orientation === "horizontal" ? "vertical" : "horizontal");
  };

  // Función para actualizar la celda sobre la que está el cursor
  const handleCellHover = (row, col) => {
    // Solo actualizamos el hover si la celda no tiene un barco ya colocado
    if (board[row][col] === null) {
      setHoveredCell([row, col]);
    } else {
      // Si hay un barco, no mostramos hover
      setHoveredCell(null);
    }
  };

  // Función para manejar cuando el cursor sale del tablero
  const handleBoardLeave = () => {
    setHoveredCell(null);
  };

  // Calcular celdas destacadas para preview
  // Solo mostramos el highlight si el barco no está colocado todavía y hay un barco seleccionado
  const highlightedCells =
    hoveredCell && selectedShip && !placedShips.includes(selectedShip.id)
      ? getShipCells(hoveredCell[0], hoveredCell[1], selectedShip, orientation)
      : [];

  // Función para reiniciar el juego
  const resetGame = () => {
    setBoard(initialBoard);
    setPlacedShips([]);
    setSelectedShip(null);
    setHoveredCell(null);
  };

  const handleSelectShip = (ship) => {
    // Si el barco ya está seleccionado, lo deseleccionamos
    if (selectedShip && selectedShip.id === ship.id) {
      setSelectedShip(null); // Deseleccionar el barco
    } else {
      // Si no está seleccionado o es otro barco diferente, lo seleccionamos
      setSelectedShip(ship);
    }
  };

  const handleConfirm = () => {
    onConfirm(board, placedShips);
  };

  // Guardar automáticamente en localStorage cuando cambian el tablero o los barcos
  React.useEffect(() => {
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
          <button onClick={resetGame}>Reiniciar</button>
          <button onClick={handleConfirm}>Confirmar</button>
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
            hoveredCell={hoveredCell}
            onBoardLeave={handleBoardLeave}
          />
          {hoveredCell &&
            selectedShip &&
            !placedShips.includes(selectedShip.id) &&
            !canPlaceShip(
              hoveredCell[0],
              hoveredCell[1],
              selectedShip,
              orientation
            ) && (
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
