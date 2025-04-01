// src/components/Button.js
import React from "react";
import { Link } from "react-router-dom";
import "../styles/main.css";

const Button = ({ to, children }) => {
  return (
    <Link to={to}>
      <button className="button">{children}</button>
    </Link>
  );
};

export default Button;
