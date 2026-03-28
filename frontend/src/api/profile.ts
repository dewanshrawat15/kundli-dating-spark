import client from "./client";

export interface ProfileImage {
  id: string;
  url: string;
  order: number;
  is_primary: boolean;
}

export interface Profile {
  user_id: string;
  name: string;
  age: number;
  email: string;
  date_of_birth: string;
  time_of_birth: string;
  place_of_birth: string;
  birth_lat: number | null;
  birth_lng: number | null;
  current_city: string;
  current_lat: number | null;
  current_lng: number | null;
  bio: string;
  sexual_orientation: string;
  dating_preference: string;
  religion: string;
  caste: string;
  mother_tongue: string;
  marital_status: string;
  min_age_preference: number;
  max_age_preference: number;
  max_distance_km: number;
  images: ProfileImage[];
}

export interface OnboardingPayload {
  name: string;
  date_of_birth: string;
  time_of_birth: string;
  place_of_birth: string;
  bio?: string;
  sexual_orientation: string;
  dating_preference: string;
  religion?: string;
  caste?: string;
  mother_tongue?: string;
  marital_status?: string;
  min_age_preference?: number;
  max_age_preference?: number;
  max_distance_km?: number;
  current_city?: string;
  current_lat?: number;
  current_lng?: number;
}

export const getProfile = () => client.get<Profile>("/profile/me/");

export const updateProfile = (data: Partial<OnboardingPayload>) =>
  client.put<Profile>("/profile/me/", data);

export const completeOnboarding = (data: OnboardingPayload) =>
  client.post<Profile>("/profile/me/onboarding/", data);

export const uploadPhoto = (file: File) => {
  const form = new FormData();
  form.append("image", file);
  return client.post<ProfileImage>("/profile/photos/", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const deletePhoto = (photoId: string) =>
  client.delete(`/profile/photos/${photoId}/`);
