
import React, { createContext, useState, useContext, ReactNode, useEffect } from "react";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";
import { auth } from "@/services/firebaseConfig";
import { toast } from "@/components/ui/use-toast";

interface User {
  id: string;
  email: string | null;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<boolean>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Observer for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // User is logged in
        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email,
        });
      } else {
        // User is logged out
        setUser(null);
      }
      setIsLoading(false);
    });

    // Clean up subscription when component unmounts
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Connexion réussie",
        description: "Vous êtes maintenant connecté",
      });
      return true;
    } catch (error: any) {
      let message = "Une erreur est survenue lors de la connexion";
      
      if (error.code === "auth/invalid-credential") {
        message = "Email ou mot de passe incorrect";
      } else if (error.code === "auth/user-not-found") {
        message = "Aucun utilisateur trouvé avec cet email";
      } else if (error.code === "auth/wrong-password") {
        message = "Mot de passe incorrect";
      }
      
      toast({
        title: "Échec de connexion",
        description: message,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      await createUserWithEmailAndPassword(auth, email, password);
      
      toast({
        title: "Inscription réussie",
        description: "Votre compte a été créé avec succès",
      });
      return true;
    } catch (error: any) {
      let message = "Une erreur est survenue lors de l'inscription";
      
      if (error.code === "auth/email-already-in-use") {
        message = "Cet email est déjà utilisé";
      } else if (error.code === "auth/weak-password") {
        message = "Mot de passe trop faible";
      } else if (error.code === "auth/invalid-email") {
        message = "Format d'email invalide";
      }
      
      toast({
        title: "Erreur",
        description: message,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
      toast({
        title: "Déconnexion réussie",
        description: "Vous êtes maintenant déconnecté",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la déconnexion",
        variant: "destructive",
      });
    }
  };

  const forgotPassword = async (email: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      await sendPasswordResetEmail(auth, email);
      
      toast({
        title: "Email envoyé",
        description: "Un email de réinitialisation a été envoyé à votre adresse",
      });
      return true;
    } catch (error: any) {
      let message = "Une erreur est survenue lors de la demande de réinitialisation";
      
      if (error.code === "auth/user-not-found") {
        message = "Aucun utilisateur trouvé avec cet email";
      }
      
      toast({
        title: "Erreur",
        description: message,
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    forgotPassword,
    isLoading
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
