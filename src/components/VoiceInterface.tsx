import React, { useMemo } from 'react';
import { Phone, PhoneOff, MicOff, Shield } from 'lucide-react';

interface VoiceInterfaceProps {
  isConnected: boolean;
  isConnecting: boolean;
  isRequestingPermission: boolean;
  isSpeaking: boolean;
  hasPermission: boolean | null;
  connectionAttempts: number;
  isSecureConnection: boolean;
  onStartSession: () => void;
  onEndSession: () => void;
}

const VoiceInterface: React.FC<VoiceInterfaceProps> = ({
  isConnected,
  isConnecting,
  isRequestingPermission,
  isSpeaking,
  hasPermission,
  connectionAttempts,
  isSecureConnection,
  onStartSession,
  onEndSession
}) => {
  // Memoized responsive button size
  const buttonSize = useMemo(() => {
    return window.innerWidth < 640 ? 20 : window.innerWidth < 1024 ? 24 : 28;
  }, []);

  const getStatusText = () => {
    if (isConnecting || isRequestingPermission) {
      return connectionAttempts > 0 ? `Återansluter... (${connectionAttempts}/3)` : 'Ansluter...';
    }
    if (isConnected) return 'Avsluta samtal';
    if (hasPermission === false) return 'Aktivera mikrofon';
    return 'Ring AI-agent';
  };

  return (
    <div className="text-center w-full max-w-lg">
      <div className="relative mb-6 sm:mb-8 lg:mb-12">
        {/* Enhanced gradient orb */}
        <div className={`w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96 xl:w-[400px] xl:h-[400px] mx-auto rounded-full transition-all duration-500 will-change-transform ${
          isConnected 
            ? 'bg-gradient-to-br from-emerald-400 via-blue-500 to-purple-600 animate-pulse' 
            : isSpeaking
            ? 'bg-gradient-to-br from-blue-400 via-cyan-500 to-teal-600 animate-spin'
            : 'bg-gradient-to-br from-blue-400 via-cyan-500 to-teal-600'
        } shadow-2xl relative overflow-hidden`}>
          <div className="absolute inset-3 sm:inset-4 lg:inset-6 rounded-full bg-gradient-to-br from-white/20 to-transparent"></div>
          
          {/* Central button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={isConnected ? onEndSession : onStartSession}
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

          {/* Speaking indicator */}
          {isSpeaking && (
            <>
              <div className="absolute inset-0 rounded-full border-2 sm:border-4 border-white/30 animate-ping will-change-transform"></div>
              <div className="absolute inset-6 sm:inset-8 lg:inset-12 rounded-full border border-white/20 sm:border-2 animate-ping animation-delay-200 will-change-transform"></div>
            </>
          )}
        </div>

        {/* Status label */}
        <div className="absolute -bottom-12 sm:-bottom-16 lg:-bottom-20 left-1/2 transform -translate-x-1/2 w-full px-4">
          <div className="bg-black/80 backdrop-blur-sm text-white px-3 py-2 sm:px-4 sm:py-2 lg:px-6 lg:py-3 rounded-full text-xs sm:text-sm lg:text-base font-medium shadow-lg mx-auto max-w-fit">
            {getStatusText()}
          </div>
        </div>
      </div>

      {/* Status indicators */}
      {isConnected && (
        <div className="flex items-center justify-center space-x-3 sm:space-x-4 lg:space-x-6 mb-4 sm:mb-6">
          <div className="flex items-center space-x-2 text-emerald-600">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-xs sm:text-sm lg:text-base font-medium">
              {isSecureConnection ? 'Säker anslutning' : 'Ansluten'}
            </span>
          </div>
          {isSpeaking && (
            <div className="flex items-center space-x-2 text-blue-600">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-xs sm:text-sm lg:text-base font-medium">AI talar</span>
            </div>
          )}
        </div>
      )}

      {/* Permission warning */}
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
  );
};

export default VoiceInterface;