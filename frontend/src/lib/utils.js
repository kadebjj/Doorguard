import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Belt colors mapping
export const BELT_COLORS = {
  white: { bg: 'bg-white', text: 'text-zinc-900', border: 'border-zinc-300' },
  blue: { bg: 'bg-blue-500', text: 'text-white', border: 'border-blue-400' },
  purple: { bg: 'bg-purple-500', text: 'text-white', border: 'border-purple-400' },
  brown: { bg: 'bg-amber-900', text: 'text-white', border: 'border-amber-800' },
  black: { bg: 'bg-zinc-900', text: 'text-white', border: 'border-zinc-600' },
};

export const BELT_PHASES = ['white', 'blue', 'purple', 'brown', 'black'];

export const CATEGORY_NAMES = {
  personal_training: 'Personal Training',
  self_defense: 'Self Defense',
  jiujitsu: 'Jiu-Jitsu',
};

export const VERIFICATION_BADGES = {
  verified: { label: 'Verified', color: 'badge-verified', icon: 'Shield' },
  elite: { label: 'Elite', color: 'badge-elite', icon: 'Award' },
  specialist: { label: 'Specialist', color: 'badge-specialist', icon: 'Star' },
};

// Format currency
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

// Format date
export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

// Format time
export const formatTime = (timeString) => {
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

// Get initials from name
export const getInitials = (name) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Calculate progress percentage
export const calculateProgress = (current, total) => {
  if (total === 0) return 0;
  return Math.round((current / total) * 100);
};

// Auth helpers
export const setAuthData = (token, user) => {
  localStorage.setItem('doorguard_token', token);
  localStorage.setItem('doorguard_user', JSON.stringify(user));
};

export const getAuthData = () => {
  const token = localStorage.getItem('doorguard_token');
  const userStr = localStorage.getItem('doorguard_user');
  const user = userStr ? JSON.parse(userStr) : null;
  return { token, user };
};

export const clearAuthData = () => {
  localStorage.removeItem('doorguard_token');
  localStorage.removeItem('doorguard_user');
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('doorguard_token');
};
