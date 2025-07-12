import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import { ChevronLeft, ChevronRight } from 'react-bootstrap-icons'; // Para los íconos de flecha

const HeroBanner = () => {
  return (
    <div style={{ backgroundColor: '#e9e9e9', padding: '30px 0', position: 'relative' }}>
      <Container>
        <Row className="align-items-center">
          <Col xs={12} md={7} className="text-center text-md-start mb-3 mb-md-0">
            <h2 className="mb-2" style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#333' }}>
              DÍA DEL PADRE
            </h2>
            <h1 className="mb-3" style={{ fontSize: '3.5rem', fontWeight: 'bold', color: '#333', lineHeight: '1.1' }}>
              ZAPATILLAS
            </h1>
            <div className="d-flex justify-content-center justify-content-md-start align-items-center mb-4">
              <Button variant="warning" className="me-3" style={{ fontWeight: 'bold', borderRadius: '4px' }}>
                HASTA 30% OFF
              </Button>
              <Button variant="outline-dark" style={{ fontWeight: 'bold', borderRadius: '4px' }}>
                HASTA 3 CUOTAS SIN INTERES
              </Button>
            </div>
            <p className="text-muted" style={{ fontSize: '0.9em' }}>
              Hasta el 15/06/25. Ver más en Día del Padre.
            </p>
          </Col>
          <Col xs={12} md={5} className="text-center">
            <img
              src="https://http2.mlstatic.com/D_NQ_NP_900388-MLA74070086208_012024-F.webp" // Usar una imagen de zapatillas real
              alt="Zapatillas de Oferta"
              className="img-fluid"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </Col>
        </Row>
      </Container>
      {/* Botones de navegación (simulados) */}
      <Button
        variant="light"
        className="position-absolute start-0 translate-middle-y rounded-circle d-none d-md-block"
        style={{ top: '50%', left: '10px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}
      >
        <ChevronLeft size={24} />
      </Button>
      <Button
        variant="light"
        className="position-absolute end-0 translate-middle-y rounded-circle d-none d-md-block"
        style={{ top: '50%', right: '10px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}
      >
        <ChevronRight size={24} />
      </Button>
    </div>
  );
};

export default HeroBanner;
