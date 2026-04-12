import React from 'react';

export const RetroAvatar = ({ id, className = "" }) => {
  const numId = parseInt(id, 10);
  if (isNaN(numId) || numId < 0 || numId > 11) return <span className={className}>{id}</span>;

  const faces = [
    // 0: Neutral
    <g key="0"><path d="M 30,65 L 70,65" stroke="#152000" strokeWidth="6" strokeLinecap="round" fill="none"/><circle cx="35" cy="40" r="5" fill="#152000"/><circle cx="65" cy="40" r="5" fill="#152000"/></g>,
    // 1: Happy closed eyes
    <g key="1"><path d="M 25,42 Q 35,32 45,42 M 55,42 Q 65,32 75,42" stroke="#152000" strokeWidth="5" strokeLinecap="round" fill="none"/><path d="M 35,65 Q 50,75 65,65" stroke="#152000" strokeWidth="6" strokeLinecap="round" fill="none"/></g>,
    // 2: Small Smile
    <g key="2"><path d="M 35,65 Q 50,75 65,65" stroke="#152000" strokeWidth="6" strokeLinecap="round" fill="none"/><circle cx="35" cy="40" r="5" fill="#152000"/><circle cx="65" cy="40" r="5" fill="#152000"/></g>,
    // 3: O-mouth
    <g key="3"><circle cx="50" cy="68" r="9" fill="none" stroke="#152000" strokeWidth="6"/><circle cx="35" cy="40" r="5" fill="#152000"/><circle cx="65" cy="40" r="5" fill="#152000"/></g>,
    // 4: Wink
    <g key="4"><path d="M 25,40 L 45,40" stroke="#152000" strokeWidth="5" strokeLinecap="round" fill="none"/><circle cx="65" cy="40" r="5" fill="#152000"/><path d="M 35,65 Q 50,75 65,65" stroke="#152000" strokeWidth="6" strokeLinecap="round" fill="none"/></g>,
    // 5: Wide Smile
    <g key="5"><path d="M 25,60 Q 50,85 75,60 Q 50,70 25,60 Z" fill="#152000" /><circle cx="35" cy="40" r="5" fill="#152000"/><circle cx="65" cy="40" r="5" fill="#152000"/></g>,
    // 6: Smirk Wink
    <g key="6"><path d="M 25,40 Q 35,35 45,40" stroke="#152000" strokeWidth="5" strokeLinecap="round" fill="none"/><circle cx="65" cy="40" r="5" fill="#152000"/><path d="M 35,65 L 70,55" stroke="#152000" strokeWidth="6" strokeLinecap="round" fill="none"/></g>,
    // 7: Sideways smile
    <g key="7"><path d="M 30,70 L 70,60" stroke="#152000" strokeWidth="6" strokeLinecap="round" fill="none"/><circle cx="35" cy="40" r="5" fill="#152000"/><circle cx="65" cy="40" r="5" fill="#152000"/></g>,
    // 8: Hmm
    <g key="8"><path d="M 30,60 L 70,70" stroke="#152000" strokeWidth="6" strokeLinecap="round" fill="none"/><circle cx="35" cy="40" r="5" fill="#152000"/><circle cx="65" cy="40" r="5" fill="#152000"/></g>,
    // 9: Sad
    <g key="9"><path d="M 35,75 Q 50,60 65,75" stroke="#152000" strokeWidth="6" strokeLinecap="round" fill="none"/><circle cx="35" cy="40" r="5" fill="#152000"/><circle cx="65" cy="40" r="5" fill="#152000"/></g>,
    // 10: Dead
    <g key="10"><path d="M 25,30 L 45,50 M 25,50 L 45,30 M 55,30 L 75,50 M 55,50 L 75,30" stroke="#152000" strokeWidth="5" strokeLinecap="round" fill="none"/><path d="M 30,70 Q 50,60 70,70" stroke="#152000" strokeWidth="6" strokeLinecap="round" fill="none"/></g>,
    // 11: Angry
    <g key="11"><path d="M 20,30 L 40,40 M 80,30 L 60,40" stroke="#152000" strokeWidth="5" strokeLinecap="round" fill="none"/><circle cx="35" cy="45" r="5" fill="#152000"/><circle cx="65" cy="45" r="5" fill="#152000"/><path d="M 35,75 Q 50,60 65,75" stroke="#152000" strokeWidth="6" strokeLinecap="round" fill="none"/></g>
  ];

  return (
    <svg viewBox="0 0 100 100" className={className} style={{ display: 'block', width: '100%', height: '100%', filter: 'drop-shadow(2px 2px 2px rgba(0,0,0,0.4))' }}>
      <defs>
        <radialGradient id={`sphereGrad-${numId}`} cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#fdfc97" />
          <stop offset="25%" stopColor="#c5e81d" />
          <stop offset="70%" stopColor="#4f8000" />
          <stop offset="100%" stopColor="#1e3300" />
        </radialGradient>
        <filter id="pixelize">
          <feGaussianBlur stdDeviation="0.4" result="blur" />
        </filter>
      </defs>
      <circle cx="50" cy="50" r="48" fill={`url(#sphereGrad-${numId})`} filter="url(#pixelize)"/>
      <g filter="url(#pixelize)">
        {faces[numId]}
      </g>
    </svg>
  );
};