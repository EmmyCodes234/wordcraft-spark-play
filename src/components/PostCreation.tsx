import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Image, 
  Smile, 
  MapPin, 
  Users, 
  Globe, 
  X, 
  Plus,
  Send,
  Camera,
  FileImage
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface PostCreationProps {
  onPostCreated?: () => void;
  placeholder?: string;
  className?: string;
}

export default function PostCreation({ onPostCreated, placeholder = "What's on your mind?", className }: PostCreationProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [privacy, setPrivacy] = useState<'public' | 'friends' | 'private'>('public');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive"
        });
        return;
      }

      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim()) && tags.length < 5) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;
      const filePath = `post-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('post-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const createPost = async () => {
    if (!content.trim() && !selectedImage) {
      toast({
        title: "Empty post",
        description: "Please add some content or an image",
        variant: "destructive"
      });
      return;
    }

    setIsPosting(true);

    try {
      let imageUrl = null;
      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage);
        if (!imageUrl) {
          throw new Error('Failed to upload image');
        }
      }

      // Try enhanced post creation first
      const { error } = await supabase
        .from('social_posts')
        .insert({
          user_id: user?.id,
          type: 'user_post',
          content: {
            title: content.substring(0, 100),
            description: content,
            data: { tags, privacy }
          },
          content_text: content,
          image_url: imageUrl,
          privacy,
          tags
        });

      // If enhanced insert fails, try basic insert
      if (error && (error.code === 'PGRST200' || error.message.includes('column') || error.message.includes('schema'))) {
        console.log('Enhanced columns not found, using basic post creation');
        
        const { error: basicError } = await supabase
          .from('social_posts')
          .insert({
            user_id: user?.id,
            type: 'user_post',
            content: {
              title: content.substring(0, 100),
              description: content,
              data: { tags, privacy }
            }
          });

        if (basicError) throw basicError;
      } else if (error) {
        throw error;
      }

      toast({
        title: "Post created!",
        description: "Your post has been shared with the community",
      });

      // Reset form
      setContent('');
      setSelectedImage(null);
      setImagePreview(null);
      setTags([]);
      setTagInput('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      onPostCreated?.();
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error",
        description: "Failed to create post",
        variant: "destructive"
      });
    } finally {
      setIsPosting(false);
    }
  };

  const getPrivacyIcon = () => {
    switch (privacy) {
      case 'public': return <Globe className="h-4 w-4" />;
      case 'friends': return <Users className="h-4 w-4" />;
      case 'private': return <Users className="h-4 w-4" />;
    }
  };

  const getPrivacyText = () => {
    switch (privacy) {
      case 'public': return 'Public';
      case 'friends': return 'Friends';
      case 'private': return 'Only me';
    }
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.user_metadata?.avatar_url} />
            <AvatarFallback>
              {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-3">
            {/* Privacy Selector */}
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPrivacy(privacy === 'public' ? 'friends' : privacy === 'friends' ? 'private' : 'public')}
                className="flex items-center space-x-1"
              >
                {getPrivacyIcon()}
                <span>{getPrivacyText()}</span>
              </Button>
            </div>

            {/* Content Input */}
            <Textarea
              placeholder={placeholder}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[100px] resize-none border-0 focus:ring-0 text-lg"
              maxLength={2000}
            />

            {/* Image Preview */}
            <AnimatePresence>
              {imagePreview && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="relative"
                >
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full max-h-96 object-cover rounded-lg"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={removeImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tags */}
            <AnimatePresence>
              {tags.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-wrap gap-2"
                >
                  {tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                      <span>#{tag}</span>
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeTag(tag)}
                      />
                    </Badge>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tag Input */}
            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder="Add tags..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
                className="flex-1 px-3 py-2 border rounded-lg text-sm"
                maxLength={20}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={addTag}
                disabled={!tagInput.trim() || tags.length >= 5}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center space-x-2"
                >
                  <Camera className="h-4 w-4" />
                  <span>Photo</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <Smile className="h-4 w-4" />
                  <span>Feeling</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  <MapPin className="h-4 w-4" />
                  <span>Location</span>
                </Button>
              </div>

              <Button
                onClick={createPost}
                disabled={isPosting || (!content.trim() && !selectedImage)}
                className="flex items-center space-x-2"
              >
                <Send className="h-4 w-4" />
                <span>{isPosting ? 'Posting...' : 'Post'}</span>
              </Button>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
