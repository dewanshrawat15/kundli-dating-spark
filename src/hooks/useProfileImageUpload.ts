
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { useProfileStore } from '@/store/profileStore';
import { toast } from '@/hooks/use-toast';

export const useProfileImageUpload = () => {
  const [uploading, setUploading] = useState(false);
  const { user } = useAuthStore();
  const { updateProfile, profile } = useProfileStore();

  const uploadProfileImage = async (file: File): Promise<string | null> => {
    if (!user || !file) {
      toast({
        title: "Upload Error",
        description: "Please select a file and ensure you're logged in.",
        variant: "destructive",
      });
      return null;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return null;
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      });
      return null;
    }

    setUploading(true);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from('profile-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(fileName);

      // Update profile with new image URL
      const currentImages = profile?.profileImages || [];
      const updatedImages = [publicUrl, ...currentImages.slice(0, 4)]; // Keep max 5 images

      await updateProfile({
        profileImages: updatedImages
      });

      toast({
        title: "Upload Successful",
        description: "Your profile image has been uploaded!",
      });

      return publicUrl;

    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload image. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const deleteProfileImage = async (imageUrl: string) => {
    if (!user || !profile) return;

    try {
      // Extract file path from URL
      const urlParts = imageUrl.split('/profile-images/');
      if (urlParts.length !== 2) return;
      
      const filePath = urlParts[1];

      // Delete from storage
      const { error } = await supabase.storage
        .from('profile-images')
        .remove([filePath]);

      if (error) {
        console.error('Delete error:', error);
        throw error;
      }

      // Update profile to remove image URL
      const updatedImages = (profile.profileImages || []).filter(url => url !== imageUrl);
      
      await updateProfile({
        profileImages: updatedImages
      });

      toast({
        title: "Image Deleted",
        description: "Profile image has been removed.",
      });

    } catch (error: any) {
      console.error('Error deleting image:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete image. Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    uploadProfileImage,
    deleteProfileImage,
    uploading
  };
};
