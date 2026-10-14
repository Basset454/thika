import React from 'react';

interface LogoMarkProps {
  className?: string;
  size?: number;
}

export const LogoMark: React.FC<LogoMarkProps> = ({ className = "w-10 h-10", size }) => {
  return (
    <div 
      className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden bg-white rounded-xl ${className}`} 
      style={size ? { width: size, height: size } : undefined}
    >
      <img
        src="https://js5vhhxkv7b7mmcq.public.blob.vercel-storage.com/454620827_501342975777167_8758272364689496478_n%20%281%29.jpg"
        alt="شعار أثاث الثقة"
        className="w-full h-full object-contain"
        onError={(e) => {
          // Fallback if image not found
          (e.currentTarget as HTMLElement).style.display = 'none';
        }}
      />
    </div>
  );
};
