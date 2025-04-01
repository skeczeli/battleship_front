// src/pages/Rules.js
import React from "react";
import "../styles/rules.css";

function Rules() {
  return (
    <div className="container">
      <h1>Reglas del Juego</h1>

      <h2>Objetivo del Juego</h2>
      <p>
        Cada jugador debe colocar estratégicamente sus barcos en un tablero de
        10x10 y tratar de hundir la flota enemiga antes de que su adversario
        hunda la suya.
      </p>

      <h2>Preparación</h2>
      <ol>
        <li>
          El juego comienza cuando dos jugadores se conectan a la partida.
        </li>
        <li>
          Cada jugador coloca sus barcos en su tablero de forma horizontal o
          vertical (no en diagonal).
        </li>
        <li>
          Una vez que ambos jugadores confirmen su posición inicial, comienza la
          partida.
        </li>
      </ol>

      <h2>Turnos de Ataque</h2>
      <ol>
        <li>El sistema elegirá aleatoriamente qué jugador comienza.</li>
        <li>
          En su turno, un jugador selecciona una coordenada en el tablero
          enemigo para disparar.
        </li>
        <li>
          El oponente recibirá una notificación con el resultado del disparo:{" "}
          <strong>"TOCADO"</strong> si acertó o <strong>"AGUA"</strong> si
          falló.
        </li>
        <li>
          El jugador marcará sus disparos en su tablero de registro con un color
          diferente según el resultado.
        </li>
        <li>El turno pasa al siguiente jugador y así sucesivamente.</li>
      </ol>

      <h2>Hundir Barcos</h2>
      <ol>
        <li>
          Cuando un barco recibe impactos en todos sus espacios, se considera{" "}
          <strong>"HUNDIDO"</strong>.
        </li>
        <li>El jugador atacado debe notificar que su barco ha sido hundido.</li>
        <li>Los disparos no pueden repetirse en la misma coordenada.</li>
      </ol>

      <h2>Condiciones de Victoria</h2>
      <ol>
        <li>
          El primer jugador que hunda todos los barcos de su oponente gana la
          partida.
        </li>
        <li>
          Si un jugador se desconecta, la partida se pausará por un tiempo
          determinado antes de dar la victoria al oponente.
        </li>
      </ol>
    </div>
  );
}

export default Rules;
