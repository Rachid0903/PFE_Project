import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/sonner";
import { WhatsAppConfig, getWhatsAppConfig, updateWhatsAppConfig } from "@/services/whatsappService";
import { AlertCircle, CheckCircle, Send } from "lucide-react";

const WhatsAppConfig: React.FC = () => {
  const [config, setConfig] = useState<WhatsAppConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [testNumber, setTestNumber] = useState("");
  const [isSendingTest, setIsSendingTest] = useState(false);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const whatsappConfig = await getWhatsAppConfig();
        setConfig(whatsappConfig);
      } catch (error) {
        console.error("Erreur lors du chargement de la configuration WhatsApp:", error);
        toast("Erreur", {
          description: "Impossible de charger la configuration WhatsApp",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, []);

  const handleSaveConfig = async () => {
    if (!config) return;

    setIsSaving(true);
    try {
      await updateWhatsAppConfig(config);
      toast("Succès", {
        description: "Configuration WhatsApp enregistrée avec succès",
      });
    } catch (error) {
      console.error("Erreur lors de l'enregistrement de la configuration:", error);
      toast("Erreur", {
        description: "Impossible d'enregistrer la configuration",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestMessage = async () => {
    if (!config || !testNumber) return;

    setIsSendingTest(true);
    try {
      // Importer dynamiquement pour éviter les problèmes de dépendance circulaire
      const { sendWhatsApp } = await import("@/services/whatsappService");
      
      const success = await sendWhatsApp(
        testNumber,
        "Ceci est un message de test de LoRa Sensor View. Si vous recevez ce message, la configuration WhatsApp fonctionne correctement."
      );

      if (success) {
        toast("Succès", {
          description: "Message de test envoyé avec succès",
        });
      } else {
        toast("Erreur", {
          description: "Échec de l'envoi du message de test",
        });
      }
    } catch (error) {
      console.error("Erreur lors de l'envoi du message de test:", error);
      toast("Erreur", {
        description: "Impossible d'envoyer le message de test",
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Configuration WhatsApp</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Paramètres WhatsApp</CardTitle>
          <CardDescription>
            Configurez les paramètres pour envoyer des alertes via WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent>
          {config && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="whatsapp-enabled">Activer WhatsApp</Label>
                  <p className="text-sm text-muted-foreground">
                    Activer l'envoi d'alertes via WhatsApp
                  </p>
                </div>
                <Switch
                  id="whatsapp-enabled"
                  checked={config.enabled}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, enabled: checked })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="api-key">Clé API WhatsApp</Label>
                <Input
                  id="api-key"
                  type="password"
                  value={config.apiKey}
                  onChange={(e) =>
                    setConfig({ ...config, apiKey: e.target.value })
                  }
                  placeholder="Entrez votre clé API WhatsApp"
                />
                <p className="text-xs text-muted-foreground">
                  Clé API pour l'authentification auprès du service WhatsApp Business
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="api-url">URL de l'API WhatsApp</Label>
                <Input
                  id="api-url"
                  type="text"
                  value={config.apiUrl}
                  onChange={(e) =>
                    setConfig({ ...config, apiUrl: e.target.value })
                  }
                  placeholder="https://graph.facebook.com/v17.0/..."
                />
                <p className="text-xs text-muted-foreground">
                  URL de l'API WhatsApp Business
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="from-number">Numéro d'expéditeur</Label>
                <Input
                  id="from-number"
                  type="text"
                  value={config.fromNumber}
                  onChange={(e) =>
                    setConfig({ ...config, fromNumber: e.target.value })
                  }
                  placeholder="+33612345678"
                />
                <p className="text-xs text-muted-foreground">
                  Numéro WhatsApp vérifié pour l'envoi des messages
                </p>
              </div>

              <Button
                onClick={handleSaveConfig}
                disabled={isSaving}
                className="w-full"
              >
                {isSaving ? "Enregistrement..." : "Enregistrer la configuration"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tester l'envoi de messages</CardTitle>
          <CardDescription>
            Envoyez un message de test pour vérifier votre configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="test-number">Numéro de test</Label>
              <Input
                id="test-number"
                type="tel"
                value={testNumber}
                onChange={(e) => setTestNumber(e.target.value)}
                placeholder="+33612345678"
              />
              <p className="text-xs text-muted-foreground">
                Format international avec indicatif pays (ex: +33612345678)
              </p>
            </div>

            <Button
              onClick={handleTestMessage}
              disabled={isSendingTest || !config?.enabled || !testNumber}
              className="w-full"
              variant="outline"
            >
              <Send className="h-4 w-4 mr-2" />
              {isSendingTest ? "Envoi en cours..." : "Envoyer un message de test"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsAppConfig;