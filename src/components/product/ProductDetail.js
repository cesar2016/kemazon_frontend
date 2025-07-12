// src/components/product/ProductDetail.js

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Image, Spinner, Alert, Button, Card, Modal, Carousel } from 'react-bootstrap';
import { CurrencyDollar, Clock, Hammer } from 'react-bootstrap-icons';
import apiClient from '../../api/apiClient';
import moment from 'moment';
import './ProductDetail.css';
import CountdownTimer from '../CountdownTimer';
import BidModal from '../modals/BidModal';
import { useAuth } from '../../context/AuthContext';
import { FaWhatsapp } from 'react-icons/fa';
import BidHistory from './BidHistory';

// Importaciones para WebSockets
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

import NotificationBubble from '../common/NotificationBubble'; // Asegúrate de que esta ruta sea correcta

// Asegúrate de que Pusher esté en el ámbito global ANTES de inicializar Echo.
window.Pusher = Pusher;

const ProductDetail = () => {
  const { productId } = useParams();
  const navigate = useNavigate();

  const { user, userId, isLoggedIn, loadingAuth } = useAuth();
  const [productData, setProductData] = useState(null);
  const [loading, setLoading] = useState(true); // Solo para la carga INICIAL del producto
  const [error, setError] = useState(null);
  const [currentMainImage, setCurrentMainImage] = useState(null);

  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [carouselActiveIndex, setCarouselActiveIndex] = useState(0);

  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 });

  const [showBidModal, setShowBidModal] = useState(false);

  // Estados para las ofertas y su carga
  const [latestBidAmounts, setLatestBidAmounts] = useState(false);
  const [loadingLatestBid, setLoadingLatestBid] = useState(false); // Spinner para el botón de oferta

  // Estado para el ID de la subasta principal que determina las bids y el historial
  const [auctionIdForBidsFetch, setAuctionIdForBidsFetch] = useState(null);

  const currentUserId = userId;

  const imagesBaseUrl = process.env.REACT_APP_API_BASE_URL_IMAGES || '';
  const finalImagesBaseUrl = imagesBaseUrl.endsWith('/') ? imagesBaseUrl : imagesBaseUrl + '/';
  const defaultImageUrl = '/images/default_product.png';

  // --- ESTADOS Y FUNCIONES PARA EL HISTORIAL DE OFERTAS ---
  const [bidsData, setBidsData] = useState({
    data: [],
    current_page: 1,
    last_page: 1,
    total: 0,
    links: [],
  });
  const [loadingBidHistory, setLoadingBidHistory] = useState(true); // Controla el spinner DENTRO de BidHistory
  const [errorBidHistory, setErrorBidHistory] = useState(null);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const bidHistoryRef = useRef(null);

  // --- FUNCIONES useCallback DECLARADAS PRIMERO PARA EVITAR no-undef ---

  const fetchProductDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get(`/products/${productId}`);
      const product = response.data;

      if (product) {
        setProductData(product);
        if (product.images && product.images.length > 0) {
          setCurrentMainImage(finalImagesBaseUrl + product.images[0].fullName_image_product);
        } else {
          setCurrentMainImage(defaultImageUrl);
        }
      } else {
        setError('Producto no encontrado.');
      }
    } catch (err) {
      console.error("Error fetching product details:", err.response ? err.response.data : err);
      if (err.response && err.response.status === 404) {
        setError('El producto que buscas no existe.');
      } else {
        setError('Error al cargar los detalles del producto. Inténtalo de nuevo más tarde.');
      }
    } finally {
      setLoading(false);
    }
  }, [productId, finalImagesBaseUrl, defaultImageUrl]);

  const fetchBidHistory = useCallback(async (page = 1, cant = itemsPerPage) => {
    if (!auctionIdForBidsFetch) {
      console.warn("fetchBidHistory: auctionIdForBidsFetch es nulo o indefinido. No se cargarán las ofertas.");
      setLoadingBidHistory(false);
      setBidsData({ data: [], current_page: 1, last_page: 1, total: 0, links: [] });
      return;
    }
    setLoadingBidHistory(true);
    setErrorBidHistory(null);
    console.log("ProductDetail: Iniciando carga de historial de ofertas. LoadingBidHistory:", true);
    try {
      const response = await apiClient.get(`/get_history_bids/${auctionIdForBidsFetch}/${cant}?page=${page}`);
      console.log(`Historial de Bids para subasta ${auctionIdForBidsFetch}, página ${page}, ${cant} por página:`, response.data);
      setBidsData(response.data);
      console.log("ProductDetail: Datos de ofertas recibidos y establecidos. LoadingBidHistory:", false);
    } catch (err) {
      console.error("Error fetching bid history:", err.response ? err.response.data : err);
      setErrorBidHistory('Error al cargar el historial de ofertas. Inténtalo de nuevo más tarde.');
      setBidsData({ data: [], current_page: 1, last_page: 1, total: 0, links: [] });
    } finally {
      setLoadingBidHistory(false);
      console.log("ProductDetail: Carga de historial de ofertas finalizada. LoadingBidHistory:", false);
    }
  }, [auctionIdForBidsFetch, itemsPerPage]);

  const fetchLatestBidForButton = useCallback(async (auctionId) => {
    if (!auctionId) {
      console.warn("fetchLatestBidForButton: auctionId es nulo o indefinido. No se realizará la llamada.");
      setLatestBidAmounts(null);
      return;
    }
    setLoadingLatestBid(true);
    try {
      const response = await apiClient.get(`/bids/${auctionId}`);
      console.log(`Última oferta para botón (bids/${auctionId}):`, response.data);

      if (response.data.status === 'full') {
        setLatestBidAmounts({
          amounMaximoSimple: parseFloat(response.data.amounMaximoSimple || 0),
          amounMaximoAutom: parseFloat(response.data.amounMaximoAutom || 0)
        });
      } else {
        setLatestBidAmounts({ amounMaximoSimple: 0, amounMaximoAutom: 0 });
      }
    } catch (err) {
      console.error(`Error al obtener última oferta (bids/${auctionId}):`, err.response ? err.response.data : err);
      setLatestBidAmounts(null);
    } finally {
      setLoadingLatestBid(false);
    }
  }, []);

  const handlePageChangeBidHistory = useCallback((pageNumber) => {
    fetchBidHistory(pageNumber, itemsPerPage);
  }, [fetchBidHistory, itemsPerPage]);

  const handleItemsPerPageChangeBidHistory = useCallback((e) => {
    const newItemsPerPage = parseInt(e.target.value, 10);
    setItemsPerPage(newItemsPerPage);
  }, []);

  const handleThumbnailClick = useCallback((imageUrl) => {
    setCurrentMainImage(imageUrl);
  }, []);

  const handleOpenGallery = useCallback(() => {
    if (productData && productData.images && productData.images.length > 0) {
      const currentImageFileName = currentMainImage ? currentMainImage.replace(finalImagesBaseUrl, '') : '';
      const index = productData.images.findIndex(img => img.fullName_image_product === currentImageFileName);
      setCarouselActiveIndex(index !== -1 ? index : 0);
    } else {
      setCarouselActiveIndex(0);
    }
    setShowGalleryModal(true);
  }, [productData, currentMainImage, finalImagesBaseUrl]);

  const handleCloseGallery = useCallback(() => setShowGalleryModal(false), []);

  const handleSelectCarousel = useCallback((selectedIndex) => {
    setCarouselActiveIndex(selectedIndex);
  }, []);

  const handleBidClick = useCallback(() => {
    if (!isLoggedIn) {
      alert('Debes iniciar sesión para poder ofertar.');
      navigate('/login');
      return;
    }

    if (productData && productData.user && productData.user.id === currentUserId) {
      alert('Error: No puedes ofertar en tu propio producto.');
      return;
    }
    setShowBidModal(true);
  }, [isLoggedIn, navigate, productData, currentUserId]);

  const handleCloseBidModal = useCallback(() => {
    console.log("ProductDetail: handleCloseBidModal llamado.");
    setShowBidModal(false);
  }, []);

  // FUNCION CLAVE: Esto se ejecuta cuando la oferta en el modal es exitosa
  const handleBidSuccess = useCallback(() => {
    console.log("ProductDetail: handleBidSuccess llamado. Iniciando cierre del modal.");
    // Cerramos el modal inmediatamente. La actualización de datos sucederá en onExited.
    setShowBidModal(false); 
  }, []);

  // NUEVA FUNCION: Esto se ejecuta DESPUÉS de que la animación de cierre del modal termina
  const handleBidModalExited = useCallback(() => {
    console.log("ProductDetail: handleBidModalExited llamado. El modal ha terminado de cerrarse. Actualizando datos.");
    if (auctionIdForBidsFetch) {
      fetchLatestBidForButton(auctionIdForBidsFetch); // <--- Esto actualizará el botón
      fetchBidHistory(1, itemsPerPage); // <--- Esto actualizará el historial
    }
  }, [auctionIdForBidsFetch, fetchLatestBidForButton, fetchBidHistory, itemsPerPage]);


  const handleWhatsappChat = useCallback(() => {
    let targetPhoneNumber = null;
    let whatsappMessage = '';

    if (user && productData.user && user.id === productData.user.id) {
      targetPhoneNumber = user.phone;
      whatsappMessage = `Hola, soy el vendedor del producto "${productData.name}" (ID: ${productId}). ¿En qué puedo ayudarte?`;
    } else {
      targetPhoneNumber = productData.user ? productData.user.phone : null;
      whatsappMessage = `Hola, estoy interesado/a en tu producto "${productData.name}" (ID: ${productId}). ¿Podrías darme más información sobre el remate?`;
    }

    if (!targetPhoneNumber) {
      alert('Número de teléfono no disponible para el chat.');
      return;
    }

    const encodedMessage = encodeURIComponent(whatsappMessage);
    const whatsappUrl = `https://wa.me/${targetPhoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  }, [user, productData, productId]);

  useEffect(() => {
    if (auctionIdForBidsFetch) {
      console.log("ProductDetail: auctionIdForBidsFetch disponible, cargando historial de ofertas...");
      fetchBidHistory(1, itemsPerPage);
    }
  }, [auctionIdForBidsFetch, fetchBidHistory, itemsPerPage]);
  
  // Carga los detalles del producto al inicio o cuando cambia productId
  useEffect(() => {
    if (productId) {
      fetchProductDetails();
    }
  }, [productId, fetchProductDetails]);

  // Lógica para determinar la subasta principal y cargar bids/última oferta
  useEffect(() => {
    if (productData && productData.auctions && productData.auctions.length > 0) {
      const now = moment();
      let auctionToProcess = null;

      auctionToProcess = productData.auctions.find(auction => {
        const startTime = moment(`${auction.date_start} ${auction.time_start}`);
        const endTime = moment(`${auction.date_end} ${auction.time_end}`);
        return auction.status === 1 && now.isBetween(startTime, endTime);
      });

      // Si no hay subasta activa, busca la próxima
      if (!auctionToProcess) {
        auctionToProcess = productData.auctions.find(auction => {
          const startTime = moment(`${auction.date_start} ${auction.time_start}`);
          return now.isBefore(startTime);
        });
      }

      // Si no hay subasta activa ni próxima, busca la más reciente (finalizada)
      if (!auctionToProcess) {
        auctionToProcess = productData.auctions.reduce((latest, current) => {
          const latestEndTime = latest ? moment(`${latest.date_end} ${latest.time_end}`) : null;
          const currentEndTime = moment(`${current.date_end} ${current.time_end}`);

          if (currentEndTime.isSameOrBefore(now) && (!latestEndTime || currentEndTime.isAfter(latestEndTime))) {
            return current;
          }
          if (currentEndTime.isAfter(now) && (!latestEndTime || currentEndTime.isAfter(latestEndTime))) {
            return current;
          }
          return latest;
        }, null);
      }

      if (auctionToProcess && auctionToProcess.id !== auctionIdForBidsFetch) {
        setAuctionIdForBidsFetch(auctionToProcess.id);
        fetchLatestBidForButton(auctionToProcess.id);
        fetchBidHistory(1, itemsPerPage);
      } else if (!auctionToProcess && auctionIdForBidsFetch !== null) {
        setAuctionIdForBidsFetch(null);
        setLatestBidAmounts(null);
        setBidsData({ data: [], current_page: 1, last_page: 1, total: 0, links: [] });
      } else if (auctionToProcess && auctionToProcess.id === auctionIdForBidsFetch) {
        // Esta condición es importante para recargar la oferta más reciente si por alguna razón no se ha cargado
        // o si el estado `latestBidAmounts` está en su valor inicial/vacío.
        // Solo recarga si `amounMaximoSimple` es 0 pero hay un precio base,
        // o si `latestBidAmounts` aún no ha sido establecido por una carga previa.
        if (!latestBidAmounts || (latestBidAmounts && latestBidAmounts.amounMaximoSimple === 0 && parseFloat(auctionToProcess.base) > 0)) {
            fetchLatestBidForButton(auctionToProcess.id);
        }
      }
    } else if (productData && (!productData.auctions || productData.auctions.length === 0)) {
      setLatestBidAmounts(null);
      setAuctionIdForBidsFetch(null);
      setBidsData({ data: [], current_page: 1, last_page: 1, total: 0, links: [] });
    }
  }, [productData, fetchLatestBidForButton, auctionIdForBidsFetch, fetchBidHistory, itemsPerPage, latestBidAmounts]);


  useEffect(() => {
    let echo;
    // Solo inicializa Echo si hay un auctionIdForBidsFetch válido
    if (auctionIdForBidsFetch) {
      console.log("React: Intentando conectar a WebSockets...");
      echo = new Echo({
        broadcaster: 'pusher',
        key: 'kemazon_v1_2025_key',
        wsHost: process.env.REACT_APP_WEBSOCKET_HOST || 'localhost',
        wsPort: process.env.REACT_APP_WEBSOCKET_PORT || 6002,
        disableStats: true,
        forceTLS: false,
        enabledTransports: ['ws'],
        cluster: 'mt1',
      });

      const channelName = `auction.${auctionIdForBidsFetch}`;
      console.log(`ProductDetail: Subscribiendo al canal WebSocket: ${channelName}`);

      echo.channel(channelName)
        .listen('.new.bid', (e) => {
          console.log('ProductDetail: ¡Nueva oferta recibida vía WebSocket!', e); // Aquí debería aparecer el log
          fetchBidHistory(1, itemsPerPage);
          fetchLatestBidForButton(auctionIdForBidsFetch);
        })
        .error((error) => {
          console.error(`ProductDetail: Error al escuchar el canal ${channelName} en React:`, error);
        });

      echo.connector.pusher.connection.bind('connected', () => {
        console.log(`ProductDetail: Conectado a Laravel WebSockets!`);
        console.log(`ProductDetail: Conectado al canal ${channelName} de Laravel WebSockets!`);
      });

      echo.connector.pusher.connection.bind('disconnected', () => {
        console.log(`ProductDetail: Desconectado de Laravel WebSockets!`);
        console.log(`ProductDetail: Desconectado del canal ${channelName} de Laravel WebSockets!`);
      });

      echo.connector.pusher.connection.bind('error', (err) => {
        console.error(`ProductDetail: Error de conexión WebSocket en canal ${channelName}:`, err);
      });
    }

    return () => {
      if (echo && auctionIdForBidsFetch) {
        const channelName = `auction.${auctionIdForBidsFetch}`;
        console.log(`ProductDetail: Desconectando Echo al desmontar...`);
        echo.leave(channelName);
        echo.disconnect();
      }
    };
  // Modifica solo esta línea para eliminar bidsData.current_page
  }, [auctionIdForBidsFetch, fetchBidHistory, fetchLatestBidForButton, itemsPerPage]); // CAMBIO AQUÍ


  // Efecto para el temporizador de cuenta regresiva
  useEffect(() => {
    let timer;

    const calculateTimeLeft = (auction) => {
      if (!auction) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
      }

      const endTime = moment(`${auction.date_end} ${auction.time_end}`); // Corregido: usar auction.time_end
      const now = moment();
      const difference = endTime.diff(now);

      if (difference > 0) {
        const duration = moment.duration(difference);
        return {
          days: Math.floor(duration.asDays()),
          hours: duration.hours(),
          minutes: duration.minutes(),
          seconds: duration.seconds(),
          total: difference,
        };
      } else {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, total: 0 };
      }
    };

    if (productData) {
      const now = moment();
      let auctionToTrack = null;

      if (productData.auctions && productData.auctions.length > 0) {
        auctionToTrack = productData.auctions.find(auction => {
          const startTime = moment(`${auction.date_start} ${auction.time_start}`);
          const endTime = moment(`${auction.date_end} ${auction.time_end}`);
          return auction.status === 1 && now.isBetween(startTime, endTime);
        });

        if (!auctionToTrack) {
          auctionToTrack = productData.auctions.find(auction => {
            const startTime = moment(`${auction.date_start} ${auction.time_start}`);
            return now.isBefore(startTime);
          });
        }

        if (!auctionToTrack) {
          auctionToTrack = productData.auctions.reduce((latest, current) => {
            const latestEndTime = latest ? moment(`${latest.date_end} ${latest.time_end}`) : null;
            const currentEndTime = moment(`${current.date_end} ${current.time_end}`);
            if (currentEndTime.isSameOrBefore(now) && (!latestEndTime || currentEndTime.isAfter(latestEndTime))) {
              return current;
            }
            if (currentEndTime.isAfter(now) && (!latestEndTime || currentEndTime.isAfter(latestEndTime))) {
              return current;
            }
            return latest;
          }, null);
        }
      }

      const initialTime = calculateTimeLeft(auctionToTrack);
      setTimeLeft(initialTime);

      if (initialTime.total > 0 && auctionToTrack) {
        timer = setInterval(() => {
          const newTimeLeft = calculateTimeLeft(auctionToTrack);
          setTimeLeft(newTimeLeft);
          if (newTimeLeft.total <= 0) {
            clearInterval(timer);
            fetchProductDetails();
          }
        }, 1000);
      }
    }

    return () => clearInterval(timer);
  }, [productData, fetchProductDetails]);

  if (loading || loadingAuth) {
    return (
      <Container className="my-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
        <p className="mt-2">Cargando información del producto...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="my-5">
        <Alert variant="danger">{error}</Alert>
        <Button onClick={() => navigate(-1)}>Volver</Button>
      </Container>
    );
  }

  if (!productData) {
    return (
      <Container className="my-5 text-center">
        <Alert variant="info">Producto no encontrado.</Alert>
        <Button onClick={() => navigate('/')}>Ir a inicio</Button>
      </Container>
    );
  }

  const now = moment();
  let currentAuctionForDisplay = null;

  if (productData.auctions && productData.auctions.length > 0) {
    currentAuctionForDisplay = productData.auctions.find(auction => {
      const startTime = moment(`${auction.date_start} ${auction.time_start}`);
      const endTime = moment(`${auction.date_end} ${auction.time_end}`);
      return auction.status === 1 && now.isBetween(startTime, endTime);
    });

    if (!currentAuctionForDisplay) {
      currentAuctionForDisplay = productData.auctions.find(auction => {
        const startTime = moment(`${auction.date_start} ${auction.time_start}`);
        return now.isBefore(startTime);
      });
    }

    if (!currentAuctionForDisplay) {
      currentAuctionForDisplay = productData.auctions.reduce((latest, current) => {
        const latestEndTime = latest ? moment(`${latest.date_end} ${latest.time_end}`) : null;
        const currentEndTime = moment(`${current.date_end} ${current.time_end}`);
        if (currentEndTime.isSameOrBefore(now) && (!latestEndTime || currentEndTime.isAfter(latestEndTime))) {
          return current;
        }
        if (currentEndTime.isAfter(now) && (!latestEndTime || currentEndTime.isAfter(latestEndTime))) {
          return current;
        }
        return latest;
      }, null);
    }
  }

  let displayAuctionStatus = null;
  let isAuctionActive = false;
  let isAuctionFinished = false;
  let nextBidAmount;

  if (currentAuctionForDisplay) {
    const startTime = moment(`${currentAuctionForDisplay.date_start} ${currentAuctionForDisplay.time_start}`);
    const endTime = moment(`${currentAuctionForDisplay.date_end} ${currentAuctionForDisplay.time_end}`);

    const basePrice = parseFloat(currentAuctionForDisplay.base);

    // Calcular nextBidAmount basado en latestBidAmounts o basePrice
    if (latestBidAmounts && latestBidAmounts.amounMaximoSimple > 0) {
      // Si hay una oferta simple o automática, el siguiente monto es 100 o 200 más
      if (latestBidAmounts.amounMaximoAutom > 0) {
        nextBidAmount = latestBidAmounts.amounMaximoSimple + 200;
      } else {
        nextBidAmount = latestBidAmounts.amounMaximoSimple + 100;
      }
    } else if (basePrice > 0) {
      // Si no hay ofertas pero hay precio base, el siguiente monto es base + 100
      nextBidAmount = basePrice + 100;
    } else {
      // Si no hay ofertas ni precio base, o precio base es 0, el siguiente monto es 0
      nextBidAmount = 0;
    }
    // Asegurarse de que nextBidAmount sea un número válido
    if (isNaN(nextBidAmount)) nextBidAmount = 0;

    if (now.isBetween(startTime, endTime) && timeLeft.total > 0) {
      isAuctionActive = true;
      displayAuctionStatus = (
        <div className="d-inline-flex align-items-center">
          <CountdownTimer
            days={timeLeft.days}
            hours={timeLeft.hours}
            minutes={timeLeft.minutes}
            seconds={timeLeft.seconds}
          />
        </div>
      );
    } else if (now.isSameOrAfter(endTime) || timeLeft.total <= 0) {
      isAuctionFinished = true;
      displayAuctionStatus = (
        <>
          <span className="text-danger ms-2 fw-bold">SUBASTA FINALIZADA</span>
          <span className="ms-2 text-muted">({moment(endTime).format('DD/MM/YYYY HH:mm')})</span>
        </>
      );
    } else {
      displayAuctionStatus = (
        <>
          <span className="text-warning ms-2 fw-bold">PRÓXIMA SUBASTA</span>
          <span className="ms-2 text-muted">(Inicia: {moment(startTime).format('DD/MM/YYYY HH:mm')})</span>
        </>
      );
    }
  } else {
    displayAuctionStatus = (
      <span className="text-info ms-2 fw-bold">Este producto no tiene una subasta activa.</span>
    );
  }

  const isBidButtonDisabled = !isLoggedIn || !isAuctionActive || (productData && productData.user && productData.user.id === currentUserId) || loadingLatestBid;

  let bidButtonText = '';
  if (loadingLatestBid) {
    bidButtonText = <><Spinner animation="border" size="sm" className="me-2" /> Cargando oferta...</>;
  } else if (!isLoggedIn) {
    bidButtonText = 'Inicia sesión para ofertar';
  } else if (productData && productData.user && productData.user.id === currentUserId) {
    bidButtonText = 'No puedes ofertar en tu propio producto';
  } else if (!isAuctionActive) {
    bidButtonText = `Comprar (Subasta ${isAuctionFinished ? 'finalizada' : 'no activa'})`;
  } else {
    // Aquí usamos nextBidAmount que ya se calculó arriba.
    // Si nextBidAmount es 0, se mostrará "OFERTAR $ 0.00"
    bidButtonText = `OFERTAR $ ${nextBidAmount ? nextBidAmount.toFixed(2) : '0.00'}`;
  }


  return (
    <Container className="my-5 product-detail-container">
      <Row className="mb-4">
        <Col xs={12}>
          <Button variant="outline-secondary" onClick={() => navigate(-1)} className="mb-3">
            &larr; Volver
          </Button>
          <h1 className="mb-3">{productData.name}</h1>
        </Col>
      </Row>
      <Row>
        <Col md={6}>
          <Row>
            <Col xs={12} className="mb-3 main-image-col">
              <Image
                src={currentMainImage || defaultImageUrl}
                fluid
                className="main-product-image clickable-image"
                alt={productData.name}
                onClick={handleOpenGallery}
              />
            </Col>
            <Col xs={12}>
              <div className="thumbnail-gallery d-flex flex-wrap justify-content-center">
                {productData.images && productData.images.length > 0 ? (
                  productData.images.map((img, index) => (
                    <div
                      key={index}
                      className={`thumbnail-wrapper me-2 mb-2 ${currentMainImage === finalImagesBaseUrl + img.fullName_image_product ? 'selected-thumbnail' : ''
                        }`}
                      onClick={() => handleThumbnailClick(finalImagesBaseUrl + img.fullName_image_product)}
                    >
                      <Image
                        src={finalImagesBaseUrl + img.fullName_image_product}
                        thumbnail
                        className="thumbnail-image"
                        alt={`Thumbnail ${index}`}
                      />
                    </div>
                  ))
                ) : (
                  <div className="thumbnail-wrapper me-2 mb-2">
                    <Image
                      src={defaultImageUrl}
                      thumbnail
                      className="thumbnail-image"
                      alt="Default thumbnail"
                    />
                  </div>
                )}
              </div>
            </Col>
          </Row>
        </Col>

        <Col md={6}>
          <p className="lead text-muted">{productData.description_product}</p>

          <Card className="mb-4 auction-info-card">
            <Card.Body>
              <Card.Title className="mb-3">Detalles de la Subasta</Card.Title>
              {currentAuctionForDisplay ? (
                <>
                  <div className="card-text">
                    <strong>Título:</strong> {currentAuctionForDisplay.title}
                  </div>
                  <div className="card-text">
                    <strong>Descripción:</strong> {currentAuctionForDisplay.description}
                  </div>
                  <div className="card-text">
                    <CurrencyDollar /> <strong>Precio Base:</strong> ${parseFloat(currentAuctionForDisplay.base).toFixed(2)}
                  </div>
                  <div className="card-text">
                    <Clock /> <strong>Inicia:</strong> {moment(currentAuctionForDisplay.date_start + ' ' + currentAuctionForDisplay.time_start).format('DD/MM/YYYY HH:mm')}
                  </div>
                  <div className="card-text">
                    <Clock /> <strong>Finaliza:</strong> {moment(currentAuctionForDisplay.date_end + ' ' + currentAuctionForDisplay.time_end).format('DD/MM/YYYY HH:mm')}
                  </div>
                  <div className="card-text mb-3">
                    <strong>Estado:</strong>
                    {displayAuctionStatus}
                  </div>
                </>
              ) : (
                <div className="card-text text-info">Este producto no tiene una subasta activa.</div>
              )}

              {productData.user && (productData.user.phone || (user && user.id === productData.user.id && user.phone)) && (
                <div className="d-grid gap-2 mt-3">
                  <Button
                    variant="success"
                    onClick={handleWhatsappChat}
                    className="d-flex align-items-center justify-content-center py-2"
                  >
                    <FaWhatsapp style={{ marginRight: '10px', fontSize: '1.5em' }} />
                    {user && user.id === productData.user.id ? 'Mi chat de WhatsApp' : 'Chat con el vendedor'}
                  </Button>
                </div>
              )}
            </Card.Body>
          </Card>

          <Button
            variant="danger"
            size="lg"
            className="w-100 mt-4"
            onClick={handleBidClick}
            disabled={isBidButtonDisabled}
          >
            <Hammer className="me-2" />
            {bidButtonText}
          </Button>

          {auctionIdForBidsFetch && (
            <BidHistory
              ref={bidHistoryRef}
              auctionId={auctionIdForBidsFetch}
              currentUserId={currentUserId}
              bidsData={bidsData}
              loading={loadingBidHistory}
              error={errorBidHistory}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChangeBidHistory}
              onItemsPerPageChange={handleItemsPerPageChangeBidHistory}
              notificationCount={bidsData.total} 
            />
          )}

        </Col>
      </Row>

      <Modal show={showGalleryModal} onHide={handleCloseGallery} size="xl" centered>
        <Modal.Header closeButton>
          <Modal.Title>{productData.name} - Galería de Imágenes</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          {productData.images && productData.images.length > 0 ? (
            <Carousel activeIndex={carouselActiveIndex} onSelect={handleSelectCarousel} interval={null}>
              {productData.images.map((img, index) => (
                <Carousel.Item key={index}>
                  <img
                    className="d-block w-100 modal-carousel-image"
                    src={finalImagesBaseUrl + img.fullName_image_product}
                    alt={`Imagen ${index + 1} de ${productData.name}`}
                  />
                </Carousel.Item>
              ))}
            </Carousel>
          ) : (
            <div className="text-center p-5">
              <p>No hay imágenes adicionales para mostrar en la galería.</p>
              <img
                src={defaultImageUrl}
                alt="Imagen por defecto"
                className="img-fluid"
                style={{ maxWidth: '300px' }}
              />
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseGallery}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>

      {currentAuctionForDisplay && (
        <BidModal
          show={showBidModal}
          handleClose={handleCloseBidModal}
          initialBidAmount={nextBidAmount}
          auctionId={currentAuctionForDisplay.id}
          userId={currentUserId}
          sellerUserId={productData.user ? productData.user.id : null}
          onBidSuccess={handleBidSuccess}
          onExited={handleBidModalExited}
        />
      )}
    </Container>
  );
};

export default ProductDetail;