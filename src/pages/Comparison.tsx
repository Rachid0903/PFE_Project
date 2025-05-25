import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Comparison: React.FC = () => {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Comparaison des capteurs</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Comparaison des données</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Contenu de la page de comparaison à implémenter.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Comparison;

