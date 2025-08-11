/**
 * TypeScript type definitions for Uni-con app
 */

// User types
export interface User {
  id: number;
  email: string;
  name: string;
  created_at: string;
}

export interface UserProfile {
  id: number;
  user_id: number;
  sleep_type: 'morning' | 'evening';
  home_time: 'day' | 'night' | 'irregular';
  cleaning_frequency: 'daily' | 'weekly' | 'as_needed';
  cleaning_sensitivity: 'very_sensitive' | 'normal' | 'not_sensitive';
  smoking_status: 'non_smoker_strict' | 'non_smoker_ok' | 'smoker_indoor_no' | 'smoker_indoor_yes';
  noise_sensitivity: 'sensitive' | 'normal' | 'not_sensitive';
  is_complete: boolean;
  updated_at: string;
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  id: number;
  email: string;
  name: string;
}

// Matching types
export interface MatchResult {
  user_id: number;
  email: string;
  name: string;
  compatibility_score: number;
  matching_details: {
    sleep_type: 'compatible' | 'neutral' | 'incompatible';
    home_time: 'compatible' | 'neutral' | 'incompatible';
    cleaning_frequency: 'compatible' | 'neutral' | 'incompatible';
    cleaning_sensitivity: 'compatible' | 'neutral' | 'incompatible';
    smoking_status: 'compatible' | 'neutral' | 'incompatible';
    noise_sensitivity: 'compatible' | 'neutral' | 'incompatible';
  };
}

// Property types (for future implementation)
export interface Property {
  id: number;
  title: string;
  type: 'oneroom' | 'tworoom' | 'officetel' | 'apartment';
  location: string;
  deposit: number;
  monthly_rent: number;
  size: number;
  image_url?: string;
  price_comparison?: 'cheaper' | 'average' | 'expensive';
  price_difference?: number;
}

// Navigation types
export type RootStackParamList = {
  index: undefined;
  'auth/login': undefined;
  'auth/signup': undefined;
  '(tabs)': undefined;
};

export type TabParamList = {
  index: undefined;
  matching: undefined;
  property: undefined;
  profile: undefined;
};

// API Response types
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

export interface ApiError {
  message: string;
  status: number;
}

// Form validation types
export interface ValidationError {
  field: string;
  message: string;
}

export interface FormState<T> {
  values: T;
  errors: ValidationError[];
  isValid: boolean;
  isSubmitting: boolean;
}

// Component prop types
export interface IconProps {
  name: string;
  size?: number;
  color?: string;
  focused?: boolean;
}

export interface CardProps {
  children: React.ReactNode;
  style?: any;
  onPress?: () => void;
}

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
  loading?: boolean;
  style?: any;
}

// Activity types (for home screen)
export interface ActivityItem {
  id: string;
  type: 'favorite' | 'test_complete' | 'match_found' | 'property_viewed';
  title: string;
  description?: string;
  timestamp: string;
  icon: string;
  iconColor: string;
}