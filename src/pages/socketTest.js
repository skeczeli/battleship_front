import React, { useEffect } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

function SocketTest() {
  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";
  useEffect(() => {
    const socket = new SockJS(`${API_BASE_URL}/ws`);
    const client = new Client({
      webSocketFactory: () => socket,
      onConnect: () => {
        console.log("Conectado");

        // Subscribirse a mensajes del back
        client.subscribe("/topic/test", (msg) => {
          console.log("Mensaje del back:", msg.body);
        });

        // Enviar un mensaje de prueba
        client.publish({ destination: "/app/test", body: "Ping desde React" });
      },
    });

    client.activate();

    return () => client.deactivate();
  }, []);

  return <div>Socket de prueba iniciado (mirá la consola)</div>;
}

export default SocketTest;
