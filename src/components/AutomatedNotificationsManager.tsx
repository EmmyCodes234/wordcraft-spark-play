import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { 
  Clock, 
  Users, 
  TrendingUp, 
  Star, 
  Zap, 
  Target,
  CheckCircle,
  XCircle,
  Play,
  Pause
} from 'lucide-react';

const AutomatedNotificationsManager: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runNotificationFunction = async (functionName: string, description: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc(functionName);
      
      if (error) {
        setResults({ 
          success: false, 
          function: functionName,
          description,
          error: error.message 
        });
      } else {
        setResults({ 
          success: true, 
          function: functionName,
          description,
          data 
        });
      }
    } catch (error) {
      setResults({ 
        success: false, 
        function: functionName,
        description,
        error: error.message 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const notificationFunctions = [
    {
      name: 'send_smart_recommendations',
      title: 'Smart Recommendations',
      description: 'Send personalized recommendations based on user activity',
      icon: <Target className="h-5 w-5" />,
      color: 'bg-blue-500'
    },
    {
      name: 'send_morning_notifications',
      title: 'Morning Motivation',
      description: 'Send morning motivation to active users',
      icon: <Clock className="h-5 w-5" />,
      color: 'bg-yellow-500'
    },
    {
      name: 'send_evening_notifications',
      title: 'Evening Wrap-up',
      description: 'Send evening reflection notifications',
      icon: <Clock className="h-5 w-5" />,
      color: 'bg-purple-500'
    },
    {
      name: 'send_weekly_progress',
      title: 'Weekly Progress',
      description: 'Send weekly progress summaries',
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'bg-green-500'
    },
    {
      name: 'send_feature_discovery',
      title: 'Feature Discovery',
      description: 'Suggest new features to users',
      icon: <Star className="h-5 w-5" />,
      color: 'bg-orange-500'
    },
    {
      name: 'check_achievements',
      title: 'Achievement Check',
      description: 'Check and send achievement notifications',
      icon: <Zap className="h-5 w-5" />,
      color: 'bg-red-500'
    },
    {
      name: 'send_engagement_notifications',
      title: 'Engagement Boost',
      description: 'Send engagement-based notifications',
      icon: <Users className="h-5 w-5" />,
      color: 'bg-indigo-500'
    },
    {
      name: 'run_daily_notifications',
      title: 'Daily Batch',
      description: 'Run all daily notification functions',
      icon: <Play className="h-5 w-5" />,
      color: 'bg-pink-500'
    }
  ];

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p>Please log in to manage automated notifications.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-6 w-6" />
            Automated Notifications Manager
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Manage automated notifications that are sent based on user behavior and app state.
            These notifications are personalized and triggered automatically.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {notificationFunctions.map((func) => (
              <Card key={func.name} className="border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-full ${func.color} text-white`}>
                        {func.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold">{func.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {func.description}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => runNotificationFunction(func.name, func.description)}
                    disabled={isLoading}
                    className="w-full"
                    size="sm"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Run Now
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {results.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              Execution Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant={results.success ? "default" : "destructive"}>
                  {results.success ? "Success" : "Error"}
                </Badge>
                <span className="font-medium">{results.function}</span>
              </div>
              <p className="text-sm text-muted-foreground">{results.description}</p>
              
              {results.error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded">
                  <p className="text-sm text-red-600">{results.error}</p>
                </div>
              )}
              
              {results.data && (
                <div className="p-3 bg-green-50 border border-green-200 rounded">
                  <p className="text-sm text-green-600">
                    Function executed successfully
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <h4 className="font-medium">🤖 Automatic Triggers:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• New user registration → Welcome notifications</li>
              <li>• User activity → Re-engagement or streak notifications</li>
              <li>• Quiz completion → Achievement and recommendation notifications</li>
              <li>• Word discovery → Milestone notifications</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">⏰ Scheduled Notifications:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• Morning motivation for active users</li>
              <li>• Evening wrap-up and reflection</li>
              <li>• Weekly progress summaries</li>
              <li>• Feature discovery suggestions</li>
              <li>• Achievement milestone checks</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">🎯 Smart Recommendations:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• Based on user activity level</li>
              <li>• Based on learning progress</li>
              <li>• Based on feature usage</li>
              <li>• Personalized to user's skill level</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AutomatedNotificationsManager;
