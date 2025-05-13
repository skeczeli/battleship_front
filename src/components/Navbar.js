import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useUser } from "contexts/UserContext";

function Navbar() {
  const { user, logout } = useUser();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

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
            <Link to={`/profile/${user.username}`}>
              <button className="button">Perfil ({user.username})</button>
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
