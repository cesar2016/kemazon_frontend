import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Row, Col, Alert, Card } from 'react-bootstrap';
import { XCircleFill } from 'react-bootstrap-icons'; // Importamos el icono de "eliminar"
import apiClient from '../../api/apiClient'; // Asegúrate de que esta ruta sea correcta
import { useNavigate } from 'react-router-dom';
import './SellProductForm.css'; // Asegúrate de que tu CSS exista y sea correcto

const SellProductForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    status: 'available',
    date_up: new Date().toISOString().slice(0, 10),
    category_id: '',
    user_id: '',
    files: [], // Usamos 'files' para almacenar los objetos File de manera consistente
  });

  const [categories, setCategories] = useState([]);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [filePreviews, setFilePreviews] = useState([]); // Almacena URLs para previsualización
  const MAX_FILES = 6; // Límite máximo de archivos

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          navigate('/login');
          return;
        }
        const userResponse = await apiClient.get('/user-profile');
        if (userResponse.data.status === 1) {
          const fetchedUserId = userResponse.data.data.id;
          setUserId(fetchedUserId);
          setFormData(prev => ({ ...prev, user_id: fetchedUserId }));
        } else {
          setError('No se pudo obtener el ID del usuario. Por favor, inicia sesión de nuevo.');
          localStorage.removeItem('access_token');
          navigate('/login');
        }
      } catch (err) {
        console.error("Error fetching user ID:", err);
        setError('Error de conexión o al cargar datos del usuario. Inténtalo de nuevo más tarde.');
        localStorage.removeItem('access_token');
        navigate('/login');
      }
    };

    const fetchCategories = async () => {
      try {
        const response = await apiClient.get('/categories');
        setCategories(response.data);
      } catch (err) {
        console.error("Error fetching categories:", err);
        setError('Error al cargar las categorías. Inténtalo de nuevo más tarde.');
      }
    };

    fetchUserId();
    fetchCategories();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    setError(null);
    setSuccess(null);
  };

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    // Filtrar archivos duplicados por nombre y tamaño para evitar errores
    const uniqueNewFiles = newFiles.filter(newFile =>
      !formData.files.some(existingFile => existingFile.name === newFile.name && existingFile.size === newFile.size)
    );

    const combinedFiles = [...formData.files, ...uniqueNewFiles];
    if (combinedFiles.length > MAX_FILES) {
      setError(`Solo puedes subir un máximo de ${MAX_FILES} imágenes.`);
      return;
    }

    setFormData(prev => ({
      ...prev,
      files: combinedFiles, // Actualiza el array de 'files' en el formData
    }));

    // Genera URLs de previsualización para los archivos combinados
    const newFilePreviews = combinedFiles.map(file => ({
      file: file,
      url: URL.createObjectURL(file)
    }));
    setFilePreviews(newFilePreviews);

    // Limpia el input del archivo para permitir seleccionar los mismos archivos de nuevo (si se desea)
    e.target.value = null;
    setError(null);
    setSuccess(null);
  };

  const handleRemoveFile = (indexToRemove) => {
    // Revocar la URL del objeto para liberar memoria
    URL.revokeObjectURL(filePreviews[indexToRemove].url);

    // Eliminar el archivo del array de formData.files
    const updatedFiles = formData.files.filter((_, index) => index !== indexToRemove);
    // Eliminar la previsualización correspondiente
    const updatedPreviews = filePreviews.filter((_, index) => index !== indexToRemove);

    setFormData(prev => ({
      ...prev,
      files: updatedFiles,
    }));
    setFilePreviews(updatedPreviews);
    setError(null);
    setSuccess(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Validaciones básicas del formulario antes de enviar
    if (!formData.name || formData.name.trim() === '') {
      setError('El nombre del producto es obligatorio.');
      setLoading(false);
      return;
    }
    if (!formData.description || formData.description.trim() === '') {
      setError('La descripción del producto es obligatoria.');
      setLoading(false);
      return;
    }
    if (isNaN(formData.price) || parseFloat(formData.price) <= 0) {
      setError('El precio debe ser un número positivo.');
      setLoading(false);
      return;
    }
    if (!formData.category_id) {
      setError('Debes seleccionar una categoría.');
      setLoading(false);
      return;
    }
    if (formData.files.length === 0) { // Verifica si hay archivos seleccionados
      setError('Debes subir al menos una imagen del producto.');
      setLoading(false);
      return;
    }
    if (!formData.user_id) {
      setError('Error: ID de usuario no disponible. Intenta recargar o iniciar sesión de nuevo.');
      setLoading(false);
      return;
    }

    const dataToSend = new FormData();
    dataToSend.append('name', formData.name);
    dataToSend.append('description', formData.description);
    dataToSend.append('price', parseFloat(formData.price));
    dataToSend.append('status', formData.status);
    dataToSend.append('date_up', formData.date_up);
    dataToSend.append('category_id', parseInt(formData.category_id));
    dataToSend.append('user_id', formData.user_id);

    // Iterar sobre los archivos en formData.files y agregarlos al FormData
    // La clave 'file[]' es crucial para que Laravel lo reciba como un array
    formData.files.forEach((file) => {
      dataToSend.append('file[]', file);
    });

    // --- LÍNEAS DE DEPURACIÓN EN LA CONSOLA DEL NAVEGADOR ---
    console.log("Contenido del FormData a enviar:");
    for (let pair of dataToSend.entries()) {
        console.log(pair[0]+ ': ' + pair[1]);
    }
    // --- FIN LÍNEAS DE DEPURACIÓN ---

    try {
      const response = await apiClient.post('/products', dataToSend, {
        headers: {
          // No es estrictamente necesario si usas FormData, pero es buena práctica
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 200 || response.status === 201) {
        setSuccess('Producto publicado con éxito!');
        // Limpiar el formulario y las previsualizaciones después de un envío exitoso
        setFormData({
          name: '',
          description: '',
          price: '',
          status: 'available',
          date_up: new Date().toISOString().slice(0, 10),
          category_id: '',
          user_id: userId,
          files: [],
        });
        // Revocar todas las URLs de objeto creadas para liberar memoria
        filePreviews.forEach(preview => URL.revokeObjectURL(preview.url));
        setFilePreviews([]);
      } else {
        setError(response.data.message || 'Error desconocido al publicar el producto.');
      }
    } catch (err) {
      console.error("Error submitting product:", err.response ? err.response.data : err);
      if (err.response && err.response.data && err.response.data.errors) {
        // Manejar errores de validación específicos del backend
        const validationErrors = err.response.data.errors;
        let errorMessage = "Errores de validación:\n";
        for (const key in validationErrors) {
          // El backend puede devolver 'file.0', 'file.1', etc. para errores individuales de archivos
          errorMessage += `- ${validationErrors[key].join(', ')}\n`;
        }
        setError(errorMessage);
      } else if (err.response && err.response.data && err.response.data.message) {
          setError(err.response.data.message);
      } else {
        setError('Hubo un problema al conectar con el servidor o al publicar el producto. Verifica tu conexión.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Efecto de limpieza: revocar URLs de objeto cuando el componente se desmonte o las previas cambien
  useEffect(() => {
    return () => {
      filePreviews.forEach(preview => URL.revokeObjectURL(preview.url));
    };
  }, [filePreviews]);

  // Mensaje de carga mientras se obtienen datos esenciales
  if (userId === null || categories.length === 0) {
    return (
      <Container className="my-5 text-center">
        <Alert variant="info">Cargando datos esenciales (usuario y categorías)...</Alert>
      </Container>
    );
  }

  const remainingFiles = MAX_FILES - formData.files.length;
  const canAddMoreFiles = formData.files.length < MAX_FILES;

  return (
    <Container className="my-5">
      <Row className="justify-content-md-center">
        <Col md={8}>
          <h2 className="text-center mb-4">Publicar Nuevo Producto</h2>

          {error && <Alert variant="danger" className="text-start">{error}</Alert>}
          {success && <Alert variant="success" className="text-start">{success}</Alert>}

          <Form onSubmit={handleSubmit} >
            <Form.Group controlId="name" className="mb-3">
              <Form.Label>Nombre del Producto <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ej: Zapatillas Deportivas Nike, Smart TV 55 pulgadas"
                maxLength={100}
                required
              />
            </Form.Group>

            <Form.Group controlId="description" className="mb-3">
              <Form.Label>Descripción <span className="text-danger">*</span></Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe tu producto en detalle (características, estado, etc. hasta 10000 caracteres)"
                maxLength={10000}
                required
              />
            </Form.Group>

            <Row className="mb-3">
              <Col md={6}>
                <Form.Group controlId="price">
                  <Form.Label>Precio <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="Ej: 99.99"
                    step="0.01"
                    min="0.01"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="category_id">
                  <Form.Label>Categoría <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    as="select"
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleChange}
                    required
                  >
                    <option value="">-- Selecciona una categoría --</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </Form.Control>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group controlId="files" className="mb-3">
              <Form.Label>Imágenes del Producto <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="file"
                name="files" // El 'name' del input file puede ser 'files' en el frontend
                multiple
                accept="image/*" // Restringe la selección a archivos de imagen
                onChange={handleFileChange}
                disabled={!canAddMoreFiles}
              />
              <Form.Text className="text-muted">
                Puedes subir hasta {MAX_FILES} imágenes. Has subido {formData.files.length}. {remainingFiles > 0 && `Puedes añadir ${remainingFiles} más.`}
              </Form.Text>
              <div className="mt-2 d-flex flex-wrap gap-2">
                {filePreviews.map((preview, index) => (
                  <Card key={index} style={{ width: '8rem', height: '8rem', overflow: 'hidden', position: 'relative' }}>
                    <Card.Img variant="top" src={preview.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <Button
                      variant="danger"
                      className="position-absolute rounded-circle p-0 border-0 d-flex justify-content-center align-items-center delete-image-button"
                      style={{
                        width: '2.2rem',
                        height: '2.2rem',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 1000,
                        backgroundColor: 'rgba(220, 53, 69, 0.85)',
                      }}
                      onClick={() => handleRemoveFile(index)}
                      aria-label="Eliminar imagen"
                    >
                      <XCircleFill size={20} />
                    </Button>
                  </Card>
                ))}
              </div>
            </Form.Group>

            <Button variant="primary" type="submit" disabled={loading} className="w-100">
              {loading ? 'Publicando...' : 'Publicar Producto'}
            </Button>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};

export default SellProductForm;