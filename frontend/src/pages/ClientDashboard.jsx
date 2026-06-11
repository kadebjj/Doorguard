import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getClientStats, getChallenges, getClientSessions, selectCategory } from '../lib/api';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import BeltProgress from '../components/BeltProgress';
import { 
  Target, Award, Calendar, TrendingUp, ChevronRight, 
  Dumbbell, Shield as ShieldIcon, Users, CheckCircle 
} from 'lucide-react';
import { CATEGORY_NAMES, formatDate, formatTime, formatCurrency } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const ClientDashboard = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const profile = user?.client_profile || {};

  const loadData = useCallback(async () => {
    try {
      const [statsRes, challengesRes, sessionsRes] = await Promise.all([
        getClientStats(),
        getChallenges(),
        getClientSessions(),
      ]);
      setStats(statsRes.data);
      setChallenges(challengesRes.data.challenges || []);
      setSessions(sessionsRes.data || []);
    } catch (error) {
      console.error('Failed to load dashboard data', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelectCategory = async (category) => {
    try {
      await selectCategory(category);
      await refreshUser();
      loadData();
      toast.success(`Category set to ${CATEGORY_NAMES[category]}`);
    } catch (error) {
      toast.error('Failed to select category');
    }
  };

  const categories = [
    { id: 'personal_training', name: 'Personal Training', icon: Dumbbell, color: 'text-green-400' },
    { id: 'self_defense', name: 'Self Defense', icon: ShieldIcon, color: 'text-blue-400' },
    { id: 'jiujitsu', name: 'Jiu-Jitsu', icon: Users, color: 'text-purple-400' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  const upcomingSessions = sessions
    .filter(s => s.status === 'confirmed' || s.status === 'pending')
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-[#09090B] py-8 px-4 sm:px-6 lg:px-8" data-testid="client-dashboard">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {user?.full_name?.split(' ')[0]}
          </h1>
          <p className="text-zinc-400">Track your progress and continue your training journey.</p>
        </div>

        {/* Category Selection (if not selected) */}
        {!profile.current_category && (
          <div className="mb-8 p-6 bg-[#18181B] border border-zinc-800 rounded-lg" data-testid="category-selection">
            <h2 className="text-xl font-bold text-white mb-4">Choose Your Training Path</h2>
            <p className="text-zinc-400 mb-6">Select a category to start tracking your progress</p>
            <div className="grid sm:grid-cols-3 gap-4">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleSelectCategory(cat.id)}
                  className="p-6 bg-zinc-800/50 border border-zinc-700 rounded-lg hover:border-[#C0A062]/50 transition-colors text-left group"
                  data-testid={`select-category-${cat.id}`}
                >
                  <cat.icon className={`w-8 h-8 ${cat.color} mb-3`} />
                  <h3 className="text-lg font-bold text-white">{cat.name}</h3>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="stats-card p-6 rounded-lg" data-testid="stat-phase">
            <div className="flex items-center justify-between mb-2">
              <span className="text-zinc-400 text-sm">Current Phase</span>
              <Award className="w-5 h-5 text-[#C0A062]" />
            </div>
            <p className="text-2xl font-bold text-white capitalize font-accent">
              {profile.current_phase || 'White'} Belt
            </p>
          </div>

          <div className="stats-card p-6 rounded-lg" data-testid="stat-points">
            <div className="flex items-center justify-between mb-2">
              <span className="text-zinc-400 text-sm">Total Points</span>
              <TrendingUp className="w-5 h-5 text-[#C0A062]" />
            </div>
            <p className="text-2xl font-bold text-white">{stats?.total_points || 0}</p>
          </div>

          <div className="stats-card p-6 rounded-lg" data-testid="stat-sessions">
            <div className="flex items-center justify-between mb-2">
              <span className="text-zinc-400 text-sm">Sessions This Phase</span>
              <Calendar className="w-5 h-5 text-[#C0A062]" />
            </div>
            <p className="text-2xl font-bold text-white">{stats?.completed_sessions || 0} / 12</p>
          </div>

          <div className="stats-card p-6 rounded-lg" data-testid="stat-challenges">
            <div className="flex items-center justify-between mb-2">
              <span className="text-zinc-400 text-sm">Challenges Done</span>
              <Target className="w-5 h-5 text-[#C0A062]" />
            </div>
            <p className="text-2xl font-bold text-white">
              {stats?.completed_challenges || 0} / {stats?.total_challenges || 0}
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Belt Progress */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-[#18181B] border border-zinc-800 rounded-lg p-6" data-testid="progress-card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Your Progress</h2>
                {profile.current_category && (
                  <span className="text-sm text-[#C0A062] font-medium">
                    {CATEGORY_NAMES[profile.current_category]}
                  </span>
                )}
              </div>

              <BeltProgress currentPhase={profile.current_phase || 'white'} showLabels size="lg" />

              <div className="mt-6 p-4 bg-zinc-800/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-zinc-400">Sessions to next phase</span>
                  <span className="text-sm text-white font-medium">
                    {Math.max(0, 12 - (stats?.completed_sessions || 0))} remaining
                  </span>
                </div>
                <Progress 
                  value={((stats?.completed_sessions || 0) / 12) * 100} 
                  className="h-2 bg-zinc-800"
                />
              </div>
            </div>

            {/* Challenges */}
            <div className="bg-[#18181B] border border-zinc-800 rounded-lg p-6" data-testid="challenges-card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Active Challenges</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-[#C0A062]"
                  onClick={() => navigate('/challenges')}
                >
                  View All <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>

              {challenges.length === 0 ? (
                <p className="text-zinc-400 text-center py-8">
                  {profile.current_category 
                    ? 'Loading challenges...'
                    : 'Select a category to see challenges'}
                </p>
              ) : (
                <div className="space-y-3">
                  {challenges.slice(0, 4).map((challenge) => (
                    <div
                      key={challenge.id}
                      className={`challenge-card p-4 bg-zinc-800/30 border border-zinc-700 rounded-lg ${
                        challenge.is_completed ? 'completed' : ''
                      }`}
                      data-testid={`challenge-${challenge.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-white">{challenge.name}</h3>
                          <p className="text-sm text-zinc-400">{challenge.description}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-[#C0A062] font-bold">+{challenge.points}</span>
                          <p className="text-xs text-zinc-500">points</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Upcoming Sessions */}
            <div className="bg-[#18181B] border border-zinc-800 rounded-lg p-6" data-testid="upcoming-sessions">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white">Upcoming Sessions</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-[#C0A062]"
                  onClick={() => navigate('/sessions')}
                >
                  All <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>

              {upcomingSessions.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                  <p className="text-zinc-400 text-sm mb-4">No upcoming sessions</p>
                  <Button 
                    size="sm" 
                    className="btn-primary"
                    onClick={() => navigate('/trainers')}
                    data-testid="book-session-btn"
                  >
                    Book a Session
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingSessions.map((session) => (
                    <div
                      key={session.id}
                      className="session-card p-4 rounded-lg"
                      data-testid={`session-${session.id}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-white">
                          {CATEGORY_NAMES[session.category]}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          session.status === 'confirmed' 
                            ? 'bg-green-500/10 text-green-400'
                            : 'bg-yellow-500/10 text-yellow-400'
                        }`}>
                          {session.status}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-400">
                        {formatDate(session.scheduled_date)} at {formatTime(session.scheduled_time)}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">
                        with {session.trainer?.full_name}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-[#18181B] border border-zinc-800 rounded-lg p-6">
              <h2 className="text-lg font-bold text-white mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Button 
                  className="w-full btn-primary justify-start"
                  onClick={() => navigate('/trainers')}
                  data-testid="find-trainer-btn"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Find a Trainer
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800 justify-start"
                  onClick={() => navigate('/sessions')}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  View Sessions
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
