import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Share2, Copy, Download, Twitter, Facebook, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ShareableContent {
  type: 'achievement' | 'quiz_result' | 'word_discovery' | 'streak' | 'challenge';
  title: string;
  description: string;
  data: any;
  image?: string;
}

interface SocialShareProps {
  content: ShareableContent;
  onShare?: () => void;
}

export default function SocialShare({ content, onShare }: SocialShareProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  const generateShareText = () => {
    const baseText = `🎯 WordSmith Achievement: ${content.title}`;
    const hashtags = '#WordSmith #Scrabble #WordGames #Learning';
    
    switch (content.type) {
      case 'achievement':
        return `${baseText}\n\n${content.description}\n\n${hashtags}`;
      case 'quiz_result':
        return `${baseText}\n\nScored ${content.data.accuracy}% accuracy (${content.data.correct}/${content.data.total} words)!\n\n${hashtags}`;
      case 'word_discovery':
        return `${baseText}\n\nJust discovered "${content.data.word}" - ${content.data.definition}\n\n${hashtags}`;
      case 'streak':
        return `${baseText}\n\n${content.data.days} day streak! 🔥\n\n${hashtags}`;
      case 'challenge':
        return `${baseText}\n\nCan you solve this anagram: "${content.data.letters}"?\n\n${hashtags}`;
      default:
        return `${baseText}\n\n${hashtags}`;
    }
  };

  const generateShareUrl = () => {
    const baseUrl = window.location.origin;
    switch (content.type) {
      case 'achievement':
        return `${baseUrl}/achievements/${content.data.id}`;
      case 'quiz_result':
        return `${baseUrl}/quiz-results/${content.data.id}`;
      case 'word_discovery':
        return `${baseUrl}/word/${content.data.word}`;
      case 'challenge':
        return `${baseUrl}/challenge/${content.data.id}`;
      default:
        return baseUrl;
    }
  };

  const shareToTwitter = () => {
    const text = generateShareText();
    const url = generateShareUrl();
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank');
    onShare?.();
  };

  const shareToFacebook = () => {
    const url = generateShareUrl();
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(facebookUrl, '_blank');
    onShare?.();
  };

  const copyToClipboard = async () => {
    const text = generateShareText();
    const url = generateShareUrl();
    const fullText = `${text}\n\n${url}`;
    
    try {
      await navigator.clipboard.writeText(fullText);
      toast({
        title: "Copied!",
        description: "Share text copied to clipboard",
      });
      onShare?.();
    } catch (error) {
      console.error('Failed to copy:', error);
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive"
      });
    }
  };

  const downloadImage = () => {
    // Create a canvas with the achievement/result
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 600;

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, 800, 600);
    gradient.addColorStop(0, '#0A4D2C');
    gradient.addColorStop(1, '#2563EB');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 600);

    // Title
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 48px Poppins, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(content.title, 400, 150);

    // Description
    ctx.font = '24px Inter, sans-serif';
    ctx.fillStyle = '#F9FAFB';
    ctx.fillText(content.description, 400, 220);

    // Additional data based on type
    ctx.font = 'bold 32px Poppins, sans-serif';
    ctx.fillStyle = '#FFB200';
    
    switch (content.type) {
      case 'quiz_result':
        ctx.fillText(`${content.data.accuracy}% Accuracy`, 400, 300);
        ctx.font = '20px Inter, sans-serif';
        ctx.fillStyle = '#F9FAFB';
        ctx.fillText(`${content.data.correct}/${content.data.total} words correct`, 400, 340);
        break;
      case 'streak':
        ctx.fillText(`${content.data.days} Day Streak!`, 400, 300);
        break;
      case 'word_discovery':
        ctx.fillText(`"${content.data.word}"`, 400, 300);
        break;
    }

    // WordSmith branding
    ctx.font = 'bold 28px Poppins, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('WordSmith', 400, 500);

    // Download
    const link = document.createElement('a');
    link.download = `wordsmith-${content.type}-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
    
    onShare?.();
  };

  if (!isOpen) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2"
      >
        <Share2 className="h-4 w-4" />
        Share
      </Button>
    );
  }

  return (
    <Card className="absolute top-full left-0 mt-2 z-50 w-80">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Share Your Achievement</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsOpen(false)}
            >
              ×
            </Button>
          </div>

          <div className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={shareToTwitter}
            >
              <Twitter className="h-4 w-4 mr-2 text-blue-400" />
              Share on Twitter
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={shareToFacebook}
            >
              <Facebook className="h-4 w-4 mr-2 text-blue-600" />
              Share on Facebook
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={copyToClipboard}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Text
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={downloadImage}
            >
              <Download className="h-4 w-4 mr-2" />
              Download Image
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            <p>Preview:</p>
            <p className="mt-1 p-2 bg-secondary rounded text-xs">
              {generateShareText().substring(0, 100)}...
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Hook for easy sharing integration
export function useSocialShare() {
  const shareAchievement = (achievement: any) => {
    const content: ShareableContent = {
      type: 'achievement',
      title: achievement.name,
      description: achievement.description,
      data: achievement
    };
    
    // Trigger share modal or direct share
    return content;
  };

  const shareQuizResult = (result: any) => {
    const content: ShareableContent = {
      type: 'quiz_result',
      title: 'Quiz Complete!',
      description: `Just completed a ${result.total}-word quiz`,
      data: result
    };
    
    return content;
  };

  const shareWordDiscovery = (word: string, definition: string) => {
    const content: ShareableContent = {
      type: 'word_discovery',
      title: 'New Word Discovered!',
      description: `Learned a new word`,
      data: { word, definition }
    };
    
    return content;
  };

  const shareStreak = (days: number) => {
    const content: ShareableContent = {
      type: 'streak',
      title: 'Streak Milestone!',
      description: `Maintaining my learning streak`,
      data: { days }
    };
    
    return content;
  };

  const shareChallenge = (challenge: any) => {
    const content: ShareableContent = {
      type: 'challenge',
      title: 'Challenge Created!',
      description: `Created a new word challenge`,
      data: challenge
    };
    
    return content;
  };

  return {
    shareAchievement,
    shareQuizResult,
    shareWordDiscovery,
    shareStreak,
    shareChallenge
  };
}
