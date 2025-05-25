import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { database } from "@/services/firebaseConfig";
import { ref, get } from "firebase/database";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Thermometer, Droplet, Gauge } from "lucide-react";
import DateTimeDisplay from "@/components/DateTimeDisplay";

interface SensorData {
  id: string;
  name: string;
  temperature: number;
  humidity: number;
  pressure: number;
  rssi: number;
  timestamp: number;
}

const Comparison: React.FC = () => {
  const [sensors, setSensors] = useState<SensorData[]>([]);
  const [selectedSensors, setSelectedSensors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("24h");
  const [comparisonData, setComparisonData] = useState<any[]>([]);

  // Charger les données des capteurs
  useEffect(() => {
    const fetchSensors = async () => {
      try {
        setIsLoading(true);
        const sensorsRef = ref(database, 'devices');
        const snapshot = await get(sensorsRef);
        
        if (snapshot.exists()) {
          const sensorsData: SensorData[] = [];
          snapshot.forEach((childSnapshot) => {
            const id = childSnapshot.key;
            const data = childSnapshot.val();
            if (id) {
              sensorsData.push({
                id,
                name: `Capteur ${id}`,
                temperature: Number(data.temperature) || 0,
                humidity: Number(data.humidity) || 0,
                pressure: Number(data.pressure) || 0,
                rssi: Number(data.rssi) || 0,
                timestamp: Number(data.timestamp) || Date.now() / 1000
              });
            }
          });
          
          setSensors(sensorsData);
          
          // Sélectionner les deux premiers capteurs par défaut s'ils existent
          if (sensorsData.length >= 2) {
            setSelectedSensors([sensorsData[0].id, sensorsData[1].id]);
          } else if (sensorsData.length === 1) {
            setSelectedSensors([sensorsData[0].id]);
          }
          
          // Générer des données de comparaison
          generateComparisonData(sensorsData, timeRange);
        }
      } catch (error) {
        console.error("Erreur lors du chargement des capteurs:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSensors();
    
    // Rafraîchir les données toutes les 30 secondes
    const interval = setInterval(fetchSensors, 30000);
    return () => clearInterval(interval);
  }, []);

  // Générer des données de comparaison pour les graphiques
  const generateComparisonData = (sensorsData: SensorData[], range: string) => {
    // Pour une démo, générons des données historiques simulées
    const data = [];
    const now = Date.now();
    let timeStep: number;
    let dataPoints: number;
    
    switch (range) {
      case "24h":
        timeStep = 60 * 60 * 1000; // 1 heure
        dataPoints = 24;
        break;
      case "7d":
        timeStep = 24 * 60 * 60 * 1000; // 1 jour
        dataPoints = 7;
        break;
      case "30d":
        timeStep = 24 * 60 * 60 * 1000; // 1 jour
        dataPoints = 30;
        break;
      default:
        timeStep = 60 * 60 * 1000;
        dataPoints = 24;
    }
    
    for (let i = dataPoints - 1; i >= 0; i--) {
      const timestamp = now - (i * timeStep);
      const entry: any = {
        time: new Date(timestamp).toLocaleString('fr-FR', {
          hour: '2-digit',
          minute: '2-digit',
          day: '2-digit',
          month: '2-digit',
          year: range !== "24h" ? '2-digit' : undefined
        })
      };
      
      // Ajouter des données pour chaque capteur
      sensorsData.forEach(sensor => {
        // Simuler des variations basées sur les valeurs actuelles
        const randomFactor = 0.8 + (Math.random() * 0.4); // 0.8 - 1.2
        entry[`temp_${sensor.id}`] = parseFloat((sensor.temperature * randomFactor).toFixed(1));
        entry[`hum_${sensor.id}`] = parseFloat((sensor.humidity * randomFactor).toFixed(1));
        entry[`press_${sensor.id}`] = parseFloat((sensor.pressure * randomFactor).toFixed(1));
      });
      
      data.push(entry);
    }
    
    setComparisonData(data);
  };

  // Mettre à jour les données de comparaison lorsque la plage de temps change
  useEffect(() => {
    if (sensors.length > 0) {
      generateComparisonData(sensors, timeRange);
    }
  }, [timeRange, sensors]);

  // Formater la date pour l'affichage
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-3xl font-bold mb-2 md:mb-0">Comparaison des capteurs</h1>
        <div className="flex items-center space-x-4">
          <DateTimeDisplay />
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Sélection des capteurs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-1/3">
                <label className="text-sm font-medium mb-2 block">Capteurs à comparer</label>
                <Select
                  value={selectedSensors.join(',')}
                  onValueChange={(value) => setSelectedSensors(value.split(','))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner des capteurs" />
                  </SelectTrigger>
                  <SelectContent>
                    {sensors.map((sensor) => (
                      <SelectItem key={sensor.id} value={sensor.id}>
                        {sensor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-full md:w-1/3">
                <label className="text-sm font-medium mb-2 block">Période</label>
                <Select
                  value={timeRange}
                  onValueChange={setTimeRange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une période" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="24h">Dernières 24 heures</SelectItem>
                    <SelectItem value="7d">7 derniers jours</SelectItem>
                    <SelectItem value="30d">30 derniers jours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="temperature">
        <TabsList className="mb-4">
          <TabsTrigger value="temperature" className="flex items-center">
            <Thermometer className="h-4 w-4 mr-2" />
            Température
          </TabsTrigger>
          <TabsTrigger value="humidity" className="flex items-center">
            <Droplet className="h-4 w-4 mr-2" />
            Humidité
          </TabsTrigger>
          <TabsTrigger value="pressure" className="flex items-center">
            <Gauge className="h-4 w-4 mr-2" />
            Pression
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="temperature">
          <Card>
            <CardHeader>
              <CardTitle>Comparaison des températures</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis unit="°C" />
                    <Tooltip />
                    <Legend />
                    {selectedSensors.map((sensorId, index) => {
                      const sensor = sensors.find(s => s.id === sensorId);
                      return (
                        <Line 
                          key={sensorId}
                          type="monotone" 
                          dataKey={`temp_${sensorId}`} 
                          name={sensor ? sensor.name : `Capteur ${sensorId}`}
                          stroke={index === 0 ? "#8884d8" : "#82ca9d"} 
                          activeDot={{ r: 8 }} 
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="humidity">
          <Card>
            <CardHeader>
              <CardTitle>Comparaison de l'humidité</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis unit="%" />
                    <Tooltip />
                    <Legend />
                    {selectedSensors.map((sensorId, index) => {
                      const sensor = sensors.find(s => s.id === sensorId);
                      return (
                        <Line 
                          key={sensorId}
                          type="monotone" 
                          dataKey={`hum_${sensorId}`} 
                          name={sensor ? sensor.name : `Capteur ${sensorId}`}
                          stroke={index === 0 ? "#8884d8" : "#82ca9d"} 
                          activeDot={{ r: 8 }} 
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="pressure">
          <Card>
            <CardHeader>
              <CardTitle>Comparaison de la pression</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis unit="hPa" />
                    <Tooltip />
                    <Legend />
                    {selectedSensors.map((sensorId, index) => {
                      const sensor = sensors.find(s => s.id === sensorId);
                      return (
                        <Line 
                          key={sensorId}
                          type="monotone" 
                          dataKey={`press_${sensorId}`} 
                          name={sensor ? sensor.name : `Capteur ${sensorId}`}
                          stroke={index === 0 ? "#8884d8" : "#82ca9d"} 
                          activeDot={{ r: 8 }} 
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Tableau comparatif</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="text-left p-2">Capteur</th>
                    <th className="text-left p-2">Température</th>
                    <th className="text-left p-2">Humidité</th>
                    <th className="text-left p-2">Pression</th>
                    <th className="text-left p-2">Dernière mise à jour</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSensors.map(sensorId => {
                    const sensor = sensors.find(s => s.id === sensorId);
                    return sensor ? (
                      <tr key={sensor.id}>
                        <td className="p-2">{sensor.name}</td>
                        <td className="p-2">{sensor.temperature.toFixed(1)} °C</td>
                        <td className="p-2">{sensor.humidity.toFixed(1)} %</td>
                        <td className="p-2">{sensor.pressure.toFixed(1)} hPa</td>
                        <td className="p-2">{formatDate(sensor.timestamp)}</td>
                      </tr>
                    ) : null;
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Écarts de mesure</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedSensors.length >= 2 ? (
              <div>
                {(() => {
                  const sensor1 = sensors.find(s => s.id === selectedSensors[0]);
                  const sensor2 = sensors.find(s => s.id === selectedSensors[1]);
                  
                  if (sensor1 && sensor2) {
                    const tempDiff = Math.abs(sensor1.temperature - sensor2.temperature).toFixed(1);
                    const humDiff = Math.abs(sensor1.humidity - sensor2.humidity).toFixed(1);
                    const pressDiff = Math.abs(sensor1.pressure - sensor2.pressure).toFixed(1);
                    
                    return (
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm font-medium">Écart de température</p>
                          <p className="text-2xl font-bold">{tempDiff} °C</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Écart d'humidité</p>
                          <p className="text-2xl font-bold">{humDiff} %</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Écart de pression</p>
                          <p className="text-2xl font-bold">{pressDiff} hPa</p>
                        </div>
                      </div>
                    );
                  }
                  return <p>Sélectionnez deux capteurs pour voir les écarts</p>;
                })()}
              </div>
            ) : (
              <p>Sélectionnez au moins deux capteurs pour comparer les écarts</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Comparison;


