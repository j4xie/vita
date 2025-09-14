// API Types for Pomelo Frontend

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    message_en: string;
    details?: any;
  };
}

export interface User {
  id: string;
  email: string;
  user_type: 'student' | 'parent' | 'organization' | 'admin';
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  last_login_at?: string;
  profile?: UserProfile;
}

export interface UserProfile {
  user_id: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  phone_number?: string;
  university?: string;
  major?: string;
  graduation_year?: string;
  city?: string;
  state?: string;
  language_preference: string;
  bio?: string;
  avatar_url?: string;
  created_at: string;
  updated_at?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirm_password: string;
  user_type?: 'student' | 'parent' | 'organization';
  profile?: Partial<UserProfile>;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface Activity {
  id: string;
  organization_id: string;
  title: string;
  title_en?: string;
  description: string;
  description_en?: string;
  activity_type: string;
  start_time: string;
  end_time: string;
  location_name?: string;
  address?: string;
  city?: string;
  state?: string;
  is_online: boolean;
  online_link?: string;
  max_participants?: number;
  registration_deadline?: string;
  is_free: boolean;
  price?: number;
  cover_image_url?: string;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  created_at: string;
  updated_at?: string;
}