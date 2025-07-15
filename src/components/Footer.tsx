import React from 'react';

const Footer: React.FC = () => {
  return (
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
  );
};

export default Footer;