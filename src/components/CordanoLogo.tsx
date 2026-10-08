import React from 'react';

interface CordanoLogoProps {
  className?: string;
  size?: number | string;
  variant?: 'dark' | 'light' | 'wine';
  showSubtitle?: boolean;
}

export const CordanoLogo: React.FC<CordanoLogoProps> = ({
  className = 'w-10 h-10',
  size,
  variant = 'wine'
}) => {
  const bgFill = variant === 'dark' ? '#0B132B' : variant === 'light' ? '#FFFFFF' : '#0F172A';
  const strokeColor = variant === 'light' ? '#0F172A' : '#FFFFFF';
  const textColor = variant === 'light' ? '#0F172A' : '#FFFFFF';

  return (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      aria-label="Logo CORDANO PMS"
      role="img"
    >
      <rect width="512" height="512" rx="110" fill={bgFill} />
      <rect x="44" y="44" width="424" height="424" rx="90" fill="none" stroke={strokeColor} strokeWidth="26" opacity="0.9" />
      <rect x="100" y="100" width="312" height="312" rx="66" fill="none" stroke={strokeColor} strokeWidth="26" opacity="0.75" />
      <rect x="156" y="156" width="200" height="200" rx="44" fill={bgFill} stroke={strokeColor} strokeWidth="26" />
      <text
        x="256"
        y="294"
        fill={textColor}
        fontFamily="system-ui, -apple-system, 'Manrope', 'Segoe UI', Roboto, sans-serif"
        fontSize="144"
        fontWeight="900"
        textAnchor="middle"
        dominantBaseline="middle"
      >
        C
      </text>
    </svg>
  );
};
