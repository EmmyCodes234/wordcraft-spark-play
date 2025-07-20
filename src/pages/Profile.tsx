import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Camera, LoaderCircle } from "lucide-react";
import { Label } from "@/components/ui/label"; // <-- ADD THIS LINE

export default function Profile() {
  const { user } = useAuth();
  const [username, setUsername] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.user_metadata?.username || "");
      // Add a timestamp to bust the cache when loading the initial avatar
      if (user.user_metadata?.avatar_url) {
          setProfileImage(`${user.user_metadata.avatar_url}?t=${new Date().getTime()}`);
      }
    }
  }, [user]);
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    // Create a path like 'user-id/avatar.png'
    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      alert("Failed to upload image.");
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    
    // Add a timestamp to the URL to bust browser cache
    const publicUrl = `${data.publicUrl}?t=${new Date().getTime()}`;

    const { error: updateError } = await supabase.auth.updateUser({
      data: { avatar_url: publicUrl },
    });

    if (updateError) {
      console.error("Update error:", updateError);
      alert("Failed to update profile with new image.");
    } else {
      setProfileImage(publicUrl);
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    
    // First update the username in the profiles table if you have one
    const { error: profileError } = await supabase
        .from('profiles')
        .update({ username: username })
        .eq('id', user.id);
        
    if (profileError) {
        alert("Error updating username.");
        console.error("Profile update error:", profileError);
    }
    
    // Then update the user metadata in auth
    const { error: authError } = await supabase.auth.updateUser({
      data: { username: username },
    });

    if (authError) {
      alert("Error updating profile.");
      console.error("Auth update error:", authError);
    } else {
      alert("Profile updated successfully!");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle py-10">
      <div className="max-w-md mx-auto p-6 sm:p-8 bg-background rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold mb-6 text-center text-primary">Your Profile</h1>

        <div className="flex flex-col items-center mb-6 space-y-4">
          <div className="relative">
            <label htmlFor="avatar-upload" className="cursor-pointer group">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="w-28 h-28 rounded-full object-cover border-4 border-background shadow-md group-hover:opacity-80 transition-opacity"
                />
              ) : (
                <div className="w-28 h-28 rounded-full bg-primary/10 flex items-center justify-center text-primary text-4xl font-bold shadow-md group-hover:opacity-80 transition-opacity">
                  {username ? username[0].toUpperCase() : "?"}
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {uploading ? <LoaderCircle className="text-white animate-spin" /> : <Camera className="text-white w-8 h-8" />}
              </div>
            </label>
            <input
              type="file"
              id="avatar-upload"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploading}
              className="hidden"
            />
          </div>
        </div>

        <div className="space-y-4">
            <div>
                <Label htmlFor="email" className="text-sm font-medium text-muted-foreground">Email</Label>
                <Input id="email" type="email" value={user?.email || ''} disabled className="mt-1 bg-secondary border-none" />
            </div>
            <div>
                <Label htmlFor="username" className="text-sm font-medium text-muted-foreground">Username</Label>
                <Input id="username" placeholder="Your name" value={username} onChange={(e) => setUsername(e.target.value)} className="mt-1"/>
            </div>
          <Button
            onClick={handleSave}
            disabled={loading || uploading}
            className="w-full text-lg py-6 bg-gradient-primary"
          >
            {loading ? <><LoaderCircle className="animate-spin mr-2" /> Saving...</> : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}