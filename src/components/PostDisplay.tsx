import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreHorizontal, 
  ThumbsUp,
  Smile,
  Image as ImageIcon,
  Reply,
  Flag,
  Edit,
  Trash2,
  Clock,
  Globe,
  Users,
  Lock
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

interface Post {
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

interface Comment {
  id: string;
  user_id: string;
  username: string;
  avatar_url?: string;
  content: string;
  image_url?: string;
  parent_comment_id?: string;
  created_at: string;
  updated_at: string;
  reactions_count: number;
  replies_count: number;
  user_reaction?: string;
}

interface PostDisplayProps {
  post: Post;
  onPostUpdated?: () => void;
}

export default function PostDisplay({ post, onPostUpdated }: PostDisplayProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  const reactionTypes = [
    { type: 'like', emoji: '👍', color: 'text-blue-500' },
    { type: 'love', emoji: '❤️', color: 'text-red-500' },
    { type: 'laugh', emoji: '😂', color: 'text-yellow-500' },
    { type: 'wow', emoji: '😮', color: 'text-purple-500' },
    { type: 'sad', emoji: '😢', color: 'text-gray-500' },
    { type: 'angry', emoji: '😠', color: 'text-orange-500' }
  ];

  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [showComments]);

  const fetchComments = async () => {
    setIsLoadingComments(true);
    try {
      const { data, error } = await supabase
        .rpc('get_post_comments_with_details', { post_uuid: post.id });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleReaction = async (reactionType: string) => {
    if (!user) return;

    try {
      if (post.user_reaction === reactionType) {
        // Remove reaction
        const { error } = await supabase
          .from('post_reactions')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);

        // If enhanced reactions fail, try basic likes
        if (error && (error.code === 'PGRST200' || error.message.includes('relation') || error.message.includes('schema'))) {
          console.log('Enhanced reactions not found, using basic likes');
          
          const { error: likeError } = await supabase
            .from('post_likes')
            .delete()
            .eq('post_id', post.id)
            .eq('user_id', user.id);

          if (likeError) throw likeError;
        } else if (error) {
          throw error;
        }
      } else {
        // Add/update reaction
        const { error } = await supabase
          .from('post_reactions')
          .upsert({
            post_id: post.id,
            user_id: user.id,
            reaction_type: reactionType
          });

        // If enhanced reactions fail, try basic likes
        if (error && (error.code === 'PGRST200' || error.message.includes('relation') || error.message.includes('schema'))) {
          console.log('Enhanced reactions not found, using basic likes');
          
          if (reactionType === 'like') {
            const { error: likeError } = await supabase
              .from('post_likes')
              .upsert({
                post_id: post.id,
                user_id: user.id
              });

            if (likeError) throw likeError;
          }
        } else if (error) {
          throw error;
        }
      }

      onPostUpdated?.();
    } catch (error) {
      console.error('Error updating reaction:', error);
    }
  };

  const handleComment = async () => {
    if (!user || !newComment.trim()) return;

    setIsPostingComment(true);
    try {
      const { error } = await supabase
        .from('post_comments')
        .insert({
          post_id: post.id,
          user_id: user.id,
          content: newComment.trim(),
          parent_comment_id: replyingTo || null
        });

      // If enhanced comments fail, show message
      if (error && (error.code === 'PGRST200' || error.message.includes('relation') || error.message.includes('schema'))) {
        console.log('Enhanced comments not found');
        toast({
          title: "Comments not available",
          description: "Please set up the enhanced database schema to enable comments",
        });
        return;
      }

      if (error) throw error;

      setNewComment('');
      setReplyingTo(null);
      fetchComments();
      onPostUpdated?.();

      toast({
        title: "Comment posted!",
        description: "Your comment has been added",
      });
    } catch (error) {
      console.error('Error posting comment:', error);
      toast({
        title: "Error",
        description: "Failed to post comment",
        variant: "destructive"
      });
    } finally {
      setIsPostingComment(false);
    }
  };

  const handleShare = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('social_posts')
        .insert({
          user_id: user.id,
          type: 'shared_post',
          content: {
            title: `Shared by ${user.user_metadata?.full_name || user.email}`,
            description: post.content_text || post.content?.description || 'Shared post'
          },
          content_text: `Shared: ${post.content_text || post.content?.description || ''}`,
          shared_from_post_id: post.id,
          privacy: 'public'
        });

      if (error) throw error;

      toast({
        title: "Post shared!",
        description: "The post has been shared to your timeline",
      });

      onPostUpdated?.();
    } catch (error) {
      console.error('Error sharing post:', error);
      toast({
        title: "Error",
        description: "Failed to share post",
        variant: "destructive"
      });
    }
  };

  const getPrivacyIcon = () => {
    switch (post.privacy) {
      case 'public': return <Globe className="h-3 w-3" />;
      case 'friends': return <Users className="h-3 w-3" />;
      case 'private': return <Lock className="h-3 w-3" />;
    }
  };

  const getReactionEmoji = (type: string) => {
    return reactionTypes.find(r => r.type === type)?.emoji || '👍';
  };

  const getReactionColor = (type: string) => {
    return reactionTypes.find(r => r.type === type)?.color || 'text-blue-500';
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.avatar_url} />
              <AvatarFallback>
                {post.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-sm">{post.username}</h3>
                {getPrivacyIcon()}
              </div>
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Post Content */}
        {post.content_text && (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {post.content_text}
          </p>
        )}

        {/* Post Image */}
        {post.image_url && (
          <div className="relative">
            <img
              src={post.image_url}
              alt="Post content"
              className="w-full max-h-96 object-cover rounded-lg"
            />
          </div>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                #{tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Reactions Summary */}
        {(post.reactions_count > 0 || post.comments_count > 0 || post.shares_count > 0) && (
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
            <div className="flex items-center space-x-4">
              {post.reactions_count > 0 && (
                <div className="flex items-center space-x-1">
                  <span className="text-lg">{getReactionEmoji(post.user_reaction || 'like')}</span>
                  <span>{post.reactions_count}</span>
                </div>
              )}
              {post.comments_count > 0 && (
                <span>{post.comments_count} comment{post.comments_count !== 1 ? 's' : ''}</span>
              )}
              {post.shares_count > 0 && (
                <span>{post.shares_count} share{post.shares_count !== 1 ? 's' : ''}</span>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleReaction('like')}
              className={`flex items-center space-x-2 ${post.user_reaction === 'like' ? 'text-blue-500' : ''}`}
            >
              <ThumbsUp className="h-4 w-4" />
              <span>Like</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowReactions(!showReactions)}
              className="flex items-center space-x-2"
            >
              <Smile className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-2"
          >
            <MessageCircle className="h-4 w-4" />
            <span>Comment</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="flex items-center space-x-2"
          >
            <Share2 className="h-4 w-4" />
            <span>Share</span>
          </Button>
        </div>

        {/* Reaction Picker */}
        <AnimatePresence>
          {showReactions && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex items-center space-x-2 p-2 bg-muted rounded-lg"
            >
              {reactionTypes.map((reaction) => (
                <Button
                  key={reaction.type}
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    handleReaction(reaction.type);
                    setShowReactions(false);
                  }}
                  className="text-lg hover:scale-110 transition-transform"
                >
                  {reaction.emoji}
                </Button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Comments Section */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-3"
            >
              {/* Comment Input */}
              <div className="flex items-start space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback>
                    {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <Textarea
                    placeholder={replyingTo ? "Write a reply..." : "Write a comment..."}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[60px] resize-none"
                    maxLength={500}
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {replyingTo && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setReplyingTo(null)}
                        >
                          Cancel reply
                        </Button>
                      )}
                    </div>
                    <Button
                      onClick={handleComment}
                      disabled={isPostingComment || !newComment.trim()}
                      size="sm"
                    >
                      {isPostingComment ? 'Posting...' : 'Post'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Comments List */}
              {isLoadingComments ? (
                <div className="text-center py-4">Loading comments...</div>
              ) : (
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex items-start space-x-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.avatar_url} />
                        <AvatarFallback>
                          {comment.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="bg-muted rounded-lg p-3">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-semibold text-sm">{comment.username}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          <p className="text-sm">{comment.content}</p>
                        </div>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setReplyingTo(comment.id)}
                          >
                            <Reply className="h-3 w-3 mr-1" />
                            Reply
                          </Button>
                          {comment.reactions_count > 0 && (
                            <span>{comment.reactions_count} reactions</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
