import React from 'react';
import { Shield } from 'lucide-react';

interface HeaderProps {
  isConnected: boolean;
}

const Header: React.FC<HeaderProps> = ({ isConnected }) => {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <img 
            src="https://images.pexels.com/photos/1181244/pexels-photo-1181244.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&fit=crop&crop=center" 
            alt="Axie Studio" 
            className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg object-cover shadow-sm"
            loading="eager"
          />
          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">
            Axie Studio
          </h1>
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
  );
};

export default Header;