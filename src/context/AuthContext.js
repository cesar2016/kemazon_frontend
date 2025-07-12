// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/apiClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const loadUserFromStorage = async () => {
    console.log("AuthContext: Iniciando loadUserFromStorage...");
    setLoadingAuth(true);
    try {
      const storedToken = localStorage.getItem('access_token');
      const storedUserString = localStorage.getItem('user');

      if (storedToken && storedUserString) {
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        console.log("AuthContext: access_token encontrado en localStorage.");

        let parsedUser = null;
        try {
          parsedUser = JSON.parse(storedUserString);
          console.log("AuthContext: User data parsed from localStorage.");
        } catch (parseError) {
          console.error("AuthContext: Error parsing user data from localStorage:", parseError);
          localStorage.removeItem('user'); // Limpia si hay un error de parseo
          parsedUser = null;
        }

        if (parsedUser && parsedUser.id) { // Asegúrate de que el objeto user tenga un ID
          setUser(parsedUser);
          setIsLoggedIn(true);
          console.log("AuthContext: User and isLoggedIn set from localStorage.");
        } else {
          console.log("AuthContext: Stored user data invalid or missing ID. Cleaning up.");
          logout(); // Realiza un logout si los datos son inválidos
        }
      } else {
        console.log("AuthContext: No access_token or user data found in localStorage. Not logged in.");
        setIsLoggedIn(false);
        setUser(null);
        delete apiClient.defaults.headers.common['Authorization'];
      }
    } catch (error) {
      console.error("AuthContext: General error during loadUserFromStorage:", error);
      logout();
    } finally {
      setLoadingAuth(false);
      console.log("AuthContext: loadUserFromStorage finalizado. isLoggedIn:", isLoggedIn, "User:", user);
    }
  };

  useEffect(() => {
    loadUserFromStorage();
  }, []);

  const login = async (credentials) => {
    console.log("AuthContext: Iniciando login...");
    setLoadingAuth(true);
    try {
        // *** ASEGÚRATE QUE LA RUTA SEA SOLO '/login' ***
        const response = await apiClient.post('/login', credentials);
        console.log("AuthContext: Respuesta completa del login API:", response.data);

        // Esta desestructuración ahora SÍ encontrará 'data' porque el backend la devolverá
        const { access_token, data: userData } = response.data;
        console.log("AuthContext: access_token extraído:", access_token);
        console.log("AuthContext: userData extraído (después de desestructuración):", userData);

        if (!access_token || !userData || typeof userData !== 'object') {
            console.error("AuthContext: Faltan access_token o userData válidos en la respuesta de la API.");
            throw new Error("Credenciales inválidas o respuesta del servidor incompleta.");
        }

        localStorage.setItem('access_token', access_token);
        localStorage.setItem('user', JSON.stringify(userData)); // Esto ahora debería guardar el objeto correcto

        apiClient.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
        setUser(userData);
        setIsLoggedIn(true);
        console.log("AuthContext: Login exitoso. isLoggedIn:", true, "User:", userData);
        return true;
    } catch (error) {
        console.error("AuthContext: Fallo de login:", error.response?.data?.msg || error.message);
        setIsLoggedIn(false);
        setUser(null);
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        delete apiClient.defaults.headers.common['Authorization'];
        throw error;
    } finally {
        setLoadingAuth(false);
        console.log("AuthContext: Login finalizado. isLoggedIn:", isLoggedIn, "User:", user);
    }
};

  const logout = () => {
    console.log("AuthContext: Iniciando logout...");
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    delete apiClient.defaults.headers.common['Authorization'];
    setUser(null);
    setIsLoggedIn(false);
    console.log("AuthContext: Logout exitoso. isLoggedIn:", false);
  };

  const contextValue = {
    user,
    userId: user?.id,
    isLoggedIn,
    loadingAuth,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    console.error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};