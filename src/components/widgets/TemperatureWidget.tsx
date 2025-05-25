import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Thermometer } from 'lucide-react';

interface TemperatureWidgetProps {
  title: string;
  sensorId?: string;
}

const TemperatureWidget: React.FC<TemperatureWidgetProps> = ({ title, sensorId }) => {
  const [temperature, setTemperature] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching temperature data
    const fetchData = () => {
      setLoading(true);
      // Mock data for demonstration
      setTimeout(() => {
        setTemperature(Math.floor(Math.random() * 15) + 15); // Random temperature between 15-30°C
        setLoading(false);
      }, 1000);
    };

    fetchData();
    const interval = setInterval(fetchData, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [sensorId]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-24">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <Thermometer className="h-8 w-8 text-sensor-temp mb-2" />
            <span className="text-3xl font-bold">{temperature}°C</span>
            <span className="text-sm text-muted-foreground mt-1">Température</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TemperatureWidget;