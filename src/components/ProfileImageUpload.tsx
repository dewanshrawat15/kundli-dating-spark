
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload, faTrash, faUser } from '@fortawesome/free-solid-svg-icons';
import { useProfileImageUpload } from '@/hooks/useProfileImageUpload';
import { useProfileStore } from '@/store/profileStore';

interface ProfileImageUploadProps {
  className?: string;
  showUploadButton?: boolean;
  showDeleteButton?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const ProfileImageUpload = ({ 
  className = "", 
  showUploadButton = true, 
  showDeleteButton = true,
  size = 'md'
}: ProfileImageUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadProfileImage, deleteProfileImage, uploading } = useProfileImageUpload();
  const { profile } = useProfileStore();

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  const primaryImage = profile?.profileImages?.[0];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadProfileImage(file);
    }
    // Clear the input so the same file can be selected again
    event.target.value = '';
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDeleteClick = () => {
    if (primaryImage) {
      deleteProfileImage(primaryImage);
    }
  };

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <Avatar className={sizeClasses[size]}>
        {primaryImage ? (
          <AvatarImage src={primaryImage} alt="Profile" className="object-cover" />
        ) : (
          <AvatarFallback className="bg-gradient-to-b from-pink-400/30 to-purple-600/30">
            <FontAwesomeIcon icon={faUser} className="h-8 w-8 text-white" />
          </AvatarFallback>
        )}
      </Avatar>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden"
      />

      <div className="flex gap-2">
        {showUploadButton && (
          <Button
            onClick={handleUploadClick}
            disabled={uploading}
            variant="outline"
            size="sm"
            className="border-white/30 text-white hover:bg-white/20"
          >
            <FontAwesomeIcon icon={faUpload} className="h-3 w-3 mr-2" />
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        )}

        {showDeleteButton && primaryImage && (
          <Button
            onClick={handleDeleteClick}
            variant="outline"
            size="sm"
            className="border-red-400/30 text-red-400 hover:bg-red-400/20"
          >
            <FontAwesomeIcon icon={faTrash} className="h-3 w-3 mr-2" />
            Delete
          </Button>
        )}
      </div>
    </div>
  );
};

export default ProfileImageUpload;
