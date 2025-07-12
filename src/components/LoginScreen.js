import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Alert, Spinner } from 'react-bootstrap';
import apiClient from '../api/apiClient';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';



const FACEBOOK_APP_ID = process.env.REACT_APP_FACEBOOK_CLIENT_ID;

const LoginScreen = () => {
  // Estados para el login tradicional
  const [email, setEmail] = useState('');
  const [passwordLogin, setPasswordLogin] = useState(''); // Contraseña para login tradicional y para Facebook ya registrado

  // Estados para el formulario de registro completo (nuevo usuario de Facebook)
  const [password, setPassword] = useState(''); // Para el campo "Confirmar Contraseña" en el formulario de registro completo
  const [phone, setPhone] = useState(''); // Para el número de teléfono en el formulario de registro completo
  // Nota: 'confirmPassword' no es necesario como estado separado si 'password' se usa solo para el segundo input y se compara con 'passwordLogin'

  // Estados para controlar la visibilidad de los formularios
  const [showPasswordForm, setShowPasswordForm] = useState(false); // Formulario completo (contraseña, confirmar, teléfono) para usuarios nuevos de Facebook
  const [showLoginForm, setShowLoginForm] = useState(false); // Formulario solo de login (contraseña existente) para usuarios de Facebook ya registrados
  const [showTraditionalLogin, setShowTraditionalLogin] = useState(true); // Controla la visibilidad del formulario de login tradicional (email/contraseña)

  // Estados compartidos
  const [facebookUserData, setFacebookUserData] = useState(null); // Datos de usuario de Facebook
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sdkLoaded, setSdkLoaded] = useState(false); // Estado para saber si el SDK de Facebook ha cargado

  const { login, isLoggedIn } = useAuth(); 

  const navigate = useNavigate();

  useEffect(() => {
    // Cargar el SDK de Facebook
    if (document.getElementById('facebook-jssdk')) {
      setSdkLoaded(true);
      return;
    }

    window.fbAsyncInit = function() {
      window.FB.init({
        appId: FACEBOOK_APP_ID,
        cookie: true,
        xfbml: true,
        version: 'v19.0'
      });
      setSdkLoaded(true);
      console.log("Facebook SDK cargado y listo.");
    };

    (function(d, s, id) {
      var js, fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) { return; }
      js = d.createElement(s); js.id = id;
      js.src = "https://connect.facebook.net/es_LA/sdk.js";
      fjs.parentNode.insertBefore(js, fjs);
    }(document, 'script', 'facebook-jssdk'));

    // Limpiar el SDK si el componente se desmonta (opcional, pero buena práctica)
    return () => {};
  }, []);

  // Redirigir si ya hay un token
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      navigate('/dashboard');
    }
  }, [navigate]);

  // Manejador del login con Facebook
  const handleFacebookLogin = () => {
    if (!sdkLoaded) {
      setError("El SDK de Facebook aún no se ha cargado. Por favor, inténtalo de nuevo.");
      return;
    }
    setLoading(true);
    setError(null);
    setMessage(null);

    window.FB.login(function(response) {
      if (response.authResponse) {
        console.log('Bienvenido! Obteniendo tu información...');
        window.FB.api('/me', { fields: 'name,email' }, function(userResponse) {
          console.log('Datos de usuario de Facebook:', userResponse);
          if (userResponse.email && userResponse.name) {
            processFacebookUserData(userResponse);
          } else {
            setError('No se pudo obtener el email de Facebook. Asegúrate de permitir el acceso.');
            setLoading(false);
          }
        });
      } else {
        setError('Login de Facebook cancelado o fallido.');
        setLoading(false);
      }
    }, { scope: 'public_profile,email' });
  };

  // Función común para procesar los datos obtenidos de Facebook con el backend
  const processFacebookUserData = async (userData) => {
    try {
      const res = await apiClient.post('/facebook-login', {
        email: userData.email,
        name: userData.name,
      });

      if (res.data.status === 1) { // Usuario existente y login exitoso
        setMessage(res.data.msg);
        localStorage.setItem('access_token', res.data.access_token);
        navigate('/dashboard');
      } else if (res.data.status === 3) { // Nuevo usuario, requiere registro completo (contraseña y teléfono)
        setFacebookUserData({ email: userData.email, name: userData.name });
        setShowPasswordForm(true); // Mostrar formulario de registro completo
        setShowLoginForm(false); // Asegurarse de que el de login simple no esté visible
        setShowTraditionalLogin(false); // Ocultar login tradicional
        setMessage(res.data.msg);
      } else if (res.data.status === 2) { // Usuario existente, solo requiere ingresar su contraseña
        setFacebookUserData({ email: userData.email, name: userData.name });
        setShowLoginForm(true); // Mostrar formulario de login simple
        setShowPasswordForm(false); // Asegurarse de que el de registro completo no esté visible
        setShowTraditionalLogin(false); // Ocultar login tradicional
        setMessage(res.data.msg);
      }
      else {
        setError(res.data.msg || 'Error desconocido al procesar el login de Facebook.');
      }
    } catch (err) {
      console.error("Error al comunicarse con el backend:", err);
      setError(err.response?.data?.msg || 'Error de conexión con el servidor. Verifica que el backend esté activo y accesible via HTTPS.');
    } finally {
      setLoading(false);
    }
  };

  // Función para manejar el envío del formulario de registro completo (nuevo usuario de Facebook)
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    // Validaciones de contraseñas y teléfono
    if (passwordLogin !== password) { // Compara la primera contraseña con la de confirmación
      setError('Las contraseñas no coinciden.');
      setLoading(false);
      return;
    }
    if (passwordLogin.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      setLoading(false);
      return;
    }
    if (!phone.trim()) {
        setError('El campo teléfono es obligatorio.');
        setLoading(false);
        return;
    }
    if (phone.length > 20) {
        setError('El teléfono no debe exceder los 20 caracteres.');
        setLoading(false);
        return;
    }

    try {
      const res = await apiClient.post('/register', {
        name: facebookUserData.name,
        email: facebookUserData.email,
        password: passwordLogin, // Usa la contraseña principal
        password_confirmation: passwordLogin, // Usa la contraseña principal para confirmación en backend
        phone: phone,
      });

      if (res.data.status === 0) {
        setMessage(res.data.msg + ' Iniciando sesión...');
        const loginRes = await apiClient.post('/login', {
          email: facebookUserData.email,
          password: passwordLogin,
        });

        if (loginRes.data.status === 1) {
          localStorage.setItem('access_token', loginRes.data.access_token);
          navigate('/dashboard');
        } else {
          setError(loginRes.data.msg || 'Error al iniciar sesión después del registro.');
        }
      } else {
        setError(res.data.msg || 'Error al completar el registro.');
        if (res.data.errors) {
            console.error("Errores de validación de backend:", res.data.errors);
            setError(Object.values(res.data.errors).flat().join(' '));
        }
      }
    } catch (err) {
      console.error("Error al registrar el usuario:", err);
      setError(err.response?.data?.msg || 'Error de conexión al intentar registrar.');
    } finally {
      setLoading(false);
    }
  };

  // Función para manejar el login de usuarios de Facebook que ya tienen contraseña
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (passwordLogin.length === 0) {
      setError('Por favor, ingresa tu contraseña.');
      setLoading(false);
      return;
    }

    try {
      const res = await apiClient.post('/login', {
        email: facebookUserData.email,
        password: passwordLogin,
      });

      if (res.data.status === 1) {
        setMessage(res.data.msg);
        localStorage.setItem('access_token', res.data.access_token);
        navigate('/dashboard');
      } else {
        setError(res.data.msg || 'Credenciales inválidas.');
      }
    } catch (err) {
      console.error("Error al iniciar sesión:", err);
      setError(err.response?.data?.msg || 'Error de conexión al intentar iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };
  
  // NUEVA FUNCIÓN: Manejador para el login tradicional (email y contraseña)
  const handleTraditionalLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (!email.trim() || !passwordLogin.trim()) {
      setError('Por favor, ingresa tu email y contraseña.');
      setLoading(false);
      return;
    }

    try {
      // *** CAMBIO CLAVE: Usar la función login del contexto ***
      const loginSuccess = await login({
        email: email,
        password: passwordLogin,
      });

      if (loginSuccess) {
        setMessage('Inicio de sesión exitoso!');
        navigate('/dashboard'); // El AuthContext ya actualizó el estado y localStorage
      } else {
        // Este else se ejecutará si la función 'login' devuelve false (por ejemplo, por credenciales inválidas)
        setError('Credenciales inválidas.'); 
      }
    } catch (err) {
      // El error ya se maneja dentro de la función 'login' del AuthContext, 
      // pero puedes añadir un log adicional aquí si lo deseas.
      console.error("Error al iniciar sesión tradicional (desde LoginScreen):", err);
      setError(err.response?.data?.msg || 'Error de conexión al intentar iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  // Manejador para volver atrás/resetear formularios
  const handleGoBack = () => {
    setShowPasswordForm(false);
    setShowLoginForm(false);
    setShowTraditionalLogin(true); // Volver al login tradicional/inicial
    setError(null);
    setMessage(null);
    setEmail(''); // Limpiar email
    setPasswordLogin(''); // Limpiar contraseña del login tradicional
    setPassword(''); // Limpiar contraseña de confirmación
    setPhone(''); // Limpiar teléfono
    setFacebookUserData(null);
  };

  // Función para alternar a la vista de login de Facebook
  const toggleToFacebookLogin = () => {
    setShowTraditionalLogin(false); // Ocultar el formulario tradicional
    setShowPasswordForm(false); // Asegurarse de que el formulario completo de Facebook esté oculto
    setShowLoginForm(false); // Asegurarse de que el formulario de login simple de Facebook esté oculto
    setError(null);
    setMessage(null);
    setEmail(''); // Limpiar cualquier email ingresado
    setPasswordLogin(''); // Limpiar cualquier contraseña ingresada
  };

  // Función para alternar a la vista de login tradicional
  const toggleToTraditionalLogin = () => {
    setShowTraditionalLogin(true); // Mostrar el formulario tradicional
    setShowPasswordForm(false); // Ocultar el formulario completo de Facebook
    setShowLoginForm(false); // Ocultar el formulario de login simple de Facebook
    setError(null);
    setMessage(null);
    // No limpiamos email/passwordLogin aquí, ya que podrían haberse llenado para el login tradicional
  };


  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      <div className="p-4 border rounded shadow-sm" style={{ maxWidth: '400px', width: '100%' }}>
        <h2 className="text-center mb-4">Iniciar Sesión</h2>

        {error && <Alert variant="danger">{error}</Alert>}
        {message && <Alert variant="success">{message}</Alert>}

        {/* Lógica de renderizado condicional principal */}
        {!showPasswordForm && !showLoginForm && showTraditionalLogin ? (
          // Vista de Login Tradicional (Email y Contraseña)
          <Form onSubmit={handleTraditionalLoginSubmit}>
            <Form.Group className="mb-3" controlId="formBasicEmail">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                placeholder="Ingresa tu email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formBasicPasswordTraditional">
              <Form.Label>Contraseña</Form.Label>
              <Form.Control
                type="password"
                placeholder="Ingresa tu contraseña"
                value={passwordLogin}
                onChange={(e) => setPasswordLogin(e.target.value)}
                required
              />
            </Form.Group>

            <Button variant="primary" type="submit" className="w-100" disabled={loading}>
              {loading ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
            </Button>

            <hr className="my-4" /> {/* Separador */}

            <p className="text-center mb-3">O inicia sesión con:</p>
            <Button
              variant="outline-primary"
              className="w-100"
              onClick={toggleToFacebookLogin}
              disabled={loading || !sdkLoaded}
            >
              {loading && <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />}
              Continuar con Facebook
            </Button>
            {!sdkLoaded && <p className="text-center mt-3 text-muted">Cargando SDK de Facebook...</p>}
          </Form>
        ) : showPasswordForm ? (
          // Formulario de registro completo (contraseña, confirmar, teléfono) para nuevos usuarios de Facebook
          <Form onSubmit={handlePasswordSubmit}>
            <p className="text-center mb-3">
              Bienvenido/a {facebookUserData?.name}! Para completar tu registro, por favor establece una contraseña y tu teléfono.
            </p>

            <Form.Group className="mb-3" controlId="formPhone">
              <Form.Label>Teléfono</Form.Label>
              <Form.Control
                type="tel"
                placeholder="Ingresa tu número de teléfono"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                maxLength={20}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formBasicPassword">
              <Form.Label>Contraseña</Form.Label>
              <Form.Control
                type="password"
                placeholder="Ingresa tu contraseña"
                value={passwordLogin} // Contraseña principal
                onChange={(e) => setPasswordLogin(e.target.value)}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formConfirmPassword">
              <Form.Label>Confirmar Contraseña</Form.Label>
              <Form.Control
                type="password"
                placeholder="Confirma tu contraseña"
                value={password} // Contraseña de confirmación
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Form.Group>

            <Button variant="success" type="submit" className="w-100" disabled={loading}>
              {loading ? 'Registrando...' : 'Completar Registro'}
            </Button>
            <Button
              variant="link"
              onClick={handleGoBack}
              className="w-100 mt-2"
            >
              Volver
            </Button>
          </Form>
        ) : showLoginForm ? (
          // Formulario de login solo con contraseña (usuario existente que usó Facebook antes)
          <Form onSubmit={handleLoginSubmit}>
            <p className="text-center mb-3">
              Bienvenido/a de nuevo {facebookUserData?.name}! Por favor, ingresa tu contraseña para iniciar sesión.
            </p>

            <Form.Group className="mb-3" controlId="formLoginPassword">
              <Form.Label>Contraseña</Form.Label>
              <Form.Control
                type="password"
                placeholder="Ingresa tu contraseña"
                value={passwordLogin} // Contraseña para este login
                onChange={(e) => setPasswordLogin(e.target.value)}
                required
              />
            </Form.Group>

            <Button variant="primary" type="submit" className="w-100" disabled={loading}>
              {loading ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
            </Button>
            <Button
              variant="link"
              onClick={handleGoBack}
              className="w-100 mt-2"
            >
              Volver
            </Button>
          </Form>
        ) : (
            // Vista de login de Facebook (cuando se selecciona desde el login tradicional)
            <div className="text-center">
              <p className="mb-3">Inicia sesión con tu cuenta de Facebook.</p>
              <Button
                variant="primary"
                className="w-100"
                onClick={handleFacebookLogin}
                disabled={loading || !sdkLoaded}
              >
                {loading && <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />}
                Continuar con Facebook
              </Button>
              {!sdkLoaded && <p className="mt-3 text-muted">Cargando SDK de Facebook...</p>}
              <Button
                variant="link"
                onClick={toggleToTraditionalLogin}
                className="w-100 mt-2"
              >
                Volver al Login Tradicional
              </Button>
            </div>
        )}
      </div>
    </Container>
  );
};

export default LoginScreen;