import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowRight, ExternalLink } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  publishedAt: string;
  readTime: string;
  category: string;
  imageUrl?: string;
  featured?: boolean;
}

interface BlogPostCardProps {
  post: BlogPost;
  onClick: (post: BlogPost) => void;
}

export const BlogPostCard: React.FC<BlogPostCardProps> = ({ post, onClick }) => {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="h-full cursor-pointer hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
        {post.imageUrl && (
          <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-lg flex items-center justify-center">
            <div className="text-white text-4xl font-bold">
              {post.title.charAt(0)}
            </div>
          </div>
        )}
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between mb-2">
            <Badge variant="secondary" className="text-xs">
              {post.category}
            </Badge>
            {post.featured && (
              <Badge variant="default" className="text-xs bg-gradient-to-r from-yellow-400 to-orange-500">
                Featured
              </Badge>
            )}
          </div>
          <CardTitle className="text-lg leading-tight line-clamp-2">
            {post.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
            {post.excerpt}
          </p>
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {post.publishedAt}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {post.readTime}
              </div>
            </div>
            <span>By {post.author}</span>
          </div>
          <Button 
            onClick={() => onClick(post)}
            variant="outline" 
            size="sm" 
            className="w-full group"
          >
            Read More
            <ArrowRight className="ml-2 h-3 w-3 group-hover:translate-x-1 transition-transform" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Sample blog posts data
export const sampleBlogPosts: BlogPost[] = [
  {
    id: '1',
    title: 'Mastering High-Scoring Scrabble Words: A Complete Guide',
    excerpt: 'Discover the secrets to finding those elusive high-scoring words that can turn the tide of any Scrabble game. Learn about Q-words, Z-words, and strategic letter combinations.',
    author: 'Scrabble Master',
    publishedAt: 'Dec 15, 2024',
    readTime: '8 min read',
    category: 'Strategy',
    featured: true
  },
  {
    id: '2',
    title: 'Tournament Preparation: Tips from Lekki Scrabble Classics Champions',
    excerpt: 'Get insider tips from past champions on how to prepare for competitive Scrabble tournaments. Mental preparation, study techniques, and game-day strategies.',
    author: 'Tournament Pro',
    publishedAt: 'Dec 12, 2024',
    readTime: '6 min read',
    category: 'Tournament',
    featured: true
  },
  {
    id: '3',
    title: 'Advanced Pattern Recognition in Scrabble',
    excerpt: 'Learn to identify common letter patterns and word structures that can help you spot opportunities on the board faster and more accurately.',
    author: 'Pattern Expert',
    publishedAt: 'Dec 10, 2024',
    readTime: '5 min read',
    category: 'Technique'
  },
  {
    id: '4',
    title: 'The Psychology of Competitive Scrabble',
    excerpt: 'Understanding your opponent\'s mindset and managing your own mental state during high-pressure games. Psychological strategies that champions use.',
    author: 'Mind Games',
    publishedAt: 'Dec 8, 2024',
    readTime: '7 min read',
    category: 'Psychology'
  },
  {
    id: '5',
    title: 'Building Your Scrabble Vocabulary: A Systematic Approach',
    excerpt: 'A structured method for expanding your word knowledge efficiently. Focus areas, study schedules, and memory techniques for serious players.',
    author: 'Vocabulary Builder',
    publishedAt: 'Dec 5, 2024',
    readTime: '9 min read',
    category: 'Learning'
  },
  {
    id: '6',
    title: 'Lekki Scrabble Classics 2025: What to Expect',
    excerpt: 'Everything you need to know about the upcoming tournament at Peninsula Hotel & Towers. Format, prizes, registration details, and preparation tips.',
    author: 'Event Coordinator',
    publishedAt: 'Dec 3, 2024',
    readTime: '4 min read',
    category: 'Events',
    featured: true
  }
];

// Advert Card Component for Dashboard
interface AdvertCardProps {
  post: BlogPost;
  onClick: (post: BlogPost) => void;
  variant?: 'featured' | 'compact';
}

export const AdvertCard: React.FC<AdvertCardProps> = ({ post, onClick, variant = 'compact' }) => {
  if (variant === 'featured') {
    return (
      <motion.div
        whileHover={{ y: -4, scale: 1.02 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
            <div className="text-white text-2xl font-bold">
              {post.title.charAt(0)}
            </div>
          </div>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="secondary" className="text-xs">
                {post.category}
              </Badge>
              {post.featured && (
                <Badge variant="default" className="text-xs bg-gradient-to-r from-yellow-400 to-orange-500">
                  Featured
                </Badge>
              )}
            </div>
            <h3 className="font-semibold text-lg mb-2 line-clamp-2">
              {post.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
              {post.excerpt}
            </p>
            <Button 
              onClick={() => onClick(post)}
              className="w-full group"
              size="sm"
            >
              Read Article
              <ArrowRight className="ml-2 h-3 w-3 group-hover:translate-x-1 transition-transform" />
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Compact variant
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <div className="text-white text-lg font-bold">
                {post.title.charAt(0)}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className="text-xs">
                  {post.category}
                </Badge>
                <span className="text-xs text-muted-foreground">{post.readTime}</span>
              </div>
              <h4 className="font-medium text-sm line-clamp-2 mb-1">
                {post.title}
              </h4>
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                {post.excerpt}
              </p>
              <Button 
                onClick={() => onClick(post)}
                variant="ghost" 
                size="sm" 
                className="h-6 px-2 text-xs group"
              >
                Read
                <ExternalLink className="ml-1 h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
