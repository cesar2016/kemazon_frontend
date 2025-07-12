// src/utils/countdownUtils.js

/**
 * Calcula el tiempo restante hasta una fecha objetivo.
 * @param {string | Date} targetDate La fecha y hora objetivo (ej. "2025-12-31T23:59:59").
 * @returns {{days: number, hours: number, minutes: number, seconds: number, isTimeUp: boolean}} Objeto con el tiempo restante.
 */
export const calculateTimeLeft = (targetDate) => {
  const difference = +new Date(targetDate) - +new Date(); // Diferencia en milisegundos
  let timeLeft = {};

  if (difference > 0) {
    timeLeft = {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
      isTimeUp: false,
    };
  } else {
    timeLeft = {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isTimeUp: true, // Indica que el tiempo ha terminado
    };
  }

  return timeLeft;
};
