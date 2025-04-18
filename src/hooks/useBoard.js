// hooks/useBoard.js
import { useState, useEffect, useCallback } from "react";

const useBoard = (initialBoardState = null, initialPlacedShips = []) => {
  // Inicializa el tablero 10x10 si no se proporciona uno
  const createEmptyBoard = () =>
    Array.from({ length: 10 }, () => Array(10).fill(null));

  // Estado del tablero
  const [board, setBoard] = useState(() => {
    if (
      initialBoardState &&
      Array.isArray(initialBoardState) &&
      initialBoardState.length === 10 &&
      initialBoardState.every((row) => Array.isArray(row) && row.length === 10)
    ) {
      return initialBoardState;
    }
    return createEmptyBoard();
  });

  // Estado de barcos colocados
  const [placedShips, setPlacedShips] = useState(initialPlacedShips || []);

  // Estado de orientación para colocación
  const [orientation, setOrientation] = useState("horizontal");

  // Estado para celda sobre la que está el cursor
  const [hoveredCell, setHoveredCell] = useState(null);

  // Estado para barco seleccionado
  const [selectedShip, setSelectedShip] = useState(null);

  // Estado para células destacadas (preview)
  const [highlightedCells, setHighlightedCells] = useState([]);

  // Calcula las celdas que serían ocupadas por el barco en la posición actual
  const getShipCells = useCallback((row, col, ship, shipOrientation) => {
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
  }, []);

  // Inicializa shipPositions con info de los barcos ya colocados en el tablero inicial
  const initializeShipPositions = useCallback(() => {
    if (!initialBoardState) return {};

    const shipPositions = {};
    const shipCells = {}; // Agrupa las celdas por ID de barco

    // Recorre todo el tablero para encontrar todos los barcos
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        const cellValue = initialBoardState[row][col];
        if (cellValue !== null && cellValue !== "hit" && cellValue !== "miss") {
          // Crea el array de celdas para este barco si no existe
          if (!shipCells[cellValue]) {
            shipCells[cellValue] = [];
          }
          // Añade esta celda al array de celdas de este barco
          shipCells[cellValue].push([row, col]);
        }
      }
    }

    // Para cada barco, determina su orientación y tamaño
    Object.keys(shipCells).forEach(shipId => {
      const cells = shipCells[shipId];
      let orientation = "horizontal";
      
      // Determina la orientación (si todas las celdas tienen la misma fila, es horizontal)
      if (cells.length > 1) {
        const firstRow = cells[0][0];
        const allSameRow = cells.every(cell => cell[0] === firstRow);
        orientation = allSameRow ? "horizontal" : "vertical";
      }
      
      // El tamaño es la cantidad de celdas
      const size = cells.length;
      
      // Guarda la información del barco
      shipPositions[shipId] = {
        cells,
        orientation,
        size
      };
    });

    return shipPositions;
  }, [initialBoardState]);

  // Estado para mantener un registro de las posiciones de los barcos
  const [shipPositions, setShipPositions] = useState(initializeShipPositions);

  // Verifica si es posible colocar el barco en esa posición
  const canPlaceShip = useCallback(
    (row, col, ship, shipOrientation) => {
      if (!ship) return false;

      const cells = getShipCells(row, col, ship, shipOrientation);

      // Si el número de celdas no coincide con el tamaño del barco, no se puede colocar
      if (cells.length !== ship.size) return false;

      // Verifica que no haya otro barco en esas celdas
      return cells.every(([r, c]) => board[r][c] === null);
    },
    [board, getShipCells]
  );

  // Función para actualizar las celdas destacadas
  const updateHighlightedCells = useCallback(
    (cell) => {
      if (!cell || !selectedShip || placedShips.includes(selectedShip.id)) {
        setHighlightedCells([]);
      } else {
        const cells = getShipCells(cell[0], cell[1], selectedShip, orientation);
        setHighlightedCells(cells);
      }
    },
    [selectedShip, placedShips, getShipCells, orientation]
  );

  // Función para manejar el click sobre una celda
  const handleCellClick = useCallback(
    (row, col) => {
      if (!selectedShip) return;

      // Si el barco ya está colocado, no hacer nada
      if (placedShips.includes(selectedShip.id)) return;

      if (canPlaceShip(row, col, selectedShip, orientation)) {
        const newBoard = [...board.map((row) => [...row])];
        const cells = getShipCells(row, col, selectedShip, orientation);

        cells.forEach(([r, c]) => {
          newBoard[r][c] = selectedShip.id;
        });

        // Guardar las posiciones del barco
        setShipPositions(prev => ({
          ...prev,
          [selectedShip.id]: {
            cells,
            orientation,
            size: selectedShip.size
          }
        }));

        setBoard(newBoard);
        setPlacedShips([...placedShips, selectedShip.id]);
        // Desseleccionar el barco después de colocarlo
        setSelectedShip(null);
        // Limpiar el hoveredCell para evitar el efecto de hover persistente
        setHoveredCell(null);
        updateHighlightedCells(null);
      }
    },
    [
      board,
      selectedShip,
      placedShips,
      orientation,
      canPlaceShip,
      getShipCells,
      updateHighlightedCells,
    ]
  );

  // Función para quitar un barco del tablero
  const handleRemoveShip = useCallback(
    (shipId) => {
      // Quitar el barco de la lista de barcos colocados
      const newPlacedShips = placedShips.filter((id) => id !== shipId);
      setPlacedShips(newPlacedShips);

      // Eliminar el barco del tablero
      const newBoard = board.map((row) =>
        row.map((cell) => (cell === shipId ? null : cell))
      );
      setBoard(newBoard);

      // Eliminar las posiciones guardadas del barco
      const newShipPositions = { ...shipPositions };
      delete newShipPositions[shipId];
      setShipPositions(newShipPositions);

      // Si este era el barco seleccionado, lo deseleccionamos
      if (selectedShip && selectedShip.id === shipId) {
        setSelectedShip(null);
      }
    },
    [board, placedShips, selectedShip, shipPositions]
  );

  // Función para cambiar la orientación del barco
  const toggleOrientation = useCallback(() => {
    setOrientation(orientation === "horizontal" ? "vertical" : "horizontal");
  }, [orientation]);

  // Función para actualizar la celda sobre la que está el cursor
  const handleCellHover = useCallback(
    (row, col) => {
      // Solo actualizamos el hover si hay un barco seleccionado
      if (selectedShip) {
        setHoveredCell([row, col]);

        // Actualizamos las celdas destacadas para preview
        if (!placedShips.includes(selectedShip.id)) {
          updateHighlightedCells([row, col]);
        }
      }
    },
    [selectedShip, placedShips, updateHighlightedCells]
  );

  // Función para manejar cuando el cursor sale del tablero
  const handleBoardLeave = useCallback(() => {
    setHoveredCell(null);
    setHighlightedCells([]);
  }, []);

  // Función para reiniciar el juego
  const resetBoard = useCallback(() => {
    setBoard(createEmptyBoard());
    setPlacedShips([]);
    setSelectedShip(null);
    setHoveredCell(null);
    setHighlightedCells([]);
    setShipPositions({});
  }, []);

  // Función para seleccionar un barco
  const handleSelectShip = useCallback(
    (ship) => {
      // Si el barco ya está seleccionado, lo deseleccionamos
      if (selectedShip && selectedShip.id === ship.id) {
        setSelectedShip(null);
        setHighlightedCells([]);
      } else {
        // Si no está seleccionado o es otro barco diferente, lo seleccionamos
        setSelectedShip(ship);
      }
    },
    [selectedShip]
  );

  // Verificar si se puede colocar en la posición actual (para mensajes de error)
  const canPlaceAtCurrentPosition = useCallback(() => {
    if (
      !hoveredCell ||
      !selectedShip ||
      placedShips.includes(selectedShip.id)
    ) {
      return true;
    }

    return canPlaceShip(
      hoveredCell[0],
      hoveredCell[1],
      selectedShip,
      orientation
    );
  }, [hoveredCell, selectedShip, placedShips, canPlaceShip, orientation]);

  // Efecto para actualizar las celdas destacadas cuando cambia la orientación
  useEffect(() => {
    if (hoveredCell) {
      updateHighlightedCells(hoveredCell);
    }
  }, [orientation, hoveredCell, updateHighlightedCells]);

  // Manejar disparos al tablero
  const handleShot = useCallback(
    (row, col) => {
      // Si ya se disparó a esa celda (hit o miss), no hacer nada
      if (board[row][col] === "hit" || board[row][col] === "miss") {
        return false;
      }

      // Clonar el tablero para actualizarlo
      const newBoard = [...board.map((boardRow) => [...boardRow])];

      
      const cellValue = board[row][col]; // El tablero real que te dio el backend

      let result = "miss"; // Asumimos que es miss
      if (cellValue !== null) {
      result = "hit"; // Si hay un barco en esa celda, es un hit
      }

      newBoard[row][col] = result;

      // Actualizar el tablero
      setBoard(newBoard);


      let message = "";

      // Verificar si el barco ha sido hundido
      if (cellValue !== null) {
          // Obtenemos todas las celdas de ese barco usando shipPositions
          const shipInfo = shipPositions[cellValue];
          
          // Verificamos si todas las celdas del barco están marcadas como "hit"
          const isSunk = shipInfo.cells.every(([r, c]) => {
            return newBoard[r][c] === "hit";
          });

          if (isSunk) {
            message = "¡Barco hundido!";
          }
        }

      // Devolver las coordenadas y resultado para que el componente pueda mostrar mensajes
      return {
        row,
        col,
        result: result,
        message,
      };
    },
    [board, shipPositions]
  );

  return {
    board,
    setBoard,
    placedShips,
    setPlacedShips,
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
    handleShot,
  };
};

export default useBoard;
