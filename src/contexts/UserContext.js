import React, { createContext, useContext, useState, useEffect } from "react";

const PLAYER_ID_KEY = "battleship_player_id";

const generateGuestId = () =>
  `guest_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

const getStoredPlayerId = (user) => {
  if (user) {
    const stored = localStorage.getItem(PLAYER_ID_KEY);
    if (stored) return stored;

    // Si no hay uno guardado aún, lo generamos a partir del user ID o username
    const newId = `${user.username}`;
    localStorage.setItem(PLAYER_ID_KEY, newId);
    return newId;
  } else {
    const stored = sessionStorage.getItem(PLAYER_ID_KEY);
    if (stored) return stored;

    const guestId = generateGuestId();
    sessionStorage.setItem(PLAYER_ID_KEY, guestId);
    return guestId;
  }
};

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    const parsedUser = stored ? JSON.parse(stored) : null;
    setUser(parsedUser);
    setPlayerId(getStoredPlayerId(parsedUser));
    setIsReady(true);
    console.log(parsedUser);
    console.log(getStoredPlayerId(parsedUser));
  }, []);

  const login = (userData, token) => {
    console.log("UserContext login llamado con:", userData, token); // Debug
    localStorage.setItem("user", JSON.stringify(userData));
    if (token) {
      localStorage.setItem("token", token);
      console.log("Token guardado:", token); // Debug
    } else {
      console.error("No se recibió token en login"); // Debug
    }
    localStorage.setItem(PLAYER_ID_KEY, `${userData.username}`);
    setUser(userData);
    setPlayerId(`${userData.username}`);
  };

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token"); // Eliminar el token
    localStorage.removeItem(PLAYER_ID_KEY);
    sessionStorage.removeItem(PLAYER_ID_KEY);
    sessionStorage.setItem("joinedAlready", "false");

    const newGuestId = generateGuestId();
    sessionStorage.setItem(PLAYER_ID_KEY, newGuestId);
    setUser(null);
    setPlayerId(newGuestId);
  };

  return (
    <UserContext.Provider value={{ user, playerId, isReady, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);