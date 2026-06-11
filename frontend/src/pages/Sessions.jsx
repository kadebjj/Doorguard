import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getClientSessions, getTrainerSessions, updateSessionStatus, createReview, sessionCheckIn, sessionCheckOut } from '../lib/api';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Calendar, MapPin, Clock, Star, CheckCircle, XCircle, DollarSign, LogIn, LogOut } from 'lucide-react';
import { CATEGORY_NAMES, formatDate, formatTime, formatCurrency, getInitials } from '../lib/utils';
import { toast } from 'sonner';

const Sessions = () => {
  const { isClient, isTrainer } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewSession, setReviewSession] = useState(null);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const response = isClient ? await getClientSessions() : await getTrainerSessions();
      setSessions(response.data || []);
    } catch (error) {
      console.error('Failed to load sessions', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (sessionId, status) => {
    setActionLoading(sessionId);
    try {
      await updateSessionStatus(sessionId, status);
      toast.success(`Session ${status}`);
      loadSessions();
    } catch (error) {
      toast.error('Failed to update session');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCheckIn = async (sessionId) => {
    setActionLoading(sessionId);
    try {
      await sessionCheckIn(sessionId);
      toast.success('Checked in. Your safety timer is active — stay safe!');
      loadSessions();
    } catch (error) {
      toast.error('Failed to check in');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCheckOut = async (sessionId) => {
    setActionLoading(sessionId);
    try {
      await sessionCheckOut(sessionId);
      toast.success('Checked out safely.');
      loadSessions();
    } catch (error) {
      toast.error('Failed to check out');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReview = async () => {
    try {
      await createReview({
        session_id: reviewSession.id,
        rating: reviewData.rating,
        comment: reviewData.comment,
      });
      toast.success('Review submitted!');
      setReviewOpen(false);
      setReviewSession(null);
      setReviewData({ rating: 5, comment: '' });
      loadSessions();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to submit review');
    }
  };

  const getStatusBadge = (status, paymentStatus) => {
    const configs = {
      pending: { className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', label: 'Pending' },
      confirmed: { className: 'bg-blue-500/10 text-blue-400 border-blue-500/20', label: 'Confirmed' },
      completed: { className: 'bg-green-500/10 text-green-400 border-green-500/20', label: 'Completed' },
      cancelled: { className: 'bg-red-500/10 text-red-400 border-red-500/20', label: 'Cancelled' },
    };
    const config = configs[status] || configs.pending;
    return (
      <div className="flex items-center gap-2">
        <Badge className={`${config.className} border`}>{config.label}</Badge>
        {paymentStatus === 'paid' && (
          <Badge className="bg-green-500/10 text-green-400 border border-green-500/20">
            <DollarSign className="w-3 h-3 mr-1" />
            Paid
          </Badge>
        )}
      </div>
    );
  };

  const filterSessions = (status) => {
    if (status === 'upcoming') {
      return sessions.filter(s => s.status === 'confirmed' || s.status === 'pending');
    }
    if (status === 'past') {
      return sessions.filter(s => s.status === 'completed' || s.status === 'cancelled');
    }
    return sessions;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090B] py-8 px-4 sm:px-6 lg:px-8" data-testid="sessions-page">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {isClient ? 'My Sessions' : 'Client Sessions'}
          </h1>
          <p className="text-zinc-400">Manage your training sessions</p>
        </div>

        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="bg-zinc-800/50 border border-zinc-700 mb-6">
            <TabsTrigger value="upcoming" className="data-[state=active]:bg-[#C0A062] data-[state=active]:text-black">
              Upcoming
            </TabsTrigger>
            <TabsTrigger value="past" className="data-[state=active]:bg-[#C0A062] data-[state=active]:text-black">
              Past
            </TabsTrigger>
            <TabsTrigger value="all" className="data-[state=active]:bg-[#C0A062] data-[state=active]:text-black">
              All
            </TabsTrigger>
          </TabsList>

          {['upcoming', 'past', 'all'].map((tab) => (
            <TabsContent key={tab} value={tab}>
              {filterSessions(tab).length === 0 ? (
                <div className="text-center py-16 bg-[#18181B] border border-zinc-800 rounded-lg">
                  <Calendar className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                  <p className="text-zinc-400">No {tab} sessions</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filterSessions(tab).map((session) => (
                    <div
                      key={session.id}
                      className="bg-[#18181B] border border-zinc-800 rounded-lg p-6"
                      data-testid={`session-${session.id}`}
                    >
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <Avatar className="w-12 h-12 border border-zinc-700">
                            <AvatarFallback className="bg-[#27272A] text-[#C0A062]">
                              {getInitials(
                                isClient 
                                  ? session.trainer?.full_name || 'T'
                                  : session.client?.full_name || 'C'
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-bold text-white text-lg">
                              {CATEGORY_NAMES[session.category]}
                            </h3>
                            <p className="text-zinc-300">
                              with {isClient ? session.trainer?.full_name : session.client?.full_name}
                            </p>
                            
                            <div className="flex flex-wrap gap-4 mt-3 text-sm text-zinc-400">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {formatDate(session.scheduled_date)}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {formatTime(session.scheduled_time)}
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {session.location_address}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          {getStatusBadge(session.status, session.payment_status)}
                          <p className="text-[#C0A062] font-bold">
                            {formatCurrency(isClient ? session.price : session.trainer_earnings)}
                          </p>
                        </div>
                      </div>

                      {/* Actions */}
                      {session.status === 'pending' && isTrainer && (
                        <div className="flex gap-2 mt-4 pt-4 border-t border-zinc-800">
                          <Button
                            size="sm"
                            className="btn-primary"
                            onClick={() => handleStatusUpdate(session.id, 'confirmed')}
                            disabled={actionLoading === session.id}
                            data-testid={`accept-${session.id}`}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                            onClick={() => handleStatusUpdate(session.id, 'cancelled')}
                            disabled={actionLoading === session.id}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Decline
                          </Button>
                        </div>
                      )}

                      {session.status === 'confirmed' && isTrainer && (
                        <div className="mt-4 pt-4 border-t border-zinc-800">
                          <Button
                            size="sm"
                            className="btn-primary"
                            onClick={() => handleStatusUpdate(session.id, 'completed')}
                            disabled={actionLoading === session.id}
                            data-testid={`complete-${session.id}`}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Mark Complete
                          </Button>
                        </div>
                      )}

                      {session.status === 'confirmed' && isClient && (
                        <div className="mt-4 pt-4 border-t border-zinc-800 flex flex-wrap items-center gap-3">
                          {!session.safety_checked_in ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                              onClick={() => handleCheckIn(session.id)}
                              disabled={actionLoading === session.id}
                              data-testid={`checkin-${session.id}`}
                            >
                              <LogIn className="w-4 h-4 mr-1" />
                              Safety Check-In
                            </Button>
                          ) : !session.safety_checked_out ? (
                            <>
                              <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <CheckCircle className="w-3 h-3 mr-1" /> Checked in
                              </Badge>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-[#C0A062]/30 text-[#C0A062] hover:bg-[#C0A062]/10"
                                onClick={() => handleCheckOut(session.id)}
                                disabled={actionLoading === session.id}
                                data-testid={`checkout-${session.id}`}
                              >
                                <LogOut className="w-4 h-4 mr-1" />
                                Check-Out (Safe)
                              </Button>
                            </>
                          ) : (
                            <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle className="w-3 h-3 mr-1" /> Completed safely
                            </Badge>
                          )}
                        </div>
                      )}

                      {session.status === 'completed' && isClient && (
                        <div className="mt-4 pt-4 border-t border-zinc-800">
                          <Dialog open={reviewOpen && reviewSession?.id === session.id} onOpenChange={(open) => {
                            setReviewOpen(open);
                            if (open) setReviewSession(session);
                          }}>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-[#C0A062]/30 text-[#C0A062] hover:bg-[#C0A062]/10"
                                data-testid={`review-${session.id}`}
                              >
                                <Star className="w-4 h-4 mr-1" />
                                Leave Review
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-[#18181B] border-zinc-800">
                              <DialogHeader>
                                <DialogTitle className="text-white">Review Your Session</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div>
                                  <label className="text-zinc-300 text-sm mb-2 block">Rating</label>
                                  <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <button
                                        key={star}
                                        onClick={() => setReviewData({ ...reviewData, rating: star })}
                                        className="p-1"
                                      >
                                        <Star 
                                          className={`w-8 h-8 ${star <= reviewData.rating ? 'star-filled fill-current' : 'star-empty'}`}
                                        />
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <label className="text-zinc-300 text-sm mb-2 block">Comment (optional)</label>
                                  <Textarea
                                    value={reviewData.comment}
                                    onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                                    placeholder="Share your experience..."
                                    className="bg-zinc-800/50 border-zinc-700 text-white"
                                  />
                                </div>
                                <Button onClick={handleReview} className="w-full btn-primary">
                                  Submit Review
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default Sessions;
