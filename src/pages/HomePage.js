// src/pages/HomePage.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Importa tus componentes necesarios.
// Las rutas de importación son relativas a 'src/pages/', por lo que '..' para subir un nivel.
import Header from '../components/Header'; // Tu componente Header/Nav
import LoginScreen from '../components/LoginScreen';
import Dashboard from '../components/user/Dashboard';
import SuggestionCardsSection from '../components/SuggestionCardsSection'; // Tu sección de productos, que es la Home
import SellProductForm from '../components/user/SellProductForm';
import UserProductsTable from '../components/user/UserProductsTable';
import ProductDetail from '../components/product/ProductDetail';
import WebSocketMessageListener from '../components/WebSocketMessageListener'; 


function HomePage() {
  return (
    // ¡Este es el ÚNICO BrowserRouter en toda la aplicación!
    <Router>
      {/* El Header se renderiza fuera de Routes para que aparezca en todas las páginas */}
      <Header />

      <Routes>
        {/* Tu página principal (Home) */}
        <Route path="/" element={<SuggestionCardsSection />} />

        {/* Ruta para la pantalla de Login */}
        <Route path="/login" element={<LoginScreen />} />

        {/* Ruta para el Dashboard del usuario */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/sell-product" element={<SellProductForm />} />
        <Route path="/my-products" element={<UserProductsTable />} />
        <Route path="/product-detail/:productId" element={<ProductDetail />} />

        <Route path="/test_push" element={<WebSocketMessageListener />} />

        {/* Ruta de fallback: redirige cualquier URL no reconocida a la página principal */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default HomePage;