import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, BookOpen } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (credentials: { email: string; password: string }) => void;
  onSwitchToRegister: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  onSwitchToRegister
}) => {
  const [formData, setFormData] = useState(() => {
    // Load saved credentials from localStorage
    const savedEmail = localStorage.getItem('savedEmail') || '';
    const savedPassword = localStorage.getItem('savedPassword') || '';
    return {
      email: savedEmail,
      password: savedPassword
    };
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('rememberMe') === 'true';
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email обязателен';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Некорректный формат email';
    }

    if (!formData.password) {
      newErrors.password = 'Пароль обязателен';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Save credentials if "Remember me" is checked
      if (rememberMe) {
        localStorage.setItem('savedEmail', formData.email.trim());
        localStorage.setItem('savedPassword', formData.password);
        localStorage.setItem('rememberMe', 'true');
      } else {
        // Clear saved credentials if "Remember me" is unchecked
        localStorage.removeItem('savedEmail');
        localStorage.removeItem('savedPassword');
        localStorage.setItem('rememberMe', 'false');
      }
      
      onLogin({
        email: formData.email.trim(),
        password: formData.password
      });
    } catch (error) {
      console.error('Login error:', error);
      setErrors({ general: 'Неверный email или пароль' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="w-64 h-64 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <img 
              src="/Logo AmigosCards.png" 
              alt="AmigosCards Logo" 
              className="w-48 h-48 object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Добро пожаловать!</h1>
          <p className="text-gray-600">Войдите в свой аккаунт</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* General Error */}
            {errors.general && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{errors.general}</p>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="example@email.com"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Пароль
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Введите пароль"
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-700 transition-colors"
              >
                Забыли пароль?
              </button>
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                Запомнить меня
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors mt-6"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Входим...
                </>
              ) : (
                'Войти'
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Нет аккаунта?{' '}
              <button
                onClick={onSwitchToRegister}
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Создать аккаунт
              </button>
            </p>
          </div>
        </div>

       

        {/* Terms */}
        <p className="text-center text-xs text-gray-500 mt-6">
          Входя в систему, вы соглашаетесь с{' '}
          <a href="#" className="text-blue-600 hover:text-blue-700">
            Условиями использования
          </a>{' '}
          и{' '}
          <a href="#" className="text-blue-600 hover:text-blue-700">
            Политикой конфиденциальности
          </a>
        </p>
      </div>
    </div>
  );
};