import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle, RefreshCw, ArrowLeft, AlertCircle } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

interface EmailVerificationScreenProps {
  email: string;
  onBackToLogin: () => void;
  onVerificationComplete: () => void;
  onRedirectToLogin: () => void;
}

export const EmailVerificationScreen: React.FC<EmailVerificationScreenProps> = ({
  email,
  onBackToLogin,
  onVerificationComplete,
  onRedirectToLogin
}) => {
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [isCheckingVerification, setIsCheckingVerification] = useState(false);

  // Проверка статуса верификации каждые 3 секунды
  useEffect(() => {
    const checkVerificationStatus = async () => {
      if (!supabase) return;
      
      try {
        // Сначала попробуем получить текущую сессию
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error checking verification status:', error);
          return;
        }
        
        // Если есть сессия и email подтвержден
        if (session?.user?.email_confirmed_at) {
          console.log('Email confirmed via session:', session.user.email);
          onRedirectToLogin();
          return;
        }
        
        // Если нет активной сессии, попробуем обновить сессию
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('Error getting user:', userError);
          return;
        }
        
        // Проверяем статус пользователя напрямую
        if (user?.email_confirmed_at) {
          console.log('Email confirmed via user check:', user.email);
          onRedirectToLogin();
        }
      } catch (error) {
        console.error('Error checking verification:', error);
      }
    };

    // Проверяем сразу
    checkVerificationStatus();
    
    // Затем каждые 3 секунды
    const interval = setInterval(checkVerificationStatus, 3000);
    
    return () => clearInterval(interval);
  }, [onVerificationComplete]);

  // Обратный отсчет для повторной отправки
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResendEmail = async () => {
    if (!supabase || countdown > 0) return;
    
    setIsResending(true);
    setResendError('');
    setResendSuccess(false);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      });

      if (error) {
        console.error('Error resending email:', error);
        setResendError('Ошибка при отправке письма. Попробуйте еще раз.');
      } else {
        setResendSuccess(true);
        setCountdown(60); // 60 секунд до следующей отправки
      }
    } catch (error) {
      console.error('Resend email error:', error);
      setResendError('Произошла ошибка. Попробуйте еще раз.');
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckVerification = () => {
    setIsCheckingVerification(true);
    setResendError('');
    setResendSuccess(true);
    
    // Показываем сообщение об успехе и перенаправляем на login
    setTimeout(() => {
      onRedirectToLogin();
    }, 1500);
  };

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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Подтвердите email</h1>
          <p className="text-gray-600">Мы отправили письмо на ваш адрес</p>
        </div>

        {/* Verification Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6">
          {/* Email Icon */}
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Проверьте почту
            </h2>
            <p className="text-gray-600 text-sm">
              Мы отправили письмо с подтверждением на адрес:
            </p>
            <p className="text-blue-600 font-medium mt-1">{email}</p>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Что делать дальше:</p>
                <ol className="list-decimal list-inside space-y-1 text-blue-700">
                  <li>Откройте письмо в почтовом ящике</li>
                  <li>Нажмите на ссылку подтверждения</li>
                  <li>Вернитесь в приложение</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {resendError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-700">{resendError}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {resendSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-700">
                  Отлично! Перенаправляем на страницу входа...
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Check Verification Button */}
            <button
              onClick={handleCheckVerification}
              disabled={isCheckingVerification}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              {isCheckingVerification ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Перенаправляем...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Я подтвердил email
                </>
              )}
            </button>

            {/* Resend Email Button */}
            <button
              onClick={handleResendEmail}
              disabled={isResending || countdown > 0}
              className="w-full bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 text-gray-700 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
            >
              {isResending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                  Отправляем...
                </>
              ) : countdown > 0 ? (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Отправить повторно ({countdown}с)
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Отправить письмо повторно
                </>
              )}
            </button>

            {/* Back to Login Button */}
            <button
              onClick={onBackToLogin}
              className="w-full text-gray-600 hover:text-gray-800 py-2 font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Вернуться к входу
            </button>
          </div>
        </div>

        {/* Help Text */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500">
            Не получили письмо? Проверьте папку "Спам" или попробуйте отправить повторно.
          </p>
        </div>
      </div>
    </div>
  );
};
