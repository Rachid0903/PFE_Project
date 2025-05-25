
export interface SensorData {
  id: string;
  name: string;
  location: string;
  temperature: number;
  humidity: number;
  rssi: number;
  lastUpdated: Date;
  status: 'online' | 'offline' | 'warning';
}

// Fonction pour générer des données simulées de capteur
export const generateSensorData = (id: string, name: string, location: string): SensorData => {
  return {
    id,
    name,
    location,
    temperature: parseFloat((Math.random() * (30 - 18) + 18).toFixed(1)),
    humidity: parseFloat((Math.random() * (85 - 30) + 30).toFixed(1)),
    rssi: Math.floor(Math.random() * (-60 - (-95)) + (-95)),
    lastUpdated: new Date(),
    status: Math.random() > 0.1 ? 'online' : (Math.random() > 0.5 ? 'warning' : 'offline'),
  };
};

// Données simulées de capteurs pour l'utilisateur
export const mockSensors: SensorData[] = [
  generateSensorData('sensor1', 'Capteur Salon', 'Salon'),
  generateSensorData('sensor2', 'Capteur Chambre', 'Chambre'),
  generateSensorData('sensor3', 'Capteur Cuisine', 'Cuisine'),
  generateSensorData('sensor4', 'Capteur Jardin', 'Extérieur'),
];

// Fonction pour rafraîchir les données des capteurs
export const refreshSensorData = (sensors: SensorData[]): SensorData[] => {
  return sensors.map(sensor => ({
    ...sensor,
    temperature: parseFloat((Math.random() * (30 - 18) + 18).toFixed(1)),
    humidity: parseFloat((Math.random() * (85 - 30) + 30).toFixed(1)),
    rssi: Math.floor(Math.random() * (-60 - (-95)) + (-95)),
    lastUpdated: new Date(),
    status: Math.random() > 0.1 ? 'online' : (Math.random() > 0.5 ? 'warning' : 'offline'),
  }));
};
