import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cloud, CloudRain, Sun, Thermometer, Wind } from 'lucide-react';
import axios from 'axios';

interface WeatherData {
  temperature: number;
  humidity: number;
  conditions: string;
  windSpeed: number;
  location: string;
  forecast: {
    date: string;
    temperature: number;
    conditions: string;
  }[];
}

interface WeatherWidgetProps {
  title: string;
  location?: string;
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ title, location = 'Paris,fr' }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeatherData = async () => {
      try {
        setLoading(true);
        
        // Simuler une API météo pour la démonstration
        // Dans un environnement réel, vous utiliseriez une API comme OpenWeatherMap
        // const response = await axios.get(`https://api.openweathermap.org/data/2.5/forecast?q=${location}&appid=${API_KEY}&units=metric`);
        
        // Données simulées
        setTimeout(() => {
          const mockWeatherData: WeatherData = {
            temperature: 22.5,
            humidity: 65,
            conditions: 'Partiellement nuageux',
            windSpeed: 12,
            location: location.split(',')[0],
            forecast: [
              { date: 'Demain', temperature: 24, conditions: 'Ensoleillé' },
              { date: 'J+2', temperature: 21, conditions: 'Pluvieux' },
              { date: 'J+3', temperature: 19, conditions: 'Nuageux' }
            ]
          };
          
          setWeather(mockWeatherData);
          setLoading(false);
        }, 1000);
      } catch (err) {
        console.error('Erreur lors de la récupération des données météo:', err);
        setError('Impossible de charger les données météo');
        setLoading(false);
      }
    };

    fetchWeatherData();
  }, [location]);

  const getWeatherIcon = (condition: string) => {
    if (condition.toLowerCase().includes('soleil') || condition.toLowerCase().includes('ensoleillé')) {
      return <Sun className="h-6 w-6 text-yellow-500" />;
    } else if (condition.toLowerCase().includes('pluie') || condition.toLowerCase().includes('pluvieux')) {
      return <CloudRain className="h-6 w-6 text-blue-500" />;
    } else {
      return <Cloud className="h-6 w-6 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-destructive">{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {title}
          <span className="text-sm font-normal">{weather?.location}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {weather && getWeatherIcon(weather.conditions)}
              <span className="text-lg font-medium">{weather?.conditions}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Thermometer className="h-5 w-5 text-sensor-temp" />
              <span className="text-xl font-bold">{weather?.temperature}°C</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span>Humidité: {weather?.humidity}%</span>
            </div>
            <div className="flex items-center space-x-1">
              <Wind className="h-4 w-4" />
              <span>Vent: {weather?.windSpeed} km/h</span>
            </div>
          </div>
          
          <div className="border-t pt-3 mt-3">
            <h4 className="text-sm font-medium mb-2">Prévisions</h4>
            <div className="grid grid-cols-3 gap-2">
              {weather?.forecast.map((day, index) => (
                <div key={index} className="text-center p-1 rounded-md bg-muted/50">
                  <div className="text-xs font-medium">{day.date}</div>
                  <div className="flex justify-center my-1">
                    {getWeatherIcon(day.conditions)}
                  </div>
                  <div className="text-sm font-bold">{day.temperature}°C</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeatherWidget;