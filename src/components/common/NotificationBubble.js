// src/components/common/NotificationBubble.js
import React from 'react';
import './NotificationBubble.css'; // Crearemos este archivo CSS en el siguiente paso

const NotificationBubble = ({ count }) => {
  if (count <= 0) {
    return null; // No renderiza el globito si no hay notificaciones
  }

  return (
    <span className="notification-bubble">
      {count}
    </span>
  );
};

export default NotificationBubble;
