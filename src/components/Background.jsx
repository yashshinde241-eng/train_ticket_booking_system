export default function Background() {
  return (
    <div className="bg-pattern" aria-hidden="true">
      <div style={{
        position: 'absolute',
        top: '15%',
        left: '5%',
        fontSize: '120px',
        opacity: 0.018,
        color: '#1a3a6b',
        fontFamily: 'sans-serif',
        transform: 'rotate(-10deg)',
        pointerEvents: 'none',
        userSelect: 'none',
      }}>
        
      </div>
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '5%',
        fontSize: '90px',
        opacity: 0.018,
        color: '#1a3a6b',
        fontFamily: 'sans-serif',
        transform: 'rotate(8deg)',
        pointerEvents: 'none',
        userSelect: 'none',
      }}>
        
      </div>
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.3 }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#dde4f0" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  );
}