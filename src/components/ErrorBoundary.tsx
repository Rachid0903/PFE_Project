import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({
      error,
      errorInfo
    });
    
    // Afficher plus de détails sur l'erreur pour le débogage
    console.error("Erreur capturée par ErrorBoundary:", error);
    console.error("Stack des composants:", errorInfo.componentStack);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 bg-gray-50 rounded-lg border border-gray-200">
          <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Une erreur est survenue</h2>
          <p className="text-gray-600 mb-4 text-center">
            {this.state.error && this.state.error.toString()}
          </p>
          <div className="text-xs text-gray-500 max-h-[200px] overflow-auto p-2 bg-gray-100 rounded w-full mb-4">
            <pre>{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
          </div>
          <Button onClick={this.handleReset} variant="outline" className="mt-2">
            Réessayer
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;




