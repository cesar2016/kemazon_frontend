// src/App.js
import React from 'react';
import HomePage from './pages/HomePage'; // Importa la HomePage
import './App.css';
import { AuthProvider } from './context/AuthContext'; // ¡Importa AuthProvider!


function App() {
  return (
    <div className="App">
      {/* ¡El AuthProvider DEBE envolver a HomePage si HomePage contiene el Router y componentes que usan el contexto! */}
      <AuthProvider>
        <HomePage /> {/* Renderizamos la HomePage */}  
      </AuthProvider>
    </div>
  );
}

export default App;