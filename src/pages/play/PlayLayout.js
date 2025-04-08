// PlayLayout.js

import React from "react";
import { Outlet } from "react-router-dom";
import Setup from "../../components/Setup";

// Sube dos niveles (pages -> src) y luego ingresa a styles/main.css
import "../../styles/main.css";
// Sube dos niveles (pages -> src) y localiza App.css
import "../../App.css";

function PlayLayout() {
  return (
    <div className="layout-container">
      <Outlet /> <Setup />
    </div>
  );
}

export default PlayLayout;
