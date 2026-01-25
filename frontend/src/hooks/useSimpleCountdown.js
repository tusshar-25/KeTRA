import { useState, useEffect, useRef } from 'react';

export const useSimpleCountdown = (targetTime) => {
  const [timeLeft, setTimeLeft] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = new Date(targetTime).getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft(0);
        setIsCompleted(true);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        return;
      }

      setTimeLeft(Math.floor(difference / 1000));
      setIsCompleted(false);
    };

    // Initial calculation
    calculateTimeLeft();

    // Set up interval
    intervalRef.current = setInterval(calculateTimeLeft, 1000);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [targetTime]);

  const formatTime = (seconds) => {
    if (seconds <= 0) return 'Completed';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    return `${seconds}s`;
  };

  return {
    timeLeft,
    isCompleted,
    formatted: formatTime(timeLeft),
    minutes: Math.floor(timeLeft / 60),
    seconds: timeLeft % 60
  };
};
