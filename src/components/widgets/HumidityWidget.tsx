import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Droplets } from 'lucide-react';

interface HumidityWidgetProps {
  title: string;
  sensorId?: string;
}

const HumidityWidget: React.FC<HumidityWidgetProps> = ({ title, sensorId }) => {
  const [humidity, setHumidity] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching humidity data
    const fetchData = () => {
      setLoading(true);
      // Mock data for demonstration
      setTimeout(() => {
        setHumidity(Math.floor(Math.random() * 30) + 40); // Random humidity between 40-70%
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
            <Droplets className="h-8 w-8 text-blue-500 mb-2" />
            <span className="text-3xl font-bold">{humidity}%</span>
            <span className="text-sm text-muted-foreground mt-1">Humidité relative</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HumidityWidget;