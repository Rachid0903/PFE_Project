
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "@/components/LoginForm";
import { useAuth } from "@/contexts/AuthContext";

const Login: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate, isLoading]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-lora-accent/20">
      <div className="w-full max-w-md px-8 py-10 bg-white rounded-lg shadow-lg">
        <LoginForm />
      </div>
    </div>
  );
};

export default Login;
