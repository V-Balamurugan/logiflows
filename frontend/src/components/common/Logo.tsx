import React from 'react';
import { Link } from 'react-router-dom';

export interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  asLink?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', asLink = true }) => {
  const sizeMap = {
    sm: { icon: 24, text: 'text-base' },
    md: { icon: 28, text: 'text-lg' },
    lg: { icon: 34, text: 'text-xl' },
  };

  const content = (
    <div className="flex items-center gap-2.5 select-none font-bold tracking-tight">
      <div className="relative flex items-center justify-center p-1.5 rounded-lg bg-gradient-to-br from-blue-600 via-blue-700 to-teal-500 shadow-sm shadow-blue-500/20 text-white">
        <svg
          width={sizeMap[size].icon}
          height={sizeMap[size].icon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.29 7 12 12 20.71 7" />
          <line x1="12" y1="22" x2="12" y2="12" />
        </svg>
      </div>
      <div className="flex items-center">
        <span className={`${sizeMap[size].text} font-extrabold text-white`}>Logi</span>
        <span className={`${sizeMap[size].text} font-light text-teal-400`}>Flows</span>
      </div>
    </div>
  );

  if (asLink) {
    return (
      <Link to="/" className="inline-flex items-center hover:opacity-90 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
};

export default Logo;
