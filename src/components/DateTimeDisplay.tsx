import React, { useState, useEffect } from "react";
import { formatDateTime } from "@/lib/dateUtils";

const DateTimeDisplay: React.FC = () => {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    // Mettre à jour l'heure toutes les secondes
    const interval = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    // Nettoyer l'intervalle lors du démontage du composant
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-sm text-muted-foreground">
      {formatDateTime(currentDateTime)}
    </div>
  );
};

export default DateTimeDisplay;


