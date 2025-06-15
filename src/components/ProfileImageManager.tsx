
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, X, Plus } from "lucide-react";
import { useProfileImageUpload } from "@/hooks/useProfileImageUpload";
import { useProfileStore } from "@/store/profileStore";

const ProfileImageManager = () => {
  const { uploadProfileImage, deleteProfileImage, uploading } = useProfileImageUpload();
  const { profile } = useProfileStore();
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        await uploadProfileImage(file);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const currentImages = profile?.profileImages || [];
  const canAddMore = currentImages.length < 5;

  return (
    <Card className="bg-white text-black border-gray-300">
      <CardHeader>
        <CardTitle className="text-black">Profile Photos ({currentImages.length}/5)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Images Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {currentImages.map((imageUrl, index) => (
            <div key={index} className="relative group">
              <img
                src={imageUrl}
                alt={`Profile ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg"
              />
              <Button
                onClick={() => deleteProfileImage(imageUrl)}
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>

        {/* Upload Area */}
        {canAddMore && (
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragOver 
                ? 'border-purple-500 bg-purple-50' 
                : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-gray-500" />
            <p className="text-black mb-2">
              Drag and drop photos here, or click to select
            </p>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
              id="image-upload"
            />
            <Button
              asChild
              variant="outline"
              disabled={uploading}
              className="bg-white text-black border-gray-300 hover:bg-gray-100"
            >
              <label htmlFor="image-upload" className="cursor-pointer">
                <Plus className="h-4 w-4 mr-2" />
                {uploading ? 'Uploading...' : 'Add Photos'}
              </label>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileImageManager;
