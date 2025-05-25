import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const SimpleNavigation: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return null;
  }

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav style={{ 
      backgroundColor: '#f8f9fa', 
      padding: '10px 20px', 
      marginBottom: '20px',
      borderBottom: '1px solid #e9ecef'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        maxWidth: '1000px',
        margin: '0 auto'
      }}>
        <div>
          <Link 
            to="/" 
            style={{ 
              fontWeight: 'bold', 
              fontSize: '18px', 
              color: '#333',
              textDecoration: 'none'
            }}
          >
            IoT Monitor
          </Link>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
          <Link 
            to="/dashboard" 
            style={{ 
              color: isActive('/dashboard') ? '#007bff' : '#6c757d',
              textDecoration: 'none',
              fontWeight: isActive('/dashboard') ? 'bold' : 'normal'
            }}
          >
            Tableau de bord
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default SimpleNavigation;