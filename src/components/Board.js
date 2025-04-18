import React from "react";
import "../styles/board.css";

/**
 * Componente de tablero de juego.
 * Renderiza una cuadrícula interactiva y maneja eventos de clic y hover.
 * @param {Array} board - Estado del tablero
 * @param {Function} onCellClick - Función a ejecutar al hacer clic en una celda
 * @param {Array} highlightedCells - Celdas a destacar (para preview de colocación)
 * @param {Function} onCellHover - Función a ejecutar al pasar el cursor sobre una celda
 * @param {Function} onBoardLeave - Función a ejecutar cuando el cursor sale del tablero
 * @param {boolean} isGameMode - Indica si estamos en modo juego para mostrar disparos
 */
function Board({
  board,
  onCellClick,
  highlightedCells = [],
  onCellHover,
  onBoardLeave,
  isGameMode = false,
}) {
  // Función para determinar si una celda está destacada (para preview)
  const isCellHighlighted = (row, col) => {
    return highlightedCells.some(([r, c]) => r === row && c === col);
  };

  // Renderizar una celda individual
  const renderCell = (row, col) => {
    const cellContent = board[row][col];
    const isHighlighted = isCellHighlighted(row, col);

    // Determinar la clase CSS
    let cellClass = "cell";

    // En modo juego, mostramos hits/misses diferente
    if (isGameMode) {
      if (cellContent === "hit" || cellContent === "miss") {
        cellClass += ` ${cellContent}`;
      } else if (cellContent && typeof cellContent === "string") {
        // Mostramos barcos normalmente (en tablero propio)
        cellClass += ` ship-${cellContent}`;
      }
    } else {
      // En modo setup, solo mostramos barcos
      if (cellContent && typeof cellContent === "string") {
        cellClass += ` ship-${cellContent}`;
      }
    }

    if (isHighlighted) {
      cellClass += " highlight";
    }

    return (
      <div
        key={`${row}-${col}`}
        className={cellClass}
        onClick={() => onCellClick(row, col)}
        onMouseEnter={() => onCellHover && onCellHover(row, col)}
        data-state={
          cellContent === "hit" || cellContent === "miss" ? cellContent : null
        }
      ></div>
    );
  };

  // Renderizar las etiquetas de coordenadas
  const renderCoordinateLabels = () => {
    const letters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
    const numbers = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];

    return (
      <>
        {/* Etiquetas de columna (letras) */}
        <div className="coordinate-row">
          <div className="coordinate-cell empty"></div>
          {letters.map((letter, index) => (
            <div key={`col-${index}`} className="coordinate-cell">
              {letter}
            </div>
          ))}
        </div>

        {/* Contenido del tablero con etiquetas de fila */}
        {board.map((row, rowIndex) => (
          <div key={`row-${rowIndex}`} className="board-row">
            <div className="coordinate-cell">{numbers[rowIndex]}</div>
            {row.map((_, colIndex) => renderCell(rowIndex, colIndex))}
          </div>
        ))}
      </>
    );
  };

  return (
    <div className="board" onMouseLeave={onBoardLeave}>
      {renderCoordinateLabels()}
    </div>
  );
}

export default Board;
