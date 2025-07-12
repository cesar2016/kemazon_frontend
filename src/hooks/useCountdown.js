// src/hooks/useCountdown.js
import { useState, useEffect } from 'react';
import { calculateTimeLeft } from '../utils/countdownUtils'; // Importa la función utilitaria

/**
 * Hook personalizado para manejar un contador regresivo.
 * @param {string | Date} targetDate La fecha y hora objetivo del contador.
 * @returns {{days: number, hours: number, minutes: number, seconds: number, isTimeUp: boolean}} El tiempo restante y un indicador de si ha terminado.
 */
export const useCountdown = (targetDate) => {
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(targetDate));

  useEffect(() => {
    // Si la fecha objetivo no es válida o ya ha terminado, no hacemos nada.
    if (!targetDate || timeLeft.isTimeUp) {
      return;
    }

    const timer = setInterval(() => {
      const newTimeLeft = calculateTimeLeft(targetDate);
      if (newTimeLeft.isTimeUp) {
        // Si el tiempo terminó, limpiamos el intervalo y actualizamos a 0
        clearInterval(timer);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isTimeUp: true });
      } else {
        setTimeLeft(newTimeLeft);
      }
    }, 1000); // Actualiza cada segundo

    // Función de limpieza para cuando el componente se desmonte
    return () => clearInterval(timer);
  }, [targetDate, timeLeft.isTimeUp]); // Dependencias del efecto: targetDate y si el tiempo ya terminó

  return timeLeft;
};
