import React from "react";
import { Outlet } from "react-router-dom";

function PlayLayout() {
  return (
    <div className="container">
      <h1>Batalla naval – partida</h1>
      <Outlet />
    </div>
  );
}

export default PlayLayout;
