
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MapView from "./pages/MapView";
import Comparison from "./pages/Comparison";
import Diagnostics from "./pages/Diagnostics";
import Statistics from "./pages/Statistics";
import Reports from "./pages/Reports";
import WeeklyStatsView from "./components/WeeklyStatsView";
import Navigation from "./components/Navigation";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import ProtectedRoute from "./components/ProtectedRoute";
import React, { useEffect } from "react";
import { updateAllSensorsTimestamps } from "./services/sensorService";

// Create a QueryClient instance
const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Mettre à jour les timestamps de tous les capteurs au démarrage de l'application
    updateAllSensorsTimestamps();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Navigation />
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/statistics" 
                element={
                  <ProtectedRoute>
                    <Statistics />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/map" 
                element={
                  <ProtectedRoute>
                    <MapView />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/comparison" 
                element={
                  <ProtectedRoute>
                    <Comparison />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/diagnostics" 
                element={
                  <ProtectedRoute>
                    <Diagnostics />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/reports" 
                element={
                  <ProtectedRoute>
                    <Reports />
                  </ProtectedRoute>
                } 
              />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
            <Toaster />
            <Sonner />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
