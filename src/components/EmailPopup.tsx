import React, { useState, useCallback } from 'react';
import { X, Mail } from 'lucide-react';

interface EmailPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (email: string) => void;
  prompt?: string;
  isAgentTool?: boolean;
}

const EmailPopup: React.FC<EmailPopupProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  prompt = "Enter your email to complete booking:",
  isAgentTool = false
}) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    
    const trimmedEmail = email.trim();
    
    if (!trimmedEmail) {
      setError('E-post krävs');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Vänligen ange en giltig e-postadress');
      return;
    }

    setIsSubmitting(true);
    setError('');

    // For agent tool, return email directly without webhook
    if (isAgentTool) {
      console.log('📧 Returning email directly to agent:', trimmedEmail);
      onSubmit(trimmedEmail);
      setEmail('');
      setIsSubmitting(false);
    } else {
      // For auto-trigger during call, still send to webhook
      try {
        const webhookUrl = `https://stefan0987.app.n8n.cloud/webhook/803738bb-c134-4bdb-9720-5b1af902475f?email=${encodeURIComponent(trimmedEmail)}`;
        
        console.log('📧 Sending email to webhook during call:', trimmedEmail);
        
        // Use image loading technique to bypass CORS
        const img = new Image();
        img.onload = () => {
          console.log('✅ Email sent successfully to webhook during call');
          onSubmit(trimmedEmail);
          setEmail('');
        };
        img.onerror = () => {
          console.log('✅ Email sent to webhook (expected image error)');
          onSubmit(trimmedEmail);
          setEmail('');
        };
        img.src = webhookUrl;
      } catch (error) {
        console.error('❌ Error sending email to webhook:', error);
        setError('Nätverksfel. Försök igen.');
      } finally {
        setIsSubmitting(false);
      }
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
              E-post krävs
            </h2>
          </div>
          {!isAgentTool && (
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
            {prompt}
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
                placeholder="din@email.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:border-black focus:ring-1 focus:ring-black outline-none transition-all text-black placeholder-gray-400 disabled:opacity-50 disabled:bg-gray-50"
                autoFocus
                autoComplete="email"
                disabled={isSubmitting}
              />
              {error && (
                <p className="text-red-600 text-xs mt-2">
                  {error === 'Email is required' ? 'E-post krävs' :
                   error === 'Please enter a valid email address' ? 'Vänligen ange en giltig e-postadress' :
                   error === 'Failed to submit email. Please try again.' ? 'Misslyckades att skicka e-post. Försök igen.' :
                   error === 'Network error. Please try again.' ? 'Nätverksfel. Försök igen.' :
                   error}
                </p>
              )}
            </div>
            
            <div className="flex space-x-3">
              {!isAgentTool && (
                <button
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  Avbryt
                </button>
              )}
              <button
                onClick={handleSubmit}
                disabled={!email.trim() || isSubmitting}
                className={`${isAgentTool ? 'w-full' : 'flex-1'} px-4 py-3 bg-black hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    {isAgentTool ? 'Skickar till agent...' : 'Skickar...'}
                  </>
                ) : (
                  isAgentTool ? 'Skicka till agent' : 'Skicka e-post'
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