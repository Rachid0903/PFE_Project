import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, AlertTriangle, Mail, Phone } from "lucide-react";
import { getAlertConfig } from "@/services/alertService";
import { getTwilioConfig } from "@/services/smsService";

const AlertServiceStatus: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [services, setServices] = useState({
    email: { enabled: false, configured: false },
    sms: { enabled: false, configured: false }
  });

  useEffect(() => {
    const loadServiceStatus = async () => {
      try {
        const [alertConfig, twilioConfig] = await Promise.all([
          getAlertConfig(),
          getTwilioConfig()
        ]);

        setServices({
          email: {
            enabled: alertConfig.enabled,
            configured: !!alertConfig.userEmail && alertConfig.userEmail.includes('@')
          },
          sms: {
            enabled: alertConfig.enabled,
            configured: !!twilioConfig.accountSid && !!twilioConfig.authToken && !!twilioConfig.fromNumber
          }
        });
      } catch (error) {
        console.error("Erreur lors du chargement des statuts des services:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadServiceStatus();
  }, []);

  const getStatusIcon = (service: { enabled: boolean; configured: boolean }) => {
    if (!service.enabled) {
      return <XCircle className="h-5 w-5 text-muted-foreground" />;
    }
    
    if (!service.configured) {
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
    
    return <CheckCircle className="h-5 w-5 text-green-500" />;
  };

  const getStatusText = (service: { enabled: boolean; configured: boolean }) => {
    if (!service.enabled) {
      return "Désactivé";
    }
    
    if (!service.configured) {
      return "Non configuré";
    }
    
    return "Actif";
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>État des services d'alerte</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Mail className="h-5 w-5 mr-2" />
              <span>Email</span>
            </div>
            <div className="flex items-center">
              {getStatusIcon(services.email)}
              <span className="ml-2">{getStatusText(services.email)}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Phone className="h-5 w-5 mr-2" />
              <span>SMS</span>
            </div>
            <div className="flex items-center">
              {getStatusIcon(services.sms)}
              <span className="ml-2">{getStatusText(services.sms)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AlertServiceStatus;







