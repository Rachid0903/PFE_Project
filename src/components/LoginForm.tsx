
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [isForgotLoading, setIsForgotLoading] = useState(false);
  
  const { login, forgotPassword, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      navigate("/dashboard");
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsForgotLoading(true);
    
    try {
      await forgotPassword(forgotEmail);
      setForgotEmail("");
    } finally {
      setIsForgotLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-lora">LoRa Sensor View</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Connectez-vous pour accéder à vos capteurs
        </p>
      </div>
      
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="email">Adresse email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="nom@exemple.fr"
              className="pl-10"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="password">Mot de passe</Label>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="link" className="p-0 h-auto text-xs text-lora hover:text-lora-light">
                  Mot de passe oublié ?
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Réinitialiser votre mot de passe</DialogTitle>
                </DialogHeader>
                <form className="space-y-4" onSubmit={handleForgotPassword}>
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email">Adresse email</Label>
                    <Input
                      id="forgot-email"
                      type="email"
                      placeholder="nom@exemple.fr"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <DialogClose asChild>
                      <Button variant="outline" type="button">Annuler</Button>
                    </DialogClose>
                    <Button 
                      type="submit" 
                      disabled={isForgotLoading}
                      className="bg-lora hover:bg-lora-light text-white"
                    >
                      {isForgotLoading ? "Envoi en cours..." : "Envoyer le lien"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              className="pl-10"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Eye className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </div>
        </div>
        
        <Button 
          type="submit" 
          className="w-full bg-lora hover:bg-lora-light text-white" 
          disabled={isLoading}
        >
          {isLoading ? "Connexion en cours..." : "Se connecter"}
        </Button>
      </form>
      
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Vous n'avez pas de compte ?{" "}
          <Button 
            variant="link" 
            className="p-0 h-auto text-lora hover:text-lora-light"
            onClick={() => navigate("/register")}
          >
            Inscrivez-vous
          </Button>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
