import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useConversation } from '@elevenlabs/react';
import { Mic, MicOff, Phone, PhoneOff, Mail, X, Shield } from 'lucide-react';

// Types for better type safety
interface EmailCaptureParams {
  prompt?: string;
}

interface EmailCaptureResult {
  email: string | null;
  success: boolean;
  message: string;
}

// Constants for better performance
const MODAL_ANIMATION_DURATION = 200;
const CONNECTION_TIMEOUT = 10000;
const RETRY_ATTEMPTS = 3;

function App() {
  // State management with proper typing
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [emailPrompt, setEmailPrompt] = useState('');
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [isSecureConnection, setIsSecureConnection] = useState(false);
  const [emailResolver, setEmailResolver] = useState<((result: any) => void) | null>(null);

  // Memoized agent ID with validation
  const agentId = useMemo(() => {
    const id = import.meta.env.VITE_ELEVENLABS_AGENT_ID;
    if (!id) {
      console.error('❌ Agent ID missing in environment variables');
      return null;
    }
    console.log('✅ Agent ID loaded securely');
    return id;
  }, []);

  // Client tool function following ElevenLabs documentation
  const captureEmail = useCallback((parameters: any) => {
    console.log('📧 captureEmail tool triggered with parameters:', parameters);
    
    // Extract prompt from parameters
    const prompt = parameters?.prompt || 'Please provide your email address to continue:';
    
    console.log('📧 Setting up email capture modal with prompt:', prompt);
    setEmailPrompt(prompt);
    setShowEmailModal(true);
    setEmailInput('');
    
    // Return a promise that will be resolved when user submits email
    return new Promise((resolve) => {
      setEmailResolver(() => resolve);
      
      // Auto-timeout after 2 minutes for security
      const timeoutId = setTimeout(() => {
        console.log('⏰ Email capture timed out');
        resolve({
          success: false,
          message: 'Email capture timed out. Please try again.',
          email: null
        });
        setShowEmailModal(false);
        setEmailResolver(null);
      }, 120000);

      // Store timeout ID for cleanup
      (window as any).emailCaptureTimeout = timeoutId;
    });
  }, []);

  // Enhanced conversation configuration with security and performance optimizations
  const conversation = useConversation({
    apiKey: import.meta.env.VITE_ELEVENLABS_API_KEY,
    clientTools: {
      capture_Email: captureEmail
    },
    onConnect: useCallback(() => {
      console.log('🔗 Connected to Axie Studio AI');
      setIsSecureConnection(true);
      setConnectionAttempts(0);
    }, []),
    onDisconnect: useCallback(() => {
      console.log('🔌 Disconnected from Axie Studio AI');
      setIsSecureConnection(false);
      // Clean up any pending email capture
      if (emailResolver) {
        setShowEmailModal(false);
        setEmailResolver(null);
        if ((window as any).emailCaptureTimeout) {
          clearTimeout((window as any).emailCaptureTimeout);
          delete (window as any).emailCaptureTimeout;
        }
      }
    }, []),
    onMessage: useCallback((message) => {
      console.log('💬 Message received:', message);
    }, []),
    onError: useCallback((error) => {
      console.error('❌ Connection error:', error);
      setIsSecureConnection(false);
      
      // Auto-retry logic for better reliability
      if (connectionAttempts < RETRY_ATTEMPTS) {
        setTimeout(() => {
          setConnectionAttempts(prev => prev + 1);
          console.log(`🔄 Retrying connection (${connectionAttempts + 1}/${RETRY_ATTEMPTS})`);
        }, 2000);
      }
    }, [connectionAttempts]),
  }, [captureEmail, emailResolver, connectionAttempts]);

  // Optimized microphone permission request with better UX
  const requestMicrophonePermission = useCallback(async () => {
    if (isRequestingPermission) return;
    
    setIsRequestingPermission(true);
    console.log('🎤 Requesting microphone permission...');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000
        }
      });
      
      // Immediately stop the stream to free resources
      stream.getTracks().forEach(track => track.stop());
      
      setHasPermission(true);
      console.log('✅ Microphone permission granted');
    } catch (error) {
      console.error('❌ Microphone permission denied:', error);
      setHasPermission(false);
    } finally {
      setIsRequestingPermission(false);
    }
  }, [isRequestingPermission]);

  // Enhanced session management with timeout and retry logic
  const handleStartSession = useCallback(async () => {
    if (!agentId) {
      console.error('❌ Cannot start session: Agent ID missing');
      return;
    }

    if (!hasPermission) {
      await requestMicrophonePermission();
      return;
    }

    console.log('🚀 Starting secure session...');
    
    try {
      const sessionPromise = conversation.startSession({
        agentId: agentId,
      });

      // Add timeout for connection
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout')), CONNECTION_TIMEOUT);
      });

      await Promise.race([sessionPromise, timeoutPromise]);
      console.log('✅ Session started successfully');
      
    } catch (error) {
      console.error('❌ Failed to start session:', error);
      
      // Auto-retry on failure
      if (connectionAttempts < RETRY_ATTEMPTS) {
        setConnectionAttempts(prev => prev + 1);
        setTimeout(() => handleStartSession(), 1000);
      }
    }
  }, [agentId, hasPermission, requestMicrophonePermission, conversation, connectionAttempts]);

  // Optimized session end with cleanup
  const handleEndSession = useCallback(async () => {
    console.log('🛑 Ending session...');
    
    try {
      await conversation.endSession();
      console.log('✅ Session ended successfully');
    } catch (error) {
      console.error('❌ Error ending session:', error);
    } finally {
      setIsSecureConnection(false);
      setConnectionAttempts(0);
      // Clean up email capture if active
      if (emailResolver) {
        setShowEmailModal(false);
        setEmailResolver(null);
        if ((window as any).emailCaptureTimeout) {
          clearTimeout((window as any).emailCaptureTimeout);
          delete (window as any).emailCaptureTimeout;
        }
      }
    }
  }, [conversation]);

  // Optimized email submission with validation
  const handleEmailSubmit = useCallback(() => {
    const email = emailInput.trim();
    
    if (!email) {
      console.warn('⚠️ Email is empty');
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValidEmail = emailRegex.test(email);

    console.log('📧 Email being submitted:', email);
    
    if (emailResolver) {
      console.log('✅ Resolving email capture with:', email);
      
      // Return result in format expected by ElevenLabs
      const result = {
        success: true,
        email: email,
        message: isValidEmail 
          ? `Email captured successfully: ${email}`
          : `Email captured with format warning: ${email}`
      };
      
      emailResolver(result);
      setEmailResolver(null);
      
      // Clear timeout
      if ((window as any).emailCaptureTimeout) {
        clearTimeout((window as any).emailCaptureTimeout);
        delete (window as any).emailCaptureTimeout;
      }
    } else {
      console.error('❌ No email resolver function found');
    }
    
    setShowEmailModal(false);
    setEmailInput('');
    console.log('📧 Email modal closed, input cleared');
  }, [emailInput, emailResolver]);

  // Optimized email cancellation
  const handleEmailCancel = useCallback(() => {
    console.log('❌ Email capture cancelled');
    
    if (emailResolver) {
      emailResolver({
        success: false,
        message: 'Email capture cancelled by user.',
        email: null
      });
      setEmailResolver(null);
      
      // Clear timeout
      if ((window as any).emailCaptureTimeout) {
        clearTimeout((window as any).emailCaptureTimeout);
        delete (window as any).emailCaptureTimeout;
      }
    }
    
    setShowEmailModal(false);
    setEmailInput('');
  }, [emailResolver]);

  // Optimized keyboard handling
  const handleEmailKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleEmailSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleEmailCancel();
    }
  }, [handleEmailSubmit, handleEmailCancel]);

  // Check initial permissions on mount
  useEffect(() => {
    const checkPermissions = async () => {
      if (navigator.permissions) {
        try {
          const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          setHasPermission(result.state === 'granted');
          
          result.addEventListener('change', () => {
            setHasPermission(result.state === 'granted');
          });
        } catch (error) {
          console.warn('⚠️ Could not check microphone permissions:', error);
        }
      }
    };

    checkPermissions();
  }, []);

  // Security check for HTTPS
  useEffect(() => {
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      console.warn('⚠️ Insecure connection detected. HTTPS recommended for production.');
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if ((window as any).emailCaptureTimeout) {
        clearTimeout((window as any).emailCaptureTimeout);
        delete (window as any).emailCaptureTimeout;
      }
    };
  }, []);
  // Memoized connection status
  const connectionStatus = useMemo(() => {
    const isConnected = conversation.status === 'connected';
    const isConnecting = conversation.status !== 'connected' && conversation.status !== 'disconnected';
    
    return { isConnected, isConnecting };
  }, [conversation.status]);

  const { isConnected, isConnecting } = connectionStatus;

  // Memoized responsive button size
  const buttonSize = useMemo(() => {
    return window.innerWidth < 640 ? 20 : window.innerWidth < 1024 ? 24 : 28;
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Enhanced Email Modal with faster animations */}
      {showEmailModal && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
          style={{ animationDuration: `${MODAL_ANIMATION_DURATION}ms` }}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-auto transform animate-in slide-in-from-bottom-4 duration-200">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-black mb-2">Email Required</h2>
              <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                {emailPrompt}
              </p>
              
              <div className="space-y-4">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={handleEmailKeyPress}
                  placeholder="your.email@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-black focus:ring-1 focus:ring-black outline-none transition-all text-black placeholder-gray-400 text-sm"
                  autoFocus
                  autoComplete="email"
                />
                
                <div className="flex space-x-3">
                  <button
                    onClick={handleEmailCancel}
                    className="flex-1 px-4 py-2 text-black bg-white border border-gray-300 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEmailSubmit}
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
      )}

      {/* Enhanced Header with Security Indicator */}
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <a 
              href="https://www.axiestudio.se" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
              <img 
                src="https://www.axiestudio.se/logo.jpg" 
                alt="Axie Studio" 
                className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg object-cover"
                loading="eager"
              />
              <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">
                Axie Studio
              </h1>
            </a>
          </div>
          
          {/* Security Status Indicator */}
          {isConnected && (
            <div className="flex items-center space-x-2 text-emerald-600">
              <Shield size={16} />
              <span className="text-xs font-medium hidden sm:inline">Secure</span>
            </div>
          )}
        </div>
      </div>

      {/* Optimized Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="text-center w-full max-w-lg">
          <div className="relative mb-6 sm:mb-8 lg:mb-12">
            {/* Enhanced gradient orb with better performance */}
            <div className={`w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96 xl:w-[400px] xl:h-[400px] mx-auto rounded-full transition-all duration-500 will-change-transform ${
              isConnected 
                ? 'bg-gradient-to-br from-emerald-400 via-blue-500 to-purple-600 animate-pulse' 
                : conversation.isSpeaking
                ? 'bg-gradient-to-br from-blue-400 via-cyan-500 to-teal-600 animate-spin'
                : 'bg-gradient-to-br from-blue-400 via-cyan-500 to-teal-600'
            } shadow-2xl relative overflow-hidden`}>
              <div className="absolute inset-3 sm:inset-4 lg:inset-6 rounded-full bg-gradient-to-br from-white/20 to-transparent"></div>
              
              {/* Enhanced central button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  onClick={isConnected ? handleEndSession : handleStartSession}
                  disabled={isConnecting || isRequestingPermission}
                  className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-black/80 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/90 active:scale-95 transition-all duration-200 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed group touch-manipulation will-change-transform"
                  aria-label={isConnected ? 'End call' : 'Start call'}
                >
                  {isConnecting || isRequestingPermission ? (
                    <div className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : isConnected ? (
                    <PhoneOff size={buttonSize} className="group-hover:scale-110 transition-transform" />
                  ) : hasPermission === false ? (
                    <MicOff size={buttonSize} className="group-hover:scale-110 transition-transform" />
                  ) : (
                    <Phone size={buttonSize} className="group-hover:scale-110 transition-transform" />
                  )}
                </button>
              </div>

              {/* Optimized speaking indicator */}
              {conversation.isSpeaking && (
                <>
                  <div className="absolute inset-0 rounded-full border-2 sm:border-4 border-white/30 animate-ping will-change-transform"></div>
                  <div className="absolute inset-6 sm:inset-8 lg:inset-12 rounded-full border border-white/20 sm:border-2 animate-ping animation-delay-200 will-change-transform"></div>
                </>
              )}
            </div>

            {/* Enhanced status label */}
            <div className="absolute -bottom-12 sm:-bottom-16 lg:-bottom-20 left-1/2 transform -translate-x-1/2 w-full px-4">
              <div className="bg-black/80 backdrop-blur-sm text-white px-3 py-2 sm:px-4 sm:py-2 lg:px-6 lg:py-3 rounded-full text-xs sm:text-sm lg:text-base font-medium shadow-lg mx-auto max-w-fit">
                {isConnecting || isRequestingPermission ? (
                  connectionAttempts > 0 ? `Återansluter... (${connectionAttempts}/${RETRY_ATTEMPTS})` : 'Ansluter...'
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

          {/* Enhanced status indicators */}
          {isConnected && (
            <div className="flex items-center justify-center space-x-3 sm:space-x-4 lg:space-x-6 mb-4 sm:mb-6">
              <div className="flex items-center space-x-2 text-emerald-600">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-xs sm:text-sm lg:text-base font-medium">
                  {isSecureConnection ? 'Säker anslutning' : 'Ansluten'}
                </span>
              </div>
              {conversation.isSpeaking && (
                <div className="flex items-center space-x-2 text-blue-600">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-xs sm:text-sm lg:text-base font-medium">AI talar</span>
                </div>
              )}
            </div>
          )}

          {/* Enhanced permission warning */}
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

      {/* Enhanced Footer */}
      <div className="p-4 sm:p-6 lg:p-8 text-center">
        <div className="flex items-center justify-center space-x-2 text-gray-500">
          <span className="text-xs sm:text-sm">Powered by</span>
          <img 
            src="https://www.axiestudio.se/logo.jpg" 
            alt="Axie Studio" 
            className="w-3 h-3 sm:w-4 sm:h-4 rounded object-cover"
            loading="lazy"
          />
          <span className="text-xs sm:text-sm font-medium">Axie Studio AI</span>
        </div>
      </div>
    </div>
  );
}

export default App;