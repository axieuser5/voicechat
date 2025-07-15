import React, { useState, useCallback } from 'react';
import { X, Mail } from 'lucide-react';

interface EmailPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (email: string) => void;
  prompt?: string;
  autoTrigger?: boolean;
}

const EmailPopup: React.FC<EmailPopupProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  prompt = "Enter your email to complete booking:",
  autoTrigger = false
}) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    
    const trimmedEmail = email.trim();
    
    if (!trimmedEmail) {
      setError('Email is required');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Send GET request to n8n webhook
      const webhookUrl = `https://stefan0987.app.n8n.cloud/webhook/803738bb-c134-4bdb-9720-5b1af902475f?email=${encodeURIComponent(trimmedEmail)}`;
      
      console.log('📧 AUTO-TRIGGERING email to webhook during call:', trimmedEmail);
      
      const response = await fetch(webhookUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        console.log('✅ Email auto-sent successfully to webhook during active call');
        onSubmit(trimmedEmail);
        setEmail('');
      } else {
        console.error('❌ Webhook request failed:', response.status);
        setError('Failed to submit email. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error sending email to webhook:', error);
      setError('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [email, isSubmitting, onSubmit]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  }, [handleSubmit, onClose]);

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      setEmail('');
      setError('');
      onClose();
    }
  }, [isSubmitting, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-auto border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
              <Mail size={16} className="text-white" />
            </div>
            <h2 className="text-lg font-semibold text-black">
              {autoTrigger ? 'Call in Progress - Email Required' : 'Email Required'}
            </h2>
          </div>
          {!autoTrigger && (
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 text-sm mb-4 leading-relaxed">
            {autoTrigger 
              ? 'You are currently in an active call. Please provide your email to continue:' 
              : prompt
            }
          </p>
          
          <div className="space-y-4">
            <div>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                onKeyDown={handleKeyPress}
                placeholder="your@email.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-black focus:ring-1 focus:ring-black outline-none transition-all text-black placeholder-gray-400 disabled:opacity-50 disabled:bg-gray-50"
                autoFocus
                autoComplete="email"
                disabled={isSubmitting}
              />
              {error && (
                <p className="text-red-600 text-xs mt-2">{error}</p>
              )}
            </div>
            
            <div className="flex space-x-3">
              {!autoTrigger && (
                <button
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleSubmit}
                disabled={!email.trim() || isSubmitting}
                className={`${autoTrigger ? 'w-full' : 'flex-1'} px-4 py-3 bg-black hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    {autoTrigger ? 'Processing Call...' : 'Submitting...'}
                  </>
                ) : (
                  {autoTrigger ? 'Continue Call' : 'Submit Email'}
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailPopup;