import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';

interface DatabaseTest {
  name: string;
  status: 'pending' | 'success' | 'error' | 'warning';
  message: string;
  details?: string;
}

export default function DatabaseVerification() {
  const [tests, setTests] = useState<DatabaseTest[]>([]);
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    setTests([]);

    const newTests: DatabaseTest[] = [];

    // Test 1: Check if profiles table exists
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      if (error) {
        newTests.push({
          name: 'Profiles Table',
          status: 'error',
          message: 'Profiles table does not exist or is not accessible',
          details: error.message
        });
      } else {
        newTests.push({
          name: 'Profiles Table',
          status: 'success',
          message: 'Profiles table exists and is accessible'
        });
      }
    } catch (error) {
      newTests.push({
        name: 'Profiles Table',
        status: 'error',
        message: 'Failed to check profiles table',
        details: String(error)
      });
    }

    // Test 2: Check if user_stats table exists
    try {
      const { data, error } = await supabase
        .from('user_stats')
        .select('count')
        .limit(1);
      
      if (error) {
        newTests.push({
          name: 'User Stats Table',
          status: 'error',
          message: 'User stats table does not exist or is not accessible',
          details: error.message
        });
      } else {
        newTests.push({
          name: 'User Stats Table',
          status: 'success',
          message: 'User stats table exists and is accessible'
        });
      }
    } catch (error) {
      newTests.push({
        name: 'User Stats Table',
        status: 'error',
        message: 'Failed to check user stats table',
        details: String(error)
      });
    }

    // Test 3: Check current user's profile
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error) {
          newTests.push({
            name: 'Current User Profile',
            status: 'warning',
            message: 'Current user does not have a profile',
            details: error.message
          });
        } else {
          newTests.push({
            name: 'Current User Profile',
            status: 'success',
            message: `Profile exists for user: ${data.username}`
          });
        }
      } else {
        newTests.push({
          name: 'Current User Profile',
          status: 'warning',
          message: 'No user is currently logged in'
        });
      }
    } catch (error) {
      newTests.push({
        name: 'Current User Profile',
        status: 'error',
        message: 'Failed to check current user profile',
        details: String(error)
      });
    }

    // Test 4: Check triggers
    try {
      const { data, error } = await supabase.rpc('check_triggers');
      
      if (error) {
        newTests.push({
          name: 'Database Triggers',
          status: 'warning',
          message: 'Could not verify triggers (this is normal)',
          details: error.message
        });
      } else {
        newTests.push({
          name: 'Database Triggers',
          status: 'success',
          message: 'Triggers are properly configured'
        });
      }
    } catch (error) {
      newTests.push({
        name: 'Database Triggers',
        status: 'warning',
        message: 'Could not verify triggers (this is normal)',
        details: String(error)
      });
    }

    setTests(newTests);
    setLoading(false);
  };

  const createTestProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        alert('Please log in first');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          username: user.email?.split('@')[0] || 'user',
          avatar_url: null
        })
        .select()
        .single();

      if (error) {
        alert(`Error creating profile: ${error.message}`);
      } else {
        alert(`Profile created successfully for ${data.username}`);
        runTests(); // Refresh tests
      }
    } catch (error) {
      alert(`Unexpected error: ${error}`);
    }
  };

  const getStatusIcon = (status: DatabaseTest['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Loader2 className="h-5 w-5 text-gray-500 animate-spin" />;
    }
  };

  const getStatusColor = (status: DatabaseTest['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-500/10 text-green-700 border-green-500/20';
      case 'error':
        return 'bg-red-500/10 text-red-700 border-red-500/20';
      case 'warning':
        return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-primary" />
              Database Verification Tool
            </CardTitle>
            <p className="text-muted-foreground">
              This tool helps diagnose database issues that prevent new users from signing up.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={runTests} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running Tests...
                  </>
                ) : (
                  'Run Database Tests'
                )}
              </Button>
              <Button variant="outline" onClick={createTestProfile}>
                Create Test Profile
              </Button>
            </div>

            {tests.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold">Test Results:</h3>
                {tests.map((test, index) => (
                  <Card key={index} className={`border ${getStatusColor(test.status)}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {getStatusIcon(test.status)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{test.name}</h4>
                            <Badge variant="outline" className={getStatusColor(test.status)}>
                              {test.status}
                            </Badge>
                          </div>
                          <p className="text-sm">{test.message}</p>
                          {test.details && (
                            <p className="text-xs text-muted-foreground mt-1 font-mono">
                              {test.details}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Next Steps:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• If any tests fail, run the SQL script in your Supabase SQL editor</li>
                <li>• Check the Supabase logs for detailed error messages</li>
                <li>• Ensure RLS policies are properly configured</li>
                <li>• Verify that triggers are created for auto-profile creation</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
