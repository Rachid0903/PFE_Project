import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { database } from '@/services/firebaseConfig';
import { ref, onValue } from 'firebase/database';
import { Sensor } from '@/types/sensor';

interface MapWidgetProps {
  title: string;
}

interface SensorLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: 'online' | 'offline' | 'warning';
  lastReading?: {
    temperature: number;
    humidity: number;
  };
}

const MapWidget: React.FC<MapWidgetProps> = ({ title }) => {
  const [sensors, setSensors] = useState<SensorLocation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sensorsRef = ref(database, 'sensors');
    
    const unsubscribe = onValue(sensorsRef, (snapshot) => {
      if (snapshot.exists()) {
        const sensorsData = snapshot.val();
        const sensorsWithLocation: SensorLocation[] = [];
        
        // Pour la démonstration, nous allons créer des emplacements fictifs
        // Dans une application réelle, ces données viendraient de la base de données
        Object.keys(sensorsData).forEach((key, index) => {
          const sensor = sensorsData[key] as Sensor;
          
          // Générer des coordonnées fictives autour de Paris
          const baseLatitude = 48.8566;
          const baseLongitude = 2.3522;
          const latOffset = (Math.random() - 0.5) * 0.1;
          const lngOffset = (Math.random() - 0.5) * 0.1;
          
          // Déterminer le statut en fonction du RSSI
          let status: 'online' | 'offline' | 'warning' = 'online';
          if (sensor.rssi < -90) {
            status = 'offline';
          } else if (sensor.rssi < -70) {
            status = 'warning';
          }
          
          sensorsWithLocation.push({
            id: key,
            name: `Capteur ${index + 1}`,
            lat: baseLatitude + latOffset,
            lng: baseLongitude + lngOffset,
            status,
            lastReading: {
              temperature: sensor.temperature,
              humidity: sensor.humidity
            }
          });
        });
        
        setSensors(sensorsWithLocation);
      }
      
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-[300px]">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="relative h-[300px] bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden">
            {/* Ici, vous intégreriez une vraie carte avec Leaflet, Google Maps ou MapBox */}
            <div className="absolute inset-0 p-4">
              <div className="text-center text-sm text-muted-foreground mb-4">
                Carte interactive des capteurs (simulation)
              </div>
              
              {/* Simulation de carte avec des points représentant les capteurs */}
              <div className="relative w-full h-full border border-border rounded-md bg-[url('/map-background.png')] bg-cover">
                {sensors.map((sensor) => (
                  <div 
                    key={sensor.id}
                    className="absolute w-4 h-4 rounded-full transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                    style={{
                      left: `${(sensor.lng - 2.3) / 0.2 * 100}%`,
                      top: `${(48.9 - sensor.lat) / 0.2 * 100}%`,
                      backgroundColor: 
                        sensor.status === 'online' ? 'rgb(34, 197, 94)' : 
                        sensor.status === 'warning' ? 'rgb(234, 179, 8)' : 
                        'rgb(239, 68, 68)',
                      boxShadow: `0 0 0 2px white, 0 0 0 4px ${
                        sensor.status === 'online' ? 'rgba(34, 197, 94, 0.5)' : 
                        sensor.status === 'warning' ? 'rgba(234, 179, 8, 0.5)' : 
                        'rgba(239, 68, 68, 0.5)'
                      }`
                    }}
                    title={`${sensor.name}: ${sensor.lastReading?.temperature}°C, ${sensor.lastReading?.humidity}%`}
                  />
                ))}
              </div>
              
              <div className="absolute bottom-2 right-2 bg-background/80 backdrop-blur-sm p-2 rounded-md text-xs">
                <div className="flex items-center space-x-2 mb-1">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>En ligne</span>
                </div>
                <div className="flex items-center space-x-2 mb-1">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span>Signal faible</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span>Hors ligne</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MapWidget;