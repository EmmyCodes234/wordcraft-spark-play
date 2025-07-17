import React, { useContext, useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { AuthContext } from "../context/AuthContext";
import { BarChart3, BookOpen, Search, Target, TrendingUp, Zap } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [profileName, setProfileName] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const { data, error } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", user.id)
          .single();

        if (data) {
          setProfileName(data.username);
        } else if (error) {
          console.error("Error fetching profile:", error);
        }
      }
    };

    fetchProfile();
  }, [user]);

  const displayName =
    profileName ||
    user?.user_metadata?.username ||
    user?.user_metadata?.full_name ||
    user?.email;

  const stats = [
    { label: "Words Analyzed", value: "1,247", icon: Search, color: "text-primary" },
    { label: "Accuracy Rate", value: "94%", icon: Target, color: "text-success" },
    { label: "Tools Used", value: "6", icon: Zap, color: "text-info" },
    { label: "Performance", value: "Excellent", icon: TrendingUp, color: "text-accent" }
  ];

  const quickActions = [
    { title: "Word Lookup", description: "Search and analyze words", path: "/lookup", icon: Search },
    { title: "Word Judge", description: "Validate word acceptability", path: "/judge", icon: Target },
    { title: "Anagram Solver", description: "Find anagram solutions", path: "/anagram", icon: BarChart3 },
    { title: "Study Tools", description: "Access learning materials", path: "/study-deck", icon: BookOpen }
  ];

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-2"
        >
          <h1 className="text-display-small font-medium text-foreground">
            Welcome back, {displayName}
          </h1>
          <p className="text-body-large text-muted-foreground max-w-2xl mx-auto">
            Your professional word analysis workspace
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {stats.map((stat, index) => (
            <Card key={stat.label} className="elevation-2 border-0">
              <CardContent className="p-6 flex items-center space-x-4">
                <div className={`p-3 rounded-full bg-surface-variant ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-title-large font-medium">{stat.value}</p>
                  <p className="text-body-small text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="elevation-2 border-0">
            <CardHeader className="pb-4">
              <h2 className="text-headline-small font-medium">Quick Actions</h2>
              <p className="text-body-medium text-muted-foreground">
                Access your most-used tools
              </p>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action) => (
                <Button
                  key={action.title}
                  variant="outline"
                  className="h-auto p-6 flex flex-col items-center space-y-3 hover:elevation-3 transition-all duration-300"
                  onClick={() => window.location.href = action.path}
                >
                  <action.icon className="h-8 w-8 text-primary" />
                  <div className="text-center">
                    <p className="text-label-large font-medium">{action.title}</p>
                    <p className="text-body-small text-muted-foreground">{action.description}</p>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="elevation-2 border-0">
            <CardHeader>
              <h2 className="text-headline-small font-medium">Recent Activity</h2>
              <p className="text-body-medium text-muted-foreground">
                Your latest word analysis sessions
              </p>
            </CardHeader>
            <CardContent className="py-8 text-center">
              <div className="text-muted-foreground space-y-2">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-body-large">No recent activity</p>
                <p className="text-body-small">Start using the tools to see your activity here</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
