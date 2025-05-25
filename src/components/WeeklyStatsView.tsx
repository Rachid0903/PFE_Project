import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { WeeklyStats, getWeeklyStats } from "@/services/statsService";
import { Thermometer, Droplet, Gauge, Calendar, RefreshCw } from "lucide-react";
import WeeklyStatsChart from "./WeeklyStatsChart";

const WeeklyStatsView: React.FC = () => {
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSensor, setSelectedSensor] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Fonction pour formater les dates
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  };

  // Charger les statistiques hebdomadaires
  const loadStats = async () => {
    try {
      setIsLoading(true);
      const weeklyStats = await getWeeklyStats();
      
      // S'assurer que weeklyStats.sensors existe
      if (!weeklyStats.sensors) {
        weeklyStats.sensors = {};
      }
      
      setStats(weeklyStats);
      
      // Sélectionner le premier capteur par défaut
      if (weeklyStats && weeklyStats.sensors && Object.keys(weeklyStats.sensors).length > 0) {
        setSelectedSensor(Object.keys(weeklyStats.sensors)[0]);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des statistiques:", error);
      setError(error instanceof Error ? error : new Error("Erreur inconnue"));
      toast({
        title: "Erreur",
        description: "Impossible de charger les statistiques hebdomadaires",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleRefresh = () => {
    loadStats();
    toast({
      title: "Actualisation",
      description: "Les statistiques sont en cours d'actualisation",
    });
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
      <div className="p-6 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-medium mb-2">Erreur</h3>
        <p className="text-gray-500 mb-4">
          Une erreur s'est produite lors du chargement des statistiques: {error.message}
        </p>
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Réessayer
        </Button>
      </div>
    );
  }

  // Vérifier si des données sont disponibles
  if (!stats || !stats.sensors || Object.keys(stats.sensors).length === 0) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-medium mb-2">Aucune donnée disponible</h3>
        <p className="text-gray-500 mb-4">
          Aucune donnée statistique n'est disponible pour le moment.
        </p>
        <Button 
          variant="outline" 
          onClick={handleRefresh}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Statistiques hebdomadaires</h2>
          <p className="text-sm text-muted-foreground">
            Semaine du {formatDate(stats.startDate)} au {formatDate(stats.endDate)}
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </Button>
      </div>

      <Tabs defaultValue={selectedSensor || ""} onValueChange={setSelectedSensor}>
        <TabsList className="mb-4">
          {Object.keys(stats.sensors).map((sensorId) => (
            <TabsTrigger key={sensorId} value={sensorId}>
              Capteur {sensorId}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(stats.sensors).map(([sensorId, sensorData]) => (
          <TabsContent key={sensorId} value={sensorId} className="space-y-6">
            {/* Carte avec les données du capteur */}
            <Card>
              <CardHeader>
                <CardTitle>Données du capteur {sensorId}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h3 className="text-base font-medium text-gray-500 mb-2">Température moyenne</h3>
                    <div className="flex items-center">
                      <Thermometer className="h-5 w-5 text-sensor-temp mr-2" />
                      <span className="text-3xl font-bold text-sensor-temp">
                        {sensorData.avgTemperature ? sensorData.avgTemperature.toFixed(1) : "N/A"}°C
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-medium text-gray-500 mb-2">Humidité moyenne</h3>
                    <div className="flex items-center">
                      <Droplet className="h-5 w-5 text-sensor-humidity mr-2" />
                      <span className="text-3xl font-bold text-sensor-humidity">
                        {sensorData.avgHumidity ? sensorData.avgHumidity.toFixed(0) : "N/A"}%
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-medium text-gray-500 mb-2">Disponibilité</h3>
                    <div className="flex items-center">
                      <Gauge className="h-5 w-5 text-sensor-pressure mr-2" />
                      <span className="text-3xl font-bold text-sensor-pressure">
                        {sensorData.uptime ? (sensorData.uptime * 100).toFixed(0) : "N/A"}%
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Graphique des statistiques directement sous les données */}
                <div className="mt-6">
                  <h3 className="text-base font-medium text-gray-500 mb-4">Évolution sur 7 jours</h3>
                  <WeeklyStatsChart sensorId={sensorId} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default WeeklyStatsView;





