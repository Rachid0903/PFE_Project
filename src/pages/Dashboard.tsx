import React, { useEffect, useState } from "react";
import { database } from "@/services/firebaseConfig";
import { ref, onValue, off } from "firebase/database";
import SensorCard from "@/components/SensorCard";
import { Button } from "@/components/ui/button";
import { RefreshCw, LayoutDashboard, Thermometer, Droplet, Gauge, Signal, LogOut } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import type { SensorData } from "@/components/SensorCard";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const Dashboard: React.FC = () => {
  const [sensors, setSensors] = useState<SensorData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [stats, setStats] = useState({
    avgTemp: 0,
    avgHumidity: 0,
    avgPressure: 0,
    onlineSensors: 0
  });
  
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  // Calculer les statistiques
  const calculateStats = (sensors: SensorData[]) => {
    if (sensors.length === 0) return;
    
    // Ensure we only calculate stats with valid numeric values
    const validSensors = sensors.filter(sensor => 
      !isNaN(Number(sensor.temperature)) && 
      !isNaN(Number(sensor.humidity)) && 
      !isNaN(Number(sensor.pressure))
    );
    
    if (validSensors.length === 0) return;
    
    const tempSum = validSensors.reduce((sum, sensor) => sum + Number(sensor.temperature), 0);
    const humiditySum = validSensors.reduce((sum, sensor) => sum + Number(sensor.humidity), 0);
    const pressureSum = validSensors.reduce((sum, sensor) => sum + Number(sensor.pressure), 0);
    const onlineSensors = sensors.filter(sensor => sensor.rssi > -90).length;
    
    setStats({
      avgTemp: parseFloat((tempSum / validSensors.length).toFixed(1)),
      avgHumidity: parseFloat((humiditySum / validSensors.length).toFixed(1)),
      avgPressure: parseFloat((pressureSum / validSensors.length).toFixed(1)),
      onlineSensors: onlineSensors
    });
  };

  // Chargement des données depuis Firebase
  useEffect(() => {
    const devicesRef = ref(database, 'devices');
    
    const handleData = (snapshot: any) => {
      const data = snapshot.val();
      if (data) {
        const sensorsArray = Object.entries(data)
          .filter(([id]) => id !== "0") // Filter out the sensor with ID "0"
          .map(([id, values]: [string, any]) => {
            // Ensure all numeric values are properly converted
            const sensorData: SensorData = {
              id,
              temperature: Number(values.temperature),
              humidity: Number(values.humidity),
              pressure: Number(values.pressure),
              rssi: Number(values.rssi),
              uptime: Number(values.uptime),
              timestamp: Number(values.timestamp)
            };
            return sensorData;
          });
        
        setSensors(sensorsArray);
        calculateStats(sensorsArray);
        setLastRefreshed(new Date());
        setIsLoading(false);
      } else {
        setSensors([]);
        setIsLoading(false);
      }
    };

    onValue(devicesRef, handleData, (error) => {
      console.error("Error fetching sensor data:", error);
      setIsLoading(false);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les données des capteurs",
        variant: "destructive",
      });
    });
    
    // Cleanup on unmount
    return () => {
      off(devicesRef);
    };
  }, []);

  // Fonction pour rafraîchir les données manuellement
  const handleRefresh = () => {
    setIsLoading(true);
    // Firebase automatically updates when data changes
    // This just updates the last refreshed time and shows a toast
    setLastRefreshed(new Date());
    
    toast({
      title: "Données actualisées",
      description: "Les données des capteurs ont été mises à jour avec succès",
    });
    
    setIsLoading(false);
  };

  // Format de date pour afficher le moment du dernier rafraîchissement
  const formatLastRefreshed = (date: Date): string => {
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec la barre de navigation */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-lora flex items-center gap-2">
                <LayoutDashboard className="h-6 w-6" />
                Système de Surveillance IoT
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {user && (
                <p className="text-sm text-gray-600">
                  {user.email}
                </p>
              )}
              <Button variant="outline" onClick={handleRefresh} size="sm">
                Actualiser
              </Button>
              <Button variant="outline" onClick={handleLogout} size="sm" className="flex items-center gap-1">
                <LogOut className="h-4 w-4" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Tableau de bord</h2>
            <p className="text-sm text-gray-500">
              Dernière actualisation : {formatLastRefreshed(lastRefreshed)}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 self-end md:self-auto"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            {isLoading ? "Actualisation..." : "Actualiser"}
          </Button>
        </div>

        {/* Cartes de statistiques */}
        {sensors.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium text-gray-500">Température moyenne</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Thermometer className="h-5 w-5 text-sensor-temp mr-2" />
                  <span className="text-3xl font-bold text-sensor-temp">{stats.avgTemp}°C</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium text-gray-500">Humidité moyenne</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Droplet className="h-5 w-5 text-sensor-humidity mr-2" />
                  <span className="text-3xl font-bold text-sensor-humidity">{stats.avgHumidity}%</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium text-gray-500">Pression moyenne</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Gauge className="h-5 w-5 text-blue-500 mr-2" />
                  <span className="text-3xl font-bold text-blue-500">{stats.avgPressure} hPa</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium text-gray-500">Capteurs en ligne</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Signal className="h-5 w-5 text-lora mr-2" />
                  <span className="text-3xl font-bold text-lora">
                    {stats.onlineSensors}/{sensors.length}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Grille des capteurs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sensors.length === 0 && !isLoading ? (
            <div className="col-span-full py-12 text-center">
              <p className="text-gray-500 mb-4">Aucun capteur disponible pour le moment</p>
              <Button variant="outline" onClick={handleRefresh}>
                Actualiser
              </Button>
            </div>
          ) : (
            sensors.map((sensor) => (
              <SensorCard key={sensor.id} sensor={sensor} />
            ))
          )}
          
          {/* État de chargement */}
          {isLoading && sensors.length === 0 && (
            <div className="col-span-full py-12 text-center">
              <RefreshCw className="h-8 w-8 text-lora animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Chargement des capteurs...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
