
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/store/authStore";
import { useProfileStore } from "@/store/profileStore";
import { toast } from "@/hooks/use-toast";

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
    }
  }, [user, navigate]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          updateProfile({
            currentLocationLat: position.coords.latitude,
            currentLocationLng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          toast({
            title: "Location access denied",
            description: "Please enable location services for better matches.",
            variant: "destructive",
          });
        }
      );
    }
  };

  const handleNext = () => {
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
    setLoading(true);
    try {
      await updateProfile({
        ...formData,
        isOnboardingComplete: true,
      });
      await completeOnboarding();
      toast({
        title: "Profile completed!",
        description: "Welcome to Kundli Dating!",
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
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-white">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
                placeholder="Enter your full name"
                required
              />
            </div>
            <div>
              <Label htmlFor="bio" className="text-white">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
                placeholder="Tell us about yourself..."
                rows={3}
              />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="dateOfBirth" className="text-white">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="bg-white/20 border-white/30 text-white"
                required
              />
            </div>
            <div>
              <Label htmlFor="timeOfBirth" className="text-white">Time of Birth</Label>
              <Input
                id="timeOfBirth"
                type="time"
                value={formData.timeOfBirth}
                onChange={(e) => setFormData({ ...formData, timeOfBirth: e.target.value })}
                className="bg-white/20 border-white/30 text-white"
                required
              />
            </div>
            <div>
              <Label htmlFor="placeOfBirth" className="text-white">Place of Birth</Label>
              <Input
                id="placeOfBirth"
                value={formData.placeOfBirth}
                onChange={(e) => setFormData({ ...formData, placeOfBirth: e.target.value })}
                className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
                placeholder="City, State, Country"
                required
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-white">Sexual Orientation</Label>
              <Select value={formData.sexualOrientation} onValueChange={(value) => setFormData({ ...formData, sexualOrientation: value })}>
                <SelectTrigger className="bg-white/20 border-white/30 text-white">
                  <SelectValue placeholder="Select your orientation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="straight">Straight</SelectItem>
                  <SelectItem value="gay">Gay</SelectItem>
                  <SelectItem value="lesbian">Lesbian</SelectItem>
                  <SelectItem value="bisexual">Bisexual</SelectItem>
                  <SelectItem value="pansexual">Pansexual</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-white">Dating Preference</Label>
              <Select value={formData.datingPreference} onValueChange={(value) => setFormData({ ...formData, datingPreference: value })}>
                <SelectTrigger className="bg-white/20 border-white/30 text-white">
                  <SelectValue placeholder="Who are you interested in?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="men">Men</SelectItem>
                  <SelectItem value="women">Women</SelectItem>
                  <SelectItem value="everyone">Everyone</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-white text-lg mb-4">Location Access</h3>
              <p className="text-purple-200 mb-4">
                Allow location access to find matches near you
              </p>
              <Button onClick={getCurrentLocation} className="mb-4">
                Enable Location
              </Button>
            </div>
            <div className="text-center">
              <h3 className="text-white text-lg mb-4">Profile Images</h3>
              <p className="text-purple-200 mb-4">
                Add photos to complete your profile (coming soon)
              </p>
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
          <div className="text-purple-200">Step {step} of 4</div>
        </CardHeader>
        <CardContent>
          {renderStep()}
          <div className="flex justify-between mt-6">
            {step > 1 && (
              <Button onClick={handleBack} variant="outline" className="border-white/30 text-white hover:bg-white/20">
                Back
              </Button>
            )}
            {step < 4 ? (
              <Button onClick={handleNext} className="ml-auto bg-gradient-to-r from-pink-500 to-purple-600">
                Next
              </Button>
            ) : (
              <Button 
                onClick={handleComplete} 
                disabled={loading}
                className="ml-auto bg-gradient-to-r from-pink-500 to-purple-600"
              >
                {loading ? "Completing..." : "Complete Profile"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
