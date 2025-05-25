import { database } from "./firebaseConfig";
import { ref, get, set, push, query, orderByChild, startAt, endAt } from "firebase/database";

// Types pour les statistiques
export interface SensorStats {
  avgTemperature: number;
  avgHumidity: number;
  minTemperature: number;
  maxTemperature: number;
  minHumidity: number;
  maxHumidity: number;
  uptime: number;
  readingsCount: number;
}

export interface WeeklyStats {
  startDate: string;
  endDate: string;
  sensors: {
    [sensorId: string]: SensorStats;
  };
}

// Fonction pour enregistrer l'historique des capteurs
export const saveSensorHistory = async (sensor: any): Promise<void> => {
  try {
    const historyRef = ref(database, `sensorHistory/${sensor.id}`);
    const newEntryRef = push(historyRef);
    
    await set(newEntryRef, {
      timestamp: new Date().toISOString(),
      temperature: sensor.temperature,
      humidity: sensor.humidity,
      rssi: sensor.rssi
    });
    
    console.log(`Historique enregistré pour le capteur ${sensor.id}`);
  } catch (error) {
    console.error("Erreur lors de l'enregistrement de l'historique:", error);
    throw error;
  }
};

// Optimiser la fonction de calcul des statistiques hebdomadaires
export const calculateWeeklyStats = async (): Promise<void> => {
  try {
    // Utiliser une seule transaction pour réduire les opérations de base de données
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 7);
    
    const startDateStr = startDate.toISOString();
    const endDateStr = now.toISOString();
    
    // Créer l'objet de statistiques
    const weeklyStats: WeeklyStats = {
      startDate: startDateStr,
      endDate: endDateStr,
      sensors: {}
    };
    
    // Récupérer tous les capteurs en une seule requête
    const sensorsRef = ref(database, 'devices');
    const sensorsSnapshot = await get(sensorsRef);
    
    if (!sensorsSnapshot.exists()) {
      console.log("Aucun capteur trouvé");
      return;
    }
    
    // Préparer toutes les requêtes d'historique en parallèle
    const historyPromises = [];
    const sensors = sensorsSnapshot.val();
    
    for (const sensorId of Object.keys(sensors)) {
      if (sensorId === "0") continue;
      
      const historyRef = ref(database, `sensorHistory/${sensorId}`);
      const historyQuery = query(
        historyRef,
        orderByChild('timestamp'),
        startAt(startDateStr),
        endAt(endDateStr)
      );
      
      historyPromises.push(
        get(historyQuery).then(snapshot => ({ sensorId, snapshot }))
      );
    }
    
    // Exécuter toutes les requêtes en parallèle
    const historyResults = await Promise.all(historyPromises);
    
    // Traiter les résultats
    for (const { sensorId, snapshot } of historyResults) {
      if (!snapshot.exists()) continue;
      
      const history = snapshot.val();
      const readings = Object.values(history) as any[];
      
      if (readings.length === 0) continue;
      
      // Calculer les statistiques
      const temperatures = readings.map(r => r.temperature);
      const humidities = readings.map(r => r.humidity);
      
      weeklyStats.sensors[sensorId] = {
        avgTemperature: temperatures.reduce((sum, val) => sum + val, 0) / temperatures.length,
        avgHumidity: humidities.reduce((sum, val) => sum + val, 0) / humidities.length,
        minTemperature: Math.min(...temperatures),
        maxTemperature: Math.max(...temperatures),
        minHumidity: Math.min(...humidities),
        maxHumidity: Math.max(...humidities),
        uptime: Math.min(readings.length / (7 * 24 * 60 / 5), 1),
        readingsCount: readings.length
      };
    }
    
    // Enregistrer les statistiques en une seule opération
    const weeklyStatsRef = ref(database, 'weeklyStats');
    await set(weeklyStatsRef, weeklyStats);
    
  } catch (error) {
    console.error("Erreur lors du calcul des statistiques hebdomadaires:", error);
    throw error;
  }
};

