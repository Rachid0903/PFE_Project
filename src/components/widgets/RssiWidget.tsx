import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Signal } from 'lucide-react';

interface RssiWidgetProps {
  title: string;
  sensorId?: string;
}

const RssiWidget: React.FC<RssiWidgetProps> = ({ title, sensorId }) => {
  const [rssi, setRssi] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = () => {
      setLoading(true);
      // Mock data for demonstration
      setTimeout(() => {
        setRssi(Math.floor(Math.random() * 40) - 100); // Random RSSI between -100 and -60 dBm
        setLoading(false);
      }, 1000);
    };

    fetchData();
    const interval = setInterval(fetchData, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [sensorId]);

  const getSignalStrength = (value: number | null): string => {
    if (value === null) return 'Inconnu';
    if (value > -70) return 'Excellent';
    if (value > -85) return 'Bon';
    if (value > -100) return 'Faible';
    return 'Très faible';
  };

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
            <Signal className="h-8 w-8 text-blue-500 mb-2" />
            <span className="text-3xl font-bold">{rssi} dBm</span>
            <span className="text-sm text-muted-foreground mt-1">
              {getSignalStrength(rssi)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RssiWidget;