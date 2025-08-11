/**
 * Form validation utilities for Uni-con app
 */

import { ValidationError } from '../types';

// Email validation
export const validateEmail = (email: string): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!email) {
    errors.push({ field: 'email', message: '이메일을 입력해주세요.' });
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push({ field: 'email', message: '올바른 이메일 형식을 입력해주세요.' });
  }
  
  return errors;
};

// Password validation
export const validatePassword = (password: string): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!password) {
    errors.push({ field: 'password', message: '비밀번호를 입력해주세요.' });
  } else if (password.length < 8) {
    errors.push({ field: 'password', message: '비밀번호는 최소 8자 이상이어야 합니다.' });
  } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    errors.push({ 
      field: 'password', 
      message: '비밀번호는 대문자, 소문자, 숫자를 포함해야 합니다.' 
    });
  }
  
  return errors;
};

// Confirm password validation
export const validateConfirmPassword = (
  password: string, 
  confirmPassword: string
): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!confirmPassword) {
    errors.push({ field: 'confirmPassword', message: '비밀번호 확인을 입력해주세요.' });
  } else if (password !== confirmPassword) {
    errors.push({ field: 'confirmPassword', message: '비밀번호가 일치하지 않습니다.' });
  }
  
  return errors;
};

// Name validation
export const validateName = (name: string): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!name) {
    errors.push({ field: 'name', message: '이름을 입력해주세요.' });
  } else if (name.length < 2) {
    errors.push({ field: 'name', message: '이름은 최소 2자 이상이어야 합니다.' });
  } else if (name.length > 20) {
    errors.push({ field: 'name', message: '이름은 최대 20자까지 입력 가능합니다.' });
  }
  
  return errors;
};

// Profile validation
export const validateProfile = (profile: any): ValidationError[] => {
  const errors: ValidationError[] = [];
  const requiredFields = [
    'sleep_type',
    'home_time',
    'cleaning_frequency',
    'cleaning_sensitivity',
    'smoking_status',
    'noise_sensitivity'
  ];
  
  requiredFields.forEach(field => {
    if (!profile[field]) {
      errors.push({ 
        field, 
        message: `${getFieldDisplayName(field)}을(를) 선택해주세요.` 
      });
    }
  });
  
  return errors;
};

// Get user-friendly field names
const getFieldDisplayName = (field: string): string => {
  const fieldNames: Record<string, string> = {
    sleep_type: '수면 패턴',
    home_time: '재택 시간',
    cleaning_frequency: '청소 주기',
    cleaning_sensitivity: '청소 민감도',
    smoking_status: '흡연 여부',
    noise_sensitivity: '소음 민감도'
  };
  
  return fieldNames[field] || field;
};

// Generic validation function
export const validateForm = <T>(
  data: T,
  validators: Array<(data: T) => ValidationError[]>
): { isValid: boolean; errors: ValidationError[] } => {
  const allErrors = validators.reduce((errors, validator) => {
    return [...errors, ...validator(data)];
  }, [] as ValidationError[]);
  
  return {
    isValid: allErrors.length === 0,
    errors: allErrors
  };
};

// Login form validation
export const validateLoginForm = (data: { email: string; password: string }) => {
  return validateForm(data, [
    (d) => validateEmail(d.email),
    (d) => d.password ? [] : [{ field: 'password', message: '비밀번호를 입력해주세요.' }]
  ]);
};

// Signup form validation
export const validateSignupForm = (data: { 
  email: string; 
  password: string; 
  confirmPassword: string; 
  name: string;
}) => {
  return validateForm(data, [
    (d) => validateEmail(d.email),
    (d) => validatePassword(d.password),
    (d) => validateConfirmPassword(d.password, d.confirmPassword),
    (d) => validateName(d.name)
  ]);
};

// Remove errors for a specific field
export const removeFieldErrors = (errors: ValidationError[], field: string): ValidationError[] => {
  return errors.filter(error => error.field !== field);
};

// Get errors for a specific field
export const getFieldErrors = (errors: ValidationError[], field: string): string[] => {
  return errors
    .filter(error => error.field === field)
    .map(error => error.message);
};