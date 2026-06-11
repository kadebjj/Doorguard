import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTrainerStats, getTrainerSessions, updateSessionStatus } from '../lib/api';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  DollarSign, Calendar, Star, Users, CheckCircle, 
  XCircle, Clock, ChevronRight, Shield, Award 
} from 'lucide-react';
import { CATEGORY_NAMES, formatDate, formatTime, formatCurrency, getInitials } from '../lib/utils';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { toast } from 'sonner';

const TrainerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const profile = user?.trainer_profile || {};

  const loadData = useCallback(async () => {
    try {
      const [statsRes, sessionsRes] = await Promise.all([
        getTrainerStats(),
        getTrainerSessions(),
      ]);
      setStats(statsRes.data);
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

  const handleSessionAction = async (sessionId, status) => {
    setActionLoading(sessionId);
    try {
      await updateSessionStatus(sessionId, status);
      toast.success(`Session ${status}`);
      loadData();
    } catch (error) {
      toast.error('Failed to update session');
    } finally {
      setActionLoading(null);
    }
  };

  const VERIFICATION_CONFIG = {
    verified: { icon: Shield, label: 'Verified', className: 'badge-verified' },
    elite: { icon: Award, label: 'Elite', className: 'badge-elite' },
    specialist: { icon: Star, label: 'Specialist', className: 'badge-specialist' },
  };

  const verification = VERIFICATION_CONFIG[profile.verification_level] || VERIFICATION_CONFIG.verified;
  const VerificationIcon = verification.icon;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  const pendingSessions = sessions.filter(s => s.status === 'pending');
  const upcomingSessions = sessions.filter(s => s.status === 'confirmed');
  const recentSessions = sessions.filter(s => s.status === 'completed').slice(0, 5);

  return (
    <div className="min-h-screen bg-[#09090B] py-8 px-4 sm:px-6 lg:px-8" data-testid="trainer-dashboard">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-white">
                Welcome, {user?.full_name?.split(' ')[0]}
              </h1>
              <Badge className={`${verification.className} flex items-center gap-1`}>
                <VerificationIcon className="w-3 h-3" />
                {verification.label}
              </Badge>
            </div>
            <p className="text-zinc-400">Manage your sessions and track your earnings.</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="stats-card p-6 rounded-lg" data-testid="stat-earnings">
            <div className="flex items-center justify-between mb-2">
              <span className="text-zinc-400 text-sm">Total Earnings</span>
              <DollarSign className="w-5 h-5 text-[#C0A062]" />
            </div>
            <p className="text-2xl font-bold text-white">
              {formatCurrency(stats?.total_earnings || 0)}
            </p>
          </div>

          <div className="stats-card p-6 rounded-lg" data-testid="stat-completed">
            <div className="flex items-center justify-between mb-2">
              <span className="text-zinc-400 text-sm">Completed Sessions</span>
              <CheckCircle className="w-5 h-5 text-[#C0A062]" />
            </div>
            <p className="text-2xl font-bold text-white">{stats?.completed_sessions || 0}</p>
          </div>

          <div className="stats-card p-6 rounded-lg" data-testid="stat-pending">
            <div className="flex items-center justify-between mb-2">
              <span className="text-zinc-400 text-sm">Pending Requests</span>
              <Clock className="w-5 h-5 text-[#C0A062]" />
            </div>
            <p className="text-2xl font-bold text-white">{stats?.pending_sessions || 0}</p>
          </div>

          <div className="stats-card p-6 rounded-lg" data-testid="stat-rating">
            <div className="flex items-center justify-between mb-2">
              <span className="text-zinc-400 text-sm">Average Rating</span>
              <Star className="w-5 h-5 text-[#C0A062]" />
            </div>
            <p className="text-2xl font-bold text-white">
              {stats?.avg_rating || 0} <span className="text-sm text-zinc-400">({stats?.total_reviews || 0})</span>
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Pending Requests */}
            {pendingSessions.length > 0 && (
              <div className="bg-[#18181B] border border-zinc-800 rounded-lg p-6" data-testid="pending-requests">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white">
                    Pending Requests ({pendingSessions.length})
                  </h2>
                </div>

                <div className="space-y-4">
                  {pendingSessions.map((session) => (
                    <div
                      key={session.id}
                      className="p-4 bg-zinc-800/30 border border-yellow-500/20 rounded-lg"
                      data-testid={`pending-${session.id}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10 border border-zinc-700">
                            <AvatarFallback className="bg-[#27272A] text-[#C0A062] text-sm">
                              {getInitials(session.client?.full_name || 'C')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-medium text-white">{session.client?.full_name}</h3>
                            <p className="text-sm text-zinc-400">
                              {CATEGORY_NAMES[session.category]} • {formatDate(session.scheduled_date)} at {formatTime(session.scheduled_time)}
                            </p>
                            <p className="text-xs text-zinc-500 mt-1">{session.location_address}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[#C0A062] font-bold">{formatCurrency(session.trainer_earnings)}</p>
                          <p className="text-xs text-zinc-500">your earnings</p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button
                          size="sm"
                          className="flex-1 btn-primary"
                          onClick={() => handleSessionAction(session.id, 'confirmed')}
                          disabled={actionLoading === session.id}
                          data-testid={`accept-${session.id}`}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10"
                          onClick={() => handleSessionAction(session.id, 'cancelled')}
                          disabled={actionLoading === session.id}
                          data-testid={`decline-${session.id}`}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Sessions */}
            <div className="bg-[#18181B] border border-zinc-800 rounded-lg p-6" data-testid="upcoming-sessions">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Upcoming Sessions</h2>
              </div>

              {upcomingSessions.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                  <p className="text-zinc-400">No upcoming sessions scheduled</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingSessions.map((session) => (
                    <div
                      key={session.id}
                      className="session-card p-4 rounded-lg flex items-center justify-between"
                      data-testid={`upcoming-${session.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 border border-zinc-700">
                          <AvatarFallback className="bg-[#27272A] text-[#C0A062] text-sm">
                            {getInitials(session.client?.full_name || 'C')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium text-white">{session.client?.full_name}</h3>
                          <p className="text-sm text-zinc-400">
                            {formatDate(session.scheduled_date)} at {formatTime(session.scheduled_time)}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="btn-primary"
                        onClick={() => handleSessionAction(session.id, 'completed')}
                        disabled={actionLoading === session.id}
                        data-testid={`complete-${session.id}`}
                      >
                        Mark Complete
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Sessions */}
            {recentSessions.length > 0 && (
              <div className="bg-[#18181B] border border-zinc-800 rounded-lg p-6" data-testid="recent-sessions">
                <h2 className="text-xl font-bold text-white mb-6">Recent Sessions</h2>
                <div className="space-y-3">
                  {recentSessions.map((session) => (
                    <div
                      key={session.id}
                      className="p-4 bg-zinc-800/30 rounded-lg flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 border border-zinc-700">
                          <AvatarFallback className="bg-[#27272A] text-zinc-400 text-sm">
                            {getInitials(session.client?.full_name || 'C')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium text-white">{session.client?.full_name}</h3>
                          <p className="text-sm text-zinc-500">{formatDate(session.scheduled_date)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-green-400 text-sm">{formatCurrency(session.trainer_earnings)}</span>
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Profile Summary */}
            <div className="bg-[#18181B] border border-zinc-800 rounded-lg p-6" data-testid="profile-summary">
              <h2 className="text-lg font-bold text-white mb-4">Your Profile</h2>
              
              <div className="space-y-4">
                <div>
                  <span className="text-sm text-zinc-400">Specializations</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(profile.categories || []).map((cat) => (
                      <span key={cat} className="text-xs px-2 py-1 bg-zinc-800 text-zinc-300 rounded">
                        {CATEGORY_NAMES[cat] || cat}
                      </span>
                    ))}
                    {(!profile.categories || profile.categories.length === 0) && (
                      <span className="text-xs text-zinc-500">No categories set</span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-sm text-zinc-400">Experience</span>
                  <p className="text-white mt-1">{profile.experience_years || 0} years</p>
                </div>

                <div>
                  <span className="text-sm text-zinc-400">Hourly Rate</span>
                  <p className="text-white mt-1">{formatCurrency(profile.hourly_rate || 75)}</p>
                </div>
              </div>

              <Button 
                variant="outline" 
                className="w-full mt-6 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                Edit Profile
              </Button>
            </div>

            {/* Earnings Summary */}
            <div className="bg-[#18181B] border border-zinc-800 rounded-lg p-6">
              <h2 className="text-lg font-bold text-white mb-4">This Month</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Sessions</span>
                  <span className="text-white font-medium">{stats?.completed_sessions || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Earnings</span>
                  <span className="text-[#C0A062] font-bold">{formatCurrency(stats?.total_earnings || 0)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainerDashboard;
