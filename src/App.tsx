import React, { useState, useEffect } from 'react';
import { useConversation } from '@elevenlabs/react';
import { Mic, MicOff, Phone, PhoneOff, Mail, X } from 'lucide-react';

function App() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [emailPrompt, setEmailPrompt] = useState('');

  // Get agent ID from environment variable
  const agentId = import.meta.env.VITE_ELEVENLABS_AGENT_ID;

  const conversation = useConversation({
    clientTools: {
      capture_Email: (parameters: any) => {
        console.log('Email capture tool triggered with parameters:', parameters);
        
        // Extract prompt from parameters if provided
        const prompt = parameters?.prompt || 'Please enter your email address:';
        setEmailPrompt(prompt);
        setShowEmailModal(true);
        setEmailInput('');
        
        // Return a promise that resolves when email is submitted
        return new Promise((resolve) => {
          // Store the resolve function to call it later when email is submitted
          (window as any).emailCaptureResolve = resolve;
        });
      }
    },
    onConnect: () => {
      console.log('Connected to Axie Studio AI');
    },
    onDisconnect: () => {
      console.log('Disconnected from Axie Studio AI');
    },
    onMessage: (message) => {
      console.log('Message:', message);
    },
    onError: (error) => {
      console.error('Error:', error);
    },
  });

  const requestMicrophonePermission = async () => {
    setIsRequestingPermission(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasPermission(true);
    } catch (error) {
      setHasPermission(false);
    } finally {
      setIsRequestingPermission(false);
    }
  };

  const handleStartSession = async () => {
    if (!agentId) {
      console.error('Agent ID missing in configuration');
      return;
    }

    if (!hasPermission) {
      await requestMicrophonePermission();
      return;
    }

    try {
      await conversation.startSession({
        agentId: agentId,
        connectionType: 'webrtc',
      });
    } catch (error) {
      console.error('Could not start conversation:', error);
    }
  };

  const handleEndSession = async () => {
    try {
      await conversation.endSession();
    } catch (error) {
      console.error('Could not end conversation:', error);
    }
  };

  const handleEmailSubmit = () => {
    if (emailInput.trim()) {
      // Call the resolve function if it exists
      if ((window as any).emailCaptureResolve) {
        (window as any).emailCaptureResolve({
          email: emailInput.trim(),
          success: true,
          message: `Email ${emailInput.trim()} has been captured successfully.`
        });
        delete (window as any).emailCaptureResolve;
      }
      
      setShowEmailModal(false);
      setEmailInput('');
      console.log('Email captured:', emailInput.trim());
    }
  };

  const handleEmailCancel = () => {
    // Call the resolve function with cancellation info
    if ((window as any).emailCaptureResolve) {
      (window as any).emailCaptureResolve({
        email: null,
        success: false,
        message: 'Email capture was cancelled by the user.'
      });
      delete (window as any).emailCaptureResolve;
    }
    
    setShowEmailModal(false);
    setEmailInput('');
  };

  const handleEmailKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEmailSubmit();
    } else if (e.key === 'Escape') {
      handleEmailCancel();
    }
  };

  useEffect(() => {
    // Check initial microphone permission
    if (navigator.permissions) {
      navigator.permissions.query({ name: 'microphone' as PermissionName }).then(result => {
        setHasPermission(result.state === 'granted');
      });
    }
  }, []);

  const isConnected = conversation.status === 'connected';
  const isConnecting = conversation.status !== 'connected' && conversation.status !== 'disconnected';

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Email Capture Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto transform transition-all">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Mail size={20} className="text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Email Required</h2>
              </div>
              <button
                onClick={handleEmailCancel}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <X size={16} className="text-gray-500" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6">
              <p className="text-gray-600 mb-4 leading-relaxed">
                {emailPrompt}
              </p>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    onKeyDown={handleEmailKeyPress}
                    placeholder="your.email@example.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 placeholder-gray-400"
                    autoFocus
                  />
                </div>
                
                {/* Action Buttons */}
                <div className="flex space-x-3 pt-2">
                  <button
                    onClick={handleEmailCancel}
                    className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEmailSubmit}
                    disabled={!emailInput.trim()}
                    className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                  >
                    Submit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header - Responsive */}
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-center sm:justify-start space-x-3">
          <img 
            src="https://www.axiestudio.se/logo.jpg" 
            alt="Axie Studio" 
            className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg object-cover"
          />
          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">
            Axie Studio
          </h1>
        </div>
      </div>

      {/* Main Content - Responsive Container */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="text-center w-full max-w-lg">
          {/* Responsive Gradient Orb with Button */}
          <div className="relative mb-6 sm:mb-8 lg:mb-12">
            {/* Animated gradient background - Responsive sizes */}
            <div className={`w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96 xl:w-[400px] xl:h-[400px] mx-auto rounded-full transition-all duration-1000 ${
              isConnected 
                ? 'bg-gradient-to-br from-emerald-400 via-blue-500 to-purple-600 animate-pulse' 
                : conversation.isSpeaking
                ? 'bg-gradient-to-br from-blue-400 via-cyan-500 to-teal-600 animate-spin'
                : 'bg-gradient-to-br from-blue-400 via-cyan-500 to-teal-600'
            } shadow-2xl relative overflow-hidden`}>
              {/* Inner glow effect */}
              <div className="absolute inset-3 sm:inset-4 lg:inset-6 rounded-full bg-gradient-to-br from-white/20 to-transparent"></div>
              
              {/* Central button - Responsive sizing */}
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  onClick={isConnected ? handleEndSession : handleStartSession}
                  disabled={isConnecting || isRequestingPermission}
                  className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-black/80 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/90 active:scale-95 transition-all duration-200 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed group touch-manipulation"
                >
                  {isConnecting || isRequestingPermission ? (
                    <div className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : isConnected ? (
                    <PhoneOff size={window.innerWidth < 640 ? 20 : window.innerWidth < 1024 ? 24 : 28} className="group-hover:scale-110 transition-transform" />
                  ) : hasPermission === false ? (
                    <MicOff size={window.innerWidth < 640 ? 20 : window.innerWidth < 1024 ? 24 : 28} className="group-hover:scale-110 transition-transform" />
                  ) : (
                    <Phone size={window.innerWidth < 640 ? 20 : window.innerWidth < 1024 ? 24 : 28} className="group-hover:scale-110 transition-transform" />
                  )}
                </button>
              </div>

              {/* Speaking indicator rings - Responsive */}
              {conversation.isSpeaking && (
                <>
                  <div className="absolute inset-0 rounded-full border-2 sm:border-4 border-white/30 animate-ping"></div>
                  <div className="absolute inset-6 sm:inset-8 lg:inset-12 rounded-full border border-white/20 sm:border-2 animate-ping animation-delay-200"></div>
                </>
              )}
            </div>

            {/* Button label - Responsive positioning and sizing */}
            <div className="absolute -bottom-12 sm:-bottom-16 lg:-bottom-20 left-1/2 transform -translate-x-1/2 w-full px-4">
              <div className="bg-black/80 backdrop-blur-sm text-white px-3 py-2 sm:px-4 sm:py-2 lg:px-6 lg:py-3 rounded-full text-xs sm:text-sm lg:text-base font-medium shadow-lg mx-auto max-w-fit">
                {isConnecting || isRequestingPermission ? (
                  'Ansluter...'
                ) : isConnected ? (
                  'Avsluta samtal'
                ) : hasPermission === false ? (
                  'Aktivera mikrofon'
                ) : (
                  'Ring AI-agent'
                )}
              </div>
            </div>
          </div>

          {/* Status indicators - Responsive */}
          {isConnected && (
            <div className="flex items-center justify-center space-x-3 sm:space-x-4 lg:space-x-6 mb-4 sm:mb-6">
              <div className="flex items-center space-x-2 text-emerald-600">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-xs sm:text-sm lg:text-base font-medium">Ansluten</span>
              </div>
              {conversation.isSpeaking && (
                <div className="flex items-center space-x-2 text-blue-600">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-xs sm:text-sm lg:text-base font-medium">AI talar</span>
                </div>
              )}
            </div>
          )}

          {/* Permission warning - Responsive */}
          {hasPermission === false && (
            <div className="max-w-xs sm:max-w-md lg:max-w-lg mx-auto mb-4 sm:mb-6 px-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4">
                <div className="flex items-start sm:items-center space-x-2 text-amber-800">
                  <MicOff size={16} className="flex-shrink-0 mt-0.5 sm:mt-0" />
                  <span className="text-xs sm:text-sm font-medium leading-relaxed">
                    Mikrofonbehörighet krävs för att använda röstassistenten
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer - Responsive */}
      <div className="p-4 sm:p-6 lg:p-8 text-center">
        <div className="flex items-center justify-center space-x-2 text-gray-500">
          <span className="text-xs sm:text-sm">Powered by</span>
          <img 
            src="https://www.axiestudio.se/logo.jpg" 
            alt="Axie Studio" 
            className="w-3 h-3 sm:w-4 sm:h-4 rounded object-cover"
          />
          <span className="text-xs sm:text-sm font-medium">Axie Studio AI</span>
        </div>
      </div>
    </div>
  );
}

export default App;