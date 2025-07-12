import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, InputGroup, Spinner } from 'react-bootstrap'; // Eliminamos Alert
import { Hammer, CurrencyDollar, InfoCircle } from 'react-bootstrap-icons';
import moment from 'moment';
import apiClient from '../../api/apiClient';

// Importa SweetAlert2
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

import './BidModal.css';

// Crea una instancia de SweetAlert2 con soporte para React
const MySwal = withReactContent(Swal);

// Asegúrate de que onExited esté desestructurada en las props
const BidModal = ({ show, handleClose, initialBidAmount, auctionId, userId, sellerUserId, onBidSuccess, onExited }) => {
  const [bidAmount, setBidAmount] = useState(initialBidAmount || 0);
  const [autobid, setAutobid] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(moment().format('DD-MM-YYYY HH:mm:ss'));

  // Estados para la carga
  const [loading, setLoading] = useState(false); // Para mostrar el spinner

  const minBidAmount = initialBidAmount || 0;

  useEffect(() => {
    setBidAmount(initialBidAmount || 0);
    // Solo necesitamos resetear el estado de carga al abrir el modal
    setLoading(false);
  }, [initialBidAmount, show]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(moment().format('DD-MM-YYYY HH:mm:ss'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAmountChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setBidAmount(value);
    }
  };

  const showSwal = (icon, title, text) => {
    MySwal.fire({
      icon: icon,
      title: title,
      text: text,
      confirmButtonText: 'Ok',
      customClass: {
        confirmButton: 'btn btn-primary', // Puedes personalizar las clases CSS aquí
      },
      buttonsStyling: false // Importante para usar tus propias clases de botón
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true); // Mostrar spinner

    const finalBid = parseFloat(bidAmount);

    // Validaciones del lado del cliente antes de enviar
    if (isNaN(finalBid) || finalBid < minBidAmount) {
      showSwal('error', 'Error de Validación', `El monto de la oferta debe ser numérico y mayor o igual a $${minBidAmount.toFixed(2)}.`);
      setLoading(false);
      return;
    }
    if (!userId) {
        showSwal('error', 'Error', 'No se pudo obtener el ID de usuario. Por favor, inicia sesión.');
        setLoading(false);
        return;
    }
    if (!auctionId) {
        showSwal('error', 'Error', 'ID de subasta no disponible.');
        setLoading(false);
        return;
    }

    const bidData = {
      auction_id: auctionId,
      user_id: userId,
      amount: finalBid,
      date_bid: moment().format('YYYY-MM-DD HH:mm:ss'),
      autobid: autobid ? 1 : 0,
      status: 1,
    };

    try {
      const response = await apiClient.post('/bids', bidData);

      console.log("BidModal: Respuesta EXITOSA del servidor al enviar oferta:", response);

      if (response.status === 200) {
        const backendMessage = response.data.message || '';

        if (backendMessage.includes('Muy Bien, por ahora no hay otras ofertas') ||
            backendMessage.includes('Muy Bien!, por ahora vas ganando este REMATE')) {
          MySwal.fire({
            icon: 'success',
            title: '¡Oferta Exitosa!',
            text: backendMessage,
            confirmButtonText: 'Ok',
            customClass: {
              confirmButton: 'btn btn-primary',
            },
            buttonsStyling: false,
            // timer: 3000, // Opcional: auto-cerrar después de 3 segundos
            // timerProgressBar: true,
          }).then((result) => {
            if (result.isConfirmed || result.dismiss === Swal.DismissReason.timer) {
              // Verifica si onBidSuccess es una función antes de llamarla
              if (typeof onBidSuccess === 'function') {
                onBidSuccess(); // Actualiza el historial en el padre
              } else {
                console.warn("BidModal: onBidSuccess no es una función después de SweetAlert. No se pudo llamar.");
              }
              handleClose();  // Cierra el modal de oferta
            }
          });
        }
        else if (backendMessage.includes('Tu oferta no puede ser menor') ||
                 backendMessage.includes('Ups!!, Alguien con OFERTA AUTOMATICA te sigue GANADO!')) {
          showSwal('warning', 'Atención', backendMessage);
          // No cerramos el modal de SweetAlert2 automáticamente aquí
        }
        else {
          MySwal.fire({
            icon: 'success',
            title: '¡Oferta Procesada!',
            text: backendMessage || 'Oferta procesada con éxito.',
            confirmButtonText: 'Ok',
            customClass: {
              confirmButton: 'btn btn-primary',
            },
            buttonsStyling: false,
          }).then((result) => {
            if (result.isConfirmed || result.dismiss === Swal.DismissReason.timer) {
              // Verifica si onBidSuccess es una función antes de llamarla
              if (typeof onBidSuccess === 'function') {
                onBidSuccess();
              } else {
                console.warn("BidModal: onBidSuccess no es una función después de SweetAlert. No se pudo llamar.");
              }
              handleClose();
            }
          });
        }
      } else if (response.status === 203) {
        showSwal('error', 'Problema al Ofertar', response.data.message || 'La operación no pudo ser completada.');
      } else {
        showSwal('error', 'Error Inesperado', response.data.message || 'Ocurrió un error inesperado al enviar la oferta.');
      }
    } catch (error) {
      console.error("BidModal: Respuesta de ERROR del servidor al enviar oferta:", error.response);
      const errorMessage = error.response?.data?.message || 'Error de conexión al enviar la oferta. Inténtalo de nuevo.';
      showSwal('error', 'Error de Conexión', errorMessage);
    } finally {
        setLoading(false); // Siempre ocultar el spinner al finalizar
    }
  };

  return (
    // Aquí se pasa la prop onExited al componente Modal de React-Bootstrap
    <Modal show={show} onHide={handleClose} centered dialogClassName="bid-modal-custom" onExited={onExited}>
      <Modal.Header closeButton className="bg-dark text-white border-0">
        <Modal.Title className="w-100 text-center">
          OFERTAR <Hammer className="ms-2" />
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="bg-dark text-white">
        <div className="text-center mb-3">
          <small className="text-warning">
            <InfoCircle className="me-1" /> Más info sobre "oferta automática"
          </small>
        </div>

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-4">
            <InputGroup>
              <InputGroup.Text className="bg-secondary text-white border-0">$</InputGroup.Text>
              <Form.Control
                type="number"
                step="0.01"
                value={bidAmount}
                onChange={handleAmountChange}
                min={minBidAmount}
                className="form-control-bid"
                placeholder="Monto de la oferta"
                disabled={loading}
              />
            </InputGroup>
            {bidAmount !== '' && parseFloat(bidAmount) < minBidAmount && (
                <Form.Text className="text-danger mt-1">
                    El monto debe ser igual o mayor a ${minBidAmount.toFixed(2)}
                </Form.Text>
            )}
          </Form.Group>

          <Form.Group className="mb-4 d-flex align-items-center justify-content-between">
            <Form.Label className="mb-0">La función de Auto-oferta esta:</Form.Label>
            <Form.Check
              type="switch"
              id="autobid-switch"
              checked={autobid}
              onChange={(e) => setAutobid(e.target.checked)}
              label={autobid ? 'Activa' : 'Inactiva'}
              className={autobid ? 'text-success' : 'text-danger'}
              disabled={loading}
            />
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label>Fecha y Hora de Oferta:</Form.Label>
            <Form.Control
              type="text"
              value={currentDateTime}
              disabled
              className="bg-secondary text-white border-0"
            />
          </Form.Group>

          <div className="d-grid gap-2">
            <Button variant="info" type="submit" size="lg" className="btn-send-bid" disabled={loading}>
              {loading ? (
                <>
                  <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                  Enviando...
                </>
              ) : (
                'Enviar'
              )}
            </Button>
            <Button variant="secondary" onClick={handleClose} size="lg" className="btn-exit-bid" disabled={loading}>
              Salir
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default BidModal;