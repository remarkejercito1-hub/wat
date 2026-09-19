interface RibbonMedalProps {
  rank: number;
  isTied?: boolean;
}

export function RibbonMedal({ rank, isTied }: RibbonMedalProps) {
  // Colors for Gold, Silver, Bronze, and other ranks
  let medalFill = '#eab308'; // Gold
  let medalStroke = '#fef08a';
  let medalTextColor = '#451a03';
  let ribbonLeft = '#2563eb';
  let ribbonRight = '#1d4ed8';

  if (rank === 2) {
    medalFill = '#94a3b8'; // Silver
    medalStroke = '#f1f5f9';
    medalTextColor = '#0f172a';
    ribbonLeft = '#3b82f6';
    ribbonRight = '#2563eb';
  } else if (rank === 3) {
    medalFill = '#b45309'; // Bronze
    medalStroke = '#fde68a';
    medalTextColor = '#451a03';
    ribbonLeft = '#3b82f6';
    ribbonRight = '#1d4ed8';
  } else if (rank > 3) {
    medalFill = '#475569';
    medalStroke = '#94a3b8';
    medalTextColor = '#f8fafc';
    ribbonLeft = '#1e3a8a';
    ribbonRight = '#172554';
  }

  return (
    <div className="relative w-[34px] h-[40px] shrink-0 flex items-center justify-center filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
      <svg width="34" height="40" viewBox="0 0 34 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Left Ribbon Tail */}
        <path
          d="M10 19L5 37L11 33.5L16.5 36.5L14 19H10Z"
          fill={ribbonLeft}
        />
        {/* Right Ribbon Tail */}
        <path
          d="M16 19L18.5 36.5L24 33.5L30 37L25 19H16Z"
          fill={ribbonRight}
        />
        {/* Dark fold shadow */}
        <path d="M12 18L17 21L22 18H12Z" fill="#1e1b4b" opacity="0.4" />

        {/* Circular Medallion */}
        <circle
          cx="17"
          cy="15"
          r="12.5"
          fill={medalFill}
          stroke={medalStroke}
          strokeWidth="1.5"
        />
        {/* Inner subtle rim */}
        <circle
          cx="17"
          cy="15"
          r="9.5"
          fill="none"
          stroke="rgba(255,255,255,0.35)"
          strokeWidth="1"
        />

        {/* Rank or Equal symbol */}
        {isTied ? (
          <text
            x="17"
            y="19"
            fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            fontWeight="900"
            fontSize="10"
            fill={medalTextColor}
            textAnchor="middle"
          >
            ⚖️
          </text>
        ) : (
          <text
            x="17"
            y="19.5"
            fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            fontWeight="900"
            fontSize="13"
            fill={medalTextColor}
            textAnchor="middle"
          >
            {rank}
          </text>
        )}
      </svg>
    </div>
  );
}
