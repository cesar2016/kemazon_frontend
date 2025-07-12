// src/components/CountdownTimer.js
import React from 'react';

const CountdownTimer = ({ days, hours, minutes, seconds }) => {
  const countdownGreenColor = '#1a774f'; // Un verde oscuro y saturado

  return (
    <div style={{
      backgroundColor: countdownGreenColor, // Fondo para todo el bloque
      color: 'white',
      fontWeight: 'bold',
      padding: '6px 8px', // Padding interno para el bloque verde general
      borderRadius: '5px', // Bordes redondeados para el bloque
      display: 'flex', // Usa flexbox para alinear los elementos internos
      alignItems: 'center', // Alinea verticalmente los elementos
      justifyContent: 'center', // Centra el contenido horizontalmente
      fontSize: '0.9em', // Tamaño de fuente base para todo el contador
      boxShadow: '0 2px 5px rgba(0,0,0,0.2)', // Ligera sombra
    }}>
      {/* Bloque de Días */}
      <div style={{ textAlign: 'center', margin: '0 3px' }}>
        <div style={{
          backgroundColor: 'rgba(3, 65, 22, 0.2)', // Fondo semitransparente
          padding: '2px 5px', // Padding top/bottom de 2, laterales de 5
          borderRadius: '3px', // Redondeado
          display: 'inline-block', // Crucial para que el padding y border-radius funcionen bien
          lineHeight: '1.2', // Mantenemos el line-height para consistencia
          marginBottom: '5px',
        }}>
          <span style={{ fontSize: '1.4em', lineHeight: '1.2' }}>{days}</span>
        </div>
        <span style={{ fontSize: '0.7em', display: 'block', lineHeight: '1.2' }}>DIAS</span>
      </div>

      {/* Separador ":" */}
      <span style={{
        fontSize: '1.4em',
        lineHeight: '1.2',
        margin: '0 3px',
        transform: 'translateY(-8px)'
      }}>:</span>

      {/* Bloque de Horas */}
      <div style={{ textAlign: 'center', margin: '0 3px' }}>
        <div style={{
          backgroundColor: 'rgba(3, 65, 22, 0.2)',
          padding: '2px 5px',
          borderRadius: '3px',
          display: 'inline-block',
          lineHeight: '1.2',
          marginBottom: '5px',
        }}>
          <span style={{ fontSize: '1.4em', lineHeight: '1.2' }}>{hours}</span>
        </div>
        <span style={{ fontSize: '0.7em', display: 'block', lineHeight: '1.2' }}>HS</span>
      </div>

      {/* Separador ":" */}
      <span style={{
        fontSize: '1.4em',
        lineHeight: '1.2',
        margin: '0 3px',
        transform: 'translateY(-8px)'
      }}>:</span>

      {/* Bloque de Minutos */}
      <div style={{ textAlign: 'center', margin: '0 3px' }}>
        <div style={{
          backgroundColor: 'rgba(3, 65, 22, 0.2)',
          padding: '2px 5px',
          borderRadius: '3px',
          display: 'inline-block',
          lineHeight: '1.2',
          marginBottom: '5px',
        }}>
          <span style={{ fontSize: '1.4em', lineHeight: '1.2' }}>{minutes}</span>
        </div>
        <span style={{ fontSize: '0.7em', display: 'block', lineHeight: '1.2' }}>MIN</span>
      </div>

      {/* Separador ":" */}
      <span style={{
        fontSize: '1.4em',
        lineHeight: '1.2',
        margin: '0 3px',
        transform: 'translateY(-8px)'
      }}>:</span>

      {/* Bloque de Segundos */}
      <div style={{ textAlign: 'center', margin: '0 3px' }}>
        <div style={{
          backgroundColor: 'rgba(3, 65, 22, 0.2)',
          padding: '2px 5px',
          borderRadius: '3px',
          display: 'inline-block',
          lineHeight: '1.2',
          marginBottom: '5px',
        }}>
          <span style={{ fontSize: '1.4em', lineHeight: '1.2' }}>{seconds}</span>
        </div>
        <span style={{ fontSize: '0.7em', display: 'block', lineHeight: '1.2' }}>SEG</span>
      </div>
    </div>
  );
};

export default CountdownTimer;
