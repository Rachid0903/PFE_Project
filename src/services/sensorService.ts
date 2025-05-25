
import { database } from './firebaseConfig';
import { ref, get, set, update } from 'firebase/database';

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
  
  // Pour le capteur 2, utilisons la date actuelle
  await addMockSensorData(
    "02",
    20 + Math.random() * 10, 
    40 + Math.random() * 40,
    1010 + Math.random() * 20,
    -60 - Math.random() * 40
  );
};

// Fonction pour mettre à jour tous les capteurs avec des timestamps corrects
export const updateAllSensorsTimestamps = async (): Promise<void> => {
  try {
    // Récupérer tous les capteurs
    const sensorsRef = ref(database, 'devices');
    const snapshot = await get(sensorsRef);
    
    if (snapshot.exists()) {
      const updates: Record<string, any> = {};
      
      snapshot.forEach((childSnapshot) => {
        const id = childSnapshot.key;
        const data = childSnapshot.val();
        
        if (id && id !== "0") {
          // Mettre à jour uniquement le timestamp
          updates[`devices/${id}/timestamp`] = Math.floor(Date.now() / 1000);
        }
      });
      
      // Appliquer toutes les mises à jour en une seule opération
      if (Object.keys(updates).length > 0) {
        const dbRef = ref(database);
        await update(dbRef, updates);
        console.log("Tous les timestamps des capteurs ont été mis à jour");
      }
    }
  } catch (error) {
    console.error("Erreur lors de la mise à jour des timestamps:", error);
  }
};
