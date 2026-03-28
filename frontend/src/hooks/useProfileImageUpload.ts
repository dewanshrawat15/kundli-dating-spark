import { useState } from "react";
import { uploadPhoto, deletePhoto } from "@/api/profile";
import { useProfileStore } from "@/store/profileStore";
import { toast } from "@/hooks/use-toast";

export const useProfileImageUpload = () => {
  const [uploading, setUploading] = useState(false);
  const { profile, setProfile } = useProfileStore();

  const uploadProfileImage = async (file: File): Promise<string | null> => {
    if (!file) return null;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file type", description: "Please select an image.", variant: "destructive" });
      return null;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5MB allowed.", variant: "destructive" });
      return null;
    }

    setUploading(true);
    try {
      const { data: img } = await uploadPhoto(file);
      if (profile) {
        setProfile({ ...profile, images: [...(profile.images || []), img] });
      }
      toast({ title: "Photo uploaded!" });
      return img.url;
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const deleteProfileImage = async (photoId: string) => {
    try {
      await deletePhoto(photoId);
      if (profile) {
        setProfile({ ...profile, images: profile.images.filter((i) => i.id !== photoId) });
      }
      toast({ title: "Photo removed" });
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  return { uploadProfileImage, deleteProfileImage, uploading };
};
