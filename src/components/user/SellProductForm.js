import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Row, Col, Alert, Card, Spinner } from 'react-bootstrap';
import { XCircleFill } from 'react-bootstrap-icons';
import apiClient from '../../api/apiClient';
import { useNavigate, useParams } from 'react-router-dom';
import './SellProductForm.css';

const SellProductForm = () => {
  const navigate = useNavigate();
  const { productId } = useParams();
  const isEditing = !!productId;

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    status: '1', // Asumo '1' es tu valor por defecto para 'available'
    date_up: new Date().toISOString().slice(0, 10),
    category_id: '',
    user_id: '',
    files: [],
  });

  const BASE_URL_IMAGES = process.env.REACT_APP_API_BASE_URL_IMAGES || '';

  const [categories, setCategories] = useState([]);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [filePreviews, setFilePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const MAX_FILES = 6;

  useEffect(() => {
    const fetchInitialData = async () => {
      setInitialLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          navigate('/login');
          return;
        }

        const [userResponse, categoriesResponse] = await Promise.all([
          apiClient.get('/user-profile'),
          apiClient.get('/categories')
        ]);

        if (userResponse.data.status === 1) {
          const fetchedUserId = userResponse.data.data.id;
          setUserId(fetchedUserId);
          setFormData(prev => ({ ...prev, user_id: fetchedUserId }));
        } else {
          throw new Error('No se pudo obtener el ID del usuario. Por favor, inicia sesión de nuevo.');
        }

        setCategories(categoriesResponse.data);

        if (isEditing) {
          const productResponse = await apiClient.get(`/products/${productId}`);
          const productData = productResponse.data;

          console.log("Datos del producto obtenidos del backend (productData):", productData);

          setFormData(prev => ({
            ...prev,
            name: productData.name,
            description: productData.description,
            price: productData.price,
            status: String(productData.status), // Asegurarse de que el status sea un string para el formulario
            date_up: productData.date_up ? productData.date_up.slice(0, 10) : new Date().toISOString().slice(0, 10),
            category_id: productData.category_id,
          }));

          if (productData.images && Array.isArray(productData.images)) {
            const existingProductImagePreviews = productData.images.map(img => ({
              id: img.id,
              // *** AJUSTE AQUÍ: Usar fullName_image_product para la URL ***
              url: `${BASE_URL_IMAGES}/${img.fullName_image_product}`,
              isNew: false
            }));
            setExistingImages(existingProductImagePreviews);
            setFilePreviews(existingProductImagePreviews);
          } else {
              setExistingImages([]);
              setFilePreviews([]);
          }
        }

      } catch (err) {
        console.error("Error fetching initial data:", err);
        setError(err.message || 'Error de conexión o al cargar datos esenciales. Inténtalo de nuevo más tarde.');
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
            localStorage.removeItem('access_token');
            navigate('/login');
        }
      } finally {
        setInitialLoading(false);
      }
    };

    fetchInitialData();
  }, [navigate, productId, isEditing, BASE_URL_IMAGES]); // Añadir BASE_URL_IMAGES a las dependencias


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

    const combinedFilesCount = existingImages.length + formData.files.length + newFiles.length;
    if (combinedFilesCount > MAX_FILES) {
      setError(`Solo puedes subir un máximo de ${MAX_FILES} imágenes (incluyendo las existentes).`);
      return;
    }

    // Filtrar archivos duplicados por nombre y tamaño para evitar añadir los mismos si se selecciona de nuevo
    const uniqueNewFiles = newFiles.filter(newFile =>
      !formData.files.some(existingFile => existingFile.name === newFile.name && existingFile.size === newFile.size)
    );

    setFormData(prev => ({
      ...prev,
      files: [...prev.files, ...uniqueNewFiles],
    }));

    const newFilePreviews = uniqueNewFiles.map(file => ({
      file: file, // Guardamos la referencia al archivo original
      url: URL.createObjectURL(file),
      isNew: true
    }));
    setFilePreviews(prev => [...prev, ...newFilePreviews]);

    e.target.value = null; // Limpiar el input para permitir seleccionar los mismos archivos de nuevo si es necesario
    setError(null);
    setSuccess(null);
  };

  const handleRemoveFile = (indexToRemove, isNewFile = true, imageId = null) => {
    setError(null);
    setSuccess(null);

    // Si es un archivo nuevo (aún no subido al servidor)
    if (isNewFile) {
        const filePreviewToRemove = filePreviews[indexToRemove]; // Obtenemos el objeto preview completo
        if (filePreviewToRemove && filePreviewToRemove.url) {
            URL.revokeObjectURL(filePreviewToRemove.url); // Revocar URL del objeto para liberar memoria
        }

        // Filtramos formData.files basándonos en el objeto de archivo del preview
        const updatedFiles = formData.files.filter(file => file !== filePreviewToRemove.file);
        setFormData(prev => ({
            ...prev,
            files: updatedFiles,
        }));

        // Filtramos filePreviews por el índice
        setFilePreviews(prev => prev.filter((_, idx) => idx !== indexToRemove));
    } else {
        // Es una imagen existente (ya en el servidor)
        // La quitamos de `existingImages` y de `filePreviews` localmente.
        // La eliminación real en el backend se gestionará en el handleSubmit.
        setExistingImages(prev => prev.filter(img => img.id !== imageId));
        setFilePreviews(prev => prev.filter(preview => preview.id !== imageId || preview.isNew));
    }
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
    if (existingImages.length + formData.files.length === 0) {
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

    formData.files.forEach((file) => {
      dataToSend.append('file[]', file);
    });

    if (isEditing) {
        dataToSend.append('_method', 'PUT');
        const currentExistingImageIds = existingImages.map(img => img.id);
        dataToSend.append('existing_image_ids', JSON.stringify(currentExistingImageIds));
    }

    console.log("Contenido del FormData a enviar:");
    for (let pair of dataToSend.entries()) {
        console.log(pair[0]+ ': ' + pair[1]);
    }

    try {
      const apiCall = isEditing
        ? apiClient.post(`/products/${productId}`, dataToSend, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
        : apiClient.post('/products', dataToSend, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });

      const response = await apiCall;

      if (response.status === 200 || response.status === 201) {
        setSuccess(isEditing ? 'Producto actualizado con éxito!' : 'Producto publicado con éxito!');

        if (!isEditing) {
          // Lógica para nuevo producto
          setFormData({
            name: '',
            description: '',
            price: '',
            status: '1', // Asegurarse que el default sea el mismo
            date_up: new Date().toISOString().slice(0, 10),
            category_id: '',
            user_id: userId,
            files: [],
          });
          filePreviews.forEach(preview => {
            if (preview.url && preview.isNew) URL.revokeObjectURL(preview.url);
          });
          setFilePreviews([]);
          setExistingImages([]);
        } else {
            // *** AJUSTE AQUÍ: Usar la respuesta directa del backend si está bien formateada ***
            // Si Laravel ya devuelve el producto con las imágenes actualizadas en el response.data,
            // no necesitas hacer otra llamada a la API (`apiClient.get(`/products/${productId}`)`).
            // Simplemente usa `response.data`.

            const updatedProductData = response.data; // El producto actualizado que devuelve Laravel
            console.log("Respuesta del backend después de la actualización (updatedProductData):", updatedProductData);

            if (updatedProductData.images && Array.isArray(updatedProductData.images)) {
                const updatedImagePreviews = updatedProductData.images.map(img => ({
                    id: img.id,
                    // *** AJUSTE AQUÍ: Usar fullName_image_product para la URL ***
                    url: `${BASE_URL_IMAGES}/${img.fullName_image_product}`,
                    isNew: false
                }));
                setExistingImages(updatedImagePreviews);
                setFilePreviews(updatedImagePreviews); // Esto actualizará el DOM
                setFormData(prev => ({ ...prev, files: [] })); // Limpiar archivos nuevos después de subirlos
            } else {
                setExistingImages([]);
                setFilePreviews([]);
                setFormData(prev => ({ ...prev, files: [] }));
            }
        }
      } else {
        setError(response.data.message || `Error desconocido al ${isEditing ? 'actualizar' : 'publicar'} el producto.`);
      }
    } catch (err) {
      console.error("Error submitting product:", err.response ? err.response.data : err);
      if (err.response && err.response.data && err.response.data.errors) {
        const validationErrors = err.response.data.errors;
        let errorMessage = "Errores de validación:\n";
        for (const key in validationErrors) {
          errorMessage += `- ${validationErrors[key].join(', ')}\n`;
        }
        setError(errorMessage);
      } else if (err.response && err.response.data && err.response.data.message) {
          setError(err.response.data.message);
      } else {
        setError(`Hubo un problema al conectar con el servidor o al ${isEditing ? 'actualizar' : 'publicar'} el producto. Verifica tu conexión.`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      filePreviews.forEach(preview => {
        if (preview.url && preview.isNew) URL.revokeObjectURL(preview.url);
      });
    };
  }, [filePreviews]);

  if (initialLoading) {
    return (
      <Container className="my-5 text-center">
        <Spinner animation="border" role="status" className="me-2">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
        <Alert variant="info" className="d-inline-block">Cargando datos esenciales...</Alert>
      </Container>
    );
  }

  if (userId === null || categories.length === 0) {
    return (
      <Container className="my-5 text-center">
        <Alert variant="danger">No se pudieron cargar los datos necesarios para el formulario.</Alert>
      </Container>
    );
  }

  const currentTotalFiles = existingImages.length + formData.files.length;
  const remainingFiles = MAX_FILES - currentTotalFiles;
  const canAddMoreFiles = currentTotalFiles < MAX_FILES;


  return (
    <Container className="my-5">
      <Row className="justify-content-md-center">
        <Col md={8}>
          <h2 className="text-center mb-4">{isEditing ? 'Modificar Producto' : 'Publicar Nuevo Producto'}</h2>

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
                name="files"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                disabled={!canAddMoreFiles}
              />
              <Form.Text className="text-muted">
                Puedes subir hasta {MAX_FILES} imágenes. Has subido {currentTotalFiles}. {remainingFiles > 0 && `Puedes añadir ${remainingFiles} más.`}
              </Form.Text>
              <div className="mt-2 d-flex flex-wrap gap-2">
                {filePreviews.map((preview, index) => (
                  <Card key={preview.id || `new-${index}`} style={{ width: '8rem', height: '8rem', overflow: 'hidden', position: 'relative' }}>
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
                      onClick={() => handleRemoveFile(index, preview.isNew, preview.id)}
                      aria-label="Eliminar imagen"
                    >
                      <XCircleFill size={20} />
                    </Button>
                  </Card>
                ))}
              </div>
            </Form.Group>

            <Button variant="primary" type="submit" disabled={loading} className="w-100">
              {loading ? (isEditing ? 'Actualizando...' : 'Publicando...') : (isEditing ? 'Actualizar Producto' : 'Publicar Producto')}
            </Button>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};

export default SellProductForm;