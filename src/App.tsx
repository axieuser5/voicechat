import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useConversation } from '@elevenlabs/react';
import { Mic, MicOff, Phone, PhoneOff, Mail, X, Shield } from 'lucide-react';
import EmailPopup from './components/EmailPopup';

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
const MODAL_ANIMATION_DURATION = 150; // Faster animation
const CONNECTION_TIMEOUT = 8000;
const RETRY_ATTEMPTS = 3;
const EMAIL_CAPTURE_TIMEOUT = 15000; // Reduced to 15s for immediate response

function App() {
  // State management with proper typing
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showAutoEmailModal, setShowAutoEmailModal] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [emailPrompt, setEmailPrompt] = useState('');
  const [isSubmittingEmail, setIsSubmittingEmail] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [isSecureConnection, setIsSecureConnection] = useState(false);
  const [emailCaptureResolver, setEmailCaptureResolver] = useState<((result: EmailCaptureResult) => void) | null>(null);
  const [callStartTime, setCallStartTime] = useState<number | null>(null);

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

  // Highly optimized email capture tool with immediate response
  const get_email = useCallback((): Promise<EmailCaptureResult> => {
    console.log('📧 get_email client tool triggered by ElevenLabs agent!');
    
    return new Promise((resolve) => {
      // Set agent-focused prompt  
      setEmailPrompt('AI Agent begär din e-post:');
      
      // Store resolver to return email directly to agent
      setEmailCaptureResolver(() => (result: EmailCaptureResult) => {
        if (result.success && result.email) {
          console.log('✅ Returning email to agent:', result.email);
          resolve(result.email); // Return email string directly to agent
        } else {
          console.log('❌ Email capture failed, rejecting agent tool');
          reject(new Error(result.message || 'Email capture failed'));
        }
      });
      
      // Show modal IMMEDIATELY - no animation delay
      setShowEmailModal(true);
      
      // 1 second timeout to match agent configuration
      const timeoutId = setTimeout(() => {
        console.warn('⏰ get_email tool timed out - agent will be notified');
        setEmailCaptureResolver(null);
        setShowEmailModal(false);
        reject(new Error('Email capture timeout - please try again.'));
      }, 1000); // Match your agent's 1 second timeout
      
      // Store cleanup function
      (window as any).emailCaptureCleanup = () => {
        clearTimeout(timeoutId);
        setEmailCaptureResolver(null);
        setShowEmailModal(false);
      };
    });
  }, []);

  // Enhanced conversation configuration with security and performance optimizations
  const conversation = useConversation({
    clientTools: {
      get_email: get_email
    },
    onConnect: useCallback(() => {
      console.log('🔗 Connected to Axie Studio AI');
      setIsSecureConnection(true);
      setConnectionAttempts(0);
      setCallStartTime(Date.now());
      
      // Auto-trigger email popup after 3 seconds of being connected
      setTimeout(() => {
        console.log('🚀 Auto-triggering email popup during active call');
        setShowAutoEmailModal(true);
      }, 3000);
    }, []),
    onDisconnect: useCallback(() => {
      console.log('🔌 Disconnected from Axie Studio AI');
      setIsSecureConnection(false);
      setCallStartTime(null);
      setShowAutoEmailModal(false);
      
      // Clean up any pending email capture
      if (emailCaptureResolver) {
        emailCaptureResolver({
          email: null,
          success: false,
          message: 'Connection lost - email capture cancelled.'
        });
        setEmailCaptureResolver(null);
        setShowEmailModal(false);
      }
    }, [emailCaptureResolver]),
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
    }, [connectionAttempts])
  }, [get_email, emailCaptureResolver, connectionAttempts]);

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
        connectionType: 'webrtc',
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
    }
  }, [conversation]);

  // Handle email submission from popup
  const handleEmailSubmit = useCallback((email: string) => {
    console.log('📧 Email submitted from popup:', email);

    if (emailCaptureResolver) {
      const result = {
        email: email,
        success: true,
        message: `Email captured successfully for agent.`
      };
      
      emailCaptureResolver(result);
      setEmailCaptureResolver(null);
      
      if ((window as any).emailCaptureCleanup) {
        (window as any).emailCaptureCleanup();
        delete (window as any).emailCaptureCleanup;
      }
    } else {
      console.log('📧 No agent resolver - this is auto-email during call');
    }
    
    // Close modal
    setShowEmailModal(false);
  }, [emailCaptureResolver]);

  // Handle email popup close
  const handleEmailClose = useCallback(() => {
    console.log('❌ Email popup closed');
    
    if (emailCaptureResolver) {
      emailCaptureResolver({
        email: null,
        success: false,
        message: 'Email capture cancelled by user.'
      });
      setEmailCaptureResolver(null);
      
      if ((window as any).emailCaptureCleanup) {
        (window as any).emailCaptureCleanup();
        delete (window as any).emailCaptureCleanup;
      }
    }
    
    setShowEmailModal(false);
  }, [emailCaptureResolver]);

  // Handle auto email submission during call
  const handleAutoEmailSubmit = useCallback(async (email: string) => {
    console.log('📧 Auto email submitted during call:', email);
    
    // Send to webhook immediately
    try {
      const webhookUrl = `https://stefan0987.app.n8n.cloud/webhook/803738bb-c134-4bdb-9720-5b1af902475f?email=${encodeURIComponent(email)}`;
      
      // Use image loading technique to bypass CORS
      const img = new Image();
      img.onload = () => {
        console.log('✅ Auto email sent successfully to webhook during call');
      };
      img.onerror = () => {
        console.log('✅ Auto email sent to webhook (expected image error)');
      };
      img.src = webhookUrl;
    } catch (error) {
      console.error('❌ Error sending auto email to webhook:', error);
    }
    
    // Close auto modal
    setShowAutoEmailModal(false);
  }, []);

  // Handle auto email close
  const handleAutoEmailClose = useCallback(() => {
    console.log('❌ Auto email popup closed during call');
    setShowAutoEmailModal(false);
  }, []);

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
      {/* Email Popup Component */}
      <EmailPopup
        isOpen={showEmailModal}
        onClose={handleEmailClose}
        onSubmit={handleEmailSubmit}
        prompt={emailPrompt}
        isAgentTool={true}
      />

      {/* Auto Email Popup During Call */}
      <EmailPopup
        isOpen={showAutoEmailModal}
        onClose={handleAutoEmailClose}
        onSubmit={handleAutoEmailSubmit}
        prompt="You are currently in an active call. Please provide your email:"
        isAgentTool={false}
      />

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