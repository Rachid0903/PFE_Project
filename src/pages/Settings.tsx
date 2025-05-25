import React, { useState, useEffect } from "react";
import { database } from "@/services/firebaseConfig";
import { ref, set } from "firebase/database";
import { toast } from "@/components/ui/use-toast";
import { DEFAULT_THRESHOLDS, getAlertConfig, updateAlertConfig } from "@/services/alertService";

const Settings: React.FC = () => {
  const [alertEnabled, setAlertEnabled] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [tempMin, setTempMin] = useState(0);
  const [tempMax, setTempMax] = useState(40);
  const [humidityMin, setHumidityMin] = useState(20);
  const [humidityMax, setHumidityMax] = useState(80);

  // Charger la configuration des alertes
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await getAlertConfig();
        setAlertEnabled(config.enabled || false);
        setEmailAddress(config.userEmail || "");
        
        if (config.thresholds) {
          if (config.thresholds.temperature) {
            setTempMin(config.thresholds.temperature.min);
            setTempMax(config.thresholds.temperature.max);
          }
          
          if (config.thresholds.humidity) {
            setHumidityMin(config.thresholds.humidity.min);
            setHumidityMax(config.thresholds.humidity.max);
          }
        }
      } catch (error) {
        console.error("Erreur lors du chargement de la configuration:", error);
      }
    };
    
    loadConfig();
  }, []);

  // Gérer les changements dans les champs
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmailAddress(e.target.value);
  };

  // Enregistrer la configuration
  const saveConfig = async () => {
    setIsLoading(true);
    
    try {
      // Vérifier que l'email est valide si les alertes sont activées
      if (alertEnabled && (!emailAddress || !emailAddress.includes('@'))) {
        toast({
          title: "Erreur",
          description: "Veuillez fournir une adresse email valide pour recevoir les alertes",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
      
      await updateAlertConfig({
        enabled: alertEnabled,
        userEmail: emailAddress.trim(),
        thresholds: {
          temperature: {
            min: tempMin,
            max: tempMax
          },
          humidity: {
            min: humidityMin,
            max: humidityMax
          },
          pressure: DEFAULT_THRESHOLDS.pressure
        },
        cooldownMinutes: 5
      });
      
      toast({
        title: "Succès",
        description: "Configuration des alertes enregistrée avec succès",
      });
    } catch (error) {
      console.error("Erreur lors de l'enregistrement de la configuration:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer la configuration des alertes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6 text-foreground">Paramètres</h1>
      
      <div className="bg-card rounded-lg shadow p-6 border border-border">
        <h2 className="text-xl font-semibold mb-4 text-foreground">Configuration des alertes</h2>
        
        <div className="space-y-4">
          <div>
            <label className="flex items-center space-x-2 text-foreground">
              <input
                type="checkbox"
                checked={alertEnabled}
                onChange={(e) => setAlertEnabled(e.target.checked)}
                className="h-4 w-4"
              />
              <span>Activer les alertes</span>
            </label>
          </div>
          
          <div>
            <label className="block mb-1 text-foreground">Adresse email pour les alertes</label>
            <input
              type="email"
              value={emailAddress}
              onChange={handleEmailChange}
              className="w-full p-2 border rounded bg-background text-foreground border-input"
              placeholder="exemple@email.com"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2 text-foreground">Seuils de température</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm mb-1 text-foreground">Min (°C)</label>
                  <input
                    type="number"
                    value={tempMin}
                    onChange={(e) => setTempMin(Number(e.target.value))}
                    className="w-full p-2 border rounded bg-background text-foreground border-input"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-foreground">Max (°C)</label>
                  <input
                    type="number"
                    value={tempMax}
                    onChange={(e) => setTempMax(Number(e.target.value))}
                    className="w-full p-2 border rounded bg-background text-foreground border-input"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-2 text-foreground">Seuils d'humidité</h3>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm mb-1 text-foreground">Min (%)</label>
                  <input
                    type="number"
                    value={humidityMin}
                    onChange={(e) => setHumidityMin(Number(e.target.value))}
                    className="w-full p-2 border rounded bg-background text-foreground border-input"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-foreground">Max (%)</label>
                  <input
                    type="number"
                    value={humidityMax}
                    onChange={(e) => setHumidityMax(Number(e.target.value))}
                    className="w-full p-2 border rounded bg-background text-foreground border-input"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <button
              onClick={saveConfig}
              disabled={isLoading}
              className="px-4 py-2 bg-lora text-white rounded hover:bg-lora-light"
            >
              {isLoading ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;