// Fonction pour nettoyer les anciennes données d'historique
export const cleanupSensorHistory = async (): Promise<void> => {
  try {
    // Garder seulement les données des 30 derniers jours
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    const cutoffDateStr = cutoffDate.toISOString();
    
    // Récupérer tous les capteurs
    const sensorsRef = ref(database, 'devices');
    const sensorsSnapshot = await get(sensorsRef);
    
    if (!sensorsSnapshot.exists()) {
      return;
    }
    
    const sensors = sensorsSnapshot.val();
    
    // Pour chaque capteur, supprimer les anciennes données
    for (const sensorId of Object.keys(sensors)) {
      if (sensorId === "0") continue; // Ignorer le capteur avec ID "0"
      
      const historyRef = ref(database, `sensorHistory/${sensorId}`);
      const historyQuery = query(
        historyRef,
        orderByChild('timestamp'),
        endAt(cutoffDateStr)
      );
      
      const historySnapshot = await get(historyQuery);
      
      if (!historySnapshot.exists()) {
        continue;
      }
      
      const oldData = historySnapshot.val();
      
      // Supprimer chaque entrée ancienne
      for (const entryId of Object.keys(oldData)) {
        const entryRef = ref(database, `sensorHistory/${sensorId}/${entryId}`);
        await set(entryRef, null);
      }
    }
    
    console.log("Nettoyage des anciennes données terminé");
  } catch (error) {
    console.error("Erreur lors du nettoyage des anciennes données:", error);
    throw error;
  }
};

// Fonction pour récupérer les statistiques hebdomadaires
export const getWeeklyStats = async (): Promise<WeeklyStats> => {
  try {
    const weeklyStatsRef = ref(database, 'weeklyStats');
    const snapshot = await get(weeklyStatsRef);
    
    if (snapshot.exists()) {
      return snapshot.val() as WeeklyStats;
    } else {
      // Retourner des statistiques vides si aucune n'est disponible
      return {
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
        sensors: {}
      };
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques hebdomadaires:", error);
    throw error;
  }
};

// Fonction pour générer des données de test pour les statistiques
export const generateTestWeeklyStats = async (): Promise<void> => {
  try {
    console.log("Génération de données de test pour les statistiques...");
    
    // Calculer les dates de début et de fin de la semaine
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - 7);
    
    const startDateStr = startDate.toISOString();
    const endDateStr = now.toISOString();
    
    // Créer des statistiques de test
    const weeklyStats: WeeklyStats = {
      startDate: startDateStr,
      endDate: endDateStr,
      sensors: {
        "1": {
          avgTemperature: 22.5,
          avgHumidity: 45,
          minTemperature: 19.2,
          maxTemperature: 25.8,
          minHumidity: 35,
          maxHumidity: 60,
          uptime: 0.95,
          readingsCount: 1200
        },
        "2": {
          avgTemperature: 21.3,
          avgHumidity: 48,
          minTemperature: 18.5,
          maxTemperature: 24.2,
          minHumidity: 38,
          maxHumidity: 65,
          uptime: 0.92,
          readingsCount: 1150
        }
      }
    };
    
    // Enregistrer les statistiques hebdomadaires
    const weeklyStatsRef = ref(database, 'weeklyStats');
    await set(weeklyStatsRef, weeklyStats);
    
    // Générer des données d'historique pour les graphiques
    for (const sensorId of Object.keys(weeklyStats.sensors)) {
      const historyRef = ref(database, `sensorHistory/${sensorId}`);
      
      // Générer des données pour les 7 derniers jours
      for (let i = 0; i < 7; i++) {
        const day = new Date(now);
        day.setDate(day.getDate() - i);
        
        // Générer plusieurs points par jour
        for (let hour = 0; hour < 24; hour += 2) {
          const timestamp = new Date(day);
          timestamp.setHours(hour);
          
          const temperature = 20 + Math.random() * 5; // Entre 20 et 25
          const humidity = 40 + Math.random() * 20; // Entre 40 et 60
          
          const newEntryRef = push(historyRef);
          await set(newEntryRef, {
            timestamp: timestamp.toISOString(),
            temperature: parseFloat(temperature.toFixed(1)),
            humidity: parseFloat(humidity.toFixed(1)),
            rssi: -70 - Math.floor(Math.random() * 20) // Entre -70 et -90
          });
        }
      }
    }
    
    console.log("Données de test générées avec succès");
  } catch (error) {
    console.error("Erreur lors de la génération des données de test:", error);
    throw error;
  }
};






