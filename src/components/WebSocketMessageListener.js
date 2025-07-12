// src/components/WebSocketMessageListener.js
import React, { useEffect, useState } from 'react';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

function WebSocketMessageListener() {
  const [lastMessage, setLastMessage] = useState('Esperando mensajes...');

  useEffect(() => {
    const echo = new Echo({
      broadcaster: 'pusher',
      key: 'kemazon_v1_2025_key', // Asegúrate de que esta clave coincida con PUSHER_APP_KEY en tu .env de Laravel
      wsHost: 'localhost',
      wsPort: 6002,
      disableStats: true,
      forceTLS: false,
      enabledTransports: ['ws'],
      cluster: 'mt1',
    });

    // Escucha el canal y el evento
    echo.channel('my-channel')
      .listen('.my-event-Kemazon-2025', (e) => { // ¡MODIFICACIÓN AQUÍ! Coincide con broadcastAs() de TestEvent
        console.log('Evento recibido en React:', e);
        setLastMessage(`Mensaje: ${e.message} (Recibido a las ${new Date().toLocaleTimeString()})`);
      })
      .error((error) => {
        console.error('Error al escuchar el canal en React:', error);
        setLastMessage(`Error al escuchar: ${error.message || 'Desconocido'}`);
      });

    // Conexión y depuración de Echo
    echo.connector.pusher.connection.bind('connected', () => {
      console.log('React: Conectado a Laravel WebSockets!');
    });

    echo.connector.pusher.connection.bind('disconnected', () => {
      console.log('React: Desconectado de Laravel WebSockets!');
      setLastMessage('Desconectado. Reconectando...');
    });

    echo.connector.pusher.connection.bind('error', (err) => {
      console.error('React: Error de conexión WebSocket:', err);
      setLastMessage(`Error de conexión: ${err.message || 'Desconocido'}`);
    });

    console.log('React: Intentando conectar a WebSockets...');

    // Función de limpieza al desmontar el componente
    return () => {
      console.log('React: Desconectando Echo al desmontar...');
      echo.leave('my-channel'); // Deja el canal
      echo.disconnect(); // Desconecta la conexión WebSocket
    };
  }, []);

  return (
    <div>
      <h2>Último Mensaje del WebSocket:</h2>
      <p>{lastMessage}</p>
    </div>
  );
}

export default WebSocketMessageListener;