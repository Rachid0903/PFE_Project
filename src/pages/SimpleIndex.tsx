import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";

const SimpleIndex: React.FC = () => {
  const { login, isAuthenticated } = useAuth();

  const handleLogin = () => {
    login("test@example.com", "password123");
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Page d'accueil simplifiée</h1>
      {isAuthenticated ? (
        <div>
          <p>Vous êtes connecté!</p>
          <Link 
            to="/dashboard"
            style={{ 
              display: 'inline-block',
              padding: '8px 16px', 
              backgroundColor: '#2196F3', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer',
              textDecoration: 'none',
              marginTop: '10px'
            }}
          >
            Accéder au tableau de bord
          </Link>
        </div>
      ) : (
        <div>
          <p>Vous n'êtes pas connecté.</p>
          <button 
            onClick={handleLogin}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#4CAF50', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer' 
            }}
          >
            Se connecter (simulation)
          </button>
        </div>
      )}
    </div>
  );
};

export default SimpleIndex;
