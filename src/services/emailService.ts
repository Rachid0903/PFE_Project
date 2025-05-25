import { database } from './firebaseConfig';
import { ref, set, push } from 'firebase/database';
import { Alert } from './alertService';

// Configuration pour un service d'email réel (à compléter avec vos informations)
const EMAIL_API_CONFIG = {
  apiKey: process.env.REACT_APP_EMAIL_API_KEY || '',
  apiUrl: process.env.REACT_APP_EMAIL_API_URL || '',
  fromEmail: process.env.REACT_APP_FROM_EMAIL || 'noreply@lorasensorview.com',
  fromName: 'LoRa Sensor View'
};

// Fonction pour envoyer un email (version réelle)
export const sendEmail = async (
  to: string,
  subject: string,
  message: string
): Promise<boolean> => {
  try {
    if (!to || !to.includes('@')) {
      console.error(`Adresse email invalide: ${to}`);
      return false;
    }
    
    // Enregistrer la tentative d'envoi
    const emailLogRef = push(ref(database, 'emailLogs'));
    const emailId = emailLogRef.key;
    
    // Créer l'entrée de log avec statut "pending"
    await set(emailLogRef, {
      id: emailId,
      to,
      subject,
      message,
      timestamp: new Date().toISOString(),
      status: 'pending'
    });
    
    // En environnement de développement, simuler l'envoi
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV] Simulation d'envoi d'email à ${to}: ${subject}`);
      
      // Mettre à jour le statut
      await set(emailLogRef, {
        id: emailId,
        to,
        subject,
        message,
        timestamp: new Date().toISOString(),
        status: 'sent'
      });
      
      return true;
    }
    
    // En production, utiliser un service d'email réel
    // Exemple avec fetch et une API d'email générique
    if (EMAIL_API_CONFIG.apiKey && EMAIL_API_CONFIG.apiUrl) {
      const response = await fetch(EMAIL_API_CONFIG.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${EMAIL_API_CONFIG.apiKey}`
        },
        body: JSON.stringify({
          from: {
            email: EMAIL_API_CONFIG.fromEmail,
            name: EMAIL_API_CONFIG.fromName
          },
          to: [{ email: to }],
          subject,
          content: [{ type: 'text/html', value: message }]
        })
      });
      
      const result = await response.json();
      const success = response.ok;
      
      // Mettre à jour le statut
      await set(emailLogRef, {
        id: emailId,
        to,
        subject,
        message,
        timestamp: new Date().toISOString(),
        status: success ? 'sent' : 'failed',
        response: JSON.stringify(result)
      });
      
      return success;
    } else {
      console.error('Configuration d\'email manquante');
      
      // Mettre à jour le statut
      await set(emailLogRef, {
        id: emailId,
        to,
        subject,
        message,
        timestamp: new Date().toISOString(),
        status: 'failed',
        error: 'Configuration d\'email manquante'
      });
      
      return false;
    }
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    return false;
  }
};

// Fonction pour envoyer des alertes par email
export const sendAlertEmail = async (
  alert: Alert
): Promise<boolean> => {
  try {
    // Vérifier que alert et alert.userEmail existent
    if (!alert || !alert.userEmail) {
      console.error('Format d\'alerte invalide ou aucune adresse email configurée:', alert);
      return false;
    }
    
    // Créer le message d'alerte
    const subject = `ALERTE LoRa Sensor View - Capteur ${alert.sensorId}`;
    const message = `ALERTE LoRa Sensor View - Capteur ${alert.sensorId || 'inconnu'}: ${alert.message || 'Alerte déclenchée'}`;
    
    console.log(`Envoi d'alerte email à ${alert.userEmail}: ${message}`);
    
    // Envoyer l'email
    return await sendEmail(alert.userEmail, subject, message);
  } catch (error) {
    console.error('Erreur lors de l\'envoi des alertes par email:', error);
    return false;
  }
};



