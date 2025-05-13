const PLAYER_ID_KEY = "battleship_player_id";

const generateGuestId = () => {
  return `guest_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
};

const getPlayerId = (user) => {
  if (user?.username) return user.username;

  const sessionId = sessionStorage.getItem(PLAYER_ID_KEY);
  if (sessionId) return sessionId;

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

export {
  getPlayerId,
  setPlayerId,
  clearPlayerId,
};
