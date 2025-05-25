import React, { createContext, useContext, useState, useEffect } from 'react';
import { database } from '@/services/firebaseConfig';
import { ref, onValue, set } from 'firebase/database';
import { useAuth } from './AuthContext';

export type WidgetType = 'temperature' | 'humidity' | 'rssi' | 'battery' | 'weather' | 'map' | 'prediction';

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  sensorId?: string;
  size: 'small' | 'medium' | 'large';
  position: number;
}

interface DashboardContextType {
  widgets: DashboardWidget[];
  addWidget: (widget: Omit<DashboardWidget, 'id'>) => void;
  removeWidget: (id: string) => void;
  updateWidget: (id: string, updates: Partial<Omit<DashboardWidget, 'id'>>) => void;
  reorderWidgets: (newOrder: DashboardWidget[]) => void;
  isLoading: boolean;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setWidgets([]);
      setIsLoading(false);
      return;
    }

    const widgetsRef = ref(database, `users/${user.uid}/dashboard/widgets`);
    
    const unsubscribe = onValue(widgetsRef, (snapshot) => {
      if (snapshot.exists()) {
        const widgetsData = snapshot.val();
        const widgetsArray = Object.keys(widgetsData).map(key => ({
          id: key,
          ...widgetsData[key]
        }));
        
        // Trier par position
        widgetsArray.sort((a, b) => a.position - b.position);
        setWidgets(widgetsArray);
      } else {
        // Widgets par défaut si aucun n'existe
        const defaultWidgets: DashboardWidget[] = [
          {
            id: 'temp-widget-1',
            type: 'temperature',
            title: 'Température',
            size: 'medium',
            position: 0
          },
          {
            id: 'humidity-widget-1',
            type: 'humidity',
            title: 'Humidité',
            size: 'medium',
            position: 1
          },
          {
            id: 'map-widget-1',
            type: 'map',
            title: 'Carte des capteurs',
            size: 'large',
            position: 2
          }
        ];
        
        // Sauvegarder les widgets par défaut
        const widgetsObject = defaultWidgets.reduce((acc, widget) => {
          acc[widget.id] = {
            type: widget.type,
            title: widget.title,
            size: widget.size,
            position: widget.position,
            ...(widget.sensorId && { sensorId: widget.sensorId })
          };
          return acc;
        }, {});
        
        set(widgetsRef, widgetsObject);
        setWidgets(defaultWidgets);
      }
      
      setIsLoading(false);
    });
    
    return () => unsubscribe();
  }, [user]);

  const addWidget = (widget: Omit<DashboardWidget, 'id'>) => {
    if (!user) return;
    
    const newWidgetId = `widget-${Date.now()}`;
    const widgetRef = ref(database, `users/${user.uid}/dashboard/widgets/${newWidgetId}`);
    
    set(widgetRef, {
      ...widget,
      position: widgets.length
    });
  };

  const removeWidget = (id: string) => {
    if (!user) return;
    
    const widgetRef = ref(database, `users/${user.uid}/dashboard/widgets/${id}`);
    set(widgetRef, null);
  };

  const updateWidget = (id: string, updates: Partial<Omit<DashboardWidget, 'id'>>) => {
    if (!user) return;
    
    const widgetIndex = widgets.findIndex(w => w.id === id);
    if (widgetIndex === -1) return;
    
    const updatedWidget = { ...widgets[widgetIndex], ...updates };
    const widgetRef = ref(database, `users/${user.uid}/dashboard/widgets/${id}`);
    
    set(widgetRef, {
      type: updatedWidget.type,
      title: updatedWidget.title,
      size: updatedWidget.size,
      position: updatedWidget.position,
      ...(updatedWidget.sensorId && { sensorId: updatedWidget.sensorId })
    });
  };

  const reorderWidgets = (newOrder: DashboardWidget[]) => {
    if (!user) return;
    
    // Mettre à jour les positions
    const updates = {};
    newOrder.forEach((widget, index) => {
      updates[`users/${user.uid}/dashboard/widgets/${widget.id}/position`] = index;
    });
    
    // Mettre à jour la base de données
    Object.keys(updates).forEach(path => {
      set(ref(database, path), updates[path]);
    });
  };

  return (
    <DashboardContext.Provider value={{ 
      widgets, 
      addWidget, 
      removeWidget, 
      updateWidget, 
      reorderWidgets,
      isLoading
    }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};