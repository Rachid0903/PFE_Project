#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <heltec.h>

#define BAND 868E6          // Doit correspondre à l'émetteur
#define LORA_SYNC_WORD 0x12 // Même mot de synchronisation
#define LORA_SF 9           // Mêmes paramètres LoRa
#define LORA_BW 125E3
#define LORA_CR 5
#define LORA_PREAMBLE_LEN 8

// Structure pour stocker les données reçues
struct LoRaPacket {
  uint8_t chipId[5];       // ID de l'émetteur (5 octets)
  uint8_t modbusData[8];   // Modbus RTU frame (8 octets)
  int rssi;                // Force du signal
};

// Calcul CRC Modbus
uint16_t calculateCRC(uint8_t *data, uint8_t len) {
  uint16_t crc = 0xFFFF;
  for (uint8_t pos = 0; pos < len; pos++) {
    crc ^= data[pos];
    for (uint8_t i = 8; i != 0; i--) {
      if (crc & 0x0001) {
        crc >>= 1;
        crc ^= 0xA001;
      } else {
        crc >>= 1;
      }
    }
  }
  return crc;
}

// Forward declaration
void displayReceivedData(const LoRaPacket& packet);

const char* ssid = "VOTRE_SSID";
const char* password = "VOTRE_MOT_DE_PASSE";
const char* serverUrl = "http://localhost:8000/sensor-data/";

void sendToBackend(const LoRaPacket& packet) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    String chipIdStr;
    for (int i = 0; i < 5; i++) {
      char hex[3];
      sprintf(hex, "%02X", packet.chipId[i]);
      chipIdStr += hex;
    }

    uint16_t temperature = (packet.modbusData[3] << 8) | packet.modbusData[4];
    uint16_t humidity = (packet.modbusData[5] << 8) | packet.modbusData[6];

    String payload = String("{\"chip_id\":\"") + chipIdStr + 
                    "\",\"temperature\":" + String(temperature / 10.0, 1) + 
                    ",\"humidity\":" + String(humidity) + 
                    ",\"rssi\":" + String(packet.rssi) + "}";

    int httpResponseCode = http.POST(payload);
    
    if (httpResponseCode > 0) {
      Serial.print("HTTP Response code: ");
      Serial.println(httpResponseCode);
    } else {
      Serial.print("Error code: ");
      Serial.println(httpResponseCode);
    }
    http.end();
  }
}

void setup() {
  // Initialisation de la carte Heltec
  Heltec.begin(
    true,   // Activer l'écran
    true,   // Activer LoRa
    true,   // Activer le Serial intégré
    true,   // PABOOST
    BAND
  );

  // Connexion WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");

  // Configuration LoRa
  LoRa.setSyncWord(LORA_SYNC_WORD);
  LoRa.setSpreadingFactor(LORA_SF);
  LoRa.setSignalBandwidth(LORA_BW);
  LoRa.setCodingRate4(LORA_CR);
  LoRa.setPreambleLength(LORA_PREAMBLE_LEN);
  
  // Mode récepteur
  LoRa.receive();

  // Affichage initial
  Heltec.display->clear();
  Heltec.display->drawString(0, 0, "Recepteur LoRa");
  Heltec.display->drawString(0, 20, "En attente...");
  Heltec.display->display();

  // Debug Serial
  Serial.begin(115200);
  Serial.println("Receiver started!");
}

void loop() {
  static unsigned long lastPacket = millis(); // Track last packet time
  int packetSize = LoRa.parsePacket();
  
  if (packetSize) {
    lastPacket = millis(); // Reset timeout on packet reception
    Serial.printf("Packet received, size: %d\n", packetSize);
    LoRaPacket receivedPacket;
    receivedPacket.rssi = LoRa.packetRssi();

    // Vérifier la taille du paquet (5 + 8 = 13 octets)
    if (LoRa.available() >= 13) {
      // Lire l'ID (5 octets)
      LoRa.readBytes(receivedPacket.chipId, 5);
      
      // Lire le Modbus frame (8 octets)
      LoRa.readBytes(receivedPacket.modbusData, 8);

      // Vérifier CRC
      uint16_t receivedCRC = (receivedPacket.modbusData[7] << 8) | receivedPacket.modbusData[6];
      uint16_t calculatedCRC = calculateCRC(receivedPacket.modbusData, 6);
      if (receivedCRC == calculatedCRC) {
        // Afficher les données
        displayReceivedData(receivedPacket);
        sendToBackend(receivedPacket);  // Ajout de l'envoi au backend
      } else {
        Serial.println("CRC invalide!");
        Serial.printf("Received CRC: %04X, Calculated CRC: %04X\n", receivedCRC, calculatedCRC);
        Serial.printf("Modbus Frame=[");
        for (int i = 0; i < 8; i++) {
          Serial.printf("%02X ", receivedPacket.modbusData[i]);
        }
        Serial.println("]");
      }
    } else {
      Serial.println("Packet too small!");
    }
  }

  // Timeout: No packet received for 10 seconds
  if (millis() - lastPacket > 10000) {
    Serial.println("Timeout: No packet received for 10 seconds!");
    Heltec.display->clear();
    Heltec.display->drawString(0, 0, "Recepteur LoRa");
    Heltec.display->drawString(0, 20, "No packet received!");
    Heltec.display->display();
    lastPacket = millis(); // Reset to avoid spamming
  }
}

void displayReceivedData(const LoRaPacket& packet) {
  char buffer[64];
  
  // Convertir l'ID en hexadécimal
  String chipIdStr;
  for (int i = 0; i < 5; i++) {
    char hex[3];
    sprintf(hex, "%02X", packet.chipId[i]);
    chipIdStr += hex;
  }

  // Extraire les données Modbus
  uint16_t temperature = (packet.modbusData[3] << 8) | packet.modbusData[4]; // Register 0
  uint16_t humidity = (packet.modbusData[5] << 8) | packet.modbusData[6];    // Register 1

  // Mise à jour de l'affichage
  Heltec.display->clear();
  Heltec.display->drawString(0, 0, "ID: " + chipIdStr);
  sprintf(buffer, "Temp: %.1f C", temperature / 10.0);
  Heltec.display->drawString(0, 15, buffer);
  sprintf(buffer, "Hum: %d %%", humidity);
  Heltec.display->drawString(0, 30, buffer);
  sprintf(buffer, "RSSI: %d dBm", packet.rssi);
  Heltec.display->drawString(0, 45, buffer);
  
  Heltec.display->display();

  // Debug Serial
  Serial.println("Received packet:");
  Serial.println("ID: " + chipIdStr);
  Serial.printf("Modbus Frame=[");
  for (int i = 0; i < 8; i++) {
    Serial.printf("%02X ", packet.modbusData[i]);
  }
  Serial.println("]");
  Serial.printf("Temp: %.1f C\n", temperature / 10.0);
  Serial.printf("Hum: %d %%\n", humidity);
  Serial.println("RSSI: " + String(packet.rssi) + " dBm");
}
