import React, { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff, BookOpen, Globe, ChevronDown } from 'lucide-react';
import { Language } from '../../types';

interface RegistrationScreenProps {
  onRegister: (userData: { 
    name: string; 
    email: string; 
    password: string;
    knownLanguage: Language;
    learningLanguage: Language;
    level: string;
  }) => void;
  onSwitchToLogin: () => void;
}

// Available languages
const AVAILABLE_LANGUAGES: Language[] = [
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' }
];

// Language levels
const DIFFICULTY_LEVELS = [
  { value: 'Beginner', label: 'Начинающий' },
  { value: 'Elementary', label: 'Элементарный' },
  { value: 'Intermediate', label: 'Средний' },
  { value: 'Upper-Intermediate', label: 'Выше среднего' },
  { value: 'Advanced', label: 'Продвинутый' },
  { value: 'Proficient', label: 'Профессиональный' }
];

export const RegistrationScreen: React.FC<RegistrationScreenProps> = ({
  onRegister,
  onSwitchToLogin
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    knownLanguage: AVAILABLE_LANGUAGES[0], // Default: Russian
    learningLanguage: AVAILABLE_LANGUAGES[2], // Default: Spanish
    level: 'Beginner'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [knownDropdownOpen, setKnownDropdownOpen] = useState(false);
  const [learningDropdownOpen, setLearningDropdownOpen] = useState(false);
  const [levelDropdownOpen, setLevelDropdownOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Имя обязательно';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Имя должно содержать минимум 2 символа';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email обязателен';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Некорректный формат email';
    }

    if (!formData.password) {
      newErrors.password = 'Пароль обязателен';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Пароль должен содержать минимум 6 символов';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Подтвердите пароль';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Пароли не совпадают';
    }

    if (!formData.knownLanguage) {
      newErrors.knownLanguage = 'Выберите язык, который вы знаете';
    }

    if (!formData.learningLanguage) {
      newErrors.learningLanguage = 'Выберите язык, который изучаете';
    }

    if (formData.knownLanguage && formData.learningLanguage && 
        formData.knownLanguage.code === formData.learningLanguage.code) {
      newErrors.learningLanguage = 'Язык изучения должен отличаться от известного языка';
    }

    if (!formData.level) {
      newErrors.level = 'Выберите уровень языка';
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
      
      onRegister({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        knownLanguage: formData.knownLanguage,
        learningLanguage: formData.learningLanguage,
        level: formData.level
      });
    } catch (error) {
      console.error('Registration error:', error);
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

  const handleLanguageChange = (type: 'known' | 'learning', language: Language) => {
    setFormData(prev => ({ ...prev, [`${type}Language`]: language }));
    
    // Clear error when user selects language
    if (errors[`${type}Language`]) {
      setErrors(prev => ({ ...prev, [`${type}Language`]: '' }));
    }
    
    // Close dropdown
    if (type === 'known') {
      setKnownDropdownOpen(false);
    } else {
      setLearningDropdownOpen(false);
    }
  };

  const handleLevelChange = (level: string) => {
    setFormData(prev => ({ ...prev, level }));
    
    // Clear error when user selects level
    if (errors.level) {
      setErrors(prev => ({ ...prev, level: '' }));
    }
    
    setLevelDropdownOpen(false);
  };

  // Custom Dropdown Component
  const CustomDropdown: React.FC<{
    label: string;
    value: string;
    options: Array<{ code?: string; name?: string; value?: string; label: string; flag?: string }>;
    isOpen: boolean;
    onToggle: () => void;
    onSelect: (option: any) => void;
    error?: string;
  }> = ({ label, value, options, isOpen, onToggle, onSelect, error }) => (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <button
        type="button"
        onClick={onToggle}
        className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-left flex items-center justify-between text-black ${
          error ? 'border-red-300 bg-red-50' : 'border-gray-300'
        }`}
      >
        <div className="flex items-center gap-2">
          <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <span className="ml-6">{value}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {options.map((option, index) => (
            <button
              key={index}
              type="button"
              onClick={() => onSelect(option)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 first:rounded-t-lg last:rounded-b-lg text-black"
            >
              {option.flag && <span className="text-lg">{option.flag}</span>}
              <span>{option.label || option.name}</span>
            </button>
          ))}
        </div>
      )}
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <img 
              src="/assets/Logo AmigosCards.png" 
              alt="AmigosCards Logo" 
              className="w-10 h-10"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.parentElement!.innerHTML = '<svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z"/></svg>';
              }}
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Создать аккаунт</h1>
          <p className="text-gray-600">Начните изучать языки уже сегодня</p>
        </div>

        {/* Registration Form */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Имя
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Введите ваше имя"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-black ${
                    errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

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
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-black ${
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
                  placeholder="Минимум 6 символов"
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-black ${
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

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Подтвердите пароль
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="Повторите пароль"
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-black ${
                    errors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Language Selection Section */}
            <div className="border-t pt-4 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                Языковые настройки
              </h3>
              
              {/* Known Language */}
              <div className="mb-4">
                <CustomDropdown
                  label="Язык, который вы знаете"
                  value={formData.knownLanguage ? `${formData.knownLanguage.flag} ${formData.knownLanguage.name}` : 'Выберите язык'}
                  options={AVAILABLE_LANGUAGES}
                  isOpen={knownDropdownOpen}
                  onToggle={() => setKnownDropdownOpen(!knownDropdownOpen)}
                  onSelect={(language) => handleLanguageChange('known', language)}
                  error={errors.knownLanguage}
                />
              </div>

              {/* Learning Language */}
              <div className="mb-4">
                <CustomDropdown
                  label="Язык, который изучаете"
                  value={formData.learningLanguage ? `${formData.learningLanguage.flag} ${formData.learningLanguage.name}` : 'Выберите язык'}
                  options={AVAILABLE_LANGUAGES.filter(lang => lang.code !== formData.knownLanguage?.code)}
                  isOpen={learningDropdownOpen}
                  onToggle={() => setLearningDropdownOpen(!learningDropdownOpen)}
                  onSelect={(language) => handleLanguageChange('learning', language)}
                  error={errors.learningLanguage}
                />
              </div>

              {/* Language Level */}
              <div className="mb-4">
                <CustomDropdown
                  label="Уровень языка"
                  value={DIFFICULTY_LEVELS.find(level => level.value === formData.level)?.label || 'Выберите уровень'}
                  options={DIFFICULTY_LEVELS}
                  isOpen={levelDropdownOpen}
                  onToggle={() => setLevelDropdownOpen(!levelDropdownOpen)}
                  onSelect={(level) => handleLevelChange(level.value)}
                  error={errors.level}
                />
              </div>
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
                  Создаем аккаунт...
                </>
              ) : (
                'Создать аккаунт'
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Уже есть аккаунт?{' '}
              <button
                onClick={onSwitchToLogin}
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Войти
              </button>
            </p>
          </div>
        </div>

        {/* Terms */}
        <p className="text-center text-xs text-gray-500 mt-6">
          Создавая аккаунт, вы соглашаетесь с{' '}
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