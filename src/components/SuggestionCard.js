// src/components/SuggestionCard.js
import React from 'react';
import { Card, Button } from 'react-bootstrap';
import CountdownTimer from './CountdownTimer'; // Importa el componente visual del contador
import { useCountdown } from '../hooks/useCountdown'; // Importa nuestro nuevo hook
import { Link } from 'react-router-dom'; // <--- ¡Importamos Link de react-router-dom!

const SuggestionCard = ({ auctionId, productId, auctionTitle, productName, imageUrl, basePrice, time_start }) => {
  // Formatear el precio a moneda argentina
  const formattedPrice = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(basePrice);

  // Usamos nuestro hook personalizado para obtener el tiempo restante
  // Pasamos 'time_start' que será la fecha de finalización del remate
  const timeLeft = useCountdown(time_start);

  return (
    // <--- ¡Envolvemos toda la Card con el componente Link!
    // Esto hace que toda la tarjeta sea clickeable y redirija a la página de detalles del producto.
    <Link
      to={`/product-detail/${productId}`} // Definimos la ruta dinámica usando el productId
      style={{ textDecoration: 'none', color: 'inherit' }} // Opcional: quitamos el subrayado del enlace y mantenemos el color del texto
    >
      <Card className="shadow-sm h-100">
        <div style={{ position: 'relative' }}>
          <Card.Img
            variant="top"
            src={imageUrl}
            alt={productName}
            style={{ width: '100%', height: '180px', objectFit: 'cover' }}
          />
          
          {/* Aquí insertamos el componente CountdownTimer y le pasamos los valores del hook */}
          {/* Solo mostramos el contador si el tiempo no ha terminado */}
          {!timeLeft.isTimeUp ? (
            <div style={{
              position: 'absolute',
              bottom: '10px',
              left: '50%',
              transform: 'translateX(-50%)',
            }}>
              <CountdownTimer
                days={timeLeft.days}
                hours={timeLeft.hours}
                minutes={timeLeft.minutes}
                seconds={timeLeft.seconds}
              />
            </div>
          ) : (
            // Opcional: mostrar un mensaje cuando el remate ha terminado
            <div style={{
              position: 'absolute',
              bottom: '10px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(200, 0, 0, 0.8)', // Fondo rojo para "Terminado"
              color: 'white',
              padding: '5px 10px',
              borderRadius: '5px',
              fontWeight: 'bold',
              fontSize: '1em',
            }}>
              Remate Finalizado
            </div>
          )}
        </div>

        <Card.Body className="d-flex flex-column">
          <Card.Title className="text-truncate" style={{ fontSize: '1.1em', minHeight: '33px' }} title={auctionTitle}>
            {auctionTitle}
          </Card.Title>
          <Card.Text className="text-muted mb-1" style={{ fontSize: '0.9em' }}>
            {productName}
          </Card.Text>
          <Card.Text className="fw-bold" style={{ fontSize: '1.2em' }}>
            Base: {formattedPrice}
          </Card.Text>
          {/* El botón "Ver Detalles" ahora también formará parte del enlace general de la tarjeta.
              Si quisieras que el botón tuviera un comportamiento distinto (ej. abrir un modal),
              tendrías que manejar su evento onClick y usar e.stopPropagation().
              Por simplicidad, lo mantenemos como parte del Link principal.
          */}
          <Button variant="warning" className="mt-auto">Ver Detalles</Button>
        </Card.Body>
      </Card>
    </Link>
  );
};

export default SuggestionCard;