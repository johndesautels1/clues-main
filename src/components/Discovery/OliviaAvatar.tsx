/**
 * OliviaAvatar — SVG avatar with speaking animation
 */

export function OliviaAvatar({ isSpeaking, size = 64 }: { isSpeaking: boolean; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', position: 'relative', flexShrink: 0 }}>
      {isSpeaking && (
        <>
          <div
            aria-hidden="true"
            style={{
              position: 'absolute', inset: -10, borderRadius: '50%',
              border: '1.5px solid rgba(196,168,122,0.25)',
              animation: 'discovery-oliviaRingOut 1.4s ease-in-out infinite',
            }}
          />
          <div
            aria-hidden="true"
            style={{
              position: 'absolute', inset: -5, borderRadius: '50%',
              border: '1px solid rgba(196,168,122,0.45)',
              animation: 'discovery-oliviaRingOut 1.4s ease-in-out 0.3s infinite',
            }}
          />
        </>
      )}
      <div
        style={{
          position: 'absolute', inset: -2, borderRadius: '50%',
          background: 'conic-gradient(from 0deg,#C4A87A,#B49E80,#C8AE80,#C4A87A)',
          opacity: isSpeaking ? 1 : 0.45,
          transition: 'opacity 0.4s ease',
        }}
      />
      <div
        style={{
          position: 'absolute', inset: 2, borderRadius: '50%',
          background: 'linear-gradient(145deg,#1e1a28 0%,#2a2235 50%,#1a1820 100%)',
          overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <svg width={size * 0.75} height={size * 0.75} viewBox="0 0 60 60" fill="none" aria-hidden="true">
          <defs>
            <radialGradient id="skinGrad" cx="50%" cy="40%">
              <stop offset="0%" stopColor="#e8c99a" />
              <stop offset="100%" stopColor="#c9a57a" />
            </radialGradient>
            <radialGradient id="hairGrad" cx="50%" cy="0%">
              <stop offset="0%" stopColor="#6b4a2e" />
              <stop offset="100%" stopColor="#3d2a18" />
            </radialGradient>
          </defs>
          <ellipse cx="30" cy="18" rx="14" ry="11" fill="url(#hairGrad)" />
          <path d="M16 22 Q14 35 16 44 Q20 48 25 50" stroke="#3d2a18" strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M44 22 Q46 35 44 44 Q40 48 35 50" stroke="#3d2a18" strokeWidth="6" fill="none" strokeLinecap="round" />
          <ellipse cx="30" cy="31" rx="12" ry="14" fill="url(#skinGrad)" />
          <ellipse cx="25" cy="27" rx="2" ry="2.2" fill="#2d1f0e" />
          <ellipse cx="35" cy="27" rx="2" ry="2.2" fill="#2d1f0e" />
          <circle cx="25.7" cy="26.4" r="0.7" fill="rgba(255,255,255,0.7)" />
          <circle cx="35.7" cy="26.4" r="0.7" fill="rgba(255,255,255,0.7)" />
          <path d="M22 24 Q25 22.5 28 24" stroke="#7a5535" strokeWidth="1" fill="none" strokeLinecap="round" />
          <path d="M32 24 Q35 22.5 38 24" stroke="#7a5535" strokeWidth="1" fill="none" strokeLinecap="round" />
          {isSpeaking ? (
            <ellipse cx="30" cy="36" rx="3.5" ry="2" fill="#8a5030" opacity="0.8" />
          ) : (
            <path d="M26 35.5 Q30 38.5 34 35.5" stroke="#b07050" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          )}
          <circle cx="30" cy="47" r="1.2" fill="#C4A87A" opacity="0.8" />
        </svg>
        {isSpeaking && (
          <div
            aria-hidden="true"
            style={{
              position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)',
              display: 'flex', gap: 2, alignItems: 'flex-end',
            }}
          >
            {[3, 5, 4, 6, 3, 5, 4].map((h, i) => (
              <div
                key={i}
                style={{
                  width: 2.5, height: h,
                  background: 'rgba(196,168,122,0.85)',
                  borderRadius: 2,
                  animation: `discovery-soundBar 0.5s ease-in-out ${i * 0.08}s infinite alternate`,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
