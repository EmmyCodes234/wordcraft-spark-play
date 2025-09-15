import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Trophy, ExternalLink, ArrowRight } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  bannerText: {
    top: string;
    main: string;
    bottom: string;
    dates: string;
  };
  bannerColor: string;
  textColor: string;
  author: string;
  featured?: boolean;
  actionText?: string;
  actionUrl?: string;
  publishedAt?: string;
}

interface AnnouncementCardProps {
  announcement: Announcement;
  onClick: (announcement: Announcement) => void;
}

export const AnnouncementCard: React.FC<AnnouncementCardProps> = ({ announcement, onClick }) => {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 border-0 overflow-hidden">
        {/* Flyer Image Section */}
        <div className="relative h-80 rounded-t-lg overflow-hidden">
          <img 
            src="/lekki-scrabble-classics-flyer.jpg" 
            alt="Lekki Scrabble Classics 2025 Tournament Flyer"
            className="w-full h-full object-cover"
            onLoad={() => console.log('Flyer image loaded successfully')}
            onError={(e) => {
              console.log('Flyer image failed to load, using fallback');
              e.currentTarget.style.display = 'none';
              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = 'block';
            }}
          />
          {/* Fallback background if image doesn't exist */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 hidden">
            <div className="absolute top-6 left-1/2 transform -translate-x-1/2">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center border-2 border-black">
                <div className="text-black font-bold text-2xl">S</div>
              </div>
            </div>
            <div className="absolute top-24 left-6 text-green-400 font-bold text-3xl leading-tight">
              LEKKI<br />
              SCRABBLE<br />
              CLASSICS '25
            </div>
            <div className="absolute top-24 right-6">
              <div className="relative">
                <div className="bg-white text-black px-6 py-3 rounded-lg text-lg font-bold">
                  ₦1,000,000 plus Trophy
                </div>
                <div className="absolute -top-2 -right-2 bg-red-500 text-white px-3 py-1 text-sm font-bold rounded-lg transform rotate-12">
                  STAR PRIZE
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3">
            <Badge variant="secondary" className="text-xs">
              Tournament
            </Badge>
            {announcement.featured && (
              <Badge variant="default" className="text-xs bg-gradient-to-r from-yellow-400 to-orange-500">
                Featured
              </Badge>
            )}
          </div>
          
          <h3 className="font-semibold text-lg mb-2 line-clamp-2">
            {announcement.title}
          </h3>
          
          <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
            {announcement.description}
          </p>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
            <span>Written by {announcement.author}</span>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {announcement.publishedAt || 'Dec 15, 2024'}
            </div>
          </div>
          
          <Button 
            onClick={() => onClick(announcement)}
            className="w-full group"
            size="sm"
          >
            {announcement.actionText || 'Read More'}
            <ArrowRight className="ml-2 h-3 w-3 group-hover:translate-x-1 transition-transform" />
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Sample announcements data
export const sampleAnnouncements: Announcement[] = [
  {
    id: '1',
    title: 'Lekki Scrabble Classics 2025 Tournament Announcement!',
    subtitle: 'written by Emmanuel Enyi',
    description: 'The Lekki Scrabble Classics 2025 is coming to Peninsula Hotel & Towers! Join us for 18 games of competitive Scrabble with a ₦1,000,000 star prize plus trophy. Registration closes September 20, 2025.',
    bannerText: {
      top: 'ANNOUNCING THE',
      main: 'LEKKI SCRABBLE CLASSICS \'25',
      bottom: '₦1,000,000 STAR PRIZE + TROPHY',
      dates: 'SEPTEMBER 27ᵗʰ - 28ᵗʰ 2025'
    },
    bannerColor: 'bg-gradient-to-r from-green-600 to-emerald-700',
    textColor: 'text-white',
    author: 'Emmanuel Enyi',
    featured: true,
    actionText: 'Register Now',
    actionUrl: '/tournament-registration',
    publishedAt: new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }
];
