import React, { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { register } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Shield, Eye, EyeOff, AlertCircle, User, Dumbbell } from 'lucide-react';
import { toast } from 'sonner';

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    city: '',
    zip_code: '',
    role: searchParams.get('role') || '',
  });

  const handleRoleSelect = (role) => {
    setFormData({ ...formData, role });
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await register(formData);
      loginUser(response.data.token, response.data.user);
      toast.success('Welcome to DoorGuard!');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#09090B]">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <Link to="/" className="flex items-center gap-2 mb-8">
              <Shield className="w-8 h-8 text-[#C0A062]" />
              <span className="text-xl font-bold text-white">
                DOOR<span className="text-[#C0A062]">GUARD</span>
              </span>
            </Link>
            
            <h1 className="text-3xl font-bold text-white mb-2">
              {step === 1 ? 'Join DoorGuard' : 'Create Your Account'}
            </h1>
            <p className="text-zinc-400">
              {step === 1 
                ? 'Choose how you want to use DoorGuard'
                : `Register as a ${formData.role === 'client' ? 'Client' : 'Trainer'}`
              }
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          )}

          {step === 1 ? (
            <div className="space-y-4" data-testid="role-selection">
              <button
                onClick={() => handleRoleSelect('client')}
                className="w-full p-6 bg-[#18181B] border border-zinc-800 rounded-lg hover:border-[#C0A062]/50 transition-colors text-left group"
                data-testid="select-client"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#C0A062]/10 flex items-center justify-center group-hover:bg-[#C0A062]/20 transition-colors">
                    <User className="w-6 h-6 text-[#C0A062]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">I'm a Client</h3>
                    <p className="text-sm text-zinc-400">Find trainers and start your journey</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleRoleSelect('trainer')}
                className="w-full p-6 bg-[#18181B] border border-zinc-800 rounded-lg hover:border-[#C0A062]/50 transition-colors text-left group"
                data-testid="select-trainer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#C0A062]/10 flex items-center justify-center group-hover:bg-[#C0A062]/20 transition-colors">
                    <Dumbbell className="w-6 h-6 text-[#C0A062]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">I'm a Trainer</h3>
                    <p className="text-sm text-zinc-400">Share your expertise and earn</p>
                  </div>
                </div>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5" data-testid="register-form">
              <div>
                <Label htmlFor="full_name" className="text-zinc-300">Full Name</Label>
                <Input
                  id="full_name"
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="mt-2 bg-[#18181B] border-zinc-800 text-white"
                  placeholder="John Doe"
                  required
                  data-testid="register-name"
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-zinc-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-2 bg-[#18181B] border-zinc-800 text-white"
                  placeholder="you@example.com"
                  required
                  data-testid="register-email"
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-zinc-300">Password</Label>
                <div className="relative mt-2">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="bg-[#18181B] border-zinc-800 text-white pr-10"
                    placeholder="••••••••"
                    required
                    minLength={6}
                    data-testid="register-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city" className="text-zinc-300">City</Label>
                  <Input
                    id="city"
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="mt-2 bg-[#18181B] border-zinc-800 text-white"
                    placeholder="New York"
                    data-testid="register-city"
                  />
                </div>
                <div>
                  <Label htmlFor="zip_code" className="text-zinc-300">Zip Code</Label>
                  <Input
                    id="zip_code"
                    type="text"
                    value={formData.zip_code}
                    onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                    className="mt-2 bg-[#18181B] border-zinc-800 text-white"
                    placeholder="10001"
                    data-testid="register-zip"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 btn-primary"
                  data-testid="register-submit"
                >
                  {loading ? <span className="spinner w-5 h-5" /> : 'Create Account'}
                </Button>
              </div>
            </form>
          )}

          <p className="mt-8 text-center text-zinc-400">
            Already have an account?{' '}
            <Link to="/login" className="text-[#C0A062] hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Image */}
      <div 
        className="hidden lg:block lg:w-1/2 bg-cover bg-center relative"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1570442387127-66eb80e00938?w=1920)',
        }}
      >
        <div className="absolute inset-0 bg-[#09090B]/60" />
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              {formData.role === 'trainer' 
                ? 'Earn Without Limits'
                : 'Your Personal Defense, At Home'
              }
            </h2>
            <p className="text-zinc-300 max-w-md">
              {formData.role === 'trainer'
                ? 'No gym fees, no overhead. Just you, your skills, and clients who need you.'
                : 'Connect with vetted trainers who come directly to your door.'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
