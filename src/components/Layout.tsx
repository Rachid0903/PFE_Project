import React from "react";
import { Outlet } from "react-router-dom";
import Navigation from "./Navigation";
import { useTheme } from "@/contexts/ThemeContext";

const Layout: React.FC = () => {
  const { theme } = useTheme();
  
  return (
    <div className={theme}>
      <div className="min-h-screen bg-background text-foreground">
        <Navigation />
        <main className="pb-16">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;

