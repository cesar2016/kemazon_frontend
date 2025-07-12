// src/components/user/UserProductsTable.js
import React, { useState, useEffect, useCallback } from 'react'; // Importar useCallback
import { Container, Table, Spinner, Alert, Image, Button, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { CheckCircleFill, XCircleFill, HourglassSplit, PencilSquare, Trash, Hammer } from 'react-bootstrap-icons';
import apiClient from '../../api/apiClient';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import './UserProductsTable.css';
import AuctionModal from '../modals/AuctionModal';
import { Link } from 'react-router-dom';

const UserProductsTable = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);
  const navigate = useNavigate();

  // Estados para el modal de subasta
  const [showAuctionModal, setShowAuctionModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);

  // --- Funciones de fetch fuera del useEffect ---

  // Usamos useCallback para memoizar estas funciones y evitar re-creaciones innecesarias
  // Esto es una buena práctica cuando las funciones son dependencias de useEffect o se pasan a componentes hijos
  const fetchUserId = useCallback(async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        navigate('/login');
        return null;
      }
      const userResponse = await apiClient.get('/user-profile');
      if (userResponse.data.status === 1) {
        return userResponse.data.data.id;
      } else {
        setError('No se pudo obtener el ID del usuario. Por favor, inicia sesión de nuevo.');
        localStorage.removeItem('access_token');
        navigate('/login');
        return null;
      }
    } catch (err) {
      console.error("Error fetching user ID:", err);
      // Incluimos manejo de error 401/403 aquí también por si acaso
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        setError('Tu sesión ha expirado o es inválida. Inicia sesión de nuevo.');
        localStorage.removeItem('access_token');
        navigate('/login');
      } else {
        setError('Error de conexión o al cargar datos del usuario. Inténtalo de nuevo más tarde.');
      }
      return null;
    }
  }, [navigate]); // navigate es una dependencia

  const fetchUserProducts = useCallback(async (id) => {
    // Solo intenta buscar productos si hay un ID y un token
    const token = localStorage.getItem('access_token');
    if (!id || !token) {
      setLoading(false);
      return;
    }
    try {
      const response = await apiClient.get(`/products_for_user/${id}`);
      setProducts(response.data);
    } catch (err) {
      console.error("Error fetching user products:", err);
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        setError('Tu sesión ha expirado o es inválida. Inicia sesión de nuevo.');
        localStorage.removeItem('access_token');
        navigate('/login');
      } else {
        setError('Error al cargar tus productos. Inténtalo de nuevo más tarde.');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]); // navigate es una dependencia, se usa dentro del catch

  // --- useEffect que usa las funciones de fetch ---
  useEffect(() => {
    const loadData = async () => {
      setLoading(true); // Siempre poner loading a true al iniciar la carga
      const id = await fetchUserId();
      if (id) {
        setUserId(id);
        fetchUserProducts(id);
      } else {
        // Si fetchUserId no pudo obtener un ID (ej. porque redirigió),
        // entonces no hay que cargar nada y ya setLoading(false) al final del fetchUserProducts
        // o directamente aquí si id es null
        setLoading(false);
      }
    };

    loadData();
  }, [fetchUserId, fetchUserProducts]); // Dependencias: las funciones memoizadas

  // Manejadores del modal
  const handleShowAuctionModal = (productId) => {
    setSelectedProductId(productId);
    setShowAuctionModal(true);
  };

  const handleCloseAuctionModal = () => {
    setShowAuctionModal(false);
    setSelectedProductId(null); // Limpiar el ID seleccionado
    setError(null); // Limpiar cualquier error del modal
  };

  // Función para manejar el éxito de la subasta (ej. desde el modal)
  const handleAuctionSuccess = () => {
    // Aquí puedes decidir si refrescar solo el producto afectado o toda la tabla
    // Para asegurar el estado correcto, volveremos a cargar los productos del usuario
    if (userId) { // Asegúrate de que el userId esté disponible antes de intentar recargar
      setLoading(true); // Mostrar spinner mientras se refresca
      fetchUserProducts(userId); // Vuelve a cargar los productos
    }
    handleCloseAuctionModal(); // Cerrar el modal
    setError(null);
    // Opcional: mostrar un Toast o Alert de éxito
  };


  if (loading) {
    return (
      <Container className="my-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando productos...</span>
        </Spinner>
        <p className="mt-2">Cargando tus productos...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="my-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  if (products.length === 0) {
    return (
      <Container className="my-5 text-center">
        <Alert variant="info">No tienes productos registrados aún.</Alert>
        <Button onClick={() => navigate('/sell-product')}>Publicar Nuevo Producto</Button>
      </Container>
    );
  }

  return (
    <Container className="my-5">
      <h2 className="text-center mb-4">Mis Productos Registrados</h2>
      <Table striped bordered hover responsive className="text-center">
        <thead>
          <tr>
            <th>STATUS</th>
            <th>PRODUCTO</th>
            <th>DESCRIPCIÓN</th>
            <th>PRECIO</th>
            <th>BASE</th>
            <th>INICIO</th>
            <th>FIN</th>
            <th>ACCIONES</th>
          </tr>
        </thead>
        <tbody>
          {products.map(product => {
            let currentAuctionData = null;
            let productStatusDisplay = "PENDIENTE";
            let statusIcon = <HourglassSplit color="gray" size={24} />;
            let showActionButtons = true;

            if (product.auctions && product.auctions.length > 0) {
              currentAuctionData = product.auctions[0];

              if (currentAuctionData.status === 1 || currentAuctionData.status === "1") {
                productStatusDisplay = "EN SUBASTA";
                statusIcon = <CheckCircleFill color="green" size={24} />;
                showActionButtons = false;
              } else if (currentAuctionData.status === 2 || currentAuctionData.status === "2") {
                productStatusDisplay = "SUBASTA FIN";
                statusIcon = <XCircleFill color="red" size={24} />;
                showActionButtons = false;
              }
            }

            const defaultImageUrl = '/images/default_product.png';
            const imagesBaseUrl = process.env.REACT_APP_API_BASE_URL_IMAGES || '';
            const finalImagesBaseUrl = imagesBaseUrl.endsWith('/') ? imagesBaseUrl : imagesBaseUrl + '/';

            const thumbnailUrl = product.images && product.images.length > 0
                                 ? finalImagesBaseUrl + product.images[0].fullName_image_product
                                 : defaultImageUrl;

            const productPrice = parseFloat(product.price);
            const displayProductPrice = !isNaN(productPrice) ? `$${productPrice.toFixed(2)}` : '-';

            const auctionBasePrice = currentAuctionData ? parseFloat(currentAuctionData.base) : NaN;
            const displayAuctionBasePrice = !isNaN(auctionBasePrice) ? `$${auctionBasePrice.toFixed(2)}` : '-';

            return (
              <tr key={product.id}>
                <td>
                  <OverlayTrigger
                    placement="top"
                    overlay={<Tooltip id={`tooltip-status-${product.id}`}>{productStatusDisplay}</Tooltip>}
                  >
                    {statusIcon}
                  </OverlayTrigger>
                </td>
                <td>
                  <Image src={thumbnailUrl} roundedCircle className="product-image-thumbnail" alt={product.name} />
                  <Link to={`/product-detail/${product.id}`} className="text-decoration-none"> {/* <-- ENLACE */}
                      {product.name}
                   </Link>
                </td>
                <td className="text-start">{product.name}</td>
                <td>{displayProductPrice}</td>
                <td>{displayAuctionBasePrice}</td>
                <td>
                  {currentAuctionData && currentAuctionData.date_start && currentAuctionData.time_start ?
                    moment(currentAuctionData.date_start + ' ' + currentAuctionData.time_start).format('DD/MM/YYYY HH:mm') : '-'}
                </td>
                <td>
                  {currentAuctionData && currentAuctionData.date_end && currentAuctionData.time_end ?
                    moment(currentAuctionData.date_end + ' ' + currentAuctionData.time_end).format('DD/MM/YYYY HH:mm') : '-'}
                </td>
                <td>
                  {showActionButtons ? (
                    <div className="action-button-group d-flex justify-content-center">
                      {/* Botón Eliminar */}
                      <OverlayTrigger
                        placement="top"
                        overlay={<Tooltip id={`tooltip-delete-${product.id}`}>Eliminar Producto</Tooltip>}
                      >
                        <Button variant="danger" size="sm">
                          <Trash />
                        </Button>
                      </OverlayTrigger>

                      {/* Botón Modificar */}
                      <OverlayTrigger
                        placement="top"
                        overlay={<Tooltip id={`tooltip-edit-${product.id}`}>Modificar Producto</Tooltip>}
                      >
                        <Button variant="info" size="sm" className="ms-1">
                          <PencilSquare />
                        </Button>
                      </OverlayTrigger>

                      {/* Botón Subastar - ABRIR MODAL */}
                      <OverlayTrigger
                        placement="top"
                        overlay={<Tooltip id={`tooltip-auction-${product.id}`}>Poner en Subasta</Tooltip>}
                      >
                        <Button
                          variant="success"
                          size="sm"
                          className="ms-1"
                          onClick={() => handleShowAuctionModal(product.id)}
                        >
                          <Hammer />
                        </Button>
                      </OverlayTrigger>
                    </div>
                  ) : (
                    <small className="text-muted">No Aplica</small>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>

      {/* Renderizar el Modal de Subasta */}
      <AuctionModal
        show={showAuctionModal}
        handleClose={handleCloseAuctionModal}
        productId={selectedProductId}
        onAuctionSuccess={handleAuctionSuccess}
      />
    </Container>
  );
};

export default UserProductsTable;