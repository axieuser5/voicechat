import React from 'react';
import { X } from 'lucide-react';

interface EmailModalProps {
  isOpen: boolean;
  emailInput: string;
  emailPrompt: string;
  onEmailChange: (email: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
}

const EmailModal: React.FC<EmailModalProps> = ({
  isOpen,
  emailInput,
  emailPrompt,
  onEmailChange,
  onSubmit,
  onCancel,
  onKeyPress
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-auto transform animate-in slide-in-from-bottom-4 duration-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-black">Email Required</h2>
            <button
              onClick={onCancel}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close"
            >
              <X size={16} className="text-gray-500" />
            </button>
          </div>
          
          <p className="text-gray-600 text-sm mb-4 leading-relaxed">
            {emailPrompt}
          </p>
          
          <div className="space-y-4">
            <input
              type="email"
              value={emailInput}
              onChange={(e) => onEmailChange(e.target.value)}
              onKeyDown={onKeyPress}
              placeholder="your.email@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-black focus:ring-1 focus:ring-black outline-none transition-all text-black placeholder-gray-400 text-sm"
              autoFocus
              autoComplete="email"
            />
            
            <div className="flex space-x-3">
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-2 text-black bg-white border border-gray-300 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onSubmit}
                disabled={!emailInput.trim()}
                className="flex-1 px-4 py-2 bg-black hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailModal;