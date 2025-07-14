import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Users, 
  Trophy, 
  Brain,
  Zap,
  Star,
  ArrowRight,
  Play,
  Check
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Welcome() {
  const features = [
    {
      icon: BookOpen,
      title: 'Smart Word Study',
      description: 'Master thousands of Scrabble words with spaced repetition and personalized learning paths.'
    },
    {
      icon: Brain,
      title: 'Anagram & Pattern Tools',
      description: 'Solve anagrams instantly and discover words with powerful pattern matching.'
    },
    {
      icon: Zap,
      title: 'Gamified Learning',
      description: 'Earn XP, maintain streaks, and unlock achievements as you progress.'
    },
    {
      icon: Users,
      title: 'Social Competition',
      description: 'Challenge friends and climb leaderboards to stay motivated.'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Chen',
      level: 'Tournament Player',
      quote: 'WordSmith helped me increase my word knowledge by 300% in just 3 months!',
      rating: 5
    },
    {
      name: 'Mike Rodriguez',
      level: 'Casual Player',
      quote: 'Finally, a Scrabble study app that makes learning fun instead of overwhelming.',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          {/* Logo & Brand */}
          <div className="flex items-center justify-center space-x-3">
            <div className="h-16 w-16 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              WordSmith
            </h1>
          </div>

          {/* Mission Statement */}
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold leading-tight">
              Master Scrabble Words Like Never Before
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Transform your Scrabble game with smart study tools, gamified learning, and a community of word enthusiasts. Learn faster, play better, have fun.
            </p>
          </div>

          {/* Stats Banner */}
          <div className="flex justify-center items-center space-x-8 py-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">50K+</div>
              <div className="text-sm text-muted-foreground">Words Mastered</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">10K+</div>
              <div className="text-sm text-muted-foreground">Active Learners</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">98%</div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link to="/onboarding">
              <Button size="lg" className="text-lg px-8 py-6 group">
                Start Learning Free
                <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="outline" size="lg" className="text-lg px-8 py-6 group">
                <Play className="h-5 w-5 mr-2" />
                Try Demo
              </Button>
            </Link>
          </div>

          <Badge variant="secondary" className="text-sm">
            ✨ No credit card required • Join thousands of players improving daily
          </Badge>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold mb-4">Everything You Need to Excel</h3>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Comprehensive tools designed specifically for Scrabble players of all levels
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {features.map((feature, index) => (
            <Card key={index} className="group hover:shadow-elegant hover:scale-105 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="p-3 rounded-lg bg-gradient-primary/10 group-hover:bg-gradient-primary/20 transition-colors">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg mb-2">{feature.title}</h4>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Testimonials */}
      <div className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4">Loved by Players Worldwide</h3>
            <p className="text-muted-foreground text-lg">Join thousands who've improved their game</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="hover:shadow-elegant transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-warning text-warning" />
                    ))}
                  </div>
                  <blockquote className="text-lg mb-4 italic">
                    "{testimonial.quote}"
                  </blockquote>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold">
                      {testimonial.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.level}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-2xl mx-auto border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">Ready to Transform Your Game?</h3>
            <p className="text-muted-foreground mb-6">
              Join WordSmith today and start your journey to Scrabble mastery
            </p>
            <Link to="/onboarding">
              <Button size="lg" className="text-lg px-8 py-6">
                Get Started Now
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}