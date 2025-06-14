
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faSave } from '@fortawesome/free-solid-svg-icons';
import { useAuthStore } from "@/store/authStore";
import { useProfileStore } from "@/store/profileStore";
import { toast } from "@/hooks/use-toast";
import ProfileImageUpload from "@/components/ProfileImageUpload";

const AccountSettings = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { profile, updateProfile, isLoading } = useProfileStore();
  
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    sexualOrientation: "",
    datingPreference: "",
    current_city: "",
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        bio: profile.bio || "",
        sexualOrientation: profile.sexualOrientation || "",
        datingPreference: profile.datingPreference || "",
        current_city: profile.current_city || "",
      });
    }
  }, [profile]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      await updateProfile({
        name: formData.name,
        bio: formData.bio,
        sexualOrientation: formData.sexualOrientation as any,
        datingPreference: formData.datingPreference as any,
        current_city: formData.current_city,
      });
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="flex items-center gap-4 p-4 text-white">
        <Button
          onClick={() => navigate("/profile")}
          variant="ghost"
          size="sm"
          className="text-white hover:bg-white/20"
        >
          <FontAwesomeIcon icon={faArrowLeft} className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-bold">Account Settings</h1>
      </div>

      <div className="px-4 pb-8">
        {/* Profile Photo Section */}
        <Card className="bg-white/10 backdrop-blur border-white/20 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Profile Photo</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <ProfileImageUpload size="lg" />
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card className="bg-white/10 backdrop-blur border-white/20 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-purple-200">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="bg-white/20 border-white/30 text-white placeholder-white/50"
                placeholder="Enter your name"
              />
            </div>
            
            <div>
              <Label htmlFor="current_city" className="text-purple-200">Current City</Label>
              <Input
                id="current_city"
                value={formData.current_city}
                onChange={(e) => handleInputChange("current_city", e.target.value)}
                className="bg-white/20 border-white/30 text-white placeholder-white/50"
                placeholder="Enter your current city"
              />
            </div>

            <div>
              <Label htmlFor="bio" className="text-purple-200">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange("bio", e.target.value)}
                className="bg-white/20 border-white/30 text-white placeholder-white/50"
                placeholder="Tell us about yourself..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card className="bg-white/10 backdrop-blur border-white/20 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Dating Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-purple-200">Sexual Orientation</Label>
              <Select value={formData.sexualOrientation} onValueChange={(value) => handleInputChange("sexualOrientation", value)}>
                <SelectTrigger className="bg-white/20 border-white/30 text-white">
                  <SelectValue placeholder="Select orientation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="straight">Straight</SelectItem>
                  <SelectItem value="gay">Gay</SelectItem>
                  <SelectItem value="lesbian">Lesbian</SelectItem>
                  <SelectItem value="bisexual">Bisexual</SelectItem>
                  <SelectItem value="pansexual">Pansexual</SelectItem>
                  <SelectItem value="asexual">Asexual</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-purple-200">Looking for</Label>
              <Select value={formData.datingPreference} onValueChange={(value) => handleInputChange("datingPreference", value)}>
                <SelectTrigger className="bg-white/20 border-white/30 text-white">
                  <SelectValue placeholder="Select preference" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="men">Men</SelectItem>
                  <SelectItem value="women">Women</SelectItem>
                  <SelectItem value="everyone">Everyone</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={handleSave}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
        >
          <FontAwesomeIcon icon={faSave} className="h-4 w-4 mr-2" />
          {isLoading ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
};

export default AccountSettings;
