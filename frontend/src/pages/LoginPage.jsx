import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';
import { useAuthStore } from '../store/useStore';

function LoginPage() {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = isRegister
        ? await authAPI.register(formData)
        : await authAPI.login(formData.email, formData.password);

      const { token, user } = response.data;

      localStorage.setItem('authToken', token);
      setUser(user);
      toast.success(isRegister ? 'Account created!' : 'Welcome back!');
      navigate('/');
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Authentication failed'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-600 mb-2">
            🎯 Lead Gen Pro
          </h1>
          <p className="text-gray-600">
            Professional LinkedIn Lead Generation Platform
          </p>
        </div>

        {/* Form Card */}
        <div className="card">
          <h2 className="text-2xl font-bold mb-6 text-center">
            {isRegister ? 'Create Account' : 'Sign In'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    required={isRegister}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    required={isRegister}
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                className="input"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                className="input"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn btn-primary py-3 text-lg"
            >
              {isLoading
                ? 'Loading...'
                : isRegister
                ? 'Create Account'
                : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              {isRegister
                ? 'Already have an account? Sign in'
                : "Don't have an account? Create one"}
            </button>
          </div>
        </div>

        {/* Demo Info */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Demo credentials:</p>
          <p className="font-mono">demo@leadgenpro.com / demo123</p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
