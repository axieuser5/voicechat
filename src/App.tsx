import React, { useState, useCallback, useMemo, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import VoiceInterface from './components/VoiceInterface';
import EmailModal from './components/EmailModal';
import { useVoiceAssistant } from './hooks/useVoiceAssistant';

interface EmailCaptureResult {
  email: string | null;
  success: boolean;
  message: string;
}

function App() {
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [emailPrompt, setEmailPrompt] = useState('');

  const {
    conversation,
    hasPermission,
    isRequestingPermission,
    connectionAttempts,
    isSecureConnection,
    handleStartSession,
    handleEndSession
  } = useVoiceAssistant();

  // Memoized connection status
  const connectionStatus = useMemo(() => {
    const isConnected = conversation.status === 'connected';
    const isConnecting = conversation.status !== 'connected' && conversation.status !== 'disconnected';
    
    return { isConnected, isConnecting };
  }, [conversation.status]);

  const { isConnected, isConnecting } = connectionStatus;

  // Email modal event listener
  useEffect(() => {
    const handleShowEmailModal = (event: CustomEvent) => {
      const { prompt } = event.detail;
      setEmailPrompt(prompt);
      setShowEmailModal(true);
      setEmailInput('');
    };

    window.addEventListener('showEmailModal', handleShowEmailModal as EventListener);
    
    return () => {
      window.removeEventListener('showEmailModal', handleShowEmailModal as EventListener);
    };
  }, []);

  // Email submission handler
  const handleEmailSubmit = useCallback(() => {
    const email = emailInput.trim();
    
    if (!email) {
      console.warn('⚠️ Email is empty');
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.warn('⚠️ Invalid email format:', email);
    }

    console.log('📧 Email being submitted:', email);
    
    if ((window as any).emailCaptureResolve) {
      console.log('✅ Resolving email capture with:', email);
      (window as any).emailCaptureResolve({
        email: email,
        success: true,
        message: `Email ${email} captured successfully.`
      });
      delete (window as any).emailCaptureResolve;
    } else {
      console.error('❌ No emailCaptureResolve function found');
    }
    
    setShowEmailModal(false);
    setEmailInput('');
    console.log('📧 Email modal closed, input cleared');
  }, [emailInput]);

  // Email cancellation handler
  const handleEmailCancel = useCallback(() => {
    console.log('❌ Email capture cancelled');
    
    if ((window as any).emailCaptureResolve) {
      (window as any).emailCaptureResolve({
        email: null,
        success: false,
        message: 'Email capture cancelled by user.'
      });
      delete (window as any).emailCaptureResolve;
    }
    
    setShowEmailModal(false);
    setEmailInput('');
  }, []);

  // Keyboard handling
  const handleEmailKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleEmailSubmit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleEmailCancel();
    }
  }, [handleEmailSubmit, handleEmailCancel]);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <EmailModal
        isOpen={showEmailModal}
        emailInput={emailInput}
        emailPrompt={emailPrompt}
        onEmailChange={setEmailInput}
        onSubmit={handleEmailSubmit}
        onCancel={handleEmailCancel}
        onKeyPress={handleEmailKeyPress}
      />

      <Header isConnected={isConnected} />

      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <VoiceInterface
          isConnected={isConnected}
          isConnecting={isConnecting}
          isRequestingPermission={isRequestingPermission}
          isSpeaking={conversation.isSpeaking}
          hasPermission={hasPermission}
          connectionAttempts={connectionAttempts}
          isSecureConnection={isSecureConnection}
          onStartSession={handleStartSession}
          onEndSession={handleEndSession}
        />
      </div>

      <Footer />
    </div>
  );
}

export default App;