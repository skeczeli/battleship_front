/**
 * Servicio para manejar la identidad del jugador de manera consistente
 * en toda la aplicación, independientemente de si está autenticado o no.
 */

// Clave para almacenar el ID del jugador en sessionStorage
const PLAYER_ID_KEY = "battleship_player_id";

/**
 * Genera un ID único para un jugador anónimo
 * @returns {string} ID de jugador generado
 */
const generateGuestId = () => {
  return `guest_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
};

/**
 * Obtiene el ID del jugador, buscando primero en sessionStorage,
 * luego intentando obtener el usuario autenticado, y finalmente
 * generando un ID de invitado si es necesario.
 *
 * @returns {string} ID del jugador
 */
export const getPlayerId = () => {
  // 1. Intentar obtener el ID del sessionStorage
  let playerId = sessionStorage.getItem(PLAYER_ID_KEY);

  // 2. Si no existe en sessionStorage, intentar obtener del usuario autenticado
  if (!playerId) {
    try {
      const user = localStorage.getItem("user");
      if (user) {
        const userData = JSON.parse(user);
        if (userData && userData.username) {
          playerId = userData.username;
        }
      }
    } catch (error) {
      console.error("Error al obtener usuario autenticado:", error);
    }
  }

  // 3. Si aún no hay ID, generar uno de invitado
  if (!playerId) {
    playerId = generateGuestId();
  }

  // 4. Guardar el ID en sessionStorage para mantener consistencia
  sessionStorage.setItem(PLAYER_ID_KEY, playerId);

  return playerId;
};

/**
 * Verifica si el jugador actual es un invitado
 * @returns {boolean} true si es invitado, false si es usuario autenticado
 */
export const isGuestPlayer = () => {
  const playerId = getPlayerId();
  return playerId.startsWith("guest_");
};

/**
 * Obtiene un nombre para mostrar basado en el ID del jugador
 * @returns {string} Nombre para mostrar
 */
export const getPlayerDisplayName = () => {
  const playerId = getPlayerId();
  return isGuestPlayer() ? "Invitado" : playerId;
};

/**
 * Limpia el ID del jugador (útil al cerrar sesión)
 */
export const clearPlayerId = () => {
  sessionStorage.removeItem(PLAYER_ID_KEY);
};

const PlayerService = {
  getPlayerId,
  isGuestPlayer,
  getPlayerDisplayName,
  clearPlayerId,
};

export default PlayerService;
