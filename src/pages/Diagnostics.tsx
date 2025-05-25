import React, { useState, useEffect, useCallback } from "react";
import { database } from "@/services/firebaseConfig";
import { ref, get, onValue, off } from "firebase/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { RefreshCw, Wifi, WifiOff, AlertTriangle, CheckCircle, Battery, Signal, Activity, Server } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { generateMockData } from "@/services/sensorService";
import { formatDateTime, formatRelativeTime } from "@/lib/dateUtils";
import DateTimeDisplay from "@/components/DateTimeDisplay";

interface SensorDiagnostic {
  id: string;
  name?: string;
  temperature: number;
  humidity: number;
  rssi: number;
  battery?: number;
  lastSeen: string;
  status: "online" | "offline" | "warning";
  uptime?: number;
  firmwareVersion?: string;
}

const Diagnostics: React.FC = () => {
  const [sensors, setSensors] = useState<SensorDiagnostic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [systemStatus, setSystemStatus] = useState({
    sensorsOnline: 0,
    sensorsOffline: 0,
    sensorsWarning: 0,
    avgRssi: 0,
    avgBattery: 0,
    lastUpdate: new Date()
  });
  const [activeTab, setActiveTab] = useState("overview");
  const [networkStats, setNetworkStats] = useState({
    packetLoss: Math.floor(Math.random() * 5), // 0-5%
    latency: Math.floor(Math.random() * 50) + 10, // 10-60ms
    bandwidth: Math.floor(Math.random() * 50) + 50, // 50-100Mbps
    connectionUptime: Math.floor(Math.random() * 30) + 1, // 1-30 jours
  });

  // Fonction pour déterminer le statut d'un capteur
  const determineSensorStatus = (sensor: any): "online" | "offline" | "warning" => {
    const lastSeenDate = new Date(sensor.lastSeen || Date.now());
    const now = new Date();
    const diffMinutes = (now.getTime() - lastSeenDate.getTime()) / (1000 * 60);
    
    if (diffMinutes > 30) {
      return "offline";
    } else if (sensor.rssi < -85 || (sensor.battery && sensor.battery < 20)) {
      return "warning";
    } else {
      return "online";
    }
  };

  // Fonction pour récupérer les diagnostics
  const fetchDiagnostics = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Récupérer les données des capteurs depuis Firebase
      const sensorsRef = ref(database, 'devices');
      const snapshot = await get(sensorsRef);
      
      if (snapshot.exists()) {
        const sensorsData: SensorDiagnostic[] = [];
        let onlineCount = 0;
        let offlineCount = 0;
        let warningCount = 0;
        let rssiSum = 0;
        let batterySum = 0;
        let batteryCount = 0;
        
        // Limiter le nombre de capteurs traités pour éviter les problèmes de performance
        let processedCount = 0;
        const MAX_SENSORS = 20; // Limite raisonnable
        
        snapshot.forEach((childSnapshot) => {
          if (processedCount >= MAX_SENSORS) return; // Limiter le nombre de capteurs
          
          const id = childSnapshot.key;
          const data = childSnapshot.val();
          
          if (id && id !== "0") { // Ignorer le capteur problématique avec ID "0" ou "1"
            try {
              // Générer une date de dernière vue (simulée ou réelle)
              const lastSeen = data.lastSeen || new Date().toISOString();
              
              // Déterminer le statut du capteur
              const status = determineSensorStatus({...data, lastSeen});
              
              // Générer des données de diagnostic supplémentaires pour la démo
              const sensorDiagnostic: SensorDiagnostic = {
                id,
                name: `Capteur ${id}`,
                temperature: Number(data.temperature) || 0,
                humidity: Number(data.humidity) || 0,
                rssi: Number(data.rssi) || -75,
                battery: Number(data.battery) || Math.floor(Math.random() * 60) + 40, // 40-100%
                lastSeen,
                status,
                uptime: Math.floor(Math.random() * 720) + 24, // 24-744 heures (1-31 jours)
                firmwareVersion: `1.${Math.floor(Math.random() * 5)}.${Math.floor(Math.random() * 10)}`
              };
              
              // Mettre à jour les compteurs
              if (status === "online") onlineCount++;
              else if (status === "offline") offlineCount++;
              else if (status === "warning") warningCount++;
              
              rssiSum += sensorDiagnostic.rssi;
              
              if (sensorDiagnostic.battery) {
                batterySum += sensorDiagnostic.battery;
                batteryCount++;
              }
              
              sensorsData.push(sensorDiagnostic);
              processedCount++;
            } catch (err) {
              console.error(`Erreur lors du traitement du capteur ${id}:`, err);
              // Continuer avec le prochain capteur
            }
          }
        });
        
        setSensors(sensorsData);
        
        // Mettre à jour le statut du système
        setSystemStatus({
          sensorsOnline: onlineCount,
          sensorsOffline: offlineCount,
          sensorsWarning: warningCount,
          avgRssi: sensorsData.length > 0 ? rssiSum / sensorsData.length : 0,
          avgBattery: batteryCount > 0 ? batterySum / batteryCount : 0,
          lastUpdate: new Date()
        });
      } else {
        // Si aucune donnée n'existe, générer des données de démonstration
        const demoSensors: SensorDiagnostic[] = [];
        const statuses: ("online" | "offline" | "warning")[] = ["online", "online", "online", "warning", "offline"];
        
        for (let i = 1; i <= 5; i++) {
          const status = statuses[i-1];
          const rssi = status === "online" ? -65 - Math.floor(Math.random() * 10) : 
                      status === "warning" ? -85 - Math.floor(Math.random() * 5) : 
                      -90 - Math.floor(Math.random() * 10);
          
          const battery = status === "online" ? 60 + Math.floor(Math.random() * 40) : 
                         status === "warning" ? 10 + Math.floor(Math.random() * 10) : 
                         5 + Math.floor(Math.random() * 10);
          
          demoSensors.push({
            id: i.toString(),
            name: `Capteur ${i}`,
            temperature: 20 + Math.floor(Math.random() * 10),
            humidity: 40 + Math.floor(Math.random() * 30),
            rssi,
            battery,
            lastSeen: status === "offline" ? 
                     new Date(Date.now() - (60 * 60 * 1000)).toISOString() : 
                     new Date().toISOString(),
            status,
            uptime: Math.floor(Math.random() * 720) + 24,
            firmwareVersion: `1.${Math.floor(Math.random() * 5)}.${Math.floor(Math.random() * 10)}`
          });
        }
        
        setSensors(demoSensors);
        
        // Mettre à jour le statut du système avec les données de démonstration
        setSystemStatus({
          sensorsOnline: demoSensors.filter(s => s.status === "online").length,
          sensorsOffline: demoSensors.filter(s => s.status === "offline").length,
          sensorsWarning: demoSensors.filter(s => s.status === "warning").length,
          avgRssi: demoSensors.reduce((sum, s) => sum + s.rssi, 0) / demoSensors.length,
          avgBattery: demoSensors.reduce((sum, s) => sum + (s.battery || 0), 0) / demoSensors.length,
          lastUpdate: new Date()
        });
      }
      
      // Mettre à jour les statistiques réseau (simulées)
      setNetworkStats({
        packetLoss: Math.floor(Math.random() * 5),
        latency: Math.floor(Math.random() * 50) + 10,
        bandwidth: Math.floor(Math.random() * 50) + 50,
        connectionUptime: Math.floor(Math.random() * 30) + 1,
      });
      
      // Récupérer également les données de l'API backend si disponible
      try {
        // Commentons cette partie qui pourrait causer des problèmes
        // await generateMockData();
        // console.log("Données simulées générées avec succès");
      } catch (error) {
        console.log("Impossible de générer les données simulées:", error);
      }
      
    } catch (error) {
      console.error("Erreur lors du chargement des diagnostics:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les diagnostics des capteurs",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Charger les diagnostics au chargement de la page
  useEffect(() => {
    fetchDiagnostics();
    
    // Configurer une mise à jour en temps réel pour les changements de statut
    // mais avec un délai minimum entre les mises à jour
    const sensorsRef = ref(database, 'devices');
    let lastUpdate = Date.now();
    const MIN_UPDATE_INTERVAL = 5000; // 5 secondes minimum entre les mises à jour
    
    const unsubscribe = onValue(sensorsRef, (snapshot) => {
      const now = Date.now();
      if (now - lastUpdate > MIN_UPDATE_INTERVAL) {
        fetchDiagnostics();
        lastUpdate = now;
      }
    });
    
    return () => {
      // Nettoyer l'écouteur lors du démontage du composant
      unsubscribe();
    };
  }, [fetchDiagnostics]);

  // Fonction pour formater la force du signal RSSI
  const formatRssiStrength = (rssi: number): string => {
    if (rssi > -70) return "Excellente";
    if (rssi > -85) return "Bonne";
    if (rssi > -100) return "Faible";
    return "Très faible";
  };

  // Fonction pour obtenir la couleur en fonction du statut
  const getStatusColor = (status: "online" | "offline" | "warning"): string => {
    switch (status) {
      case "online": return "bg-green-500";
      case "warning": return "bg-yellow-500";
      case "offline": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  // Fonction pour obtenir l'icône en fonction du statut
  const getStatusIcon = (status: "online" | "offline" | "warning") => {
    switch (status) {
      case "online":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "offline":
        return <WifiOff className="h-4 w-4 text-red-500" />;
    }
  };

  // Fonction pour formater la durée d'activité
  const formatUptime = (hours: number): string => {
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days} jour${days > 1 ? 's' : ''}`;
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-2xl font-bold mb-2 md:mb-0">Diagnostics du système</h1>
        <div className="flex items-center space-x-4">
          <DateTimeDisplay />
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              Dernière mise à jour: {formatDateTime(systemStatus.lastUpdate)}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchDiagnostics}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>
        </div>
      </div>

      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="sensors">Capteurs</TabsTrigger>
          <TabsTrigger value="network">Réseau</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">État des capteurs</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-20 w-full" />
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        En ligne
                      </span>
                      <span>{systemStatus.sensorsOnline}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center">
                        <AlertTriangle className="h-4 w-4 text-yellow-500 mr-2" />
                        Avertissement
                      </span>
                      <span>{systemStatus.sensorsWarning}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center">
                        <WifiOff className="h-4 w-4 text-red-500 mr-2" />
                        Hors ligne
                      </span>
                      <span>{systemStatus.sensorsOffline}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Force du signal moyen</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-20 w-full" />
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Signal className="h-5 w-5 text-blue-500" />
                      <span className="text-2xl font-bold">{Math.round(systemStatus.avgRssi)} dBm</span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">
                        Qualité: {formatRssiStrength(systemStatus.avgRssi)}
                      </span>
                      <Progress 
                        value={Math.min(100, Math.max(0, (systemStatus.avgRssi + 100) * 2))} 
                        className="h-2 mt-1"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Niveau de batterie moyen</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-20 w-full" />
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Battery className="h-5 w-5 text-green-500" />
                      <span className="text-2xl font-bold">{Math.round(systemStatus.avgBattery)}%</span>
                    </div>
                    <div>
                      <Progress 
                        value={systemStatus.avgBattery} 
                        className={`h-2 mt-1 ${
                          systemStatus.avgBattery > 60 ? 'bg-green-100' : 
                          systemStatus.avgBattery > 30 ? 'bg-yellow-100' : 'bg-red-100'
                        }`}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="sensors">
          <Card>
            <CardHeader>
              <CardTitle>État détaillé des capteurs</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Nom</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Température</TableHead>
                      <TableHead>Humidité</TableHead>
                      <TableHead>Signal</TableHead>
                      <TableHead>Batterie</TableHead>
                      <TableHead>Firmware</TableHead>
                      <TableHead>Uptime</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sensors.map((sensor) => (
                      <TableRow key={sensor.id}>
                        <TableCell className="font-medium">{sensor.id}</TableCell>
                        <TableCell>{sensor.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {getStatusIcon(sensor.status)}
                            <span className="ml-2">
                              {sensor.status === "online" ? "En ligne" : 
                               sensor.status === "warning" ? "Avertissement" : "Hors ligne"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{sensor.temperature}°C</TableCell>
                        <TableCell>{sensor.humidity}%</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Signal className="h-4 w-4 mr-1" />
                            <span>{sensor.rssi} dBm</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Battery className="h-4 w-4 mr-1" />
                            <span>{sensor.battery}%</span>
                          </div>
                        </TableCell>
                        <TableCell>v{sensor.firmwareVersion}</TableCell>
                        <TableCell>{formatUptime(sensor.uptime || 0)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="network">
          <Card>
            <CardHeader>
              <CardTitle>Diagnostics réseau</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <Signal className="h-5 w-5 text-blue-500" />
                  <span className="text-2xl font-bold">{Math.round(systemStatus.avgRssi)} dBm</span>
                </div>
                <div>
                  <Battery className="h-5 w-5 text-green-500" />
                  <span className="text-2xl font-bold">{Math.round(systemStatus.avgBattery)}%</span>
                </div>
                <div>
                  <Wifi className="h-5 w-5 text-blue-500" />
                  <span className="text-2xl font-bold">{networkStats.connectionUptime} jours</span>
                </div>
                <div>
                  <RefreshCw className="h-5 w-5 text-blue-500" />
                  <span className="text-2xl font-bold">{networkStats.packetLoss}%</span>
                </div>
                <div>
                  <Activity className="h-5 w-5 text-blue-500" />
                  <span className="text-2xl font-bold">{networkStats.latency} ms</span>
                </div>
                <div>
                  <Server className="h-5 w-5 text-blue-500" />
                  <span className="text-2xl font-bold">{networkStats.bandwidth} Mbps</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Diagnostics;














