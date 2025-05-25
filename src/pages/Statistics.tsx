import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import WeeklyStatsView from "@/components/WeeklyStatsView";
import DateTimeDisplay from "@/components/DateTimeDisplay";
import { generateTestWeeklyStats } from "@/services/statsService";

const Statistics: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateTestData = async () => {
    try {
      setIsGenerating(true);
      await generateTestWeeklyStats();
      toast({
        title: "Données générées",
        description: "Les données de test ont été générées avec succès. Actualisez la page pour les voir.",
        variant: "default",
      });
      // Recharger la page pour afficher les nouvelles données
      window.location.reload();
    } catch (error) {
      console.error("Erreur lors de la génération des données de test:", error);
      toast({
        title: "Erreur",
        description: "Impossible de générer les données de test",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="container mx-auto py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <h1 className="text-2xl font-bold mb-2 sm:mb-0">Statistiques</h1>
          <DateTimeDisplay />
        </div>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Statistiques des capteurs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 mb-4">
              Cette page affiche les statistiques détaillées de tous vos capteurs sur les 7 derniers jours.
            </p>
            
            <WeeklyStatsView />
            
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-medium mb-4">Outils de développement</h3>
              <Button 
                onClick={handleGenerateTestData} 
                disabled={isGenerating}
                className="bg-amber-500 hover:bg-amber-600"
              >
                {isGenerating ? "Génération en cours..." : "Générer des données de test"}
              </Button>
              <p className="text-sm text-gray-500 mt-2">
                Ce bouton génère des données de test pour les statistiques et les graphiques.
                Utilisez-le uniquement en développement.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Statistics;
