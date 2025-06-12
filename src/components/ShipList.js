// ShipList.js
import React from "react";

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
  // Mapa de colores para cada tipo de barco
  const shipColors = {
    portaaviones: "#ec4899", // Rosa - primer portaaviones
    acorazado: "#a855f7",    // Violeta
    submarino: "#06b6d4",    // Celeste
    destructor: "#10b981",   // Verde
    lancha: "#f97316",       // Naranja
    fragata: "#8b5cf6",      // Púrpura
  };

  const getShipColor = (ship) => {
    // Extraer el tipo del ID (ej: "portaaviones-0" -> "portaaviones")
    const shipType = ship.type || ship.id.split('-')[0];
    
    // Color especial para el segundo portaaviones (Superportaaviones)
    if (ship.id === "portaaviones-1") {
      return "#f59e0b"; // Dorado para Superportaaviones
    }
    
    return shipColors[shipType] || "#6b7280"; // Gris por defecto
  };

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
              data-ship-id={ship.id}
              style={{
                borderLeft: `4px solid ${getShipColor(ship)}`,
                paddingLeft: '12px'
              }}
            >
              {ship.name} ({ship.size}){placedShips.includes(ship.id) && " ✓"}
            </div>

            {placedShips.includes(ship.id) && (
              <button
                className="remove-ship-btn"
                onClick={() => {
                  onRemoveShip(ship.id);
                  onSelectShip(ship);
                }}
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

export default ShipList;