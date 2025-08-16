import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/context/ThemeContext';
import { 
  Eye, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  XCircle,
  Sun,
  Moon,
  Monitor
} from 'lucide-react';

export const ThemeTextTest: React.FC = () => {
  const { 
    themeMode, 
    setThemeMode, 
    colorScheme, 
    setColorScheme, 
    isDark,
    colors 
  } = useTheme();

  const colorSchemes = [
    { name: 'Green', value: 'green' },
    { name: 'Blue', value: 'blue' },
    { name: 'Purple', value: 'purple' },
    { name: 'Pink', value: 'pink' },
    { name: 'Orange', value: 'orange' },
    { name: 'Red', value: 'red' },
    { name: 'Teal', value: 'teal' },
    { name: 'Indigo', value: 'indigo' },
  ];

  const themeModes = [
    { name: 'Light', value: 'light', icon: Sun },
    { name: 'Dark', value: 'dark', icon: Moon },
    { name: 'Auto', value: 'auto', icon: Monitor },
  ];

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-foreground">
          Text Visibility Test
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Testing text visibility across all theme modes and color schemes
        </p>
      </div>

      {/* Theme Controls */}
      <Card className="theme-transition">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Eye className="w-5 h-5" />
            Theme Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Theme Mode */}
          <div>
            <h3 className="font-medium text-foreground mb-3">Theme Mode</h3>
            <div className="flex gap-2">
              {themeModes.map((mode) => {
                const Icon = mode.icon;
                const isActive = themeMode === mode.value;
                return (
                  <Button
                    key={mode.value}
                    variant={isActive ? "default" : "outline"}
                    onClick={() => setThemeMode(mode.value as any)}
                    className="flex items-center gap-2"
                  >
                    <Icon className="w-4 h-4" />
                    {mode.name}
                    {isActive && <Badge variant="secondary">Active</Badge>}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Color Scheme */}
          <div>
            <h3 className="font-medium text-foreground mb-3">Color Scheme</h3>
            <div className="grid grid-cols-4 gap-2">
              {colorSchemes.map((scheme) => {
                const isActive = colorScheme === scheme.value;
                return (
                  <Button
                    key={scheme.value}
                    variant={isActive ? "default" : "outline"}
                    onClick={() => setColorScheme(scheme.value as any)}
                    className="text-sm"
                  >
                    {scheme.name}
                    {isActive && <Badge variant="secondary" className="ml-1">✓</Badge>}
                  </Button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Button Test */}
      <Card className="theme-transition">
        <CardHeader>
          <CardTitle className="text-foreground">Button Text Visibility Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium text-foreground">Primary Actions</h4>
              <div className="space-y-2">
                <Button className="w-full">Default Button</Button>
                <Button variant="success" className="w-full">Success Button</Button>
                <Button variant="warning" className="w-full">Warning Button</Button>
                <Button variant="info" className="w-full">Info Button</Button>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-foreground">Secondary Actions</h4>
              <div className="space-y-2">
                <Button variant="outline" className="w-full">Outline Button</Button>
                <Button variant="secondary" className="w-full">Secondary Button</Button>
                <Button variant="ghost" className="w-full">Ghost Button</Button>
                <Button variant="link" className="w-full">Link Button</Button>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-foreground">Destructive Actions</h4>
              <div className="space-y-2">
                <Button variant="destructive" className="w-full">Delete Button</Button>
                <Button variant="destructive" size="sm" className="w-full">Small Delete</Button>
                <Button variant="destructive" size="lg" className="w-full">Large Delete</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card Text Test */}
      <Card className="theme-transition">
        <CardHeader>
          <CardTitle className="text-foreground">Card Text Visibility Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <h3 className="font-semibold text-success-foreground">Success Card</h3>
                </div>
                <p className="text-success-foreground/80">This text should be clearly visible in success colors.</p>
                <p className="text-sm text-success-foreground/60 mt-2">Secondary text with reduced opacity.</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-warning/10 to-warning/5 border-warning/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                  <h3 className="font-semibold text-warning-foreground">Warning Card</h3>
                </div>
                <p className="text-warning-foreground/80">This text should be clearly visible in warning colors.</p>
                <p className="text-sm text-warning-foreground/60 mt-2">Secondary text with reduced opacity.</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-info/10 to-info/5 border-info/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-5 h-5 text-info" />
                  <h3 className="font-semibold text-info-foreground">Info Card</h3>
                </div>
                <p className="text-info-foreground/80">This text should be clearly visible in info colors.</p>
                <p className="text-sm text-info-foreground/60 mt-2">Secondary text with reduced opacity.</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-5 h-5 text-destructive" />
                  <h3 className="font-semibold text-destructive-foreground">Destructive Card</h3>
                </div>
                <p className="text-destructive-foreground/80">This text should be clearly visible in destructive colors.</p>
                <p className="text-sm text-destructive-foreground/60 mt-2">Secondary text with reduced opacity.</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Current Theme Info */}
      <Card className="theme-transition">
        <CardHeader>
          <CardTitle className="text-foreground">Current Theme Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-foreground">Theme Settings</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mode:</span>
                  <span className="font-medium text-foreground">
                    {themeMode === 'auto' ? `${isDark ? 'Dark' : 'Light'} (Auto)` : themeMode}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Color Scheme:</span>
                  <span className="font-medium text-foreground capitalize">{colorScheme}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Is Dark:</span>
                  <span className="font-medium text-foreground">{isDark ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-foreground">Text Visibility Check</h4>
              <div className="space-y-2 text-sm">
                <div className="p-2 bg-background border rounded">
                  <span className="text-foreground">Primary text (foreground)</span>
                </div>
                <div className="p-2 bg-muted border rounded">
                  <span className="text-muted-foreground">Muted text</span>
                </div>
                <div className="p-2 bg-primary border rounded">
                  <span className="text-primary-foreground">Primary background text</span>
                </div>
                <div className="p-2 bg-card border rounded">
                  <span className="text-card-foreground">Card background text</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ThemeTextTest; 