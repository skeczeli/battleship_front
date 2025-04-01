// src/components/Navbar.js
import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

function Navbar() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/";
  };

  const location = useLocation();

  return (
    <div className="top-buttons">
      {location.pathname !== "/" && (
        <Link to="/">
          <button className="button">Home</button>
        </Link>
      )}

      {user ? (
        <>
          <Link to="/account">
            <button className="button">{user.username}</button>
          </Link>
          <button className="button" onClick={handleLogout}>
            Log out
          </button>
        </>
      ) : (
        <>
          {location.pathname === "/login" && (
            <Link to="/register">
              <button className="button">Register</button>
            </Link>
          )}
          {location.pathname === "/register" && (
            <Link to="/login">
              <button className="button">Log in</button>
            </Link>
          )}
          {location.pathname !== "/play" && (
            <Link to="/play">
              <button className="button">Play modes</button>
            </Link> //esto solo en playLayout
          )}
          {location.pathname !== "/login" &&
            location.pathname !== "/register" && (
              <Link to="/login">
                <button className="button">Log in</button>
              </Link>
            )}
        </>
      )}
    </div>
  );
}

export default Navbar;
