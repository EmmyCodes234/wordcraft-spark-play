import React from "react";
import { useNavigate } from "react-router-dom";
import { Star, Search, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <h1 className="text-display-large font-medium text-foreground">
            Professional Word Analysis Tools
          </h1>
          <p className="text-body-large text-muted-foreground max-w-2xl mx-auto">
            Comprehensive word analysis, pattern matching, and linguistic tools for professionals, 
            researchers, and word enthusiasts.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="inline-flex items-center gap-2"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate("/auth")}
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-headline-large font-medium text-foreground mb-4">
            Powerful Word Analysis Features
          </h2>
          <p className="text-body-large text-muted-foreground max-w-2xl mx-auto">
            Everything you need for comprehensive word analysis and research
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="elevation-2 border-0 hover:elevation-4 transition-all duration-300">
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-primary-container rounded-full flex items-center justify-center">
                <Search className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-title-large font-medium">Word Lookup & Analysis</h3>
              <p className="text-body-medium text-muted-foreground">
                Comprehensive word verification, definitions, and linguistic analysis tools.
              </p>
            </CardContent>
          </Card>

          <Card className="elevation-2 border-0 hover:elevation-4 transition-all duration-300">
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-secondary-container rounded-full flex items-center justify-center">
                <Zap className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="text-title-large font-medium">Pattern Matching</h3>
              <p className="text-body-medium text-muted-foreground">
                Advanced anagram solving and pattern matching for complex word puzzles.
              </p>
            </CardContent>
          </Card>

          <Card className="elevation-2 border-0 hover:elevation-4 transition-all duration-300">
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-accent/10 rounded-full flex items-center justify-center">
                <Star className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-title-large font-medium">Study Tools</h3>
              <p className="text-body-medium text-muted-foreground">
                Organize, study, and master vocabulary with professional-grade tools.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-surface py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-headline-medium font-medium text-foreground">
              Ready to enhance your word analysis?
            </h2>
            <p className="text-body-large text-muted-foreground">
              Join professionals who rely on WordSmith for accurate word analysis and research.
            </p>
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="inline-flex items-center gap-2"
            >
              Start Analyzing
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-body-small text-muted-foreground">
            © {new Date().getFullYear()} WordSmith. Professional word analysis tools.
          </p>
        </div>
      </footer>
    </main>
  );
};

export default Landing;
