import { useState, useEffect } from 'react';

export default function Clock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="flex flex-col items-end whitespace-nowrap">
      <div className="text-lg font-semibold text-slate-900 mb-0.5 font-mono tracking-wide leading-tight">
        {formatTime(time)}
      </div>
      <div className="text-xs text-slate-600 leading-tight">
        {formatDate(time)}
      </div>
    </div>
  );
}

