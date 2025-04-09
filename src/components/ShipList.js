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

export default ShipList;
