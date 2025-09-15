import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { ArrowLeft, Search, Calendar, User, Filter, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AnnouncementCard, sampleAnnouncements, Announcement } from '@/components/AnnouncementCard';

export default function AnnouncementsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');

  const filters = ['All', 'Tournament', 'Community', 'Feature', 'General'];

  const filteredAnnouncements = sampleAnnouncements.filter(announcement => {
    const matchesSearch = announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         announcement.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'All' || 
                         (announcement.featured && selectedFilter === 'Tournament') ||
                         (announcement.title.toLowerCase().includes(selectedFilter.toLowerCase()));
    return matchesSearch && matchesFilter;
  });

  const featuredAnnouncements = filteredAnnouncements.filter(announcement => announcement.featured);
  const regularAnnouncements = filteredAnnouncements.filter(announcement => !announcement.featured);

  const handleAnnouncementClick = (announcement: Announcement) => {
    // Navigate to registration website for Lekki Scrabble Classics
    if (announcement.id === '1') {
      window.open('https://www.classics.lekkiscrabbleclub.com', '_blank');
    } else {
      // For other announcements, show alert (or navigate to full announcement page)
      alert(`Opening announcement: "${announcement.title}"\n\nThis would navigate to a full announcement page with complete details.`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Announcements</h1>
            <p className="text-muted-foreground">Stay updated with the latest tournaments, features, and community news</p>
          </div>
        </div>

        {/* Search and Filter */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search announcements..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {filters.map(filter => (
                  <Button
                    key={filter}
                    variant={selectedFilter === filter ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedFilter(filter)}
                  >
                    <Filter className="h-3 w-3 mr-1" />
                    {filter}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Featured Announcements */}
        {featuredAnnouncements.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-500" />
              Featured Announcements
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {featuredAnnouncements.map((announcement, index) => (
                <motion.div
                  key={announcement.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <AnnouncementCard announcement={announcement} onClick={handleAnnouncementClick} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Regular Announcements */}
        {regularAnnouncements.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-2xl font-bold mb-6">All Announcements</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularAnnouncements.map((announcement, index) => (
                <motion.div
                  key={announcement.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <AnnouncementCard announcement={announcement} onClick={handleAnnouncementClick} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* No Results */}
        {filteredAnnouncements.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-4xl mb-4">📢</div>
              <h3 className="text-lg font-semibold mb-2">No announcements found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search terms or filter options.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
