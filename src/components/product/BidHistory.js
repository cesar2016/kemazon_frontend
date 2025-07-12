// src/components/tables/BidHistory.js

import React, { useEffect, forwardRef } from 'react';
import { Card, Spinner, Alert, ListGroup, Pagination, Form, Col, Row, OverlayTrigger, Tooltip } from 'react-bootstrap';
import moment from 'moment';
import { EmojiSmileFill, EmojiFrownFill, PlayFill, Bell, HammerFill } from 'react-bootstrap-icons';
import './BidHistory.css';

import NotificationBubble from '../common/NotificationBubble';

const BidHistory = forwardRef(({
  auctionId,
  currentUserId,
  bidsData,
  loading,
  error,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  notificationCount,
  onBellClick // ¡Nueva prop!
}, ref) => {

  const effectiveBidsData = bidsData && typeof bidsData === 'object' ? bidsData : {
    data: [],
    current_page: 1,
    last_page: 1,
    total: 0,
    links: [],
  };

  const handlePageChange = (pageNumber) => {
    onPageChange(pageNumber);
  };

  const handleItemsPerPageChange = (e) => {
    onItemsPerPageChange(e);
  };

  const renderPaginationItems = () => {
    const { current_page, last_page } = effectiveBidsData;
    const items = [];
    items.push(<Pagination.Prev key="prev" onClick={() => handlePageChange(current_page - 1)} disabled={current_page === 1} />);
    let startPage = Math.max(1, current_page - 2);
    let endPage = Math.min(last_page, current_page + 2);

    if (startPage > 1) {
      items.push(<Pagination.Item key={1} onClick={() => handlePageChange(1)}>{1}</Pagination.Item>);
      if (startPage > 2) {
        items.push(<Pagination.Ellipsis key="ellipsis-start" />);
      }
    }

    for (let page = startPage; page <= endPage; page++) {
      items.push(
        <Pagination.Item key={page} active={page === current_page} onClick={() => handlePageChange(page)}>
          {page}
        </Pagination.Item>
      );
    }

    if (endPage < last_page) {
      if (endPage < last_page - 1) {
        items.push(<Pagination.Ellipsis key="ellipsis-end" />);
      }
      items.push(<Pagination.Item key={last_page} onClick={() => handlePageChange(last_page)}>{last_page}</Pagination.Item>);
    }
    items.push(<Pagination.Next key="next" onClick={() => handlePageChange(current_page + 1)} disabled={current_page === last_page} />);
    return items;
  };

  // Función auxiliar para el contenido del header
  const renderHeaderContent = () => (
    <div className="d-flex justify-content-between align-items-center">
      <h4 className="bid-history-title-with-bell">
        Historial de Ofertas
        {/* Aquí se envuelve el span de la campana y la burbuja con OverlayTrigger para el tooltip */}
        <OverlayTrigger
          placement="top"
          overlay={
            <Tooltip id={`tooltip-new-bids-${auctionId}`}>
              Hay {notificationCount} nuevas ofertas
            </Tooltip>
          }
        >
          {/* Añadimos el onClick para resetear las notificaciones */}
          <span className="bell-and-bubble-container" onClick={onBellClick}>
            <Bell className="small-bell-icon" />
            <NotificationBubble count={notificationCount} />
          </span>
        </OverlayTrigger>
      </h4>
      <span className="text-muted">Total de ofertas: {effectiveBidsData.total}</span>
    </div>
  );

  // ... (el resto de tu componente BidHistory sigue igual) ...

  return (
    <Card className="bid-history-card mt-4" ref={ref}>
      <Card.Header>
        {renderHeaderContent()}
      </Card.Header>
      <Card.Body>
        <Row className="mb-3 align-items-center">
          <Col xs={12} md={6}>
            <Form.Group as={Row} className="align-items-center">
              <Form.Label column sm="6" className="text-md-end">
                Mostrar ofertas:
              </Form.Label>
              <Col sm="6">
                <Form.Select value={itemsPerPage} onChange={handleItemsPerPageChange}>
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </Form.Select>
              </Col>
            </Form.Group>
          </Col>
          <Col xs={12} md={6} className="text-md-end mt-2 mt-md-0">
             Total de ofertas: <strong>{effectiveBidsData.total}</strong>
          </Col>
        </Row>

        {effectiveBidsData.data.length > 0 ? (
          <>
            <ListGroup variant="flush">
              {effectiveBidsData.data.map((bid, index) => {
                const isWinner = effectiveBidsData.current_page === 1 && index === 0;
                const displayUsername = bid.user ? bid.user.name : 'Usuario Desconocido';
                const isCurrentUserBid = currentUserId && bid.user && bid.user.id === currentUserId;

                const displayDate = moment(bid.date_bid || bid.created_at).format('DD/MM/YYYY HH:mm:ss');

                const amount_index_condition_str = effectiveBidsData.data[1] ? effectiveBidsData.data[1].amount : null;
                const amount_index_condition = amount_index_condition_str !== null ? parseFloat(amount_index_condition_str) : 0;

                const amount_condition_str = bid.autobid === 1 ? (amount_index_condition + 100) : bid.amount;
                const amount_condition = parseFloat(amount_condition_str);

                const autoBid_Active = bid.autobid === 1 ? true : '';

                return (
                  <ListGroup.Item key={bid.id || index} className={`bid-item ${isWinner ? 'winner-bid' : ''}`}>
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        
                        {isWinner ? (
                          // Si isWinner es true, muestra la carita feliz                           
                          <EmojiSmileFill className="me-1 text-warning" />                            
                        ) : (     
                          <EmojiFrownFill className="me-1" />
                        )}

                        {isWinner ? (                                                  
                          <strong className="bid-amount text-white">${parseFloat(amount_condition).toFixed(2)}</strong>                            
                        ) : (     
                          <span className="bid-amount">${parseFloat(amount_condition).toFixed(2)}</span>

                        )} 
                        
                        {
                          autoBid_Active
                          &&
                          <OverlayTrigger
                            placement="top" // Puedes mantener 'top' o cambiar a 'bottom', 'left', 'right'
                            overlay={
                              // Aquí definimos el contenido del Tooltip
                              <Tooltip id="tooltip-auto-oferta-activa"> {/* IMPORTANTE: Asegúrate de que este ID sea único */}
                                Auto oferta activada
                              </Tooltip>
                            }
                          >
                            {/* El elemento al que se le aplicará el tooltip es el hijo de OverlayTrigger */}
                            <span> {/* Este span es el "gatillo" del tooltip */}
                              <PlayFill className="bg-danger" />
                            </span>
                          </OverlayTrigger>
                        }
                      </div>
                      <div className="bid-user-info">        
                        {displayUsername} {isCurrentUserBid && <span className="badge bg-primary ms-1">Tú</span>}
                      </div>
                    </div>                       
                    <div className="bid-timestamp text-white;">
                      {displayDate}
                    </div>
                  </ListGroup.Item>
                );
              })}
            </ListGroup>

            {effectiveBidsData.last_page > 1 && (
              <Pagination className="justify-content-center mt-3">
                {renderPaginationItems()}
              </Pagination>
            )}
          </>
        ) : (
          <Alert variant="info" className="text-center mb-0">
            Aún no hay ofertas para esta subasta. ¡Sé el primero!
          </Alert>
        )}
      </Card.Body>
    </Card>
  );
});

export default BidHistory;