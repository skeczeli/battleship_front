const PLAYER_ID_KEY = "battleship_player_id";

const generateGuestId = () => {
  return `guest_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
};

const getPlayerId = () => {
  const localId = localStorage.getItem(PLAYER_ID_KEY);
  const sessionId = sessionStorage.getItem(PLAYER_ID_KEY);

  // PRIORIDAD: si hay usuario logueado, usá eso
  if (localId) return localId;

  // Si no hay login, usá el invitado
  if (sessionId) return sessionId;

  // Generar nuevo guest
  const guestId = generateGuestId();
  sessionStorage.setItem(PLAYER_ID_KEY, guestId);
  return guestId;
};

const setPlayerId = (id, isGuest = false) => {
  sessionStorage.removeItem(PLAYER_ID_KEY);
  localStorage.removeItem(PLAYER_ID_KEY);

  if (isGuest) {
    sessionStorage.setItem(PLAYER_ID_KEY, id);
  } else {
    localStorage.setItem(PLAYER_ID_KEY, id);
  }
};

const clearPlayerId = () => {
  sessionStorage.removeItem(PLAYER_ID_KEY);
  localStorage.removeItem(PLAYER_ID_KEY);
};

const isGuestPlayer = () => {
  const id = getPlayerId();
  return id.startsWith("guest_");
};

const getPlayerDisplayName = () => {
  const id = getPlayerId();
  return isGuestPlayer() ? "Invitado" : id;
};

export {
  getPlayerId,
  setPlayerId,
  clearPlayerId,
  isGuestPlayer,
  getPlayerDisplayName,
};
