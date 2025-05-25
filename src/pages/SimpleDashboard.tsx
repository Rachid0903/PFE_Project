import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";

const SimpleDashboard: React.FC = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  // Données simulées pour le tableau de bord
  const mockSensors = [
    { id: 1, name: "Capteur 1", temperature: 22.5, humidity: 45, status: "online" },
    { id: 2, name: "Capteur 2", temperature: 24.1, humidity: 38, status: "online" },
    { id: 3, name: "Capteur 3", temperature: 21.8, humidity: 52, status: "offline" },
  ];

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ margin: 0 }}>Tableau de bord simplifié</h1>
        <div>
          <span style={{ marginRight: '15px' }}>Connecté en tant que: {user?.email}</span>
          <button 
            onClick={handleLogout}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#f44336', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer' 
            }}
          >
            Se déconnecter
          </button>
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{ 
          backgroundColor: '#e3f2fd', 
          padding: '15px', 
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 10px 0' }}>Température moyenne</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
            {(mockSensors.reduce((sum, sensor) => sum + sensor.temperature, 0) / mockSensors.length).toFixed(1)}°C
          </p>
        </div>
        
        <div style={{ 
          backgroundColor: '#e8f5e9', 
          padding: '15px', 
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 10px 0' }}>Humidité moyenne</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
            {(mockSensors.reduce((sum, sensor) => sum + sensor.humidity, 0) / mockSensors.length).toFixed(1)}%
          </p>
        </div>
        
        <div style={{ 
          backgroundColor: '#fff3e0', 
          padding: '15px', 
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 10px 0' }}>Capteurs en ligne</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
            {mockSensors.filter(sensor => sensor.status === 'online').length} / {mockSensors.length}
          </p>
        </div>
      </div>

      <h2>Liste des capteurs</h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f5f5f5' }}>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>ID</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Nom</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Température</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Humidité</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Statut</th>
            </tr>
          </thead>
          <tbody>
            {mockSensors.map(sensor => (
              <tr key={sensor.id}>
                <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>{sensor.id}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>{sensor.name}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>{sensor.temperature}°C</td>
                <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>{sensor.humidity}%</td>
                <td style={{ padding: '12px', borderBottom: '1px solid #ddd' }}>
                  <span style={{ 
                    display: 'inline-block',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: sensor.status === 'online' ? '#e8f5e9' : '#ffebee',
                    color: sensor.status === 'online' ? '#2e7d32' : '#c62828'
                  }}>
                    {sensor.status === 'online' ? 'En ligne' : 'Hors ligne'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '30px', textAlign: 'center' }}>
        <Link 
          to="/"
          style={{ 
            display: 'inline-block',
            padding: '8px 16px', 
            backgroundColor: '#9e9e9e', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer',
            textDecoration: 'none',
            marginRight: '10px'
          }}
        >
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
};

export default SimpleDashboard;
