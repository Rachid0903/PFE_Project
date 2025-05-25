import { database } from './firebaseConfig';
import { ref, set, get } from 'firebase/database';
import { Alert } from './alertService'; // Importez uniquement le type Alert, pas la fonction

// Configuration pour WhatsApp
export interface WhatsAppConfig {
  apiKey: string;
  apiUrl: string;
  fromNumber: string;
  enabled: boolean;
}

// Valeurs par défaut
const DEFAULT_WHATSAPP_CONFIG: WhatsAppConfig = {
  apiKey: process.env.REACT_APP_WHATSAPP_API_KEY || '',
  apiUrl: process.env.REACT_APP_WHATSAPP_API_URL || '',
  fromNumber: process.env.REACT_APP_WHATSAPP_FROM_NUMBER || '',
  enabled: false
};

// Récupérer la configuration WhatsApp depuis Firebase
export const getWhatsAppConfig = async (): Promise<WhatsAppConfig> => {
  try {
    const configRef = ref(database, 'config/whatsapp');
    const snapshot = await get(configRef);
    
    if (snapshot.exists()) {
      return snapshot.val() as WhatsAppConfig;
    }
    
    // Si aucune configuration n'existe, créer une configuration par défaut
    await set(configRef, DEFAULT_WHATSAPP_CONFIG);
    return DEFAULT_WHATSAPP_CONFIG;
  } catch (error) {
    console.error('Erreur lors de la récupération de la configuration WhatsApp:', error);
    return DEFAULT_WHATSAPP_CONFIG;
  }
};

// Mettre à jour la configuration WhatsApp
export const updateWhatsAppConfig = async (config: Partial<WhatsAppConfig>): Promise<void> => {
  try {
    const currentConfig = await getWhatsAppConfig();
    const updatedConfig = { ...currentConfig, ...config };
    
    const configRef = ref(database, 'config/whatsapp');
    await set(configRef, updatedConfig);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la configuration WhatsApp:', error);
    throw error;
  }
};

// Fonction pour envoyer un message WhatsApp
export const sendWhatsApp = async (
  to: string,
  message: string
): Promise<boolean> => {
  try {
    // Vérifier que le numéro est valide
    if (!to || to.trim().length < 10) {
      console.error(`Numéro WhatsApp invalide: ${to}`);
      return false;
    }
    
    const config = await getWhatsAppConfig();
    
    // Si WhatsApp n'est pas configuré ou désactivé, simuler l'envoi
    if (!config.enabled || !config.apiKey || !config.apiUrl) {
      console.log(`[SIMULATION] Envoi WhatsApp à ${to}: ${message}`);
    } else {
      // Envoyer un vrai message WhatsApp via l'API
      // Exemple avec l'API WhatsApp Business
      try {
        const response = await fetch(config.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: to,
            type: "text",
            text: {
              body: message
            }
          })
        });
        
        if (!response.ok) {
          throw new Error(`Erreur API WhatsApp: ${response.status} ${response.statusText}`);
        }
        
        console.log(`Message WhatsApp envoyé avec succès à ${to}`);
      } catch (apiError) {
        console.error('Erreur lors de l\'appel à l\'API WhatsApp:', apiError);
        // Continuer pour enregistrer la tentative dans Firebase
      }
    }
    
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
    if (!alert) {
      console.error('Format d\'alerte invalide:', alert);
      return false;
    }
    
    // Si aucun numéro WhatsApp n'est spécifié dans l'alerte, récupérer la configuration globale
    let whatsappNumber = alert.whatsappNumber;
    if (!whatsappNumber) {
      // Import dynamique pour éviter les dépendances circulaires
      const { getAlertConfig } = await import('./alertService');
      const alertConfig = await getAlertConfig();
      whatsappNumber = alertConfig.whatsappNumber;
    }
    
    if (!whatsappNumber) {
      console.error('Aucun numéro WhatsApp configuré pour cette alerte');
      return false;
    }
    
    // Créer le message d'alerte
    const message = `🚨 ALERTE LoRa Sensor View - Capteur ${alert.sensorId || 'inconnu'}: ${alert.message || 'Alerte déclenchée'} (Valeur: ${alert.value}, Seuil: ${alert.threshold})`;
    
    console.log(`Envoi d'alerte WhatsApp à ${whatsappNumber}: ${message}`);
    
    // Envoyer le message WhatsApp
    return await sendWhatsApp(whatsappNumber, message);
  } catch (error) {
    console.error('Erreur lors de l\'envoi des alertes par WhatsApp:', error);
    return false;
  }
};


