import { database } from './firebaseConfig';
import { ref, set, get } from 'firebase/database';

export interface AlertThreshold {
  min: number;
  max: number;
}

export interface AlertConfig {
  enabled: boolean;
  userEmail: string;
  cooldownMinutes: number;
  thresholds: {
    temperature: AlertThreshold;
    humidity: AlertThreshold;
    pressure?: AlertThreshold;
  };
}

export interface Alert {
  userEmail: string;
  id?: string;
  type: string;
  message: string;
  sensorId: string;
  value: number;
  threshold: number;
  timestamp: number;
  sent: boolean;
}

// Default alert configuration
const defaultAlertConfig: AlertConfig = {
  enabled: true,
  userEmail: "",
  cooldownMinutes: 30,
  thresholds: {
    temperature: { min: 10, max: 35 },
    humidity: { min: 20, max: 80 },
    pressure: { min: 980, max: 1030 }
  }
};

export const getAlertConfig = async (): Promise<AlertConfig> => {
  try {
    const configRef = ref(database, 'config/alerts');
    const snapshot = await get(configRef);
    
    if (snapshot.exists()) {
      return snapshot.val() as AlertConfig;
    } else {
      // If no config exists, create default one
      await set(configRef, defaultAlertConfig);
      return defaultAlertConfig;
    }
  } catch (error) {
    console.error("Error getting alert config:", error);
    return defaultAlertConfig;
  }
};

export const updateAlertConfig = async (config: AlertConfig): Promise<void> => {
  try {
    const configRef = ref(database, 'config/alerts');
    await set(configRef, config);
  } catch (error) {
    console.error("Error updating alert config:", error);
    throw error;
  }
};

export const createAlert = async (alert: Omit<Alert, 'id'>): Promise<string> => {
  try {
    const alertsRef = ref(database, 'alerts');
    const newAlertRef = ref(database, `alerts/${Date.now()}`);
    await set(newAlertRef, alert);
    return newAlertRef.key || '';
  } catch (error) {
    console.error("Error creating alert:", error);
    throw error;
  }
};

export const checkSensorData = async (
  sensorId: string, 
  type: string, 
  value: number
): Promise<Alert | null> => {
  try {
    const config = await getAlertConfig();
    
    if (!config.enabled) return null;
    
    let threshold: AlertThreshold | undefined;
    
    switch (type) {
      case 'temperature':
        threshold = config.thresholds.temperature;
        break;
      case 'humidity':
        threshold = config.thresholds.humidity;
        break;
      case 'pressure':
        threshold = config.thresholds.pressure;
        break;
      default:
        return null;
    }
    
    if (!threshold) return null;
    
    let alertMessage = '';
    let thresholdValue = 0;
    
    if (value < threshold.min) {
      alertMessage = `${type.charAt(0).toUpperCase() + type.slice(1)} trop basse: ${value}`;
      thresholdValue = threshold.min;
    } else if (value > threshold.max) {
      alertMessage = `${type.charAt(0).toUpperCase() + type.slice(1)} trop élevée: ${value}`;
      thresholdValue = threshold.max;
    } else {
      return null; // No alert needed
    }
    
    const alert: Omit<Alert, 'id'> = {
      type,
      message: alertMessage,
      sensorId,
      value,
      threshold: thresholdValue,
      timestamp: Date.now(),
      sent: false,
      userEmail: ''
    };
    
    const alertId = await createAlert(alert);
    return { ...alert, id: alertId };
    
  } catch (error) {
    console.error("Error checking sensor data:", error);
    return null;
  }
};

// Marquer une alerte comme envoyée
export const markAlertAsSent = async (alertId: string): Promise<void> => {
  const alertRef = ref(database, `alerts/${alertId}`);
  const snapshot = await get(alertRef);
  
  if (snapshot.exists()) {
    const alert = snapshot.val() as Alert;
    alert.sent = true;
    await set(alertRef, alert);
  }
};

// Récupérer les alertes non envoyées
export const getUnsentAlerts = async (): Promise<Alert[]> => {
  try {
    const alertsRef = ref(database, 'alerts');
    const snapshot = await get(alertsRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const alerts = Object.values(snapshot.val()) as Alert[];
    return alerts.filter(alert => !alert.sent);
  } catch (error) {
    console.error('Erreur lors de la récupération des alertes non envoyées:', error);
    return [];
  }
};











