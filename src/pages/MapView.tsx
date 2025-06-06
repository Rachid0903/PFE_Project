import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import DateTimeDisplay from "@/components/DateTimeDisplay";
import { database } from "@/services/firebaseConfig";
import { ref, get } from "firebase/database";
import { Thermometer, Droplet, Signal } from "lucide-react";

interface SensorData {
  id: string;
  name?: string;
  location?: {
    x: number;
    y: number;
    zone: string;
  };
  temperature: number;
  humidity: number;
  rssi: number;
  timestamp: number;
}

const MapView: React.FC = () => {
  const [sensors, setSensors] = useState<SensorData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<'temperature' | 'humidity' | 'rssi'>('temperature');
  const [mapImage, setMapImage] = useState<string>('/farm-map.png'); // Chemin vers l'image du plan agricole

  // Charger les données des capteurs
  useEffect(() => {
    const fetchSensors = async () => {
      try {
        setIsLoading(true);
        const sensorsRef = ref(database, 'devices');
        const snapshot = await get(sensorsRef);
        
        if (snapshot.exists()) {
          const sensorsData: SensorData[] = [];
          
          // Définir des zones réalistes avec des coordonnées cohérentes
          const zones = [
            { name: 'Champ de blé', x: 30, y: 40, radius: 10 },
            { name: 'Verger', x: 70, y: 30, radius: 8 },
            { name: 'Vignoble', x: 25, y: 70, radius: 12 },
            { name: 'Serre', x: 65, y: 65, radius: 10 },
            { name: 'Potager', x: 75, y: 75, radius: 6 }
          ];
          
          snapshot.forEach((childSnapshot) => {
            const id = childSnapshot.key;
            const data = childSnapshot.val();
            if (id) {
              // Attribuer une zone à chaque capteur
              const zoneIndex = parseInt(id) % zones.length;
              const zone = zones[zoneIndex];
              
              // Positionner le capteur dans sa zone avec un léger décalage aléatoire
              // pour éviter que tous les capteurs d'une même zone soient au même endroit
              const offsetX = (Math.random() - 0.5) * zone.radius;
              const offsetY = (Math.random() - 0.5) * zone.radius;
              
              sensorsData.push({
                id,
                name: `Capteur ${id}`,
                location: {
                  x: Math.max(5, Math.min(95, zone.x + offsetX)), // Limiter entre 5% et 95%
                  y: Math.max(5, Math.min(95, zone.y + offsetY)), // Limiter entre 5% et 95%
                  zone: zone.name
                },
                ...data
              });
            }
          });
          
          setSensors(sensorsData);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des capteurs:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les données des capteurs",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSensors();
    
    // Rafraîchir les données toutes les 30 secondes
    const interval = setInterval(fetchSensors, 30000);
    return () => clearInterval(interval);
  }, []);

  // Obtenir la couleur en fonction de la valeur et du type de métrique
  const getColor = (value: number, type: 'temperature' | 'humidity' | 'rssi') => {
    if (type === 'temperature') {
      if (value < 18) return '#3b82f6'; // Bleu (froid)
      if (value < 22) return '#10b981'; // Vert (confortable)
      if (value < 26) return '#f59e0b'; // Orange (chaud)
      return '#ef4444'; // Rouge (très chaud)
    } else if (type === 'humidity') {
      if (value < 30) return '#ef4444'; // Rouge (très sec)
      if (value < 40) return '#f59e0b'; // Orange (sec)
      if (value < 60) return '#10b981'; // Vert (confortable)
      if (value < 70) return '#3b82f6'; // Bleu (humide)
      return '#8b5cf6'; // Violet (très humide)
    } else { // rssi
      if (value > -60) return '#10b981'; // Vert (excellent)
      if (value > -70) return '#f59e0b'; // Orange (bon)
      if (value > -80) return '#ef4444'; // Rouge (faible)
      return '#6b7280'; // Gris (très faible)
    }
  };

  // Obtenir la taille du cercle en fonction de la valeur et du type de métrique
  const getSize = (value: number, type: 'temperature' | 'humidity' | 'rssi') => {
    const baseSize = 40;
    
    if (type === 'temperature') {
      return baseSize + (value - 15) * 2; // Plus grand pour les températures élevées
    } else if (type === 'humidity') {
      return baseSize + (value - 40) * 0.2; // Plus grand pour l'humidité élevée
    } else { // rssi
      return baseSize + (value + 100) * 0.4; // Plus grand pour un meilleur signal
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h1 className="text-2xl font-bold mb-2 sm:mb-0">Carte des capteurs</h1>
          <DateTimeDisplay />
        </div>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Visualisation spatiale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center space-x-4 mb-4">
              <button
                className={`px-4 py-2 rounded-md flex items-center ${selectedMetric === 'temperature' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                onClick={() => setSelectedMetric('temperature')}
              >
                <Thermometer className="mr-2 h-4 w-4" />
                Température
              </button>
              <button
                className={`px-4 py-2 rounded-md flex items-center ${selectedMetric === 'humidity' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                onClick={() => setSelectedMetric('humidity')}
              >
                <Droplet className="mr-2 h-4 w-4" />
                Humidité
              </button>
              <button
                className={`px-4 py-2 rounded-md flex items-center ${selectedMetric === 'rssi' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                onClick={() => setSelectedMetric('rssi')}
              >
                <Signal className="mr-2 h-4 w-4" />
                Signal
              </button>
            </div>
            
            <div className="flex justify-center mb-4 text-xs text-muted-foreground">
              <div className="flex items-center mr-4">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
                <span>{selectedMetric === 'temperature' ? 'Optimal (18-22°C)' : 
                       selectedMetric === 'humidity' ? 'Optimal (40-60%)' : 
                       'Signal fort (>-70dBm)'}</span>
              </div>
              <div className="flex items-center mr-4">
                <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
                <span>{selectedMetric === 'temperature' ? 'Frais (<18°C)' : 
                       selectedMetric === 'humidity' ? 'Humide (>60%)' : 
                       'Signal moyen (-70 à -80dBm)'}</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
                <span>{selectedMetric === 'temperature' ? 'Chaud (>22°C)' : 
                       selectedMetric === 'humidity' ? 'Sec (<40%)' : 
                       'Signal faible (<-80dBm)'}</span>
              </div>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center items-center h-[600px]">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="relative w-full h-[600px] border border-border rounded-lg overflow-hidden">
                <img 
                  src={mapImage} 
                  alt="Plan des terres agricoles" 
                  className="w-full h-full object-cover opacity-50"
                  onError={() => {
                    // Fallback si l'image n'existe pas
                    setMapImage('/placeholder-farm-map.png');
                  }}
                />
                
                {/* Afficher les zones */}
                <div className="absolute inset-0">
                  {['Champ de blé', 'Verger', 'Vignoble', 'Serre', 'Potager'].map((zoneName) => {
                    const zonePositions = {
                      'Champ de blé': { x: 30, y: 40, width: 25, height: 20 },
                      'Verger': { x: 70, y: 30, width: 20, height: 15 },
                      'Vignoble': { x: 25, y: 70, width: 22, height: 18 },
                      'Serre': { x: 65, y: 65, width: 20, height: 16 },
                      'Potager': { x: 75, y: 75, width: 15, height: 12 }
                    };
                    const zone = zonePositions[zoneName as keyof typeof zonePositions];
                    
                    return (
                      <div 
                        key={zoneName}
                        className="absolute border border-dashed border-gray-400 rounded-md flex items-center justify-center text-xs text-gray-500"
                        style={{
                          left: `${zone.x - zone.width/2}%`,
                          top: `${zone.y - zone.height/2}%`,
                          width: `${zone.width}%`,
                          height: `${zone.height}%`,
                          backgroundColor: 'rgba(200, 200, 200, 0.1)'
                        }}
                      >
                        {zoneName}
                      </div>
                    );
                  })}
                </div>
                
                {sensors.map((sensor) => (
                  <div
                    key={sensor.id}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                    style={{
                      left: `${sensor.location?.x || 50}%`,
                      top: `${sensor.location?.y || 50}%`,
                    }}
                  >
                    <div
                      className="rounded-full flex items-center justify-center text-white font-bold text-xs transition-all duration-300 cursor-pointer hover:z-10"
                      style={{
                        backgroundColor: getColor(
                          selectedMetric === 'temperature' ? sensor.temperature :
                          selectedMetric === 'humidity' ? sensor.humidity :
                          sensor.rssi,
                          selectedMetric
                        ),
                        width: `${getSize(
                          selectedMetric === 'temperature' ? sensor.temperature :
                          selectedMetric === 'humidity' ? sensor.humidity :
                          sensor.rssi,
                          selectedMetric
                        )}px`,
                        height: `${getSize(
                          selectedMetric === 'temperature' ? sensor.temperature :
                          selectedMetric === 'humidity' ? sensor.humidity :
                          sensor.rssi,
                          selectedMetric
                        )}px`,
                        opacity: 0.8,
                      }}
                    >
                      {selectedMetric === 'temperature' && `${sensor.temperature.toFixed(1)}°C`}
                      {selectedMetric === 'humidity' && `${sensor.humidity.toFixed(0)}%`}
                      {selectedMetric === 'rssi' && `${sensor.rssi} dBm`}
                    </div>
                    <div className="mt-2 px-2 py-1 bg-background/80 rounded text-xs font-medium shadow">
                      {sensor.name}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sensors.map((sensor) => (
            <Card key={sensor.id} className="overflow-hidden">
              <CardHeader className="p-4">
                <CardTitle className="text-base">{sensor.name}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col items-center p-2 bg-muted/30 rounded-md">
                    <Thermometer className="h-5 w-5 mb-1 text-orange-500" />
                    <span className="text-sm font-medium">{sensor.temperature.toFixed(1)}°C</span>
                    <span className="text-xs text-muted-foreground">Température</span>
                  </div>
                  <div className="flex flex-col items-center p-2 bg-muted/30 rounded-md">
                    <Droplet className="h-5 w-5 mb-1 text-blue-500" />
                    <span className="text-sm font-medium">{sensor.humidity.toFixed(0)}%</span>
                    <span className="text-xs text-muted-foreground">Humidité</span>
                  </div>
                  <div className="flex flex-col items-center p-2 bg-muted/30 rounded-md">
                    <Signal className="h-5 w-5 mb-1 text-green-500" />
                    <span className="text-sm font-medium">{sensor.rssi} dBm</span>
                    <span className="text-xs text-muted-foreground">Signal</span>
                  </div>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Zone: {sensor.location?.zone || "Non définie"}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MapView;












