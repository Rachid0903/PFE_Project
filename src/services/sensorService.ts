
import { database } from './firebaseConfig';
import { ref, get, set } from 'firebase/database';

// This function could be used to add mock data for testing
export const addMockSensorData = async (
  id: string,
  temperature: number,
  humidity: number,
  pressure: number,
  rssi: number
): Promise<void> => {
  const mockData = {
    temperature,
    humidity,
    pressure,
    rssi,
    uptime: Math.floor(Math.random() * 86400), // Random uptime up to 24 hours
    timestamp: Math.floor(Date.now() / 1000) // Current timestamp in seconds
  };

  await set(ref(database, `devices/${id}`), mockData);
};

// For testing: generate random mock data
export const generateMockData = async (): Promise<void> => {
  // Mock data for two sensors with IDs matching your Arduino code
  await addMockSensorData(
    "01",
    20 + Math.random() * 10, // Temperature between 20-30
    40 + Math.random() * 40, // Humidity between 40-80
    1010 + Math.random() * 20, // Pressure between 1010-1030
    -60 - Math.random() * 40 // RSSI between -60 and -100
  );
  
  await addMockSensorData(
    "02",
    20 + Math.random() * 10, 
    40 + Math.random() * 40,
    1010 + Math.random() * 20,
    -60 - Math.random() * 40
  );
};
