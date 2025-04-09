import React from "react";
import "../styles/main.css";

function GridCell({
  row,
  col,
  value,
  onClick,
  isHighlighted,
  isHovered,
  onMouseEnter,
  onMouseLeave,
}) {
  // Determinamos las clases para la celda
  let cellClass = "grid-cell";

  if (value) {
    // Si la celda ya tiene un barco, mostramos ese color
    cellClass += ` ship-${value}`;
  } else {
    // Si no tiene un barco, aplicamos efectos de hover/highlight solo si no está ocupada
    if (isHovered) {
      cellClass += " cell-hovered"; // Celda sobre la que está el cursor
    }
    if (isHighlighted) {
      cellClass += " cell-highlighted"; // Celdas que formarían parte del barco
    }
  }

  return (
    <div
      className={cellClass}
      onClick={() => onClick(row, col)}
      onMouseEnter={() => onMouseEnter(row, col)}
      onMouseLeave={onMouseLeave}
    />
  );
}

export default GridCell;
