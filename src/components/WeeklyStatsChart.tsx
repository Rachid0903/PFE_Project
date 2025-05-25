import React, { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { database } from "@/services/firebaseConfig";
import { ref, get, query, orderByChild, startAt, endAt, limitToLast } from "firebase/database";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

interface SensorHistoryData {
  timestamp: string;
  temperature: number;
  humidity: number;
  rssi: number;
}

interface ChartData {
  time: string;
  temperature: number;
  humidity: number;
}

const WeeklyStatsChart: React.FC<{ sensorId: string }> = ({ sensorId }) => {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<string>("temperature");
  const [timeRange, setTimeRange] = useState<string>("24h");

  useEffect(() => {
    const fetchSensorHistory = async () => {
      try {
        setIsLoading(true);
        
        // Calculer les dates de début et de fin selon la plage horaire sélectionnée
        const endDate = new Date();
        const startDate = new Date();
        
        if (timeRange === "24h") {
          startDate.setHours(endDate.getHours() - 24);
        } else if (timeRange === "48h") {
          startDate.setHours(endDate.getHours() - 48);
        } else if (timeRange === "7d") {
          startDate.setDate(endDate.getDate() - 7);
        }
        
        const startDateStr = startDate.toISOString();
        const endDateStr = endDate.toISOString();
        
        // Récupérer l'historique du capteur
        const historyRef = ref(database, `sensorHistory/${sensorId}`);
        const historyQuery = query(
          historyRef,
          orderByChild('timestamp'),
          startAt(startDateStr),
          endAt(endDateStr)
        );
        
        const snapshot = await get(historyQuery);
        
        if (!snapshot.exists()) {
          setChartData([]);
          return;
        }
        
        // Convertir les données pour le graphique
        const historyData = Object.values(snapshot.val()) as SensorHistoryData[];
        
        // Trier par timestamp
        historyData.sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        
        // Limiter à 100 points de données pour de meilleures performances
        const sampledData = sampleData(historyData, 100);
        
        // Formater les données pour le graphique
        const formattedData = sampledData.map(item => ({
          time: formatTimestamp(item.timestamp, timeRange),
          temperature: item.temperature,
          humidity: item.humidity
        }));
        
        setChartData(formattedData);
      } catch (error) {
        console.error("Erreur lors de la récupération de l'historique:", error);
        setError(error instanceof Error ? error : new Error("Erreur inconnue"));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSensorHistory();
  }, [sensorId, timeRange]);
  
  // Fonction pour échantillonner les données (limiter le nombre de points)
  const sampleData = (data: SensorHistoryData[], maxPoints: number): SensorHistoryData[] => {
    if (data.length <= maxPoints) return data;
    
    const result: SensorHistoryData[] = [];
    const step = Math.floor(data.length / maxPoints);
    
    for (let i = 0; i < data.length; i += step) {
      result.push(data[i]);
      if (result.length >= maxPoints) break;
    }
    
    // Toujours inclure le dernier point
    if (result[result.length - 1] !== data[data.length - 1]) {
      result.push(data[data.length - 1]);
    }
    
    return result;
  };
  
  // Formater le timestamp pour l'affichage selon la plage horaire
  const formatTimestamp = (timestamp: string, range: string): string => {
    const date = new Date(timestamp);
    
    if (range === "24h" || range === "48h") {
      return new Intl.DateTimeFormat('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } else {
      return new Intl.DateTimeFormat('fr-FR', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-lora"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-500 rounded-md">
        Erreur lors du chargement des données: {error.message}
      </div>
    );
  }
  
  if (chartData.length === 0) {
    return (
      <div className="p-4 bg-gray-50 text-gray-500 rounded-md">
        Aucune donnée disponible pour ce capteur sur la période sélectionnée.
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <Tabs defaultValue="temperature" onValueChange={setSelectedMetric}>
          <TabsList>
            <TabsTrigger value="temperature">Température</TabsTrigger>
            <TabsTrigger value="humidity">Humidité</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <Tabs defaultValue="24h" onValueChange={setTimeRange}>
          <TabsList>
            <TabsTrigger value="24h">24h</TabsTrigger>
            <TabsTrigger value="48h">48h</TabsTrigger>
            <TabsTrigger value="7d">7 jours</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              domain={selectedMetric === 'temperature' ? ['auto', 'auto'] : [0, 100]}
              unit={selectedMetric === 'temperature' ? "°C" : "%"}
            />
            <Tooltip 
              formatter={(value: number) => [
                `${value}${selectedMetric === 'temperature' ? '°C' : '%'}`,
                selectedMetric === 'temperature' ? 'Température' : 'Humidité'
              ]}
            />
            <Legend />
            {selectedMetric === 'temperature' ? (
              <Line 
                type="monotone" 
                dataKey="temperature" 
                name="Température" 
                stroke="#ff7d45" 
                activeDot={{ r: 8 }} 
              />
            ) : (
              <Line 
                type="monotone" 
                dataKey="humidity" 
                name="Humidité" 
                stroke="#3b82f6" 
                activeDot={{ r: 8 }} 
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default WeeklyStatsChart;



