import React, { useState, useEffect } from "react";
import { database } from "@/services/firebaseConfig";
import { ref, get, onValue, off } from "firebase/database";
import { toast } from "@/components/ui/sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Alert as AlertComponent } from "@/components/ui/alert";
import { AlertCircle, Bell, CheckCircle } from "lucide-react";
import { Alert, AlertConfig, getAlertConfig, updateAlertConfig } from "@/services/alertService";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateTime } from "@/lib/dateUtils";

const Alerts: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [alertConfig, setAlertConfig] = useState<AlertConfig | null>(null);
  const [activeTab, setActiveTab] = useState("history");

  useEffect(() => {
    // Fetch alert history
    const fetchAlerts = async () => {
      try {
        setIsLoading(true);
        const alertsRef = ref(database, 'alerts');
        
        onValue(alertsRef, (snapshot) => {
          if (snapshot.exists()) {
            const alertsData: Alert[] = [];
            snapshot.forEach((childSnapshot) => {
              const alertId = childSnapshot.key;
              const alert = childSnapshot.val();
              
              if (alertId) {
                alertsData.push({
                  ...alert,
                  id: alertId
                });
              }
            });
            
            // Sort by timestamp (newest first)
            alertsData.sort((a, b) => b.timestamp - a.timestamp);
            setAlerts(alertsData);
          } else {
            setAlerts([]);
          }
          setIsLoading(false);
        });
        
        // Fetch alert configuration
        const config = await getAlertConfig();
        setAlertConfig(config);
        
      } catch (error) {
        console.error("Error fetching alerts:", error);
        toast.error("Impossible de charger les alertes");  // Correction ligne 61
        setIsLoading(false);
      }
    };
    
    fetchAlerts();
    
    return () => {
      // Clean up listeners
      const alertsRef = ref(database, 'alerts');
      off(alertsRef);
    };
  }, []);

  const handleConfigUpdate = async (newConfig: Partial<AlertConfig>) => {
    try {
      if (!alertConfig) return;
      
      const updatedConfig = {
        ...alertConfig,
        ...newConfig
      };
      
      await updateAlertConfig(updatedConfig);
      setAlertConfig(updatedConfig);
      
      toast.success("Les paramètres d'alerte ont été mis à jour avec succès");
    } catch (error) {
      console.error("Error updating alert config:", error);
      toast.error("Impossible de mettre à jour la configuration");  // Correction ligne 95
    }
  };

  const getAlertTypeIcon = (type: string) => {
    switch (type) {
      case 'temperature':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'humidity':
        return <AlertCircle className="h-5 w-5 text-blue-500" />;
      case 'pressure':
        return <AlertCircle className="h-5 w-5 text-purple-500" />;
      default:
        return <Bell className="h-5 w-5" />;
    }
  };

  // Fonction pour formater la date en toute sécurité
  const safeFormatDateTime = (timestamp: number | undefined): string => {
    if (!timestamp) return "Date inconnue";
    try {
      return formatDateTime(timestamp);
    } catch (error) {
      console.error("Erreur de formatage de date:", error);
      return "Date invalide";
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Alertes</h1>
      </div>
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="history">Historique</TabsTrigger>
          <TabsTrigger value="settings">Paramètres</TabsTrigger>
        </TabsList>
        
        <TabsContent value="history">
          <div className="grid gap-4">
            {isLoading ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                  </div>
                </CardContent>
              </Card>
            ) : alerts.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center justify-center p-6 text-center">
                    <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                    <h3 className="text-lg font-medium">Aucune alerte</h3>
                    <p className="text-sm text-muted-foreground">
                      Tous les capteurs fonctionnent dans les paramètres normaux.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              alerts.map((alert) => (
                <AlertComponent key={alert.id} variant="default">
                  <div className="flex items-start gap-4">
                    {getAlertTypeIcon(alert.type)}
                    <div className="flex-1">
                      <div className="font-medium">{alert.message}</div>
                      <div className="text-sm text-muted-foreground">
                        Capteur: {alert.sensorId} • {safeFormatDateTime(alert.timestamp)}
                      </div>
                    </div>
                    <div className="text-xs px-2 py-1 rounded-full bg-muted">
                      {alert.sent ? "Envoyée" : "En attente"}
                    </div>
                  </div>
                </AlertComponent>
              ))
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Configuration des alertes</CardTitle>
            </CardHeader>
            <CardContent>
              {!alertConfig ? (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Activer les alertes</h3>
                      <p className="text-sm text-muted-foreground">
                        Recevoir des notifications lorsque les capteurs dépassent les seuils définis
                      </p>
                    </div>
                    <Switch 
                      checked={alertConfig.enabled} 
                      onCheckedChange={(checked) => handleConfigUpdate({ enabled: checked })} 
                    />
                  </div>
                  
                  {alertConfig.enabled && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="email-input">Email pour les alertes</Label>
                        <Input
                          id="email-input"
                          type="email"
                          placeholder="votre@email.com"
                          value={alertConfig.userEmail || ""}
                          onChange={(e) => handleConfigUpdate({ userEmail: e.target.value })}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="whatsapp-input">Numéro WhatsApp</Label>
                        <Input
                          id="whatsapp-input"
                          type="tel"
                          placeholder="+33612345678"
                          value={alertConfig.whatsappNumber || ""}
                          onChange={(e) => handleConfigUpdate({ whatsappNumber: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">
                          Format international avec indicatif pays (ex: +33612345678)
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Alerts;
