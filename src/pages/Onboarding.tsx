
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuthStore } from "@/store/authStore";
import { useProfileStore } from "@/store/profileStore";
import { toast } from "@/hooks/use-toast";
import { Camera, MapPin, Clock, Calendar, Heart, User } from "lucide-react";

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();
  const { profile, updateProfile, completeOnboarding } = useProfileStore();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    dateOfBirth: "",
    timeOfBirth: "",
    placeOfBirth: "",
    sexualOrientation: "",
    datingPreference: "",
    bio: "",
  });

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    // Check if user has default profile data and needs onboarding
    if (profile && profile.isOnboardingComplete) {
      navigate("/home");
      return;
    }

    // Pre-fill form with existing profile data if available
    if (profile) {
      setFormData({
        name: profile.name || "",
        dateOfBirth: profile.dateOfBirth || "",
        timeOfBirth: profile.timeOfBirth || "",
        placeOfBirth: profile.placeOfBirth || "",
        sexualOrientation: profile.sexualOrientation || "",
        datingPreference: profile.datingPreference || "",
        bio: profile.bio || "",
      });
    }
  }, [user, profile, navigate]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          updateProfile({
            currentLocationLat: position.coords.latitude,
            currentLocationLng: position.coords.longitude,
          });
          toast({
            title: "Location enabled!",
            description: "We'll help you find matches nearby.",
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          toast({
            title: "Location access denied",
            description: "You can enable this later in settings for better matches.",
            variant: "destructive",
          });
        }
      );
    }
  };

  const validateStep = () => {
    switch (step) {
      case 1:
        return formData.name.trim().length > 0;
      case 2:
        return formData.dateOfBirth && formData.timeOfBirth && formData.placeOfBirth.trim().length > 0;
      case 3:
        return formData.sexualOrientation && formData.datingPreference;
      case 4:
        return true; // Optional steps
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateStep()) {
      toast({
        title: "Please fill in all required fields",
        description: "All fields on this step are required to continue.",
        variant: "destructive",
      });
      return;
    }
    
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleComplete = async () => {
    if (!validateStep()) {
      toast({
        title: "Please complete the required fields",
        description: "Some required information is missing.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await updateProfile({
        ...formData,
        isOnboardingComplete: true,
      });
      await completeOnboarding();
      toast({
        title: "Welcome to Kundli Dating! ✨",
        description: "Your profile is complete. Let's find your cosmic match!",
      });
      navigate("/home");
    } catch (error: any) {
      toast({
        title: "Error completing profile",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <User className="h-12 w-12 mx-auto mb-3 text-pink-400" />
              <h3 className="text-xl font-semibold text-white mb-2">Tell us about yourself</h3>
              <p className="text-purple-200">Let's start with the basics</p>
            </div>
            <div>
              <Label htmlFor="name" className="text-white text-sm font-medium">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-white/20 border-white/30 text-white placeholder:text-white/60 mt-2"
                placeholder="Enter your full name"
                required
              />
            </div>
            <div>
              <Label htmlFor="bio" className="text-white text-sm font-medium">Bio (Optional)</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="bg-white/20 border-white/30 text-white placeholder:text-white/60 mt-2"
                placeholder="Tell us about yourself, your interests, what makes you unique..."
                rows={3}
              />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Calendar className="h-12 w-12 mx-auto mb-3 text-pink-400" />
              <h3 className="text-xl font-semibold text-white mb-2">Birth Details</h3>
              <p className="text-purple-200">This helps us create your Kundli for better matches</p>
            </div>
            <div>
              <Label htmlFor="dateOfBirth" className="text-white text-sm font-medium">Date of Birth *</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="bg-white/20 border-white/30 text-white mt-2"
                required
              />
            </div>
            <div>
              <Label htmlFor="timeOfBirth" className="text-white text-sm font-medium">Time of Birth *</Label>
              <div className="flex items-center gap-2 mt-2">
                <Clock className="h-4 w-4 text-white/60" />
                <Input
                  id="timeOfBirth"
                  type="time"
                  value={formData.timeOfBirth}
                  onChange={(e) => setFormData({ ...formData, timeOfBirth: e.target.value })}
                  className="bg-white/20 border-white/30 text-white flex-1"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="placeOfBirth" className="text-white text-sm font-medium">Place of Birth *</Label>
              <div className="flex items-center gap-2 mt-2">
                <MapPin className="h-4 w-4 text-white/60" />
                <Input
                  id="placeOfBirth"
                  value={formData.placeOfBirth}
                  onChange={(e) => setFormData({ ...formData, placeOfBirth: e.target.value })}
                  className="bg-white/20 border-white/30 text-white placeholder:text-white/60 flex-1"
                  placeholder="City, State, Country"
                  required
                />
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Heart className="h-12 w-12 mx-auto mb-3 text-pink-400" />
              <h3 className="text-xl font-semibold text-white mb-2">Dating Preferences</h3>
              <p className="text-purple-200">Help us find your perfect cosmic match</p>
            </div>
            <div>
              <Label className="text-white text-sm font-medium">Sexual Orientation *</Label>
              <RadioGroup 
                value={formData.sexualOrientation} 
                onValueChange={(value) => setFormData({ ...formData, sexualOrientation: value })}
                className="mt-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="straight" id="straight" className="border-white/30 text-pink-400" />
                  <Label htmlFor="straight" className="text-white cursor-pointer">Straight</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="gay" id="gay" className="border-white/30 text-pink-400" />
                  <Label htmlFor="gay" className="text-white cursor-pointer">Gay</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="lesbian" id="lesbian" className="border-white/30 text-pink-400" />
                  <Label htmlFor="lesbian" className="text-white cursor-pointer">Lesbian</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="bisexual" id="bisexual" className="border-white/30 text-pink-400" />
                  <Label htmlFor="bisexual" className="text-white cursor-pointer">Bisexual</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pansexual" id="pansexual" className="border-white/30 text-pink-400" />
                  <Label htmlFor="pansexual" className="text-white cursor-pointer">Pansexual</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="other" className="border-white/30 text-pink-400" />
                  <Label htmlFor="other" className="text-white cursor-pointer">Other</Label>
                </div>
              </RadioGroup>
            </div>
            <div>
              <Label className="text-white text-sm font-medium">I'm interested in *</Label>
              <RadioGroup 
                value={formData.datingPreference} 
                onValueChange={(value) => setFormData({ ...formData, datingPreference: value })}
                className="mt-3"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="men" id="men" className="border-white/30 text-pink-400" />
                  <Label htmlFor="men" className="text-white cursor-pointer">Men</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="women" id="women" className="border-white/30 text-pink-400" />
                  <Label htmlFor="women" className="text-white cursor-pointer">Women</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="everyone" id="everyone" className="border-white/30 text-pink-400" />
                  <Label htmlFor="everyone" className="text-white cursor-pointer">Everyone</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <Camera className="h-12 w-12 mx-auto mb-3 text-pink-400" />
              <h3 className="text-xl font-semibold text-white mb-2">Final Steps</h3>
              <p className="text-purple-200">Complete your profile setup</p>
            </div>
            
            <div className="bg-white/10 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3">📍 Location Access</h4>
              <p className="text-purple-200 text-sm mb-3">
                Allow location access to find matches near you
              </p>
              <Button 
                onClick={getCurrentLocation} 
                variant="outline"
                className="w-full border-white/30 text-white hover:bg-white/20"
              >
                <MapPin className="h-4 w-4 mr-2" />
                Enable Location
              </Button>
            </div>

            <div className="bg-white/10 rounded-lg p-4">
              <h4 className="text-white font-medium mb-3">📸 Profile Photos</h4>
              <p className="text-purple-200 text-sm mb-3">
                Add photos to make your profile stand out (you can add these later)
              </p>
              <Button 
                variant="outline"
                className="w-full border-white/30 text-white hover:bg-white/20"
                disabled
              >
                <Camera className="h-4 w-4 mr-2" />
                Add Photos (Coming Soon)
              </Button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/10 backdrop-blur border-white/20">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-white">
            Complete Your Profile
          </CardTitle>
          <div className="flex items-center justify-center gap-2 mt-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-2 w-8 rounded-full transition-colors ${
                  i <= step ? 'bg-pink-400' : 'bg-white/20'
                }`}
              />
            ))}
          </div>
          <div className="text-purple-200 text-sm">Step {step} of 4</div>
        </CardHeader>
        <CardContent>
          {renderStep()}
          <div className="flex justify-between mt-8">
            {step > 1 && (
              <Button 
                onClick={handleBack} 
                variant="outline" 
                className="border-white/30 text-white hover:bg-white/20"
              >
                Back
              </Button>
            )}
            {step < 4 ? (
              <Button 
                onClick={handleNext} 
                className="ml-auto bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
              >
                Next
              </Button>
            ) : (
              <Button 
                onClick={handleComplete} 
                disabled={loading}
                className="ml-auto bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
              >
                {loading ? "Completing..." : "Complete Profile ✨"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
