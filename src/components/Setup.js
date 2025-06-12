// Setup.js
import React, { useEffect, useState } from "react";
import "styles/setup.css";
import Board from "./Board";
import ShipList from "./ShipList";
import useBoard from "../hooks/useBoard";

// Definición de barcos por defecto (fallback)
const defaultShips = [
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
  showJoinOption = false,
  gameConfig, // NUEVA PROP
  boardSize = 10 // NUEVA PROP
}) {
  // Estado para el input del gameId (solo para multiplayer)
  const [gameIdInput, setGameIdInput] = useState("");

  // Usar barcos desde gameConfig o usar los por defecto
  const ships = gameConfig?.ships ? 
    gameConfig.ships.flatMap(ship => 
      Array.from({ length: ship.count }, (_, i) => {
        let name = ship.type.charAt(0).toUpperCase() + ship.type.slice(1);
        
        // Para múltiples barcos del mismo tipo, agregar numeración
        if (ship.count > 1) {
          if (ship.type === 'portaaviones') {
            name = i === 0 ? 'Portaaviones' : 'Superportaaviones';
          } else {
            name = `${name} ${i + 1}`;
          }
        }
        
        return {
          id: `${ship.type}-${i}`,
          name: name,
          size: ship.size,
          type: ship.type
        };
      })
    ) : defaultShips;

  // Cargar datos guardados - pero solo si el tamaño coincide
  const savedState = JSON.parse(localStorage.getItem("setupState") || "{}");
  const canUseSavedState = savedState.board && savedState.board.length === boardSize;

  // Inicializar el hook con los datos guardados (solo si son compatibles)
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
  } = useBoard(
    canUseSavedState ? savedState.board : null, 
    canUseSavedState ? savedState.placedShips : [],
    boardSize // PASAR EL TAMAÑO DEL TABLERO
  );

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
      boardSize // Guardar también el tamaño
    };
    localStorage.setItem("setupState", JSON.stringify(data));
  }, [board, placedShips, orientation, boardSize]);

  const totalShips = gameConfig?.totalShips || ships.length;

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
              placedShips.length < totalShips || 
              (showJoinOption && gameIdInput.trim() === "")
            }
            title={
              placedShips.length < totalShips
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
        <div 
          className="board-wrapper" 
          onMouseLeave={handleBoardLeave}
          data-size={boardSize <= 6 ? "small" : boardSize >= 14 ? "large" : "normal"}
        >
          <Board
            board={board}
            onCellClick={handleCellClick}
            highlightedCells={highlightedCells}
            onCellHover={handleCellHover}
            onBoardLeave={handleBoardLeave}
            boardSize={boardSize}
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