// src/components/Header.js
import React, { useState, useEffect } from 'react';
import { Navbar, Nav, Container, Row, Col, Button } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import apiClient from '../api/apiClient';

// ¡Importa los iconos de React-Bootstrap Icons!
import { PersonCircle, BoxArrowRight } from 'react-bootstrap-icons'; // Importa el icono de persona y el de salir

// Si tienes un archivo CSS para tu Header/Navbar, impórtalo aquí
// import './Header.css';

const Header = () => {
  const redColor = '#C0034C';

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      setIsLoggedIn(true);
      fetchUserName();
    } else {
      setIsLoggedIn(false);
      setUserName('');
    }
  }, [location.pathname]); // Dependencia para re-evaluar al cambiar de ruta

  const fetchUserName = async () => {
    try {
      const response = await apiClient.get('/user-profile');
      if (response.data.status === 1) {
        setUserName(response.data.data.name);
      } else {
        console.error("Error al obtener el perfil del usuario:", response.data.msg);
        handleLogout();
      }
    } catch (error) {
      console.error("Error de red o servidor al obtener perfil:", error);
      handleLogout();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    setIsLoggedIn(false);
    setUserName('');
    apiClient.get('/logout'); // Descomenta si tienes un endpoint de logout en tu Laravel
    navigate('/login');
  };

  return (
    <>
      {/* Navbar principal */}
      <Navbar style={{ backgroundColor: redColor }} expand="lg" variant="dark">
        <Container>
          <Navbar.Brand as={Link} to="/" style={{ color: 'white' }}>Kemazon</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              {/* Elementos públicos para todos */}
              <Nav.Link as={Link} to="#Contacto" style={{ color: 'white' }}>Categorías</Nav.Link>
              {/* <Nav.Link as={Link} to="#moda" style={{ color: 'white' }}>Moda</Nav.Link> */}
            </Nav>
            <Nav className="align-items-center"> {/* Alinea los elementos verticalmente al centro */}
              {/* Elementos visibles solo para usuarios logueados */}
              {isLoggedIn && (
                <>
                  <Nav.Link as={Link} to="/sell-product" style={{ color: 'white' }}>Vender</Nav.Link>
                  <Nav.Link as={Link} to="/my-products" style={{ color: 'white' }}>Mis articulos</Nav.Link>
                  {/* <Nav.Link as={Link} to="#miscompras" style={{ color: 'white' }}>Mis compras</Nav.Link> */}
                  {/* <Nav.Link as={Link} to="#favoritos" style={{ color: 'white' }}>Favoritos</Nav.Link> */}
                  
                  
                  {/* Nombre de usuario con icono de avatar */}
                  <Nav.Link as={Link} to="/dashboard" className="d-flex align-items-center" style={{ color: 'white' }}>
                    <PersonCircle size={24} className="me-2" /> {/* Icono de persona circular */}
                    Hola, {userName || 'Usuario'}
                  </Nav.Link>

                  {/* Icono de Cerrar Sesión */}
                  <Nav.Link
                    onClick={handleLogout}
                    title="Cerrar sesión" // Tooltip al pasar el mouse
                    style={{ color: 'white', cursor: 'pointer' }} // Cursor de puntero para indicar que es clickeable
                  >
                    <BoxArrowRight size={24} /> {/* Icono de flecha saliendo */}
                  </Nav.Link>
                </>
              )}
              {/* Botón de Login/Logout condicional */}
              {!isLoggedIn && (
                <Button as={Link} to="/login" variant="outline-light" className="ms-2">
                  Ingresar
                </Button>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Sección del banner "DÍA DEL PADRE ZAPATILLAS" */}
      <div style={{ backgroundColor: redColor, padding: '50px 0', color: 'white' }}>
        <Container>
          <Row className="align-items-center">
            <Col md={6}>
              <h1 style={{ fontSize: '3rem', fontWeight: 'bold', color: 'white' }}>DÍA DEL PADRE</h1>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white' }}>ZAPATILLAS</h2>
              <div className="mt-3">
                <Button variant="warning" className="me-2">HASTA 30% OFF</Button>
                <Button variant="outline-light">HASTA 3 CUOTAS SIN INTERES</Button>
              </div>
              <p className="mt-3" style={{ color: 'white' }}>Hasta el 15/06/25. Ver más en Día del Padre.</p>
            </Col>
            <Col md={6} className="text-center">
              <div style={{ border: '2px dashed #ccc', padding: '20px', minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}>
                <span style={{ fontSize: '2rem' }}>Imagen de Banner Aquí</span>
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    </>
  );
};

export default Header;