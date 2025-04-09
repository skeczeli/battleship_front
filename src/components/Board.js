import React from "react";
import GridCell from "./GridCell";
import "../styles/main.css";
function Board({
  board,
  onCellClick,
  highlightedCells,
  onCellHover,
  hoveredCell,
  onBoardLeave,
}) {
  return (
    <div className="board">
      {board.map((rowArr, rowIdx) => (
        <div key={rowIdx} className="board-row">
          {rowArr.map((cell, colIdx) => (
            <GridCell
              key={`${rowIdx}-${colIdx}`}
              row={rowIdx}
              col={colIdx}
              value={cell}
              onClick={onCellClick}
              isHighlighted={highlightedCells.some(
                ([r, c]) => r === rowIdx && c === colIdx
              )}
              isHovered={
                hoveredCell &&
                hoveredCell[0] === rowIdx &&
                hoveredCell[1] === colIdx
              }
              onMouseEnter={onCellHover}
              onMouseLeave={() => {}} // No necesitamos un handler específico para cada celda
            />
          ))}
        </div>
      ))}
    </div>
  );
}
export default Board;
