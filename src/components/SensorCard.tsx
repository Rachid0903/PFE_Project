
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Thermometer, Droplet, Gauge, Rss, Clock } from "lucide-react";

export interface SensorData {
  id: string;
  temperature: number;
  humidity: number;
  pressure: number;
  rssi: number;
  uptime: number;
  timestamp: number;
}

interface SensorCardProps {
  sensor: SensorData;
}

const SensorCard: React.FC<SensorCardProps> = ({ sensor }) => {
  const formatLastUpdated = (timestamp: number): string => {
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(timestamp * 1000));
  };

  const getStatusColor = (rssi: number): string => {
    if (rssi > -70) return 'bg-green-500';
    if (rssi > -90) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  const getStatusText = (rssi: number): string => {
    if (rssi > -70) return 'Excellent';
    if (rssi > -90) return 'Moyen';
    return 'Faible';
  };

  // Format uptime in hours, minutes, seconds
  const formatUptime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  };

  // Ensure numeric values by parsing them
  const temperature = typeof sensor.temperature === 'number' ? sensor.temperature : parseFloat(sensor.temperature);
  const humidity = typeof sensor.humidity === 'number' ? sensor.humidity : parseFloat(sensor.humidity);
  const pressure = typeof sensor.pressure === 'number' ? sensor.pressure : parseFloat(sensor.pressure);
  
  return (
    <Card className="overflow-hidden border-t-4 border-t-lora hover:shadow-lg transition-all duration-300">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">Capteur {sensor.id}</CardTitle>
          <div className="flex items-center gap-2">
            <div
              className={`h-2.5 w-2.5 rounded-full ${getStatusColor(
                sensor.rssi
              )} animate-pulse-slow`}
            ></div>
            <span className="text-xs text-muted-foreground">
              {getStatusText(sensor.rssi)}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-3 gap-4 mt-2">
          <div className="flex flex-col items-center p-2 rounded-md bg-sensor-temp bg-opacity-10">
            <Thermometer className="h-5 w-5 text-sensor-temp mb-1" />
            <span className="text-lg font-medium">{!isNaN(temperature) ? temperature.toFixed(1) : "N/A"}°C</span>
            <span className="text-xs text-muted-foreground">Température</span>
          </div>

          <div className="flex flex-col items-center p-2 rounded-md bg-sensor-humidity bg-opacity-10">
            <Droplet className="h-5 w-5 text-sensor-humidity mb-1" />
            <span className="text-lg font-medium">{!isNaN(humidity) ? humidity.toFixed(1) : "N/A"}%</span>
            <span className="text-xs text-muted-foreground">Humidité</span>
          </div>

          <div className="flex flex-col items-center p-2 rounded-md bg-blue-500 bg-opacity-10">
            <Gauge className="h-5 w-5 text-blue-500 mb-1" />
            <span className="text-lg font-medium">{!isNaN(pressure) ? pressure.toFixed(1) : "N/A"}</span>
            <span className="text-xs text-muted-foreground">Pression</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="flex flex-col items-center p-2 rounded-md bg-sensor-rssi bg-opacity-10">
            <Rss className="h-5 w-5 text-sensor-rssi mb-1" />
            <span className="text-lg font-medium">{sensor.rssi} dBm</span>
            <span className="text-xs text-muted-foreground">Signal</span>
          </div>

          <div className="flex flex-col items-center p-2 rounded-md bg-gray-500 bg-opacity-10">
            <Clock className="h-5 w-5 text-gray-500 mb-1" />
            <span className="text-lg font-medium">{formatUptime(sensor.uptime)}</span>
            <span className="text-xs text-muted-foreground">Uptime</span>
          </div>
        </div>

        <div className="mt-4 text-xs text-right text-muted-foreground">
          Mis à jour: {formatLastUpdated(sensor.timestamp)}
        </div>
      </CardContent>
    </Card>
  );
};

export default SensorCard;
