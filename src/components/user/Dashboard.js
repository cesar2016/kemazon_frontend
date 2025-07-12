import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Alert, Button, Card } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient'; // <-- ¡IMPORTANTE! Ajusta la ruta de apiClient

const Dashboard = () => {
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserProfile = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const response = await apiClient.get('/user-profile');

        if (response.data.status === 1) {
          setUserProfile(response.data.data);
        } else {
          setError(response.data.msg || 'Error al cargar el perfil del usuario.');
          navigate('/login');
        }
      } catch (err) {
        console.error("Error al obtener el perfil:", err);
        setError(err.response?.data?.msg || 'Error de conexión o token inválido.');
        if (err.response && err.response.status === 401) {
          localStorage.removeItem('access_token');
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [navigate]);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await apiClient.get('/logout');
      localStorage.removeItem('access_token');
      navigate('/login');
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
      setError(err.response?.data?.msg || 'Error al cerrar sesión.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <p>Cargando perfil de usuario...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <Alert variant="danger">
          {error}
          <Button variant="link" onClick={() => navigate('/login')}>Ir a Login</Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={8}>
          <Card>
            <Card.Body>
              <Card.Title className="text-center mb-4">Bienvenido a tu Dashboard, {userProfile?.name}!</Card.Title>
              <Card.Text>
                <strong>Email:</strong> {userProfile?.email}
              </Card.Text>
              {userProfile?.phone && (
                <Card.Text>
                  <strong>Teléfono:</strong> {userProfile.phone}
                </Card.Text>
              )}
              <div className="d-grid gap-2">
                <Button variant="danger" onClick={handleLogout} disabled={loading}>
                  {loading ? 'Cerrando sesión...' : 'Cerrar Sesión'}
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;
