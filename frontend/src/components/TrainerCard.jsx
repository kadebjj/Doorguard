import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Shield, Award, Star, MapPin, ShieldCheck } from 'lucide-react';
import { getInitials, CATEGORY_NAMES, formatCurrency } from '../lib/utils';

const VERIFICATION_CONFIG = {
  verified: { icon: Shield, label: 'Verified', className: 'badge-verified' },
  elite: { icon: Award, label: 'Elite', className: 'badge-elite' },
  specialist: { icon: Star, label: 'Specialist', className: 'badge-specialist' },
};

const TrainerCard = ({ trainer }) => {
  const navigate = useNavigate();
  const profile = trainer.trainer_profile || {};
  const verification = VERIFICATION_CONFIG[profile.verification_level] || VERIFICATION_CONFIG.verified;
  const VerificationIcon = verification.icon;

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < Math.round(rating) ? 'star-filled fill-current' : 'star-empty'}`}
      />
    ));
  };

  return (
    <div 
      className="trainer-card bg-[#18181B] border border-zinc-800 rounded-lg p-6 cursor-pointer"
      onClick={() => navigate(`/trainers/${trainer.id}`)}
      data-testid={`trainer-card-${trainer.id}`}
    >
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        <Avatar className="w-16 h-16 border-2 border-[#C0A062]/30">
          <AvatarImage src={profile.profile_image} />
          <AvatarFallback className="bg-[#27272A] text-[#C0A062] text-lg font-bold">
            {getInitials(trainer.full_name)}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-white truncate">{trainer.full_name}</h3>
            <Badge className={`${verification.className} text-xs px-2 py-0.5 rounded-full flex items-center gap-1`}>
              <VerificationIcon className="w-3 h-3" />
              {verification.label}
            </Badge>
          </div>
          
          {trainer.city && (
            <div className="flex items-center gap-1 text-zinc-400 text-sm">
              <MapPin className="w-3 h-3" />
              {trainer.city}
            </div>
          )}
        </div>
      </div>

      {/* Rating */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex">{renderStars(trainer.avg_rating || 0)}</div>
        <span className="text-sm text-zinc-400">
          ({trainer.review_count || 0} reviews)
        </span>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(profile.categories || []).map((cat) => (
          <span
            key={cat}
            className="text-xs px-2 py-1 bg-zinc-800 text-zinc-300 rounded"
          >
            {CATEGORY_NAMES[cat] || cat}
          </span>
        ))}
      </div>

      {/* Trust signal */}
      {(profile.background_check_status ?? 'cleared') === 'cleared' && (
        <div className="flex items-center gap-1.5 text-xs text-emerald-400 mb-4" data-testid={`bg-check-${trainer.id}`}>
          <ShieldCheck className="w-3.5 h-3.5" />
          Background &amp; ID verified
        </div>
      )}

      {/* Bio */}
      {profile.bio && (
        <p className="text-sm text-zinc-400 line-clamp-2 mb-4">{profile.bio}</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
        <div className="text-sm">
          <span className="text-zinc-400">From </span>
          <span className="text-[#C0A062] font-bold">
            {formatCurrency(profile.hourly_rate || 75)}/session
          </span>
        </div>
        <Button 
          size="sm" 
          className="btn-primary text-xs"
          data-testid={`view-trainer-${trainer.id}`}
        >
          View Profile
        </Button>
      </div>
    </div>
  );
};

export default TrainerCard;
