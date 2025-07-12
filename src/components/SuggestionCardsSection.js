// src/components/SuggestionCardsSection.js

import React, { useState, useEffect } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import SuggestionCard from './SuggestionCard';
import apiClient from '../api/apiClient';
import './SuggestionCardsSection.css'; // ¡Importa el nuevo archivo CSS!

const IMAGES_BASE_URL = process.env.REACT_APP_API_BASE_URL_IMAGES;

const SuggestionCardsSection = () => {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        const responseData = await apiClient.get('/auctions');

        let auctionsArray = [];

        if (responseData && Array.isArray(responseData.data)) {
          auctionsArray = responseData.data;
        } else if (Array.isArray(responseData)) {
          auctionsArray = responseData;
        } else {
          console.error("La respuesta de la API para /auctions no tiene el formato de array esperado:", responseData);
          setError(new Error("Formato de datos inesperado de la API. Por favor, verifica la respuesta de /auctions."));
          setLoading(false);
          return;
        }

        setAuctions(auctionsArray); // Mostrar todos los remates
      } catch (err) {
        console.error("Error al obtener subastas:", err);
        setError(new Error(`No se pudieron cargar los remates. Detalles: ${err.message || 'Problema de conexión o con la API.'}`));
      } finally {
        setLoading(false);
      }
    };

    fetchAuctions();
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>Cargando sugerencias de remates...</div>;
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px', color: 'red' }}>
        {error.message}
      </div>
    );
  }

  if (auctions.length === 0) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>No hay remates disponibles para mostrar en este momento.</div>;
  }

  return (
    <div style={{ backgroundColor: '#efefef', padding: '30px 0' }}>
      <Container>
        <h3 className="mb-4 text-center">Remates Destacados</h3>
        <Row className="g-3 justify-content-center">
          {auctions.map((auction) => {
            const product = auction.product || {};
            const images = product.images || [];
            const imageUrl = images.length > 0 ? images[0].fullName_image_product : null;
            
            const fullImageUrl = imageUrl ? `${IMAGES_BASE_URL}/${imageUrl}` : 'URL_POR_DEFECTO';

            const auctionEndTime = `${auction.date_end}T${auction.time_end}`; 

            return (
              <Col key={auction.id} className="custom-card-col"> 
                <SuggestionCard
                  auctionId={auction.id}
                  productId={product.id} // <--- ¡AQUÍ ESTÁ EL CAMBIO CLAVE! Pasamos el product.id
                  auctionTitle={auction.title}
                  productName={product.name}
                  imageUrl={fullImageUrl}
                  basePrice={auction.base}
                  time_start={auctionEndTime}
                />
              </Col>
            );
          })}
        </Row>
      </Container>
    </div>
  );
};

export default SuggestionCardsSection;