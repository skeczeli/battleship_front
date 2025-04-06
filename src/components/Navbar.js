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
    <header className="navbar">
    <div className="navbar-left">
      {location.pathname !== "/" && (
        <Link to="/">
          <button className="button">Home</button>
        </Link>
      )}
    </div>

    <div className="navbar-right">
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
        {location.pathname !== "/login" && (
          <Link to="/login">
            <button className="button">Log in</button>
          </Link>
        )}
        {location.pathname !== "/register" && (
          <Link to="/register">
            <button className="button">Register</button>
          </Link>
        )}
        </>
      )}
    </div>
  </header>
  );
}

export default Navbar;
