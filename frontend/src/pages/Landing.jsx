import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Shield, Target, Award, Users, CheckCircle, ArrowRight, Star, Clock, MapPin } from 'lucide-react';
import BeltProgress from '../components/BeltProgress';

const Landing = () => {
  const navigate = useNavigate();

  const categories = [
    {
      id: 'personal_training',
      title: 'Personal Training',
      description: 'Health, strength, and resilience. Build your foundation.',
      image: 'https://images.unsplash.com/photo-1648542036561-e1d66a5ae2b1?w=800',
    },
    {
      id: 'self_defense',
      title: 'Self Defense',
      description: 'Awareness, escape, and real-world readiness.',
      image: 'https://images.unsplash.com/photo-1611077479643-5b3c01381f9e?w=800',
    },
    {
      id: 'jiujitsu',
      title: 'Jiu-Jitsu',
      description: 'Control, grappling, and submission fundamentals.',
      image: 'https://images.unsplash.com/photo-1747331796135-0e2354a712e4?w=800',
    },
  ];

  const features = [
    {
      icon: Shield,
      title: 'Verified Trainers',
      description: 'Background-checked coaches with real credentials you can trust.',
    },
    {
      icon: Target,
      title: 'Belt Progression',
      description: 'Structured phases from White to Black belt with clear milestones.',
    },
    {
      icon: Award,
      title: 'Gamified Learning',
      description: 'Earn points, complete challenges, and track your progress.',
    },
    {
      icon: Users,
      title: 'Train Anywhere',
      description: 'Professional training at your home, office, gym, or wherever works for you.',
    },
  ];

  const trustPoints = [
    'Background-checked trainers',
    'In-app emergency button',
    'Session recording option',
    'Public reviews & ratings',
    'Cancellation protection',
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section 
        className="hero-section flex items-center"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1570442387127-66eb80e00938?w=1920)',
        }}
        data-testid="hero-section"
      >
        <div className="hero-overlay" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
          <div className="max-w-3xl stagger-children">
            <div className="flex items-center gap-2 mb-6">
              <Shield className="w-6 h-6 text-[#C0A062]" />
              <span className="font-accent text-[#C0A062] tracking-widest">DOORGUARD</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-tight">
              Your Personal Defense,{' '}
              <span className="text-[#C0A062]">Anywhere</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-zinc-300 mb-8 max-w-2xl">
              The first legitimate civilian self-defense and combat fitness marketplace. 
              Connect with vetted trainers who come directly to your door.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg"
                onClick={() => navigate('/register')}
                className="btn-primary text-base px-8 py-6 animate-pulse-gold"
                data-testid="hero-cta-client"
              >
                Start Training
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={() => navigate('/register?role=trainer')}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white text-base px-8 py-6"
                data-testid="hero-cta-trainer"
              >
                Become a Trainer
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-[#09090B]" data-testid="how-it-works">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Simple, secure, and effective. Get started in minutes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Create Profile', desc: 'Sign up and choose your training path' },
              { step: '02', title: 'Book a Trainer', desc: 'Browse verified coaches in your area' },
              { step: '03', title: 'Train & Progress', desc: 'Earn belts and complete challenges' },
            ].map((item, i) => (
              <div 
                key={i}
                className="relative p-8 bg-[#18181B] border border-zinc-800 rounded-lg group hover:border-[#C0A062]/30 transition-colors"
              >
                <span className="font-accent text-6xl text-[#C0A062]/20 absolute top-4 right-4">
                  {item.step}
                </span>
                <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                <p className="text-zinc-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-24 bg-[#0F0F11]" data-testid="categories-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Choose Your Path</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Three categories, one progression system. Find your discipline.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {categories.map((cat) => (
              <div 
                key={cat.id}
                className="category-card rounded-lg overflow-hidden bg-[#18181B] border border-zinc-800"
                data-testid={`category-${cat.id}`}
              >
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={cat.image} 
                    alt={cat.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#18181B] to-transparent" />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-2">{cat.title}</h3>
                  <p className="text-zinc-400 text-sm mb-4">{cat.description}</p>
                  <Button 
                    variant="outline" 
                    className="w-full border-[#C0A062]/30 text-[#C0A062] hover:bg-[#C0A062]/10"
                    onClick={() => navigate('/register')}
                  >
                    Get Started
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Belt System */}
      <section className="py-24 bg-[#09090B]" data-testid="belt-system">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="font-accent text-[#C0A062] text-sm tracking-widest mb-4 block">
                THE DOORGUARD PHASE SYSTEM
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                Progress You Can See.{' '}
                <span className="text-[#C0A062]">Confidence You Can Feel.</span>
              </h2>
              <p className="text-zinc-400 mb-8">
                Each category uses five digital belt phases, inspired by martial arts. 
                Advancement requires minimum 12 live sessions, challenge completion, 
                and coach sign-off. No shortcuts. Belts mean something.
              </p>
              
              <div className="space-y-4">
                {[
                  'Minimum 12 sessions per phase',
                  'Skill-based challenges',
                  'Coach verification required',
                  'Points and rankings',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-[#C0A062]" />
                    <span className="text-zinc-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-[#18181B] border border-zinc-800 rounded-lg p-8">
              <h3 className="text-lg font-bold text-white mb-6">Your Journey</h3>
              <BeltProgress currentPhase="blue" showLabels size="lg" />
              
              <div className="mt-8 space-y-4">
                {['white', 'blue', 'purple', 'brown', 'black'].map((belt, i) => (
                  <div 
                    key={belt}
                    className={`flex items-center gap-4 p-3 rounded ${
                      i <= 1 ? 'bg-zinc-800/50' : 'opacity-50'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded belt-${belt}`} />
                    <span className="text-sm text-zinc-300 capitalize font-medium">
                      Phase {i + 1} — {belt} Belt
                    </span>
                    {i < 1 && <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />}
                    {i === 1 && <span className="text-xs text-[#C0A062] ml-auto">Current</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-[#0F0F11]" data-testid="features-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Training Offered To You Anywhere</h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Built for real safety, not fantasy fighting.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, i) => (
              <div 
                key={i}
                className="stats-card p-6 rounded-lg"
              >
                <feature.icon className="w-10 h-10 text-[#C0A062] mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-zinc-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Safety */}
      <section className="py-24 bg-[#09090B]" data-testid="trust-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="bg-[#18181B] border border-zinc-800 rounded-lg p-8">
                <h3 className="text-lg font-bold text-white mb-6">Trust Stack</h3>
                <div className="space-y-4">
                  {trustPoints.map((point, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-zinc-800/30 rounded">
                      <Shield className="w-5 h-5 text-blue-400" />
                      <span className="text-zinc-300">{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="order-1 lg:order-2">
              <span className="font-accent text-[#C0A062] text-sm tracking-widest mb-4 block">
                SAFETY FIRST
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                Your Security is{' '}
                <span className="text-[#C0A062]">Non-Negotiable</span>
              </h2>
              <p className="text-zinc-400 mb-6">
                Every trainer is verified. Every session is protected. 
                We've built DoorGuard with safety at its core—especially 
                for women and home sessions.
              </p>
              <p className="text-zinc-400">
                This isn't just training. It's status, safety, and personal 
                growth—delivered to your door.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-[#0F0F11]" data-testid="cta-section">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-zinc-400 mb-8 max-w-2xl mx-auto">
            Join thousands of clients and trainers building confidence, 
            strength, and real-world safety skills.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => navigate('/register')}
              className="btn-primary text-base px-8 py-6"
              data-testid="cta-register"
            >
              Create Your Account
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button 
              size="lg"
              variant="outline"
              onClick={() => navigate('/trainers')}
              className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white text-base px-8 py-6"
              data-testid="cta-browse"
            >
              Browse Trainers
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-[#09090B] border-t border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-[#C0A062]" />
              <span className="font-bold text-white">DOORGUARD</span>
            </div>
            <p className="text-sm text-zinc-500">
              © 2025 DoorGuard. Your Personal Defense, Anywhere.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
