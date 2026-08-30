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
      style={{ verticalAlign: 'middle', flexShrink: 0 }}
    >
      {/* Viewfinder Outer Corner Brackets */}
      <path d="M4 8V4H8" stroke="var(--ink)" strokeWidth="1.5" strokeLinecap="square" />
      <path d="M20 8V4H16" stroke="var(--ink)" strokeWidth="1.5" strokeLinecap="square" />
      <path d="M4 16V20H8" stroke="var(--ink)" strokeWidth="1.5" strokeLinecap="square" />
      <path d="M20 16V20H16" stroke="var(--ink)" strokeWidth="1.5" strokeLinecap="square" />

      {/* Frame Tick Marks */}
      <line x1="12" y1="3" x2="12" y2="5" stroke="var(--ink)" strokeWidth="1" strokeOpacity="0.7" />
      <line x1="12" y1="19" x2="12" y2="21" stroke="var(--ink)" strokeWidth="1" strokeOpacity="0.7" />
      <line x1="3" y1="12" x2="5" y2="12" stroke="var(--ink)" strokeWidth="1" strokeOpacity="0.7" />
      <line x1="19" y1="12" x2="21" y2="12" stroke="var(--ink)" strokeWidth="1" strokeOpacity="0.7" />

      {/* Center Radiant Nothing Red Recording Dot */}
      <circle cx="12" cy="12" r="3.2" fill="var(--accent)" />
    </svg>
  );
};
