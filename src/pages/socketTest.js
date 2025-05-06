import React, { useEffect } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

function SocketTest() {
  useEffect(() => {
    const socket = new SockJS("http://localhost:8080/ws");
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
