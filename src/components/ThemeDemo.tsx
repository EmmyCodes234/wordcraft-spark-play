import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/context/ThemeContext';
import { 
  Palette, 
  Sun, 
  Moon, 
  Monitor, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  XCircle,
  Star,
  Zap,
  Target
} from 'lucide-react';

const colorSchemes = [
  { name: 'Green', value: 'green', icon: CheckCircle },
  { name: 'Blue', value: 'blue', icon: Info },
  { name: 'Purple', value: 'purple', icon: Star },
  { name: 'Pink', value: 'pink', icon: Zap },
  { name: 'Orange', value: 'orange', icon: AlertTriangle },
  { name: 'Red', value: 'red', icon: XCircle },
  { name: 'Teal', value: 'teal', icon: Target },
  { name: 'Indigo', value: 'indigo', icon: Palette },
];

const themeModes = [
  { name: 'Light', value: 'light', icon: Sun },
  { name: 'Dark', value: 'dark', icon: Moon },
  { name: 'Auto', value: 'auto', icon: Monitor },
];

export const ThemeDemo: React.FC = () => {
  const { 
    themeMode, 
    setThemeMode, 
    colorScheme, 
    setColorScheme, 
    customColor, 
    setCustomColor,
    isDark,
    colors 
  } = useTheme();

  const getThemeLabel = () => {
    switch (themeMode) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      case 'auto':
        return isDark ? 'Dark (Auto)' : 'Light (Auto)';
      default:
        return 'Light';
    }
  };

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Dynamic Theme System
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Experience our advanced theme system with automatic color adaptation, 
          smooth transitions, and comprehensive dark mode support.
        </p>
      </div>

      {/* Theme Mode Selection */}
      <Card className="theme-transition">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Theme Mode
          </CardTitle>
          <CardDescription>
            Choose between light, dark, or automatic theme detection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {themeModes.map((mode) => {
              const Icon = mode.icon;
              const isActive = themeMode === mode.value;
              return (
                <Button
                  key={mode.value}
                  variant={isActive ? "default" : "outline"}
                  className={`h-16 flex-col gap-2 ${isActive ? 'bg-gradient-primary' : ''}`}
                  onClick={() => setThemeMode(mode.value as any)}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm">{mode.name}</span>
                  {isActive && <Badge variant="secondary" className="text-xs">Active</Badge>}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Color Scheme Selection */}
      <Card className="theme-transition">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Color Schemes
          </CardTitle>
          <CardDescription>
            Select from predefined color schemes or create your own
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {colorSchemes.map((scheme) => {
              const Icon = scheme.icon;
              const isActive = colorScheme === scheme.value;
              return (
                <Button
                  key={scheme.value}
                  variant={isActive ? "default" : "outline"}
                  className={`h-20 flex-col gap-2 ${isActive ? 'bg-gradient-primary' : ''}`}
                  onClick={() => setColorScheme(scheme.value as any)}
                >
                  <Icon className="w-6 h-6" />
                  <span className="text-sm font-medium">{scheme.name}</span>
                  {isActive && <Badge variant="secondary" className="text-xs">Active</Badge>}
                </Button>
              );
            })}
          </div>
          
          {/* Custom Color Picker */}
          <div className="mt-6 p-4 border rounded-lg bg-muted/50">
            <h4 className="font-medium mb-3">Custom Color</h4>
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                className="w-16 h-12 rounded-lg border cursor-pointer"
              />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-2">
                  Choose a custom color for your theme
                </p>
                <Button
                  variant={colorScheme === 'custom' ? "default" : "outline"}
                  onClick={() => setColorScheme('custom')}
                  className="w-full"
                >
                  {colorScheme === 'custom' ? 'Using Custom Color' : 'Use Custom Color'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Button Showcase */}
      <Card className="theme-transition">
        <CardHeader>
          <CardTitle>Button Variations</CardTitle>
          <CardDescription>
            All buttons automatically adapt to your selected theme and color scheme
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium">Primary Actions</h4>
              <div className="space-y-2">
                <Button className="w-full">Default Button</Button>
                <Button variant="success" className="w-full">Success Button</Button>
                <Button variant="warning" className="w-full">Warning Button</Button>
                <Button variant="info" className="w-full">Info Button</Button>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">Secondary Actions</h4>
              <div className="space-y-2">
                <Button variant="outline" className="w-full">Outline Button</Button>
                <Button variant="secondary" className="w-full">Secondary Button</Button>
                <Button variant="ghost" className="w-full">Ghost Button</Button>
                <Button variant="link" className="w-full">Link Button</Button>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">Destructive Actions</h4>
              <div className="space-y-2">
                <Button variant="destructive" className="w-full">Delete</Button>
                <Button variant="destructive" size="sm" className="w-full">Small Delete</Button>
                <Button variant="destructive" size="lg" className="w-full">Large Delete</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Theme Info */}
      <Card className="theme-transition">
        <CardHeader>
          <CardTitle>Current Theme Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium">Theme Settings</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mode:</span>
                  <span className="font-medium">{getThemeLabel()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Color Scheme:</span>
                  <span className="font-medium capitalize">{colorScheme}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Is Dark:</span>
                  <span className="font-medium">{isDark ? 'Yes' : 'No'}</span>
                </div>
                {colorScheme === 'custom' && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Custom Color:</span>
                    <span className="font-medium font-mono">{customColor}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">Color Preview</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <div 
                    className="w-full h-8 rounded border"
                    style={{ backgroundColor: colors.primary }}
                  />
                  <p className="text-xs text-muted-foreground">Primary</p>
                </div>
                <div className="space-y-1">
                  <div 
                    className="w-full h-8 rounded border"
                    style={{ backgroundColor: colors.secondary }}
                  />
                  <p className="text-xs text-muted-foreground">Secondary</p>
                </div>
                <div className="space-y-1">
                  <div 
                    className="w-full h-8 rounded border"
                    style={{ backgroundColor: colors.accent }}
                  />
                  <p className="text-xs text-muted-foreground">Accent</p>
                </div>
                <div className="space-y-1">
                  <div 
                    className="w-full h-8 rounded border"
                    style={{ backgroundColor: colors.background }}
                  />
                  <p className="text-xs text-muted-foreground">Background</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ThemeDemo; 