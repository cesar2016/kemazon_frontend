// src/api/apiClient.js
import axios from 'axios';

// Asegúrate de que REACT_APP_API_BASE_URL esté bien configurado en tu .env
// y que apunte a HTTPS si tu frontend está en HTTPS
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json', // Es buena práctica
  },
});

// Interceptor de solicitudes para añadir el token de autenticación
apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('access_token');
    if (token) {
      // Si hay un token, lo adjunta a la cabecera Authorization
      // Nota: 'Bearer ' tiene un espacio después de Bearer
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Opcional: Interceptor de respuestas para manejar 401s globales
apiClient.interceptors.response.use(
  response => response,
  error => {
    // Si la respuesta es un 401 y no es la petición de login en sí misma
    if (error.response && error.response.status === 401 && error.config && !error.config.__isRetryRequest) {
      // Esto es una simplificación. En una app real, podrías querer:
      // 1. Redirigir al usuario a la página de login
      // 2. Limpiar el token de localStorage
      console.log('Token expirado o inválido. Redirigiendo al login...');
      localStorage.removeItem('access_token');
      // Puedes usar window.location.href para una redirección forzada
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);


export default apiClient;