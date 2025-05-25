import { database } from './firebaseConfig';
import { ref, set } from 'firebase/database';
import { Alert } from './alertService';

// Configuration pour WhatsApp (à adapter selon votre service)
const WHATSAPP_CONFIG = {
  apiKey: process.env.REACT_APP_WHATSAPP_API_KEY || '',
  apiUrl: process.env.REACT_APP_WHATSAPP_API_URL || '',
  fromNumber: process.env.REACT_APP_WHATSAPP_FROM_NUMBER || ''
};

// Fonction pour envoyer un message WhatsApp
export const sendWhatsApp = async (
  to: string,
  message: string
): Promise<boolean> => {
  try {
    console.log(`[SIMULATION] Envoi WhatsApp à ${to}: ${message}`);
    
    // Enregistrer le message dans Firebase pour le suivi
    const whatsappLogRef = ref(database, `whatsappLogs/${Date.now()}`);
    await set(whatsappLogRef, {
      to,
      message,
      timestamp: new Date().toISOString(),
      status: 'sent'
    });
    
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message WhatsApp:', error);
    return false;
  }
};

// Fonction pour envoyer des alertes par WhatsApp
export const sendAlertWhatsApp = async (
  alert: Alert & { whatsappNumber?: string }
): Promise<boolean> => {
  try {
    if (!alert || !alert.whatsappNumber) {
      console.error('Format d\'alerte invalide ou aucun numéro WhatsApp configuré:', alert);
      return false;
    }
    
    // Créer le message d'alerte
    const message = `ALERTE LoRa Sensor View - Capteur ${alert.sensorId || 'inconnu'}: ${alert.message || 'Alerte déclenchée'}`;
    
    console.log(`Envoi d'alerte WhatsApp à ${alert.whatsappNumber}: ${message}`);
    
    // Envoyer le message WhatsApp
    return await sendWhatsApp(alert.whatsappNumber, message);
  } catch (error) {
    console.error('Erreur lors de l\'envoi des alertes par WhatsApp:', error);
    return false;
  }
};