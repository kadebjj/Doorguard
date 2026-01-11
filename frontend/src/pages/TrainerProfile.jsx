import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTrainer, bookSession, createCheckout } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Calendar } from '../components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { 
  Shield, Award, Star, MapPin, Clock, Calendar as CalendarIcon, 
  CheckCircle, ArrowLeft, DollarSign 
} from 'lucide-react';
import { getInitials, CATEGORY_NAMES, formatCurrency } from '../lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';

const VERIFICATION_CONFIG = {
  verified: { icon: Shield, label: 'Verified Trainer', className: 'badge-verified' },
  elite: { icon: Award, label: 'Elite Coach', className: 'badge-elite' },
  specialist: { icon: Star, label: 'Specialist', className: 'badge-specialist' },
};

const SESSION_PRICES = {
  personal_training: 75.00,
  self_defense: 85.00,
  jiujitsu: 95.00,
};

const TrainerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isClient } = useAuth();
  const [trainer, setTrainer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingData, setBookingData] = useState({
    category: '',
    scheduled_date: null,
    scheduled_time: '',
    location_address: '',
    notes: '',
  });

  useEffect(() => {
    loadTrainer();
  }, [id]);

  const loadTrainer = async () => {
    try {
      const response = await getTrainer(id);
      setTrainer(response.data);
    } catch (error) {
      toast.error('Trainer not found');
      navigate('/trainers');
    } finally {
      setLoading(false);
    }
  };

  const handleBookSession = async () => {
    if (!bookingData.category || !bookingData.scheduled_date || !bookingData.scheduled_time || !bookingData.location_address) {
      toast.error('Please fill in all required fields');
      return;
    }

    setBookingLoading(true);
    try {
      const response = await bookSession({
        trainer_id: id,
        category: bookingData.category,
        scheduled_date: format(bookingData.scheduled_date, 'yyyy-MM-dd'),
        scheduled_time: bookingData.scheduled_time,
        location_address: bookingData.location_address,
        notes: bookingData.notes,
      });

      const session = response.data.session;
      
      // Create checkout session
      const checkoutResponse = await createCheckout(session.id);
      
      toast.success('Redirecting to payment...');
      window.location.href = checkoutResponse.data.checkout_url;
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to book session');
    } finally {
      setBookingLoading(false);
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-5 h-5 ${i < Math.round(rating) ? 'star-filled fill-current' : 'star-empty'}`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (!trainer) return null;

  const profile = trainer.trainer_profile || {};
  const verification = VERIFICATION_CONFIG[profile.verification_level] || VERIFICATION_CONFIG.verified;
  const VerificationIcon = verification.icon;

  const timeSlots = [
    '09:00', '10:00', '11:00', '12:00', '13:00', 
    '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
  ];

  return (
    <div className="min-h-screen bg-[#09090B] py-8 px-4 sm:px-6 lg:px-8" data-testid="trainer-profile">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/trainers')}
          className="mb-6 text-zinc-400 hover:text-white"
          data-testid="back-btn"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Trainers
        </Button>

        {/* Profile Header */}
        <div className="bg-[#18181B] border border-zinc-800 rounded-lg p-8 mb-8" data-testid="profile-header">
          <div className="flex flex-col md:flex-row gap-6">
            <Avatar className="w-32 h-32 border-4 border-[#C0A062]/30">
              <AvatarImage src={profile.profile_image} />
              <AvatarFallback className="bg-[#27272A] text-[#C0A062] text-4xl font-bold">
                {getInitials(trainer.full_name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <h1 className="text-3xl font-bold text-white">{trainer.full_name}</h1>
                <Badge className={`${verification.className} flex items-center gap-1 text-sm`}>
                  <VerificationIcon className="w-4 h-4" />
                  {verification.label}
                </Badge>
              </div>

              {trainer.city && (
                <div className="flex items-center gap-2 text-zinc-400 mb-4">
                  <MapPin className="w-4 h-4" />
                  {trainer.city}
                </div>
              )}

              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  {renderStars(trainer.avg_rating || 0)}
                </div>
                <span className="text-zinc-400">
                  {trainer.avg_rating?.toFixed(1) || '0.0'} ({trainer.review_count || 0} reviews)
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {(profile.categories || []).map((cat) => (
                  <span
                    key={cat}
                    className="text-sm px-3 py-1 bg-zinc-800 text-zinc-300 rounded-full"
                  >
                    {CATEGORY_NAMES[cat] || cat}
                  </span>
                ))}
              </div>
            </div>

            <div className="md:text-right">
              <p className="text-sm text-zinc-400 mb-1">Starting from</p>
              <p className="text-3xl font-bold text-[#C0A062]">
                {formatCurrency(profile.hourly_rate || 75)}
              </p>
              <p className="text-sm text-zinc-400">per session</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            <div className="bg-[#18181B] border border-zinc-800 rounded-lg p-6" data-testid="about-section">
              <h2 className="text-xl font-bold text-white mb-4">About</h2>
              <p className="text-zinc-300 whitespace-pre-line">
                {profile.bio || 'No bio provided yet.'}
              </p>
            </div>

            {/* Experience & Certifications */}
            <div className="bg-[#18181B] border border-zinc-800 rounded-lg p-6" data-testid="experience-section">
              <h2 className="text-xl font-bold text-white mb-4">Experience & Certifications</h2>
              
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-5 h-5 text-[#C0A062]" />
                    <span className="font-medium text-white">Experience</span>
                  </div>
                  <p className="text-zinc-300">{profile.experience_years || 0} years</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-5 h-5 text-[#C0A062]" />
                    <span className="font-medium text-white">Certifications</span>
                  </div>
                  <div className="space-y-1">
                    {(profile.certifications || []).length > 0 ? (
                      profile.certifications.map((cert, i) => (
                        <div key={i} className="flex items-center gap-2 text-zinc-300">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          {cert}
                        </div>
                      ))
                    ) : (
                      <p className="text-zinc-500">No certifications listed</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews */}
            <div className="bg-[#18181B] border border-zinc-800 rounded-lg p-6" data-testid="reviews-section">
              <h2 className="text-xl font-bold text-white mb-4">
                Reviews ({trainer.reviews?.length || 0})
              </h2>

              {trainer.reviews?.length > 0 ? (
                <div className="space-y-4">
                  {trainer.reviews.map((review) => (
                    <div key={review.id} className="p-4 bg-zinc-800/30 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-white">{review.client_name}</span>
                        <div className="flex">{renderStars(review.rating)}</div>
                      </div>
                      {review.comment && (
                        <p className="text-zinc-400 text-sm">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-zinc-500 text-center py-8">No reviews yet</p>
              )}
            </div>
          </div>

          {/* Sidebar - Booking */}
          <div className="space-y-6">
            <div className="bg-[#18181B] border border-zinc-800 rounded-lg p-6 sticky top-24" data-testid="booking-card">
              <h2 className="text-xl font-bold text-white mb-4">Book a Session</h2>

              <div className="space-y-4 mb-6">
                {Object.entries(SESSION_PRICES).map(([cat, price]) => {
                  if (!profile.categories?.includes(cat)) return null;
                  return (
                    <div key={cat} className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-lg">
                      <span className="text-zinc-300">{CATEGORY_NAMES[cat]}</span>
                      <span className="text-[#C0A062] font-bold">{formatCurrency(price)}</span>
                    </div>
                  );
                })}
              </div>

              {isAuthenticated && isClient ? (
                <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full btn-primary py-6" data-testid="book-now-btn">
                      <CalendarIcon className="w-5 h-5 mr-2" />
                      Book Now
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-[#18181B] border-zinc-800 max-w-lg">
                    <DialogHeader>
                      <DialogTitle className="text-white">Book Session with {trainer.full_name}</DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                      <div>
                        <Label className="text-zinc-300">Category *</Label>
                        <Select
                          value={bookingData.category}
                          onValueChange={(value) => setBookingData({ ...bookingData, category: value })}
                        >
                          <SelectTrigger className="mt-2 bg-zinc-800/50 border-zinc-700 text-white" data-testid="booking-category">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#18181B] border-zinc-800">
                            {(profile.categories || []).map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {CATEGORY_NAMES[cat]} - {formatCurrency(SESSION_PRICES[cat])}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-zinc-300">Date *</Label>
                        <div className="mt-2 bg-zinc-800/50 border border-zinc-700 rounded-lg p-2">
                          <Calendar
                            mode="single"
                            selected={bookingData.scheduled_date}
                            onSelect={(date) => setBookingData({ ...bookingData, scheduled_date: date })}
                            disabled={(date) => date < new Date()}
                            className="mx-auto"
                            data-testid="booking-calendar"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-zinc-300">Time *</Label>
                        <Select
                          value={bookingData.scheduled_time}
                          onValueChange={(value) => setBookingData({ ...bookingData, scheduled_time: value })}
                        >
                          <SelectTrigger className="mt-2 bg-zinc-800/50 border-zinc-700 text-white" data-testid="booking-time">
                            <SelectValue placeholder="Select time" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#18181B] border-zinc-800">
                            {timeSlots.map((time) => (
                              <SelectItem key={time} value={time}>{time}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-zinc-300">Your Address *</Label>
                        <Input
                          value={bookingData.location_address}
                          onChange={(e) => setBookingData({ ...bookingData, location_address: e.target.value })}
                          placeholder="Enter your full address"
                          className="mt-2 bg-zinc-800/50 border-zinc-700 text-white"
                          data-testid="booking-address"
                        />
                      </div>

                      <div>
                        <Label className="text-zinc-300">Notes (optional)</Label>
                        <Textarea
                          value={bookingData.notes}
                          onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                          placeholder="Any special requests or information..."
                          className="mt-2 bg-zinc-800/50 border-zinc-700 text-white"
                          data-testid="booking-notes"
                        />
                      </div>

                      {bookingData.category && (
                        <div className="p-4 bg-[#C0A062]/10 border border-[#C0A062]/20 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-300">Session Price</span>
                            <span className="text-[#C0A062] font-bold text-xl">
                              {formatCurrency(SESSION_PRICES[bookingData.category])}
                            </span>
                          </div>
                        </div>
                      )}

                      <Button
                        onClick={handleBookSession}
                        disabled={bookingLoading}
                        className="w-full btn-primary py-6"
                        data-testid="confirm-booking-btn"
                      >
                        {bookingLoading ? (
                          <span className="spinner w-5 h-5" />
                        ) : (
                          <>
                            <DollarSign className="w-5 h-5 mr-2" />
                            Proceed to Payment
                          </>
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              ) : (
                <Button
                  onClick={() => navigate('/login')}
                  className="w-full btn-primary py-6"
                  data-testid="login-to-book-btn"
                >
                  Sign In to Book
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainerProfile;
