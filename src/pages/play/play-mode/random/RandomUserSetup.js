import React from "react";
import Setup from "components/Setup";
import "styles/main.css";
import "App.css";

function RandomUserSetup() {
  return (
    <div>
      <div>
        <h2>Modo contra usuario aleatorio</h2>
      </div>
      <div>
        <Setup />
      </div>
    </div>
  );
}

export default RandomUserSetup;
