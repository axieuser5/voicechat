import { useState, useEffect, useCallback, useMemo } from 'react';
import { useConversation } from '@elevenlabs/react';

interface EmailCaptureParams {
  prompt?: string;
}

interface EmailCaptureResult {
  email: string | null;
  success: boolean;
  message: string;
}

export const useVoiceAssistant = () => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [isSecureConnection, setIsSecureConnection] = useState(false);

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

  // Email capture resolver
  const emailCaptureResolver = useCallback((parameters: EmailCaptureParams): Promise<EmailCaptureResult> => {
    console.log('📧 Email capture tool triggered:', parameters);
    
    return new Promise((resolve) => {
      const prompt = parameters?.prompt || 'Please enter your email address:';
      
      // Store resolver with timeout for security
      const timeoutId = setTimeout(() => {
        resolve({
          email: null,
          success: false,
          message: 'Email capture timed out after 60 seconds.'
        });
      }, 60000);

      (window as any).emailCaptureResolve = (result: EmailCaptureResult) => {
        clearTimeout(timeoutId);
        resolve(result);
      };

      // Trigger email modal
      const event = new CustomEvent('showEmailModal', { detail: { prompt } });
      window.dispatchEvent(event);
    });
  }, []);

  // Enhanced conversation configuration
  const conversation = useConversation({
    clientTools: {
      capture_Email: emailCaptureResolver
    },
    onConnect: useCallback(() => {
      console.log('🔗 Connected to Axie Studio AI');
      setIsSecureConnection(true);
      setConnectionAttempts(0);
    }, []),
    onDisconnect: useCallback(() => {
      console.log('🔌 Disconnected from Axie Studio AI');
      setIsSecureConnection(false);
    }, []),
    onMessage: useCallback((message) => {
      console.log('💬 Message received:', message);
    }, []),
    onError: useCallback((error) => {
      console.error('❌ Connection error:', error);
      setIsSecureConnection(false);
      
      // Auto-retry logic
      if (connectionAttempts < 3) {
        setTimeout(() => {
          setConnectionAttempts(prev => prev + 1);
          console.log(`🔄 Retrying connection (${connectionAttempts + 1}/3)`);
        }, 2000);
      }
    }, [connectionAttempts]),
  });

  // Microphone permission request
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

  // Session management
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

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout')), 10000);
      });

      await Promise.race([sessionPromise, timeoutPromise]);
      console.log('✅ Session started successfully');
      
    } catch (error) {
      console.error('❌ Failed to start session:', error);
      
      if (connectionAttempts < 3) {
        setConnectionAttempts(prev => prev + 1);
        setTimeout(() => handleStartSession(), 1000);
      }
    }
  }, [agentId, hasPermission, requestMicrophonePermission, conversation, connectionAttempts]);

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

  // Check initial permissions
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

  // Security check
  useEffect(() => {
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      console.warn('⚠️ Insecure connection detected. HTTPS recommended for production.');
    }
  }, []);

  return {
    conversation,
    hasPermission,
    isRequestingPermission,
    connectionAttempts,
    isSecureConnection,
    handleStartSession,
    handleEndSession
  };
};