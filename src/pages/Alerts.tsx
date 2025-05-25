import React, { useState, useEffect } from "react";
import { database } from "@/services/firebaseConfig";
import { ref, get, onValue, off } from "firebase/database";
import { toast } from "@/components/ui/sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert as AlertComponent } from "@/components/ui/alert";
import { AlertCircle, Bell, CheckCircle, MessageCircle, Settings } from "lucide-react";
import { Alert, AlertConfig, getAlertConfig, updateAlertConfig } from "@/services/alertService";
import { Switch } from "@/components/ui/switch";
import { formatDateTime } from "@/lib/dateUtils";
import { useNavigate } from "react-router-dom";
import AlertServiceStatus from "@/components/AlertServiceStatus";

const Alerts: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [alertConfig, setAlertConfig] = useState<AlertConfig | null>(null);
  const [activeTab, setActiveTab] = useState("history");
  const navigate = useNavigate();

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

  // Supprimer la fonction handleTestWhatsApp
  const handleTestWhatsApp = async () => {
    // ...
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Alertes</h1>
      </div>
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="history">
            <Bell className="h-4 w-4 mr-2" />
            Alertes
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Configuration
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="history">
          <div className="grid gap-4">
            {/* Ajout du champ email pour les alertes */}
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Configuration des notifications</CardTitle>
                <CardDescription>Définissez l'adresse email pour recevoir les alertes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email pour recevoir les alertes</Label>
                    <div className="flex gap-4">
                      <Input
                        id="email"
                        type="email"
                        placeholder="votre@email.com"
                        value={alertConfig?.userEmail || ""}
                        onChange={(e) => alertConfig && handleConfigUpdate({ userEmail: e.target.value })}
                        className="flex-1"
                      />
                      <Button 
                        onClick={() => alertConfig && handleConfigUpdate({ userEmail: alertConfig.userEmail })}
                        disabled={!alertConfig}
                      >
                        Enregistrer
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Les alertes seront envoyées à cette adresse email lorsqu'un capteur dépasse les seuils définis.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

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
          <div className="grid gap-6 md:grid-cols-2">
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
                        
                        {/* Ajout des seuils d'alerte */}
                        <div className="space-y-4">
                          <h3 className="font-medium">Seuils d'alerte</h3>
                          
                          {/* Température */}
                          <div className="space-y-2">
                            <Label>Température (°C)</Label>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="temp-min" className="text-sm">Min</Label>
                                <Input
                                  id="temp-min"
                                  type="number"
                                  value={alertConfig.thresholds.temperature.min}
                                  onChange={(e) => handleConfigUpdate({
                                    thresholds: {
                                      ...alertConfig.thresholds,
                                      temperature: {
                                        ...alertConfig.thresholds.temperature,
                                        min: Number(e.target.value)
                                      }
                                    }
                                  })}
                                />
                              </div>
                              <div>
                                <Label htmlFor="temp-max" className="text-sm">Max</Label>
                                <Input
                                  id="temp-max"
                                  type="number"
                                  value={alertConfig.thresholds.temperature.max}
                                  onChange={(e) => handleConfigUpdate({
                                    thresholds: {
                                      ...alertConfig.thresholds,
                                      temperature: {
                                        ...alertConfig.thresholds.temperature,
                                        max: Number(e.target.value)
                                      }
                                    }
                                  })}
                                />
                              </div>
                            </div>
                          </div>
                          
                          {/* Humidité */}
                          <div className="space-y-2">
                            <Label>Humidité (%)</Label>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="humidity-min" className="text-sm">Min</Label>
                                <Input
                                  id="humidity-min"
                                  type="number"
                                  value={alertConfig.thresholds.humidity.min}
                                  onChange={(e) => handleConfigUpdate({
                                    thresholds: {
                                      ...alertConfig.thresholds,
                                      humidity: {
                                        ...alertConfig.thresholds.humidity,
                                        min: Number(e.target.value)
                                      }
                                    }
                                  })}
                                />
                              </div>
                              <div>
                                <Label htmlFor="humidity-max" className="text-sm">Max</Label>
                                <Input
                                  id="humidity-max"
                                  type="number"
                                  value={alertConfig.thresholds.humidity.max}
                                  onChange={(e) => handleConfigUpdate({
                                    thresholds: {
                                      ...alertConfig.thresholds,
                                      humidity: {
                                        ...alertConfig.thresholds.humidity,
                                        max: Number(e.target.value)
                                      }
                                    }
                                  })}
                                />
                              </div>
                            </div>
                          </div>
                          
                          {/* Pression */}
                          {alertConfig.thresholds.pressure && (
                            <div className="space-y-2">
                              <Label>Pression (hPa)</Label>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="pressure-min" className="text-sm">Min</Label>
                                  <Input
                                    id="pressure-min"
                                    type="number"
                                    value={alertConfig.thresholds.pressure.min}
                                    onChange={(e) => handleConfigUpdate({
                                      thresholds: {
                                        ...alertConfig.thresholds,
                                        pressure: {
                                          ...alertConfig.thresholds.pressure,
                                          min: Number(e.target.value)
                                        }
                                      }
                                    })}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="pressure-max" className="text-sm">Max</Label>
                                  <Input
                                    id="pressure-max"
                                    type="number"
                                    value={alertConfig.thresholds.pressure.max}
                                    onChange={(e) => handleConfigUpdate({
                                      thresholds: {
                                        ...alertConfig.thresholds,
                                        pressure: {
                                          ...alertConfig.thresholds.pressure,
                                          max: Number(e.target.value)
                                        }
                                      }
                                    })}
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
            
            <AlertServiceStatus />
          </div>
        </TabsContent>
        <TabsContent value="whatsapp">
          <Card>
            <CardHeader>
              <CardTitle>Configuration WhatsApp</CardTitle>
              <CardDescription>
                Configurez les paramètres pour recevoir des alertes via WhatsApp
              </CardDescription>
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
                      <h3 className="font-medium">Activer les alertes WhatsApp</h3>
                      <p className="text-sm text-muted-foreground">
                        Recevoir des notifications WhatsApp lorsque les capteurs dépassent les seuils définis
                      </p>
                    </div>
                    <Switch 
                      checked={alertConfig.enabled} 
                      onCheckedChange={(checked) => handleConfigUpdate({ enabled: checked })} 
                    />
                  </div>
                  
                  {alertConfig.enabled && (
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp-input">Numéro WhatsApp</Label>
                      <Input
                        id="whatsapp-input"
                        type="tel"
                        placeholder="+33612345678"
                        value={alertConfig.userEmail || ""}
                        onChange={(e) => handleConfigUpdate({ userEmail: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Format international avec indicatif pays (ex: +33612345678)
                      </p>
                      
                      <div className="mt-4">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleTestWhatsApp}
                          disabled={!alertConfig.userEmail}
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          Envoyer un message de test
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  <div className="pt-4 border-t">
                    <h3 className="font-medium mb-2">Configuration avancée</h3>
                    <Button 
                      variant="outline" 
                      onClick={() => navigate('/whatsapp-config')}
                    >
                      Configurer les paramètres avancés WhatsApp
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      Configurez les paramètres API pour l'intégration WhatsApp Business
                    </p>
                  </div>
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














