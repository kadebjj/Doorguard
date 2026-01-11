import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getChallenges, completeChallenge, phaseUp } from '../lib/api';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import BeltProgress from '../components/BeltProgress';
import { Target, Award, CheckCircle, Lock, ArrowUp } from 'lucide-react';
import { CATEGORY_NAMES } from '../lib/utils';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const Challenges = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(null);
  const [phaseUpLoading, setPhaseUpLoading] = useState(false);

  const profile = user?.client_profile || {};

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    try {
      const response = await getChallenges();
      setChallenges(response.data.challenges || []);
    } catch (error) {
      console.error('Failed to load challenges', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (challengeId) => {
    setCompleting(challengeId);
    try {
      const response = await completeChallenge(challengeId);
      toast.success(`+${response.data.points_earned} points!`);
      await refreshUser();
      loadChallenges();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to complete challenge');
    } finally {
      setCompleting(null);
    }
  };

  const handlePhaseUp = async () => {
    setPhaseUpLoading(true);
    try {
      const response = await phaseUp();
      toast.success(response.data.message);
      await refreshUser();
      loadChallenges();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Cannot advance yet');
    } finally {
      setPhaseUpLoading(false);
    }
  };

  const completedCount = challenges.filter(c => c.is_completed).length;
  const allCompleted = challenges.length > 0 && completedCount === challenges.length;
  const canPhaseUp = allCompleted && (profile.completed_sessions || 0) >= 12;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (!profile.current_category) {
    return (
      <div className="min-h-screen bg-[#09090B] flex items-center justify-center px-4">
        <div className="text-center">
          <Target className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">No Category Selected</h1>
          <p className="text-zinc-400 mb-6">Select a training category to see your challenges</p>
          <Button onClick={() => navigate('/dashboard')} className="btn-primary">
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090B] py-8 px-4 sm:px-6 lg:px-8" data-testid="challenges-page">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Your Challenges</h1>
          <p className="text-zinc-400">
            Complete challenges to earn points and advance to the next belt
          </p>
        </div>

        {/* Progress Overview */}
        <div className="bg-[#18181B] border border-zinc-800 rounded-lg p-6 mb-8" data-testid="progress-overview">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-6 h-6 text-[#C0A062]" />
                <span className="text-lg font-bold text-white capitalize">
                  {profile.current_phase} Belt
                </span>
                <span className="text-zinc-400">•</span>
                <span className="text-zinc-400">{CATEGORY_NAMES[profile.current_category]}</span>
              </div>
              <BeltProgress currentPhase={profile.current_phase} size="md" />
            </div>

            <div className="text-center md:text-right">
              <p className="text-3xl font-bold text-[#C0A062]">{profile.total_points || 0}</p>
              <p className="text-sm text-zinc-400">Total Points</p>
            </div>
          </div>

          {/* Phase Up Requirements */}
          <div className="mt-6 pt-6 border-t border-zinc-800">
            <h3 className="text-sm font-medium text-zinc-400 mb-4">Requirements to Advance</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className={`p-4 rounded-lg ${(profile.completed_sessions || 0) >= 12 ? 'bg-green-500/10 border border-green-500/20' : 'bg-zinc-800/30 border border-zinc-700'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-zinc-300">Sessions</span>
                  {(profile.completed_sessions || 0) >= 12 ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <Lock className="w-5 h-5 text-zinc-500" />
                  )}
                </div>
                <p className="text-lg font-bold text-white">{profile.completed_sessions || 0} / 12</p>
                <Progress value={((profile.completed_sessions || 0) / 12) * 100} className="h-2 mt-2" />
              </div>

              <div className={`p-4 rounded-lg ${allCompleted ? 'bg-green-500/10 border border-green-500/20' : 'bg-zinc-800/30 border border-zinc-700'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-zinc-300">Challenges</span>
                  {allCompleted ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <Lock className="w-5 h-5 text-zinc-500" />
                  )}
                </div>
                <p className="text-lg font-bold text-white">{completedCount} / {challenges.length}</p>
                <Progress value={challenges.length > 0 ? (completedCount / challenges.length) * 100 : 0} className="h-2 mt-2" />
              </div>
            </div>

            {canPhaseUp && (
              <Button
                onClick={handlePhaseUp}
                disabled={phaseUpLoading}
                className="w-full mt-4 btn-primary py-6 animate-pulse-gold"
                data-testid="phase-up-btn"
              >
                {phaseUpLoading ? (
                  <span className="spinner w-5 h-5" />
                ) : (
                  <>
                    <ArrowUp className="w-5 h-5 mr-2" />
                    Advance to Next Belt
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Challenges List */}
        <div className="space-y-4" data-testid="challenges-list">
          {challenges.length === 0 ? (
            <div className="text-center py-16 bg-[#18181B] border border-zinc-800 rounded-lg">
              <Target className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-400">No challenges available yet</p>
            </div>
          ) : (
            challenges.map((challenge) => (
              <div
                key={challenge.id}
                className={`challenge-card bg-[#18181B] border rounded-lg p-6 ${
                  challenge.is_completed 
                    ? 'border-green-500/30 completed' 
                    : 'border-zinc-800'
                }`}
                data-testid={`challenge-${challenge.id}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-white">{challenge.name}</h3>
                      {challenge.is_completed && (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      )}
                    </div>
                    <p className="text-zinc-400">{challenge.description}</p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-2xl font-bold text-[#C0A062]">+{challenge.points}</p>
                    <p className="text-xs text-zinc-500">points</p>
                  </div>
                </div>

                {!challenge.is_completed && (
                  <Button
                    onClick={() => handleComplete(challenge.id)}
                    disabled={completing === challenge.id}
                    className="mt-4 btn-primary"
                    data-testid={`complete-${challenge.id}`}
                  >
                    {completing === challenge.id ? (
                      <span className="spinner w-4 h-4" />
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark Complete
                      </>
                    )}
                  </Button>
                )}

                {challenge.is_completed && challenge.completed_at && (
                  <p className="mt-4 text-xs text-zinc-500">
                    Completed on {new Date(challenge.completed_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Challenges;
