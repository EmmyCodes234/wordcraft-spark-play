import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function DatabaseTest() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    const results = [];

    // Test 1: Check if profiles table exists and has data
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);
      
      results.push({
        test: 'Profiles Table',
        status: profilesError ? '❌ ERROR' : profiles ? '✅ EXISTS' : '⚠️ EMPTY',
        details: profilesError?.message || `Found ${profiles?.length || 0} profiles`
      });
    } catch (error) {
      results.push({
        test: 'Profiles Table',
        status: '❌ ERROR',
        details: error.message
      });
    }

    // Test 2: Check if social_posts table exists and has data
    try {
      const { data: posts, error: postsError } = await supabase
        .from('social_posts')
        .select('*')
        .limit(1);
      
      results.push({
        test: 'Social Posts Table',
        status: postsError ? '❌ ERROR' : posts ? '✅ EXISTS' : '⚠️ EMPTY',
        details: postsError?.message || `Found ${posts?.length || 0} posts`
      });
    } catch (error) {
      results.push({
        test: 'Social Posts Table',
        status: '❌ ERROR',
        details: error.message
      });
    }

    // Test 3: Test the relationship query
    try {
      const { data: relationship, error: relationshipError } = await supabase
        .from('social_posts')
        .select(`
          *,
          profiles!inner(username, avatar_url)
        `)
        .limit(1);
      
      results.push({
        test: 'Profiles Relationship',
        status: relationshipError ? '❌ ERROR' : relationship ? '✅ WORKS' : '⚠️ NO DATA',
        details: relationshipError?.message || 'Relationship query successful'
      });
    } catch (error) {
      results.push({
        test: 'Profiles Relationship',
        status: '❌ ERROR',
        details: error.message
      });
    }

    // Test 4: Test enhanced tables
    try {
      const { data: reactions, error: reactionsError } = await supabase
        .from('post_reactions')
        .select('*')
        .limit(1);
      
      results.push({
        test: 'Post Reactions Table',
        status: reactionsError ? '❌ ERROR' : '✅ EXISTS',
        details: reactionsError?.message || 'Enhanced table exists'
      });
    } catch (error) {
      results.push({
        test: 'Post Reactions Table',
        status: '❌ ERROR',
        details: error.message
      });
    }

    // Test 5: Test comments table
    try {
      const { data: comments, error: commentsError } = await supabase
        .from('post_comments')
        .select('*')
        .limit(1);
      
      results.push({
        test: 'Post Comments Table',
        status: commentsError ? '❌ ERROR' : '✅ EXISTS',
        details: commentsError?.message || 'Comments table exists'
      });
    } catch (error) {
      results.push({
        test: 'Post Comments Table',
        status: '❌ ERROR',
        details: error.message
      });
    }

    setTestResults(results);
    setLoading(false);
  };

  const createTestData = async () => {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('You must be logged in to create test data');
      }

      // Create a profile for current user
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username: user.email?.split('@')[0] || 'test_user',
          avatar_url: 'https://via.placeholder.com/150'
        });

      if (profileError) throw profileError;

      // Create a test post
      const { error: postError } = await supabase
        .from('social_posts')
        .insert({
          user_id: user.id,
          type: 'user_post',
          content: { title: 'Test Post', description: 'This is a test post' },
          content_text: 'This is a test post'
        });

      if (postError) throw postError;

      alert('Test data created successfully!');
      runTests(); // Re-run tests
    } catch (error) {
      alert(`Error creating test data: ${error.message}`);
    }
  };

  useEffect(() => {
    runTests();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Database Connection Test</CardTitle>
          <div className="flex gap-2">
            <Button onClick={runTests} disabled={loading}>
              {loading ? 'Testing...' : 'Run Tests'}
            </Button>
            <Button onClick={createTestData} variant="outline">
              Create Test Data
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {testResults.map((result, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{result.test}</div>
                  <div className="text-sm text-muted-foreground">{result.details}</div>
                </div>
                <Badge variant={result.status.includes('✅') ? 'default' : result.status.includes('⚠️') ? 'secondary' : 'destructive'}>
                  {result.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
