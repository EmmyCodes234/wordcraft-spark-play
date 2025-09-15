import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star, Target, Zap, Crown, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import PostCreation from '@/components/PostCreation';
import PostDisplay from '@/components/PostDisplay';

interface SocialPost {
  id: string;
  user_id: string;
  username: string;
  avatar_url?: string;
  type: string;
  content: any;
  content_text?: string;
  image_url?: string;
  shared_from_post_id?: string;
  privacy: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
  reactions_count: number;
  comments_count: number;
  shares_count: number;
  user_reaction?: string;
}

export default function SocialFeed() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPostCreation, setShowPostCreation] = useState(false);

  useEffect(() => {
    fetchSocialFeed();
  }, []);

  const fetchSocialFeed = async () => {
    try {
      // First try the enhanced query with new tables
      const { data, error } = await supabase
        .from('social_posts')
        .select(`
          *,
          profiles!inner(username, avatar_url),
          post_reactions!left(user_id, reaction_type),
          post_comments!left(id),
          post_shares!left(id)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      // If enhanced query fails, try basic query
      if (error && (error.code === 'PGRST200' || error.message.includes('relation') || error.message.includes('schema'))) {
        console.log('Enhanced tables not found, falling back to basic query');
        
        const { data: basicData, error: basicError } = await supabase
          .from('social_posts')
          .select(`
            *,
            profiles!inner(username, avatar_url),
            post_likes!left(user_id)
          `)
          .order('created_at', { ascending: false })
          .limit(20);

        // If profiles relationship fails, try the view
        if (basicError && (basicError.code === 'PGRST200' || basicError.message.includes('profiles'))) {
          console.log('Profiles relationship not found, trying view');
          
          const { data: viewData, error: viewError } = await supabase
            .from('social_posts_with_profiles')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);

          if (!viewError && viewData) {
            console.log('Using view successfully');
            const processedPosts = viewData?.map(post => ({
              ...post,
              reactions_count: 0,
              comments_count: 0,
              shares_count: 0,
              user_reaction: undefined
            })) || [];
            setPosts(processedPosts);
            return;
          }

          // If view fails, try posts without profiles
          console.log('View failed, using posts without profiles');
          const { data: postsOnly, error: postsError } = await supabase
            .from('social_posts')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(20);

          // If social_posts table doesn't exist, show empty state
          if (postsError && (postsError.code === 'PGRST200' || postsError.message.includes('relation') || postsError.message.includes('schema'))) {
            console.log('Social posts table not found, showing empty state');
            setPosts([]);
            return;
          }

          if (postsError) throw postsError;

          // Process posts without profiles (use user_id as username)
          const processedPosts = postsOnly?.map(post => ({
            ...post,
            username: `User ${post.user_id.slice(0, 8)}`,
            avatar_url: null,
            reactions_count: 0,
            comments_count: 0,
            shares_count: 0,
            user_reaction: undefined
          })) || [];

          setPosts(processedPosts);
          return;
        }

        if (basicError) throw basicError;

        // Process basic posts
        const processedPosts = basicData?.map(post => ({
          ...post,
          username: post.profiles.username,
          avatar_url: post.profiles.avatar_url,
          reactions_count: post.post_likes?.length || 0,
          comments_count: 0,
          shares_count: 0,
          user_reaction: post.post_likes?.some(like => like.user_id === user?.id) ? 'like' : undefined
        })) || [];

        setPosts(processedPosts);
        return;
      }

      if (error) throw error;

      // Process enhanced posts
      const processedPosts = data?.map(post => {
        const userReaction = post.post_reactions?.find(r => r.user_id === user?.id);
        return {
          ...post,
          username: post.profiles.username,
          avatar_url: post.profiles.avatar_url,
          reactions_count: post.post_reactions?.length || 0,
          comments_count: post.post_comments?.length || 0,
          shares_count: post.post_shares?.length || 0,
          user_reaction: userReaction?.reaction_type
        };
      }) || [];

      setPosts(processedPosts);
    } catch (error) {
      console.error('Error fetching social feed:', error);
      toast({
        title: "Error",
        description: "Failed to load social feed",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const shareAchievement = async (type: string, data: any) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('social_posts')
        .insert({
          user_id: user.id,
          type,
          content: {
            title: data.title,
            description: data.description,
            data
          },
          content_text: data.description,
          privacy: 'public'
        });

      if (error) throw error;

      toast({
        title: "Shared!",
        description: "Your achievement has been shared with the community",
      });

      // Refresh feed
      fetchSocialFeed();
    } catch (error) {
      console.error('Error sharing achievement:', error);
      toast({
        title: "Error",
        description: "Failed to share achievement",
        variant: "destructive"
      });
    }
  };

  const getPostIcon = (type: string) => {
    switch (type) {
      case 'achievement': return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 'word_discovery': return <Star className="h-5 w-5 text-blue-500" />;
      case 'quiz_result': return <Target className="h-5 w-5 text-green-500" />;
      case 'streak': return <Zap className="h-5 w-5 text-orange-500" />;
      case 'challenge_complete': return <Trophy className="h-5 w-5 text-orange-500" />;
      case 'user_post': return <Star className="h-5 w-5 text-purple-500" />;
      case 'shared_post': return <Crown className="h-5 w-5 text-blue-500" />;
      default: return <Star className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Community Feed</h1>
          <p className="text-muted-foreground">
            Share your achievements and connect with fellow word enthusiasts
          </p>
        </div>

        {/* Post Creation */}
        <PostCreation 
          onPostCreated={fetchSocialFeed}
          placeholder="What's on your mind?"
        />

        {/* Quick Share Buttons */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Share</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => shareAchievement('achievement', {
                  title: 'Achievement Unlocked!',
                  description: 'Just unlocked a new achievement!'
                })}
                className="flex items-center space-x-2"
              >
                <Trophy className="h-4 w-4" />
                <span>Share Achievement</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => shareAchievement('word_discovery', {
                  title: 'New Word Learned!',
                  description: 'Just learned a new word!'
                })}
                className="flex items-center space-x-2"
              >
                <Star className="h-4 w-4" />
                <span>Share Word</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => shareAchievement('quiz_result', {
                  title: 'Quiz Completed!',
                  description: 'Just completed a quiz!'
                })}
                className="flex items-center space-x-2"
              >
                <Target className="h-4 w-4" />
                <span>Share Quiz</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => shareAchievement('streak', {
                  title: 'Streak Maintained!',
                  description: 'Keeping up the learning streak!'
                })}
                className="flex items-center space-x-2"
              >
                <Zap className="h-4 w-4" />
                <span>Share Streak</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Posts Feed */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">No posts yet</h3>
                <p className="text-muted-foreground">
                  Be the first to share something with the community!
                </p>
                <Button onClick={() => setShowPostCreation(true)} className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Post
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {posts.map((post) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <PostDisplay 
                    post={post} 
                    onPostUpdated={fetchSocialFeed}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Load More Button */}
        {posts.length > 0 && (
          <div className="text-center">
            <Button variant="outline" onClick={fetchSocialFeed}>
              Load More Posts
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
