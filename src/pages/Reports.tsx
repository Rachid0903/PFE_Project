import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon, Download, FileText, Printer } from "lucide-react";
import { cn } from "@/lib/utils";
import { database } from "@/services/firebaseConfig";
import { ref, get, query, orderByChild, startAt, endAt } from "firebase/database";
import { toast } from "@/components/ui/sonner";

const Reports: React.FC = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [reportType, setReportType] = useState("daily");
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

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
          sensorData[sensorId] = [];
        }
      });
      
      // Process data for report
      const processedData = processReportData(sensorData, reportType, startDate, endDate);
      setReportData(processedData);
      
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
          rssi: calculateStats(readings, 'rssi')
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
      },
      sensors,
    };
  };

  const calculateStats = (readings: any[], field: string) => {
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
    };
  };

  const downloadReport = () => {
    if (!reportData) return;
    
    // In a real app, you'd generate a PDF or CSV here
    const jsonString = JSON.stringify(reportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
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
  };

  const printReport = () => {
    window.print();
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Rapports</h1>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Générer un rapport</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Type de rapport</label>
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
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Date de début</label>
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
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <Button 
                onClick={generateReport} 
                disabled={isGenerating || !date}
                className="w-full"
              >
                {isGenerating ? "Génération en cours..." : "Générer le rapport"}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {reportData && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Résultats du rapport</CardTitle>
              <div className="flex space-x-2">
                <Button variant="outline" size="icon" onClick={printReport}>
                  <Printer className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={downloadReport}>
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Période</h3>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(reportData.period.start), "PPP", { locale: fr })}
                    {" - "}
                    {format(new Date(reportData.period.end), "PPP", { locale: fr })}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium">Résumé</h3>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="bg-muted p-3 rounded-md">
                      <p className="text-sm text-muted-foreground">Capteurs</p>
                      <p className="text-2xl font-bold">{reportData.summary.sensorCount}</p>
                    </div>
                    <div className="bg-muted p-3 rounded-md">
                      <p className="text-sm text-muted-foreground">Mesures</p>
                      <p className="text-2xl font-bold">{reportData.summary.readingCount}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium">Détails par capteur</h3>
                  <div className="space-y-3 mt-2">
                    {Object.keys(reportData.sensors).map((sensorId) => {
                      const sensor = reportData.sensors[sensorId];
                      return (
                        <div key={sensorId} className="border rounded-md p-3">
                          <h4 className="font-medium">Capteur {sensorId}</h4>
                          <p className="text-sm text-muted-foreground">
                            {sensor.readingCount} mesures
                          </p>
                          
                          <div className="grid grid-cols-3 gap-2 mt-2">
                            {sensor.temperature && (
                              <div className="bg-muted p-2 rounded-md">
                                <p className="text-xs text-muted-foreground">Température</p>
                                <p className="text-sm font-medium">
                                  Moy: {sensor.temperature.avg}°C
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Min: {sensor.temperature.min}°C, Max: {sensor.temperature.max}°C
                                </p>
                              </div>
                            )}
                            
                            {sensor.humidity && (
                              <div className="bg-muted p-2 rounded-md">
                                <p className="text-xs text-muted-foreground">Humidité</p>
                                <p className="text-sm font-medium">
                                  Moy: {sensor.humidity.avg}%
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Min: {sensor.humidity.min}%, Max: {sensor.humidity.max}%
                                </p>
                              </div>
                            )}
                            
                            {sensor.rssi && (
                              <div className="bg-muted p-2 rounded-md">
                                <p className="text-xs text-muted-foreground">RSSI</p>
                                <p className="text-sm font-medium">
                                  Moy: {sensor.rssi.avg} dBm
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Min: {sensor.rssi.min} dBm, Max: {sensor.rssi.max} dBm
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Reports;

