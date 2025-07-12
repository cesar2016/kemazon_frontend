import React, { useEffect, useState } from 'react';
import { getAuctions } from '../api/apiClient'; // Importamos la función getAuctions

const AuctionsPage = () => {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAuctions = async () => {
      try {
        const data = await getAuctions();
        setAuctions(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAuctions();
  }, []); // El array vacío asegura que se ejecute solo una vez al montar el componente

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>Cargando subastas...</div>;
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px', color: 'red' }}>
        Error al cargar las subastas: {error.message}
        <p>Asegúrate de que tu API de Laravel esté corriendo en `{process.env.REACT_APP_API_BASE_URL}/auctions` y sea accesible.</p>
        <p>Si la API está en Docker y React en tu máquina, verifica que la API escuche en 0.0.0.0 y uses 172.17.0.1:8001 (o similar) en tu .env.local</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center', color: '#333' }}>Listado de Subastas (Kemazon)</h1>
      {auctions.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#666' }}>No hay subastas disponibles.</p>
      ) : (
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          {auctions.map((auction) => (
            <li key={auction.id} style={{
              background: '#f9f9f9',
              border: '1px solid #ddd',
              borderRadius: '8px',
              margin: '10px 0',
              padding: '15px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ color: '#007bff', marginBottom: '5px' }}>{auction.title || 'Subasta sin título'}</h3>
              <p style={{ fontSize: '0.9em', color: '#555' }}>
                **ID:** {auction.id} <br/>
                **Descripción:** {auction.description || 'Sin descripción'} <br/>
                **Precio Inicial:** ${auction.initial_price ? auction.initial_price.toFixed(2) : 'N/A'} <br/>
                **Estado:** {auction.status || 'N/A'} <br/>
                **Creado el:** {auction.created_at ? new Date(auction.created_at).toLocaleDateString() : 'N/A'}
              </p>
              {/* Puedes añadir más detalles de la subasta aquí */}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AuctionsPage;
