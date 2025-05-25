import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Battery, Thermometer, Droplets } from 'lucide-react';
import { generatePrediction, predictFailures, SensorPrediction } from '@/services/predictionService';

interface PredictionWidgetProps {
  title: string;
  sensorId?: string;
}

const PredictionWidget: React.FC<PredictionWidgetProps> = ({ title, sensorId }) => {
  const [prediction, setPrediction] = useState<SensorPrediction | null>(null);
  const [failurePrediction, setFailurePrediction] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('temperature');

  useEffect(() => {
    const fetchPredictions = async () => {
      if (!sensorId) {
        setError('Aucun capteur sélectionné');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Récupérer les prédictions et les risques de panne en parallèle
        const [predictionData, failureData] = await Promise.all([
          generatePrediction(sensorId),
          predictFailures(sensorId)
        ]);
        
        setPrediction(predictionData);
        setFailurePrediction(failureData);
        setError(null);
      } catch (err) {
        console.error('Erreur lors de la récupération des prédictions:', err);
        setError('Impossible de générer les prédictions');
      } finally {
        setLoading(false);
      }
    };

    fetchPredictions();
    
    // Rafraîchir les données toutes les 30 minutes
    const interval = setInterval(fetchPredictions, 30 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [sensorId]);

  // Fonction pour rendre le graphique de prédiction (simplifiée)
  const renderPredictionChart = (type: 'temperature' | 'humidity') => {
    if (!prediction || !prediction.predictions) return null;
    
    const data = type === 'temperature' 
      ? prediction.predictions.temperature 
      : prediction.predictions.humidity;
    
    // Ici, vous pourriez utiliser une bibliothèque comme recharts ou chart.js
    // Pour simplifier, nous affichons juste les valeurs
    return (
      <div className="mt-4 h-40 bg-muted/30 rounded-md p-2 flex items-end justify-between">
        {data.map((value, index) => (
          <div 
            key={index}
            className="w-4 bg-primary animate-pulse-slow"
            style={{ 
              height: `${type === 'temperature' 
                ? Math.min(100, Math.max(10, (value - 10) * 3)) 
                : Math.min(100, value)}%` 
            }}
            title={`${value}${type === 'temperature' ? '°C' : '%'}`}
          />
        ))}
      </div>
    );
  };

  // Fonction pour rendre les recommandations
  const renderRecommendations = () => {
    if (!failurePrediction || !failurePrediction.recommendedActions) return null;
    
    return (
      <div className="mt-4">
        <h4 className="font-medium mb-2">Actions recommandées:</h4>
        <ul className="space-y-1 text-sm">
          {failurePrediction.recommendedActions.map((action: string, index: number) => (
            <li key={index} className="flex items-start">
              <span className="mr-2">•</span>
              <span>{action}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-center text-muted-foreground py-8">{error}</div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="temperature" className="flex items-center">
                <Thermometer className="h-4 w-4 mr-2" />
                <span>Température</span>
              </TabsTrigger>
              <TabsTrigger value="humidity" className="flex items-center">
                <Droplets className="h-4 w-4 mr-2" />
                <span>Humidité</span>
              </TabsTrigger>
              <TabsTrigger value="maintenance" className="flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2" />
                <span>Maintenance</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="temperature">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Prévision sur 24h</span>
                  {prediction?.anomalyRisk && (
                    <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                      Risque d'anomalie: {prediction.anomalyRisk}%
                    </span>
                  )}
                </div>
                {renderPredictionChart('temperature')}
              </div>
            </TabsContent>
            
            <TabsContent value="humidity">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Prévision sur 24h</span>
                </div>
                {renderPredictionChart('humidity')}
              </div>
            </TabsContent>
            
            <TabsContent value="maintenance">
              <div>
                {failurePrediction && (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <Battery className="h-5 w-5 mr-2 text-primary" />
                        <span className="text-sm">Batterie estimée:</span>
                      </div>
                      <span className="font-medium">{prediction?.batteryEstimate?.level || 'N/A'}%</span>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Probabilité de panne:</span>
                          <span className="font-medium">{failurePrediction.failureProbability}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              failurePrediction.failureProbability > 70 
                                ? 'bg-red-500' 
                                : failurePrediction.failureProbability > 30 
                                  ? 'bg-yellow-500' 
                                  : 'bg-green-500'
                            }`}
                            style={{ width: `${failurePrediction.failureProbability}%` }}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-sm">Temps estimé avant panne:</span>
                        <div className="font-medium mt-1">
                          {failurePrediction.estimatedTimeToFailure < 30 
                            ? `${failurePrediction.estimatedTimeToFailure} jours` 
                            : failurePrediction.estimatedTimeToFailure < 365 
                              ? `${Math.round(failurePrediction.estimatedTimeToFailure / 30)} mois` 
                              : '> 1 an'}
                        </div>
                      </div>
                      
                      {renderRecommendations()}
                    </div>
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

export default PredictionWidget;




