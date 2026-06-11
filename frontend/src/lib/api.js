import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_BASE = `${BACKEND_URL}/api`;

// Create axios instance with auth header
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('doorguard_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('doorguard_token');
      localStorage.removeItem('doorguard_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);
export const getMe = () => api.get('/auth/me');

// Profile
export const updateClientProfile = (data) => api.put('/profile/client', data);
export const updateTrainerProfile = (data) => api.put('/profile/trainer', data);
export const selectCategory = (category) => api.put('/profile/category', null, { params: { category } });

// Trainers
export const getTrainers = (params) => api.get('/trainers', { params });
export const getTrainer = (id) => api.get(`/trainers/${id}`);

// Sessions
export const bookSession = (data) => api.post('/sessions/book', data);
export const getClientSessions = () => api.get('/sessions/client');
export const getTrainerSessions = () => api.get('/sessions/trainer');
export const updateSessionStatus = (sessionId, status) => api.put(`/sessions/${sessionId}/status`, null, { params: { status } });

// Challenges
export const getChallenges = () => api.get('/challenges');
export const completeChallenge = (challengeId) => api.post(`/challenges/${challengeId}/complete`);
export const phaseUp = () => api.post('/progress/phase-up');

// Reviews
export const createReview = (data) => api.post('/reviews', data);
export const getTrainerReviews = (trainerId) => api.get(`/reviews/trainer/${trainerId}`);

// Payments
export const createCheckout = (sessionId) => api.post('/payments/create-checkout', null, { params: { session_id: sessionId } });
export const getPaymentStatus = (stripeSessionId) => api.get(`/payments/status/${stripeSessionId}`);

// Stats
export const getTrainerStats = () => api.get('/stats/trainer');
export const getClientStats = () => api.get('/stats/client');

// Safety & Trust
export const getEmergencyContacts = () => api.get('/safety/emergency-contacts');
export const updateEmergencyContacts = (contacts) => api.put('/safety/emergency-contacts', { contacts });
export const triggerSOS = (data) => api.post('/safety/sos', data);
export const getSafetyAlerts = () => api.get('/safety/alerts');
export const resolveAlert = (alertId) => api.put(`/safety/alerts/${alertId}/resolve`);
export const createIncidentReport = (data) => api.post('/safety/report', data);
export const getIncidentReports = () => api.get('/safety/reports');
export const sessionCheckIn = (sessionId) => api.post(`/sessions/${sessionId}/checkin`);
export const sessionCheckOut = (sessionId) => api.post(`/sessions/${sessionId}/checkout`);

export default api;
