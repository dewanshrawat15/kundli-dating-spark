
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useProfileStore } from '@/store/profileStore';

interface LocationState {
  isLoading: boolean;
  hasPermission: boolean | null;
  error: string | null;
  currentCity: string | null;
}

export const useLocation = () => {
  const [state, setState] = useState<LocationState>({
    isLoading: false,
    hasPermission: null,
    error: null,
    currentCity: null,
  });

  const { user } = useAuthStore();
  const { profile, updateProfile, fetchProfile } = useProfileStore();

  const getCityFromCoordinates = async (latitude: number, longitude: number): Promise<string> => {
    try {
      // Using OpenStreetMap Nominatim API which is more reliable and free
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'DatingApp/1.0'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch location data');
      }
      
      const data = await response.json();
      
      // Extract city from various possible fields
      const city = data.address?.city || 
                   data.address?.town || 
                   data.address?.village || 
                   data.address?.municipality ||
                   data.address?.county ||
                   'Unknown City';
      
      return city;
    } catch (error) {
      console.error('Error getting city from coordinates:', error);
      // Fallback: try a simpler approach with just coordinates
      return `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
    }
  };

  const requestLocationPermission = async (): Promise<boolean> => {
    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, error: 'Geolocation is not supported by this browser' }));
      return false;
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      
      if (permission.state === 'granted') {
        return true;
      } else if (permission.state === 'prompt') {
        // Will be handled by getCurrentPosition which triggers the permission prompt
        return true;
      } else {
        setState(prev => ({ ...prev, hasPermission: false, error: 'Location permission denied' }));
        return false;
      }
    } catch (error) {
      // Fallback for browsers that don't support permissions API
      return true;
    }
  };

  const getCurrentLocation = async (): Promise<{ city: string; lat: number; lng: number } | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      setState(prev => ({ ...prev, isLoading: false }));
      return null;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          try {
            const city = await getCityFromCoordinates(latitude, longitude);
            
            setState(prev => ({
              ...prev,
              isLoading: false,
              hasPermission: true,
              currentCity: city,
              error: null,
            }));

            resolve({ city, lat: latitude, lng: longitude });
          } catch (error) {
            setState(prev => ({
              ...prev,
              isLoading: false,
              error: 'Failed to get city information',
            }));
            resolve(null);
          }
        },
        (error) => {
          let errorMessage = 'Failed to get location';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied';
              setState(prev => ({ ...prev, hasPermission: false }));
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
          }

          setState(prev => ({
            ...prev,
            isLoading: false,
            error: errorMessage,
          }));
          
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000, // Increased timeout
          maximumAge: 300000, // 5 minutes
        }
      );
    });
  };

  const updateUserLocation = async () => {
    if (!user || !profile) return;

    const locationData = await getCurrentLocation();
    if (!locationData) return;

    const { city, lat, lng } = locationData;
    
    // Check if city has changed
    const previousCity = profile.current_city;
    const cityChanged = previousCity !== city;

    try {
      // Update profile with new location data
      await updateProfile({
        current_city: city,
        currentLocationLat: lat,
        currentLocationLng: lng,
      });

      // If city changed, refetch profile to ensure everything is up to date
      if (cityChanged && user.id) {
        console.log('City changed from', previousCity, 'to', city, '- refetching profile');
        await fetchProfile(user.id);
      }
    } catch (error) {
      console.error('Failed to update user location:', error);
      setState(prev => ({ ...prev, error: 'Failed to update location' }));
    }
  };

  // Auto-update location when user logs in
  useEffect(() => {
    if (user && profile && !profile.current_city) {
      console.log('User logged in without current_city - requesting location');
      updateUserLocation();
    }
  }, [user, profile]);

  return {
    ...state,
    getCurrentLocation,
    updateUserLocation,
    requestLocationPermission,
  };
};
