// src/components/modals/AuctionModal.js
import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import moment from 'moment'; // Para manejar fechas, ya lo tienes instalado
import apiClient from '../../api/apiClient'; // Tu cliente Axios

const AuctionModal = ({ show, handleClose, productId, onAuctionSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    base: '',
    date_end: '',
    time_end: '',
    product_id: productId, // Se inicializa con el productId pasado como prop
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [minEndDate, setMinEndDate] = useState(''); // Estado para la fecha mínima seleccionable

  // Actualizar productId en formData cuando la prop cambie (cuando se abre el modal para un producto diferente)
  useEffect(() => {
    setFormData(prev => ({ ...prev, product_id: productId }));
  }, [productId]);

  // Calcular la fecha mínima (hoy + 7 días) al montar el componente
  useEffect(() => {
    const today = moment();
    const minDate = today.add(7, 'days').format('YYYY-MM-DD');
    setMinEndDate(minDate);
    setFormData(prev => ({ ...prev, date_end: minDate })); // Establecer la fecha de fin por defecto a +7 días
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setError(null); // Limpiar errores al cambiar un campo
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validaciones frontend básicas
    if (!formData.title.trim()) {
      setError('El título de la subasta es obligatorio.');
      setLoading(false);
      return;
    }
    if (formData.title.trim().length > 100) {
      setError('El título no debe exceder los 100 caracteres.');
      setLoading(false);
      return;
    }
    if (!formData.description.trim()) {
      setError('La descripción es obligatoria.');
      setLoading(false);
      return;
    }
    if (formData.description.trim().length > 500) {
      setError('La descripción no debe exceder los 500 caracteres.');
      setLoading(false);
      return;
    }
    if (isNaN(parseFloat(formData.base)) || parseFloat(formData.base) <= 0) {
      setError('El precio base debe ser un número positivo.');
      setLoading(false);
      return;
    }
    if (!formData.date_end) {
        setError('Debes seleccionar una fecha de finalización.');
        setLoading(false);
        return;
    }
    if (!formData.time_end) {
        setError('Debes seleccionar una hora de finalización.');
        setLoading(false);
        return;
    }

    // Datos a enviar al backend
    // `status`, `date_start`, `time_start` serán manejados en el backend
    // y no se envían desde el formulario React (son campos hidden en tu descripción)
    const dataToSend = {
      ...formData,
      base: parseFloat(formData.base), // Asegurarse de que 'base' es un número
      status: 1, // El status será 1 (Activa y en proceso) al crearla
      // date_start y time_start serán seteados en el controlador de Laravel
    };

    try {
      const response = await apiClient.post('/auctions', dataToSend);

      if (response.status === 200 || response.status === 201) {
        // Llama a la función de callback para indicar éxito y cerrar/actualizar tabla
        onAuctionSuccess(response.data); // Pasa la data de la nueva subasta si es útil
        handleClose(); // Cierra el modal
        // Opcional: limpiar el formulario para la próxima vez que se abra
        setFormData({
            title: '',
            description: '',
            base: '',
            date_end: minEndDate, // Reestablecer a la fecha mínima por defecto
            time_end: '',
            product_id: null, // Resetear product_id
        });
      } else {
        setError(response.data.message || 'Error desconocido al activar la subasta.');
      }
    } catch (err) {
      console.error("Error al activar subasta:", err.response ? err.response.data : err);
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
        setError('Hubo un problema al conectar con el servidor o al activar la subasta.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Activar Subasta para Producto ID: {productId}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="auctionTitle">
            <Form.Label>Título de la Subasta <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Ej: Oferta relámpago! Zapatillas..."
              maxLength={100}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="auctionDescription">
            <Form.Label>Descripción <span className="text-danger">*</span></Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Breve descripción de la subasta (máx. 500 caracteres)"
              maxLength={500}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="auctionBasePrice">
            <Form.Label>Precio Base <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="number"
              name="base"
              value={formData.base}
              onChange={handleChange}
              placeholder="Ej: 1500.00"
              step="0.01"
              min="0.01"
              required
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="auctionDateEnd">
            <Form.Label>Fecha de Finalización <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="date"
              name="date_end"
              value={formData.date_end}
              onChange={handleChange}
              min={minEndDate} // La fecha mínima será hoy + 7 días
              required
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="auctionTimeEnd">
            <Form.Label>Hora de Finalización <span className="text-danger">*</span></Form.Label>
            <Form.Control
              type="time"
              name="time_end"
              value={formData.time_end}
              onChange={handleChange}
              required
            />
          </Form.Group>

          {/* product_id es hidden */}
          <Form.Control type="hidden" name="product_id" value={formData.product_id} />

          <Button variant="primary" type="submit" className="w-100" disabled={loading}>
            {loading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" /> : null}
            Activar Subasta
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default AuctionModal;
