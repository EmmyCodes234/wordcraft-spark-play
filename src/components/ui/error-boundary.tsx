import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Link } from "react-router-dom";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  private handleGoHome = () => {
    window.location.href = "/dashboard";
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-0 shadow-lg">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-xl font-semibold text-foreground">
                Oops! Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                We encountered an unexpected error. Don't worry, your data is safe.
              </p>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    Error Details (Development)
                  </summary>
                  <div className="mt-2 p-3 bg-muted rounded-md overflow-auto">
                    <p className="font-mono text-destructive mb-2">
                      {this.state.error.message}
                    </p>
                    {this.state.errorInfo && (
                      <pre className="text-xs text-muted-foreground whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                </details>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button 
                  onClick={this.handleRetry} 
                  className="flex-1"
                  variant="outline"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button 
                  onClick={this.handleGoHome} 
                  className="flex-1"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Error state component for specific error scenarios
export const ErrorState = ({ 
  title = "Something went wrong",
  message = "An error occurred while loading this content.",
  action,
  onRetry,
  className,
  ...props 
}: {
  title?: string;
  message?: string;
  action?: ReactNode;
  onRetry?: () => void;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div 
      className={`error-state ${className || ''}`}
      {...props}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-semibold text-foreground mb-1">{title}</h3>
          <p className="text-sm text-muted-foreground mb-3">{message}</p>
          {action && (
            <div className="flex gap-2">
              {onRetry && (
                <Button 
                  onClick={onRetry} 
                  size="sm" 
                  variant="outline"
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Retry
                </Button>
              )}
              {action}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Network error component
export const NetworkError = ({ 
  onRetry,
  ...props 
}: {
  onRetry?: () => void;
} & React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <ErrorState
      title="Connection Error"
      message="Unable to connect to the server. Please check your internet connection and try again."
      onRetry={onRetry}
      action={
        <Button size="sm" variant="outline" asChild>
          <Link to="/dashboard">Go to Dashboard</Link>
        </Button>
      }
      {...props}
    />
  );
};

// Not found error component
export const NotFoundError = ({ 
  title = "Page Not Found",
  message = "The page you're looking for doesn't exist.",
  ...props 
}: {
  title?: string;
  message?: string;
} & React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <AlertTriangle className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl font-semibold text-foreground">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            {message}
          </p>
          <div className="flex justify-center">
            <Button asChild>
              <Link to="/dashboard">
                <Home className="w-4 h-4 mr-2" />
                Go to Dashboard
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Permission error component
export const PermissionError = ({ 
  onRetry,
  ...props 
}: {
  onRetry?: () => void;
} & React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <ErrorState
      title="Access Denied"
      message="You don't have permission to access this resource. Please contact your administrator if you believe this is an error."
      onRetry={onRetry}
      action={
        <Button size="sm" variant="outline" asChild>
          <Link to="/dashboard">Go to Dashboard</Link>
        </Button>
      }
      {...props}
    />
  );
};