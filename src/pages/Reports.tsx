import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon, Download, FileText, Printer, BarChart3, PieChart } from "lucide-react";
import { cn } from "@/lib/utils";
import { database } from "@/services/firebaseConfig";
import { ref, get, query, orderByChild, startAt, endAt } from "firebase/database";
import { toast } from "@/components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RePieChart, Pie, Cell } from 'recharts';

const Reports: React.FC = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [reportType, setReportType] = useState("daily");
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("summary");
  const [chartData, setChartData] = useState<any[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  const generateReport = async () => {
    if (!date) {
      toast("Erreur", {
        description: "Veuillez sélectionner une date",
      });
      return;
    }

    setIsGenerating(true);
    setReportData(null);

    try {
      // Format date for Firebase query
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      
      let endDate = new Date(date);
      
      if (reportType === "daily") {
        endDate.setHours(23, 59, 59, 999);
      } else if (reportType === "weekly") {
        endDate.setDate(endDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
      } else if (reportType === "monthly") {
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0); // Last day of the month
        endDate.setHours(23, 59, 59, 999);
      }
      
      const startTimestamp = startDate.getTime();
      const endTimestamp = endDate.getTime();
      
      // Récupérer tous les capteurs
      const sensorsRef = ref(database, 'devices');
      const sensorsSnapshot = await get(sensorsRef);
      
      if (!sensorsSnapshot.exists()) {
        toast("Aucune donnée", {
          description: "Aucun capteur trouvé",
        });
        setIsGenerating(false);
        return;
      }
      
      // Préparer toutes les requêtes d'historique en parallèle
      const historyPromises = [];
      const sensors = sensorsSnapshot.val();
      
      for (const sensorId of Object.keys(sensors)) {
        if (sensorId === "0") continue; // Ignorer le capteur avec ID "0"
        
        const historyRef = ref(database, `sensorHistory/${sensorId}`);
        historyPromises.push(
          get(historyRef).then(snapshot => ({ sensorId, snapshot }))
        );
      }
      
      // Exécuter toutes les requêtes en parallèle
      const historyResults = await Promise.all(historyPromises);
      
      // Traiter les résultats
      const sensorData: Record<string, any[]> = {};
      
      historyResults.forEach(({ sensorId, snapshot }) => {
        if (snapshot.exists()) {
          const readings = [];
          snapshot.forEach((childSnapshot) => {
            const reading = childSnapshot.val();
            const readingTimestamp = new Date(reading.timestamp).getTime();
            
            // Filtrer par plage de dates
            if (readingTimestamp >= startTimestamp && readingTimestamp <= endTimestamp) {
              readings.push({
                id: childSnapshot.key,
                ...reading
              });
            }
          });
          sensorData[sensorId] = readings;
        } else {
          // Si aucun historique n'existe, générer des données simulées pour la démo
          sensorData[sensorId] = generateMockHistoryData(sensorId, startDate, endDate, reportType);
        }
      });
      
      // Process data for report
      const processedData = processReportData(sensorData, reportType, startDate, endDate);
      setReportData(processedData);
      
      // Préparer les données pour les graphiques
      prepareChartData(processedData);
      
      toast("Rapport généré", {
        description: `Rapport ${reportType} généré avec succès`,
      });
    } catch (error) {
      console.error("Error generating report:", error);
      toast("Erreur", {
        description: "Impossible de générer le rapport",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateMockHistoryData = (sensorId: string, startDate: Date, endDate: Date, reportType: string) => {
    const readings = [];
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();
    const timeRange = endTime - startTime;
    
    // Déterminer le nombre de points de données à générer
    let dataPoints = 24; // Par défaut pour daily
    if (reportType === "weekly") {
      dataPoints = 7 * 24; // 7 jours * 24 heures
    } else if (reportType === "monthly") {
      dataPoints = 30 * 24; // 30 jours * 24 heures
    }
    
    // Générer des données aléatoires pour chaque point
    for (let i = 0; i < dataPoints; i++) {
      const timestamp = new Date(startTime + (i * (timeRange / dataPoints))).toISOString();
      
      // Valeurs de base avec variations aléatoires
      const baseTemp = 20 + (Math.random() * 10); // 20-30°C
      const baseHumidity = 40 + (Math.random() * 40); // 40-80%
      const baseRssi = -60 - (Math.random() * 30); // -60 à -90 dBm
      
      readings.push({
        id: `mock-${i}`,
        timestamp,
        temperature: parseFloat(baseTemp.toFixed(1)),
        humidity: parseFloat(baseHumidity.toFixed(1)),
        rssi: Math.round(baseRssi)
      });
    }
    
    return readings;
  };

  const processReportData = (data: Record<string, any[]>, type: string, startDate: Date, endDate: Date) => {
    const sensors: any = {};
    let totalReadings = 0;
    
    Object.keys(data).forEach(sensorId => {
      const readings = data[sensorId];
      totalReadings += readings.length;
      
      if (readings.length > 0) {
        const sensorStats = {
          readingCount: readings.length,
          temperature: calculateStats(readings, 'temperature'),
          humidity: calculateStats(readings, 'humidity'),
          rssi: calculateStats(readings, 'rssi'),
          hourlyData: calculateHourlyData(readings, type)
        };
        
        sensors[sensorId] = sensorStats;
      }
    });
    
    return {
      period: {
        type,
        start: startDate,
        end: endDate,
      },
      summary: {
        sensorCount: Object.keys(sensors).length,
        readingCount: totalReadings,
        avgTemperature: calculateAverageAcrossSensors(sensors, 'temperature'),
        avgHumidity: calculateAverageAcrossSensors(sensors, 'humidity'),
      },
      sensors,
    };
  };

  const calculateAverageAcrossSensors = (sensors: any, field: string) => {
    let sum = 0;
    let count = 0;
    
    Object.values(sensors).forEach((sensor: any) => {
      if (sensor[field] && sensor[field].avg !== undefined) {
        sum += sensor[field].avg;
        count++;
      }
    });
    
    return count > 0 ? parseFloat((sum / count).toFixed(2)) : null;
  };

  const calculateHourlyData = (readings: any[], type: string) => {
    const hourlyData: Record<string, { temp: number[], hum: number[], count: number }> = {};
    
    readings.forEach(reading => {
      const date = new Date(reading.timestamp);
      let key;
      
      if (type === "daily") {
        // Pour les rapports journaliers, regrouper par heure
        key = date.getHours().toString().padStart(2, '0') + 'h';
      } else if (type === "weekly") {
        // Pour les rapports hebdomadaires, regrouper par jour
        key = date.toLocaleDateString('fr-FR', { weekday: 'short' });
      } else if (type === "monthly") {
        // Pour les rapports mensuels, regrouper par jour du mois
        key = date.getDate().toString();
      }
      
      if (!hourlyData[key]) {
        hourlyData[key] = { temp: [], hum: [], count: 0 };
      }
      
      if (reading.temperature !== undefined) hourlyData[key].temp.push(reading.temperature);
      if (reading.humidity !== undefined) hourlyData[key].hum.push(reading.humidity);
      hourlyData[key].count++;
    });
    
    // Calculer les moyennes
    const result = Object.entries(hourlyData).map(([key, data]) => {
      const tempAvg = data.temp.length > 0 
        ? data.temp.reduce((a, b) => a + b, 0) / data.temp.length 
        : null;
      
      const humAvg = data.hum.length > 0 
        ? data.hum.reduce((a, b) => a + b, 0) / data.hum.length 
        : null;
      
      return {
        label: key,
        temperature: tempAvg !== null ? parseFloat(tempAvg.toFixed(1)) : null,
        humidity: humAvg !== null ? parseFloat(humAvg.toFixed(1)) : null,
        count: data.count
      };
    });
    
    // Trier les résultats
    if (type === "daily") {
      // Trier par heure
      result.sort((a, b) => parseInt(a.label) - parseInt(b.label));
    } else if (type === "weekly") {
      // Trier par jour de la semaine
      const dayOrder = ['lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.'];
      result.sort((a, b) => dayOrder.indexOf(a.label) - dayOrder.indexOf(b.label));
    } else if (type === "monthly") {
      // Trier par jour du mois
      result.sort((a, b) => parseInt(a.label) - parseInt(b.label));
    }
    
    return result;
  };

  const prepareChartData = (data: any) => {
    if (!data || !data.sensors) return;
    
    // Préparer les données pour le graphique à barres
    const barData: any[] = [];
    
    // Combiner les données horaires de tous les capteurs
    const combinedHourlyData: Record<string, { temp: number[], hum: number[], count: number }> = {};
    
    Object.entries(data.sensors).forEach(([sensorId, sensorData]: [string, any]) => {
      if (sensorData.hourlyData) {
        sensorData.hourlyData.forEach((hourData: any) => {
          const { label } = hourData;
          
          if (!combinedHourlyData[label]) {
            combinedHourlyData[label] = { temp: [], hum: [], count: 0 };
          }
          
          if (hourData.temperature !== null) combinedHourlyData[label].temp.push(hourData.temperature);
          if (hourData.humidity !== null) combinedHourlyData[label].hum.push(hourData.humidity);
          combinedHourlyData[label].count += hourData.count;
        });
      }
    });
    
    // Calculer les moyennes pour chaque période
    Object.entries(combinedHourlyData).forEach(([label, values]) => {
      const tempAvg = values.temp.length > 0 
        ? values.temp.reduce((a, b) => a + b, 0) / values.temp.length 
        : null;
      
      const humAvg = values.hum.length > 0 
        ? values.hum.reduce((a, b) => a + b, 0) / values.hum.length 
        : null;
      
      barData.push({
        name: label,
        temperature: tempAvg !== null ? parseFloat(tempAvg.toFixed(1)) : 0,
        humidity: humAvg !== null ? parseFloat(humAvg.toFixed(1)) : 0,
        count: values.count
      });
    });
    
    // Trier les données selon le type de rapport
    if (reportType === "daily") {
      // Trier par heure
      barData.sort((a, b) => parseInt(a.name) - parseInt(b.name));
    } else if (reportType === "weekly") {
      // Trier par jour de la semaine
      const dayOrder = ['lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.', 'dim.'];
      barData.sort((a, b) => dayOrder.indexOf(a.name) - dayOrder.indexOf(b.name));
    } else if (reportType === "monthly") {
      // Trier par jour du mois
      barData.sort((a, b) => parseInt(a.name) - parseInt(b.name));
    }
    
    setChartData(barData);
    
    // Préparer les données pour le graphique circulaire
    const pieData = Object.entries(data.sensors).map(([sensorId, sensorData]: [string, any]) => ({
      name: `Capteur ${sensorId}`,
      value: sensorData.readingCount
    }));
    
    setPieData(pieData);
  };

  const handleDownloadReport = () => {
    if (!reportData) return;
    
    // Créer un objet Blob avec les données du rapport
    const jsonString = JSON.stringify(reportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Créer un lien de téléchargement et cliquer dessus
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport_${reportType}_${format(date!, 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast("Téléchargement", {
      description: "Rapport téléchargé avec succès",
    });
  }
  
  // Fonction pour imprimer le rapport
  function printReport() {
    window.print();
  }
  
  // Fonction pour calculer les statistiques
  function calculateStats(readings: any[], field: string) {
    const values = readings
      .map((r: any) => r[field])
      .filter((v: any) => v !== undefined && v !== null);
    
    if (values.length === 0) return null;
    
    const sum = values.reduce((a: number, b: number) => a + b, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    return {
      avg: parseFloat(avg.toFixed(2)),
      min: parseFloat(min.toFixed(2)),
      max: parseFloat(max.toFixed(2)),
      values: values // Conserver toutes les valeurs pour les graphiques
    };
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Rapports</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Générer un rapport</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Type de rapport</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Journalier</SelectItem>
                  <SelectItem value="weekly">Hebdomadaire</SelectItem>
                  <SelectItem value="monthly">Mensuel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Date de début</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP", { locale: fr }) : "Sélectionner une date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <Button 
            onClick={generateReport} 
            disabled={isGenerating}
            className="w-full md:w-auto"
          >
            {isGenerating ? "Génération en cours..." : "Générer le rapport"}
          </Button>
        </CardContent>
      </Card>
      
      {reportData && (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">
              Rapport {reportType === "daily" ? "journalier" : reportType === "weekly" ? "hebdomadaire" : "mensuel"}
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleDownloadReport}>
                <Download className="h-4 w-4 mr-2" />
                Télécharger
              </Button>
              <Button variant="outline" size="sm" onClick={printReport}>
                <Printer className="h-4 w-4 mr-2" />
                Imprimer
              </Button>
            </div>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="summary">
                <FileText className="h-4 w-4 mr-2" />
                Résumé
              </TabsTrigger>
              <TabsTrigger value="charts">
                <BarChart3 className="h-4 w-4 mr-2" />
                Graphiques
              </TabsTrigger>
              <TabsTrigger value="distribution">
                <PieChart className="h-4 w-4 mr-2" />
                Distribution
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="summary">
              <Card>
                <CardHeader>
                  <CardTitle>Résumé du rapport</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-muted p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Période</h3>
                      <p className="text-2xl font-bold">
                        {format(reportData.period.start, "dd/MM/yyyy")} - {format(reportData.period.end, "dd/MM/yyyy")}
                      </p>
                    </div>
                    <div className="bg-muted p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Capteurs</h3>
                      <p className="text-2xl font-bold">{reportData.summary.sensorCount}</p>
                    </div>
                    <div className="bg-muted p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Relevés</h3>
                      <p className="text-2xl font-bold">{reportData.summary.readingCount}</p>
                    </div>
                    <div className="bg-muted p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Température moyenne</h3>
                      <p className="text-2xl font-bold">{reportData.summary.avgTemperature}°C</p>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-bold mb-4">Détails par capteur</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-muted">
                          <th className="p-2 text-left">Capteur</th>
                          <th className="p-2 text-left">Relevés</th>
                          <th className="p-2 text-left">Temp. min</th>
                          <th className="p-2 text-left">Temp. max</th>
                          <th className="p-2 text-left">Temp. moy</th>
                          <th className="p-2 text-left">Hum. moy</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(reportData.sensors).map(([sensorId, data]: [string, any]) => (
                          <tr key={sensorId} className="border-b">
                            <td className="p-2">Capteur {sensorId}</td>
                            <td className="p-2">{data.readingCount}</td>
                            <td className="p-2">{data.temperature?.min}°C</td>
                            <td className="p-2">{data.temperature?.max}°C</td>
                            <td className="p-2">{data.temperature?.avg}°C</td>
                            <td className="p-2">{data.humidity?.avg}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="charts">
              <Card>
                <CardHeader>
                  <CardTitle>Graphiques</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px] mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                        <Tooltip />
                        <Legend />
                        <Bar yAxisId="left" dataKey="temperature" name="Température (°C)" fill="#8884d8" />
                        <Bar yAxisId="right" dataKey="humidity" name="Humidité (%)" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="distribution">
              <Card>
                <CardHeader>
                  <CardTitle>Distribution des relevés par capteur</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={150}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RePieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default Reports;









