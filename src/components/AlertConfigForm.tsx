import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { AlertConfig, getAlertConfig, updateAlertConfig, DEFAULT_THRESHOLDS } from "@/services/alertService";

const AlertConfigForm: React.FC = () => {
  const [config, setConfig] = useState<AlertConfig>({
    enabled: false,
    userEmail: '',
    thresholds: DEFAULT_THRESHOLDS,
    cooldownMinutes: 30
  });
  const [isLoading, setIsLoading] = useState(true);

  // Charger la configuration des alertes
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const alertConfig = await getAlertConfig();
        setConfig(alertConfig);
      } catch (error) {
        console.error("Erreur lors du chargement de la configuration des alertes:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger la configuration des alertes",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, []);

  // Enregistrer la configuration
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      
      if (config.enabled && !config.userEmail) {
        toast({
          title: "Attention",
          description: "Veuillez ajouter une adresse email pour recevoir les alertes",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      await updateAlertConfig(config);
      
      toast({
        title: "Succès",
        description: "Configuration des alertes enregistrée avec succès",
      });
    } catch (error) {
      console.error("Erreur lors de l'enregistrement de la configuration:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer la configuration",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Mettre à jour les seuils
  const handleThresholdChange = (
    type: 'temperature' | 'humidity' | 'pressure',
    minOrMax: 'min' | 'max',
    value: number
  ) => {
    setConfig({
      ...config,
      thresholds: {
        ...config.thresholds,
        [type]: {
          ...config.thresholds[type],
          [minOrMax]: value
        }
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-lora"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h2 className="text-xl font-semibold">Configuration des alertes</h2>
          <p className="text-sm text-muted-foreground">
            Configurez les seuils d'alerte et l'adresse email pour recevoir des alertes
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="alert-enabled"
            checked={config.enabled}
            onCheckedChange={(checked) => setConfig({ ...config, enabled: checked })}
          />
          <Label htmlFor="alert-enabled">Activer les alertes</Label>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Configuration des seuils */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Seuils d'alerte</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Température */}
            <div className="space-y-2">
              <Label>Température (°C)</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Min</span>
                    <span className="text-sm font-medium">{config.thresholds.temperature.min}°C</span>
                  </div>
                  <Slider
                    value={[config.thresholds.temperature.min]}
                    min={-10}
                    max={40}
                    step={1}
                    onValueChange={(value) => handleThresholdChange('temperature', 'min', value[0])}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Max</span>
                    <span className="text-sm font-medium">{config.thresholds.temperature.max}°C</span>
                  </div>
                  <Slider
                    value={[config.thresholds.temperature.max]}
                    min={0}
                    max={50}
                    step={1}
                    onValueChange={(value) => handleThresholdChange('temperature', 'max', value[0])}
                  />
                </div>
              </div>
            </div>

            {/* Humidité */}
            <div className="space-y-2">
              <Label>Humidité (%)</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Min</span>
                    <span className="text-sm font-medium">{config.thresholds.humidity.min}%</span>
                  </div>
                  <Slider
                    value={[config.thresholds.humidity.min]}
                    min={0}
                    max={50}
                    step={1}
                    onValueChange={(value) => handleThresholdChange('humidity', 'min', value[0])}
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Max</span>
                    <span className="text-sm font-medium">{config.thresholds.humidity.max}%</span>
                  </div>
                  <Slider
                    value={[config.thresholds.humidity.max]}
                    min={50}
                    max={100}
                    step={1}
                    onValueChange={(value) => handleThresholdChange('humidity', 'max', value[0])}
                  />
                </div>
              </div>
            </div>

            {/* Période de cooldown */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Délai entre alertes (minutes)</Label>
                <span className="text-sm font-medium">{config.cooldownMinutes} min</span>
              </div>
              <Slider
                value={[config.cooldownMinutes]}
                min={5}
                max={120}
                step={5}
                onValueChange={(value) => setConfig({ ...config, cooldownMinutes: value[0] })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Configuration de l'email */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Email pour les alertes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user-email">Adresse email</Label>
              <Input
                id="user-email"
                type="email"
                placeholder="votre@email.com"
                value={config.userEmail}
                onChange={(e) => setConfig({ 
                  ...config, 
                  userEmail: e.target.value 
                })}
                required={config.enabled}
              />
              <p className="text-sm text-muted-foreground">
                Les alertes seront envoyées à cette adresse email
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Button type="submit" className="w-full bg-lora hover:bg-lora-light text-white" disabled={isLoading}>
        {isLoading ? "Enregistrement..." : "Enregistrer la configuration"}
      </Button>
    </form>
  );
};

export default AlertConfigForm;

