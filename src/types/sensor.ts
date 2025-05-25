export interface Sensor {
  id: string;
  temperature: number;
  humidity: number;
  rssi: number;
  battery?: number;
  uptime?: number;
  timestamp?: number;
  lastSeen?: string;
}