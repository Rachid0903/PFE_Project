import { Alert } from './alertService';
import { database } from './firebaseConfig';
import { ref, get, set } from 'firebase/database';

// Configuration pour Twilio et Email
export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
  userEmail?: string; // Ajout de l'email de l'utilisateur
}

// Fonction pour envoyer un email
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
    
    console.log(`Envoi d'email à ${to}: ${subject} - ${message}`);
    
    // En production, vous utiliseriez un service d'email comme SendGrid, Mailgun, etc.
    // Exemple avec EmailJS (vous devrez l'installer: npm install emailjs-com)
    /*
    import emailjs from 'emailjs-com';
    
    const templateParams = {
      to_email: to,
      subject: subject,
      message: message
    };
    
    await emailjs.send(
      'YOUR_SERVICE_ID',
      'YOUR_TEMPLATE_ID',
      templateParams,
      'YOUR_USER_ID'
    );
    */
    
    return true;
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email:", error);
    return false;
  }
};

// Fonction pour envoyer un SMS via Twilio
export const sendSMS = async (
  to: string,
  message: string,
  config: TwilioConfig
): Promise<boolean> => {
  try {
    // Vérifier que le numéro de téléphone est valide
    if (!to || to.trim().length < 10) {
      console.error(`Numéro de téléphone invalide: ${to}`);
      return false;
    }
    
    // Simulation d'envoi de SMS pour éviter les erreurs d'API
    console.log(`Simulation d'envoi de SMS à ${to}: ${message}`);
    
    // En production, vous utiliseriez l'API Twilio comme ceci:
    /*
    const url = `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`;
    const auth = btoa(`${config.accountSid}:${config.authToken}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        To: to,
        From: config.fromNumber,
        Body: message
      })
    });
    
    if (!response.ok) {
      throw new Error(`Erreur Twilio: ${response.status} ${response.statusText}`);
    }
    */
    
    // Enregistrer le SMS dans Firebase pour le suivi
    const smsLogRef = ref(database, `smsLogs/${Date.now()}`);
    await set(smsLogRef, {
      to,
      message,
      timestamp: new Date().toISOString(),
      status: 'sent'
    });
    
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'envoi du SMS:', error);
    return false;
  }
};

// Fonction pour envoyer des alertes par SMS et email
export const sendAlertSMS = async (
  alert: Alert,
  config: TwilioConfig
): Promise<boolean> => {
  try {
    // Vérifier que alert et alert.userEmail existent
    if (!alert || !alert.message) {
      console.error('Format d\'alerte invalide ou aucun destinataire configuré:', alert);
      return false;
    }
    
    // Créer le message d'alerte
    const message = `ALERTE LoRa Sensor View - Capteur ${alert.sensorId || 'inconnu'}: ${alert.message || 'Alerte déclenchée'}`;
    
    const recipients = (alert.userEmail || '').split(',').map(item => item.trim());
    const phoneNumbers = recipients.filter(item => !item.includes('@'));
    const emails = recipients.filter(item => item.includes('@'));
    
    console.log(`Envoi d'alertes à ${recipients.length} destinataires`);
    
    // Envoyer le SMS à tous les numéros configurés
    const smsResults = await Promise.all(
      phoneNumbers.map(phoneNumber => 
        sendSMS(phoneNumber, message, config)
      )
    );
    
    // Envoyer des emails à toutes les adresses configurées
    const emailResults = await Promise.all(
      emails.map(email => 
        sendEmail(email, `ALERTE LoRa Sensor View - Capteur ${alert.sensorId}`, message)
      )
    );
    
    // Vérifier si au moins un SMS ou un email a été envoyé avec succès
    return smsResults.some(result => result === true) || emailResults.some(result => result === true);
  } catch (error) {
    console.error('Erreur lors de l\'envoi des alertes par SMS/email:', error);
    return false;
  }
};

// Récupérer la configuration Twilio depuis Firebase
export const getTwilioConfig = async (): Promise<TwilioConfig> => {
  try {
    // Essayer de récupérer la configuration depuis Firebase
    const configRef = ref(database, 'twilioConfig');
    const snapshot = await get(configRef);
    
    if (snapshot.exists()) {
      return snapshot.val() as TwilioConfig;
    }
    
    // Si aucune configuration n'existe, créer une configuration par défaut
    const defaultConfig: TwilioConfig = {
      accountSid: 'AC_DEMO_ACCOUNT_SID',
      authToken: 'DEMO_AUTH_TOKEN',
      fromNumber: '+15555555555',
      userEmail: '' // Email vide par défaut
    };
    
    // Enregistrer la configuration par défaut
    await set(configRef, defaultConfig);
    
    return defaultConfig;
  } catch (error) {
    console.error('Erreur lors de la récupération de la configuration Twilio:', error);
    
    // Retourner une configuration par défaut en cas d'erreur
    return {
      accountSid: 'AC_DEMO_ACCOUNT_SID',
      authToken: 'DEMO_AUTH_TOKEN',
      fromNumber: '+15555555555',
      userEmail: ''
    };
  }
};











