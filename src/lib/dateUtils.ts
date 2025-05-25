import { format } from "date-fns";
import { fr } from "date-fns/locale";

export const formatDate = (date: Date | number | string): string => {
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;
  
  return format(dateObj, "dd/MM/yyyy", { locale: fr });
};

export const formatTime = (date: Date | number | string): string => {
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;
  
  return format(dateObj, "HH:mm:ss", { locale: fr });
};

export const formatDateTime = (date: Date | number | string): string => {
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;
  
  return format(dateObj, "dd/MM/yyyy HH:mm:ss", { locale: fr });
};

export const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  
  if (diff < 60000) return "À l'instant";
  if (diff < 3600000) return `Il y a ${Math.floor(diff / 60000)} min`;
  if (diff < 86400000) return `Il y a ${Math.floor(diff / 3600000)} h`;
  
  return formatDate(timestamp);
};