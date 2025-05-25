import { database } from './firebaseConfig';
import { ref, get, query, orderByChild, equalTo, update } from 'firebase/database';
import { Alert, getAlertConfig } from './alertService';
import { sendAlertSMS, getTwilioConfig } from './smsService';
import { sendEmail } from './emailService';
import { sendAlertWhatsApp } from './whatsappService';

// Traiter les alertes en attente
export const processAlerts = async (): Promise<void> => {
  try {
    // Récupérer la configuration en une seule fois
    const [twilioConfig, alertConfig] = await Promise.all([
      getTwilioConfig(),
      getAlertConfig()
    ]);
    
    if (!alertConfig.enabled) {
      console.log('Les alertes sont désactivées');
      return;
    }
    
    // Utiliser une requête plus efficace
    const alertsRef = ref(database, 'alerts');
    const alertsQuery = query(alertsRef, orderByChild('sent'), equalTo(false));
    const snapshot = await get(alertsQuery);
    
    if (!snapshot.exists()) return;
    
    // Traiter les alertes en parallèle pour plus d'efficacité
    const alertPromises = [];
    snapshot.forEach((childSnapshot) => {
      const alertId = childSnapshot.key;
      const alertObj = childSnapshot.val();
      alertPromises.push(processAlert(alertId, alertObj, twilioConfig, alertConfig));
    });
    
    await Promise.all(alertPromises);
  } catch (error) {
    console.error('Erreur lors du traitement des alertes:', error);
  }
};

// Fonction auxiliaire pour traiter une alerte individuelle
async function processAlert(alertId, alertObj, twilioConfig, alertConfig) {
  try {
    let success = false;
    
    // Vérifier si l'alerte doit être envoyée par email
    if (alertConfig.userEmail) {
      const emailSuccess = await sendEmail(alertConfig.userEmail, 
        `ALERTE LoRa Sensor View - Capteur ${alertObj.sensorId}`, 
        alertObj.message || `Alerte déclenchée pour le capteur ${alertObj.sensorId}`);
      success = success || emailSuccess;
    }
    
    // Vérifier si l'alerte doit être envoyée par SMS
    if (alertObj.userEmail && !alertObj.userEmail.includes('@')) {
      const smsSuccess = await sendAlertSMS(alertObj, twilioConfig);
      success = success || smsSuccess;
    }
    
    // Vérifier si l'alerte doit être envoyée par WhatsApp
    if (alertConfig.whatsappNumber) {
      const whatsappSuccess = await sendAlertWhatsApp({
        ...alertObj,
        whatsappNumber: alertConfig.whatsappNumber
      });
      success = success || whatsappSuccess;
    }
    
    if (success) {
      await update(ref(database, `alerts/${alertId}`), { sent: true });
      console.log(`Alerte ${alertId} envoyée avec succès`);
    }
  } catch (error) {
    console.error(`Erreur lors du traitement de l'alerte ${alertId}:`, error);
  }
}

// Fonction pour démarrer le traitement périodique des alertes
export const startAlertProcessor = (intervalMs: number = 60000): () => void => {
  console.log(`Démarrage du processeur d'alertes (intervalle: ${intervalMs}ms)`);
  
  // Traiter les alertes immédiatement au démarrage
  processAlerts();
  
  // Configurer l'intervalle pour le traitement périodique
  const intervalId = setInterval(processAlerts, intervalMs);
  
  // Retourner une fonction pour arrêter le traitement
  return () => {
    console.log('Arrêt du processeur d\'alertes');
    clearInterval(intervalId);
  };
};






