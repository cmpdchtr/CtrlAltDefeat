import React from 'react';

export const RetroAvatar = ({ id, className = "" }) => {
  const numId = parseInt(id, 10);
  if (isNaN(numId) || numId < 0 || numId > 11) return <span className={className}>{id}</span>;

  // We duplicate the face strokes slightly shifted down-right with a bright distinct green/yellow to simulate the embossed 3D lighting of the 90s.
  const renderFace = (content) => (
    <>
      <g stroke="#e2f542" fill="#e2f542" transform="translate(1.5, 1.5)">
        {content}
      </g>
      <g stroke="#152000" fill="#152000">
        {content}
      </g>
    </>
  );

  const strokes = { strokeWidth: "5.5", strokeLinecap: "round", strokeLinejoin: "round", fill: "none" };

  const faces = [
    // 0: Neutral
    <g key="0">{renderFace(<><path d="M 28,68 L 72,68" {...strokes}/><ellipse cx="33" cy="42" rx="4" ry="7"/><ellipse cx="67" cy="42" rx="4" ry="7"/></>)}</g>,
    // 1: Happy closed eyes
    <g key="1">{renderFace(<><path d="M 22,46 Q 33,30 44,46 M 56,46 Q 67,30 78,46" {...strokes}/><path d="M 33,65 Q 50,78 67,65" {...strokes}/></>)}</g>,
    // 2: Small Smile
    <g key="2">{renderFace(<><path d="M 33,65 Q 50,78 67,65" {...strokes}/><ellipse cx="33" cy="42" rx="4" ry="7"/><ellipse cx="67" cy="42" rx="4" ry="7"/></>)}</g>,
    // 3: O-mouth
    <g key="3">{renderFace(<><ellipse cx="50" cy="70" rx="10" ry="12" {...strokes}/><ellipse cx="33" cy="42" rx="4" ry="7"/><ellipse cx="67" cy="42" rx="4" ry="7"/></>)}</g>,
    // 4: Wink
    <g key="4">{renderFace(<><path d="M 22,42 L 44,42" {...strokes}/><ellipse cx="67" cy="42" rx="4" ry="7"/><path d="M 33,65 Q 50,78 67,65" {...strokes}/></>)}</g>,
    // 5: Wide Smile (colored inside later)
    <g key="5">
      {/* Dark outline + colored inside for open mouth */}
      <g transform="translate(1.5, 1.5)"><path d="M 25,60 Q 50,90 75,60 Q 50,68 25,60 Z" fill="#e2f542"/></g>
      <path d="M 25,60 Q 50,90 75,60 Q 50,68 25,60 Z" fill="#152000" stroke="#152000" strokeWidth="2" strokeLinejoin="round" />
      {renderFace(<><ellipse cx="33" cy="42" rx="4" ry="7"/><ellipse cx="67" cy="42" rx="4" ry="7"/></>)}
    </g>,
    // 6: Smirk Wink
    <g key="6">{renderFace(<><path d="M 22,42 Q 33,35 44,42" {...strokes}/><ellipse cx="67" cy="42" rx="4" ry="7"/><path d="M 33,68 L 74,55" {...strokes}/></>)}</g>,
    // 7: Sideways smile
    <g key="7">{renderFace(<><path d="M 28,72 Q 50,65 72,58" {...strokes}/><ellipse cx="33" cy="42" rx="4" ry="7"/><ellipse cx="67" cy="42" rx="4" ry="7"/></>)}</g>,
    // 8: Hmm
    <g key="8">{renderFace(<><path d="M 28,60 Q 50,65 72,72" {...strokes}/><ellipse cx="33" cy="42" rx="4" ry="7"/><ellipse cx="67" cy="42" rx="4" ry="7"/></>)}</g>,
    // 9: Sad
    <g key="9">{renderFace(<><path d="M 30,78 Q 50,60 70,78" {...strokes}/><ellipse cx="33" cy="42" rx="4" ry="7"/><ellipse cx="67" cy="42" rx="4" ry="7"/></>)}</g>,
    // 10: Dead
    <g key="10">{renderFace(<><path d="M 24,32 L 42,50 M 24,50 L 42,32 M 58,32 L 76,50 M 58,50 L 76,32" {...strokes}/><path d="M 28,75 Q 50,60 72,75" {...strokes}/></>)}</g>,
    // 11: Angry
    <g key="11">{renderFace(<><path d="M 20,30 L 42,42 M 80,30 L 58,42" {...strokes}/><ellipse cx="33" cy="48" rx="4" ry="7"/><ellipse cx="67" cy="48" rx="4" ry="7"/><path d="M 30,75 Q 50,55 70,75" {...strokes}/></>)}</g>
  ];

  return (
    <svg viewBox="-10 -10 120 120" className={className} style={{ display: 'block', width: '100%', height: '100%', overflow: 'visible' }}>
      <defs>
        {/* The classic 90s pre-rendered 3D sphere gradient. Yellow top left, dark green/black bottom right */}
        <radialGradient id={`sphereGrad-${numId}`} cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#fffb99" />
          <stop offset="15%" stopColor="#dffd21" />
          <stop offset="50%" stopColor="#81ad00" />
          <stop offset="85%" stopColor="#2c4500" />
          <stop offset="100%" stopColor="#0a1200" />
        </radialGradient>
        
        {/* A sharp white specular highlight to simulate 3D glossy plastic */}
        <radialGradient id={`specular-${numId}`} cx="20%" cy="20%" r="35%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
          <stop offset="25%" stopColor="#ffffff" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>

        {/* Pixelation effect to mimic aliased 32x32 icons */}
        <filter id="pixelize" x="-20%" y="-20%" width="140%" height="140%">
          <feComponentTransfer>
            <feFuncR type="discrete" tableValues="0 0.1 0.2 0.3 0.4 0.5 0.6 0.7 0.8 0.9 1" />
            <feFuncG type="discrete" tableValues="0 0.1 0.2 0.3 0.4 0.5 0.6 0.7 0.8 0.9 1" />
            <feFuncB type="discrete" tableValues="0 0.1 0.2 0.3 0.4 0.5 0.6 0.7 0.8 0.9 1" />
          </feComponentTransfer>
        </filter>
        
        {/* Harsh drop shadow to give it that extracted-icon feel */}
        <filter id="drop-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="3" dy="3" stdDeviation="0" floodColor="#000" floodOpacity="0.4" />
        </filter>
      </defs>
      
      <g filter="url(#drop-shadow)">
        {/* Base 3D Sphere */}
        <circle cx="50" cy="50" r="46" fill={`url(#sphereGrad-${numId})`} stroke="#142100" strokeWidth="1" filter="url(#pixelize)" />
        {/* Plastic Specular Highlight */}
        <circle cx="50" cy="50" r="46" fill={`url(#specular-${numId})`} />
        
        {/* Facial Features */}
        <g filter="url(#pixelize)">
          {faces[numId]}
        </g>
      </g>
    </svg>
  );
};