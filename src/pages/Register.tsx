
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import RegisterForm from "@/components/RegisterForm";
import { useAuth } from "@/contexts/AuthContext";

const Register: React.FC = () => {
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
        <RegisterForm />
      </div>
    </div>
  );
};

export default Register;
