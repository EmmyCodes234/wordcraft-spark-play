import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, ArrowLeft, BookOpen, User, Check } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    focus: '',
    skillWords: [] as string[],
    currentWord: '',
    detectedSkill: 'Beginner'
  });
  const [saving, setSaving] = useState(false);

  const focusOptions = ['Bingos', 'Hooks', 'Vocabulary'];

  const addSkillWord = () => {
    const word = formData.currentWord.trim().toUpperCase();
    if (word && !formData.skillWords.includes(word)) {
      setFormData(prev => ({
        ...prev,
        skillWords: [...prev.skillWords, word],
        currentWord: ''
      }));
    }
  };

  const handleFinish = async () => {
    if (!user) return;
    
    setSaving(true);
    let detectedSkill = 'Beginner';
    if (formData.skillWords.length >= 8) detectedSkill = 'Advanced';
    else if (formData.skillWords.length >= 4) detectedSkill = 'Intermediate';

    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          id: user.id,
          preferred_focus: formData.focus,
          skill_level: detectedSkill,
          onboarding_completed: true
        });

      if (error) {
        console.error("Error saving onboarding data:", error);
        toast({
          title: "Error",
          description: "Failed to save your preferences. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Welcome to WordSmith!",
        description: "Your account has been set up successfully.",
      });
      
      navigate('/dashboard');
    } catch (error) {
      console.error("Error saving onboarding data:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <>
            <h2 className="text-2xl font-bold">What should we call you?</h2>
            <p className="text-muted-foreground">Your name personalizes your journey</p>
            <Input
              placeholder="Enter your name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="text-center text-lg mt-4"
            />
          </>
        );

      case 2:
        return (
          <>
            <h2 className="text-2xl font-bold">Pick Your Focus</h2>
            <p className="text-muted-foreground">What do you want to improve the most?</p>
            <div className="flex flex-col gap-3 mt-4">
              {focusOptions.map((opt) => (
                <Button
                  key={opt}
                  variant={formData.focus === opt ? 'default' : 'outline'}
                  onClick={() => setFormData(prev => ({ ...prev, focus: opt }))}
                  className={cn(formData.focus === opt && "ring-2 ring-primary shadow-glow")}
                >
                  {opt}
                  {formData.focus === opt && <Check className="h-4 w-4 ml-2" />}
                </Button>
              ))}
            </div>
          </>
        );

      case 3:
        return (
          <>
            <h2 className="text-2xl font-bold">Quick Skill Test</h2>
            <p className="text-muted-foreground">Type words you can form from <strong>REACTOR</strong></p>
            <div className="flex gap-2 mt-4">
              <Input
                placeholder="Type a word..."
                value={formData.currentWord}
                onChange={(e) => setFormData(prev => ({ ...prev, currentWord: e.target.value }))}
                onKeyPress={(e) => e.key === 'Enter' && addSkillWord()}
              />
              <Button onClick={addSkillWord}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {formData.skillWords.map((w, i) => (
                <span key={i} className="px-2 py-1 bg-primary text-primary-foreground rounded text-sm">{w}</span>
              ))}
            </div>
          </>
        );

      case 4:
        const skillLevel = formData.skillWords.length >= 8 ? 'Advanced' : formData.skillWords.length >= 4 ? 'Intermediate' : 'Beginner';
        return (
          <>
            <h2 className="text-2xl font-bold">You're All Set!</h2>
            <p className="text-muted-foreground">We detected your skill as <strong>{skillLevel}</strong></p>
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 mt-4">
              <CardContent className="p-6 space-y-2">
                <div className="flex justify-between">
                  <span>Name:</span>
                  <Badge variant="secondary">{formData.name}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Focus:</span>
                  <Badge variant="secondary">{formData.focus}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Skill Level:</span>
                  <Badge variant="secondary">{skillLevel}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Words Found:</span>
                  <Badge variant="secondary">{formData.skillWords.length}</Badge>
                </div>
              </CardContent>
            </Card>
            <Button onClick={handleFinish} disabled={saving} className="mt-6 px-8 py-4 text-lg">
              {saving ? "Saving..." : "Finish & Go to Dashboard"}
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <Card className="w-full max-w-xl">
        <CardHeader className="text-center">
          <div className="w-full bg-muted rounded-full h-2 mb-6">
            <div 
              className="bg-gradient-primary h-2 rounded-full transition-all duration-500"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            />
          </div>
          <div className="flex items-center justify-center space-x-2 mb-4">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">WordSmith</span>
          </div>
          <CardTitle className="text-xl">
            {currentStep === 1 ? 'Welcome!' : currentStep === 2 ? 'Choose Focus' : currentStep === 3 ? 'Skill Test' : 'Summary'}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {renderStep()}

          <div className="flex justify-between pt-6">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            {currentStep < 4 && (
              <Button
                onClick={() => setCurrentStep(prev => prev + 1)}
                disabled={
                  (currentStep === 1 && !formData.name) ||
                  (currentStep === 2 && !formData.focus)
                }
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>

          {currentStep < 4 && (
            <div className="text-center">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm">Skip setup for now</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
