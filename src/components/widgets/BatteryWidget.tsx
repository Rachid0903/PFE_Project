import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Battery } from 'lucide-react';

interface BatteryWidgetProps {
  title: string;
  sensorId?: string;
}

const BatteryWidget: React.FC<BatteryWidgetProps> = ({ title, sensorId }) => {
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching battery data
    const fetchData = () => {
      setLoading(true);
      // Mock data for demonstration
      setTimeout(() => {
        setBatteryLevel(Math.floor(Math.random() * 40) + 60); // Random battery between 60-100%
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
            <Battery className="h-8 w-8 text-green-500 mb-2" />
            <span className="text-3xl font-bold">{batteryLevel}%</span>
            <span className="text-sm text-muted-foreground mt-1">Niveau de batterie</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BatteryWidget;