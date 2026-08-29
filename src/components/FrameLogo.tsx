import React from 'react';

export const FrameLogo: React.FC<{ size?: number; className?: string }> = ({
  size = 20,
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ verticalAlign: 'middle' }}
    >
      {/* Outer Viewfinder Frame */}
      <rect
        x="2.5"
        y="2.5"
        width="19"
        height="19"
        rx="2"
        stroke="var(--accent)"
        strokeWidth="1.75"
      />
      {/* Inner Cinema Aperture */}
      <rect
        x="6.5"
        y="6.5"
        width="11"
        height="11"
        rx="1"
        stroke="var(--accent)"
        strokeWidth="1.5"
        strokeOpacity="0.85"
      />
      {/* Diagonal Perspective Rays */}
      <line x1="2.5" y1="2.5" x2="6.5" y2="6.5" stroke="var(--accent)" strokeWidth="1.2" />
      <line x1="21.5" y1="2.5" x2="17.5" y2="6.5" stroke="var(--accent)" strokeWidth="1.2" />
      <line x1="2.5" y1="21.5" x2="6.5" y2="17.5" stroke="var(--accent)" strokeWidth="1.2" />
      <line x1="21.5" y1="21.5" x2="17.5" y2="17.5" stroke="var(--accent)" strokeWidth="1.2" />
    </svg>
  );
};
