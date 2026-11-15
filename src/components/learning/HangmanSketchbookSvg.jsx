// src/components/learning/HangmanSketchbookSvg.jsx
// Animated 10-stage Hangman vector illustration inside pastel crayon hills & drifting clouds

export default function HangmanSketchbookSvg({
  wrongCount = 0,
  status = 'playing',
  className = 'w-full h-48 sm:h-56 lg:h-64',
}) {
  const isLost = status === 'lost' || wrongCount >= 10;
  const isWon = status === 'won';

  return (
    <svg
      viewBox="0 0 240 165"
      className={className}
      role="img"
      aria-label={`Hình vẽ Hangman: sai ${wrongCount} trên 10 lượt`}
    >
      {/* Pastel Warm Hills Backdrop (matching reference screenshots) */}
      <path d="M22,146 C22,38 78,38 78,146 Z" fill="#FBF0D6" />
      <path d="M52,146 C52,88 94,88 94,146 Z" fill="#F6E2BC" opacity="0.8" />
      <path d="M132,146 C132,52 198,52 198,146 Z" fill="#FBF0D6" />
      <path d="M162,146 C162,82 214,82 214,146 Z" fill="#F6E2BC" opacity="0.85" />

      {/* Two Fluffy White Clouds with gentle drift */}
      <g fill="#FFFFFF">
        <path
          className="hangman-cloud-a"
          d="M100,26 a7,7 0 0,1 13,-2 a8,8 0 0,1 14,2 a6,6 0 0,1 -2,11 h-23 a6,6 0 0,1 -2,-11 z"
        />
        <path
          className="hangman-cloud-b"
          d="M116,44 a6,6 0 0,1 11,-2 a7,7 0 0,1 12,2 a5,5 0 0,1 -1,9 h-20 a5,5 0 0,1 -2,-9 z"
        />
      </g>

      {/* Faint baseline guide when still at 0 misses */}
      {wrongCount === 0 && (
        <line
          x1="34"
          y1="146"
          x2="206"
          y2="146"
          stroke="#E7DAC3"
          strokeWidth="4"
          strokeDasharray="6 6"
          strokeLinecap="round"
        />
      )}

      {/* Stage 1: Orange Horizontal Ground Beam */}
      {wrongCount >= 1 && (
        <g>
          <line
            x1="34"
            y1="146"
            x2="206"
            y2="146"
            pathLength="100"
            className="hangman-stroke"
            stroke="#F47B2A"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <line
            x1="34"
            y1="146"
            x2="72"
            y2="146"
            pathLength="100"
            className="hangman-stroke-fast"
            style={{ animationDelay: '90ms' }}
            stroke="#DD6014"
            strokeWidth="7"
            strokeLinecap="round"
          />
        </g>
      )}

      {/* Stage 2: Red Vertical Pole */}
      {wrongCount >= 2 && (
        <line
          x1="70"
          y1="144"
          x2="70"
          y2="28"
          pathLength="100"
          className="hangman-stroke"
          stroke="#C81E2B"
          strokeWidth="7"
          strokeLinecap="round"
        />
      )}

      {/* Stage 3: Orange Top Horizontal Beam */}
      {wrongCount >= 3 && (
        <line
          x1="68"
          y1="28"
          x2="152"
          y2="28"
          pathLength="100"
          className="hangman-stroke"
          stroke="#F47B2A"
          strokeWidth="7"
          strokeLinecap="round"
        />
      )}

      {/* Stage 4: Red Diagonal Support Brace */}
      {wrongCount >= 4 && (
        <line
          x1="72"
          y1="62"
          x2="106"
          y2="29"
          pathLength="100"
          className="hangman-stroke"
          stroke="#DC2626"
          strokeWidth="6"
          strokeLinecap="round"
        />
      )}

      {/* Hanging Rope + Character Group (sways softly on loss) */}
      <g className={isLost ? 'hangman-pendulum-sway' : ''}>
        {/* Stage 5: Brown Vertical Rope */}
        {wrongCount >= 5 && (
          <line
            x1="136"
            y1="29"
            x2="136"
            y2="49"
            pathLength="100"
            className="hangman-stroke"
            stroke="#5C341E"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
        )}

        {/* Stage 6: Head Circle */}
        {wrongCount >= 6 && (
          <circle
            cx="136"
            cy="61"
            r="12"
            pathLength="100"
            className="hangman-stroke-head"
            fill="#FFFDF4"
            stroke="#2B2523"
            strokeWidth="4"
          />
        )}

        {/* Stage 7: Vertical Body / Torso */}
        {wrongCount >= 7 && (
          <line
            x1="136"
            y1="73"
            x2="136"
            y2="104"
            pathLength="100"
            className="hangman-stroke"
            stroke="#2B2523"
            strokeWidth="4"
            strokeLinecap="round"
          />
        )}

        {/* Stage 8: Right Arm */}
        {wrongCount >= 8 && (
          <line
            x1="136"
            y1="84"
            x2="152"
            y2="75"
            pathLength="100"
            className="hangman-stroke-fast"
            stroke="#2B2523"
            strokeWidth="4"
            strokeLinecap="round"
          />
        )}

        {/* Stage 9: Left Arm */}
        {wrongCount >= 9 && (
          <line
            x1="136"
            y1="84"
            x2="120"
            y2="75"
            pathLength="100"
            className="hangman-stroke-fast"
            stroke="#2B2523"
            strokeWidth="4"
            strokeLinecap="round"
          />
        )}

        {/* Stage 10 (Game Over): Sequential Legs + x_x Face */}
        {isLost && (
          <g stroke="#2B2523" strokeLinecap="round">
            <line
              x1="136"
              y1="104"
              x2="124"
              y2="125"
              pathLength="100"
              className="hangman-stroke-fast"
              strokeWidth="4"
            />
            <line
              x1="136"
              y1="104"
              x2="148"
              y2="125"
              pathLength="100"
              className="hangman-stroke-fast"
              style={{ animationDelay: '90ms' }}
              strokeWidth="4"
            />
            {/* Left X eye */}
            <line
              x1="130"
              y1="56.5"
              x2="133.5"
              y2="60"
              pathLength="100"
              className="hangman-stroke-fast"
              style={{ animationDelay: '160ms' }}
              strokeWidth="2.2"
            />
            <line
              x1="133.5"
              y1="56.5"
              x2="130"
              y2="60"
              pathLength="100"
              className="hangman-stroke-fast"
              style={{ animationDelay: '200ms' }}
              strokeWidth="2.2"
            />
            {/* Right X eye */}
            <line
              x1="138.5"
              y1="56.5"
              x2="142"
              y2="60"
              pathLength="100"
              className="hangman-stroke-fast"
              style={{ animationDelay: '240ms' }}
              strokeWidth="2.2"
            />
            <line
              x1="142"
              y1="56.5"
              x2="138.5"
              y2="60"
              pathLength="100"
              className="hangman-stroke-fast"
              style={{ animationDelay: '280ms' }}
              strokeWidth="2.2"
            />
            {/* Sad mouth */}
            <path
              d="M132,66 Q136,63 140,66"
              fill="none"
              pathLength="100"
              className="hangman-stroke-fast"
              style={{ animationDelay: '330ms' }}
              strokeWidth="2"
            />
          </g>
        )}

        {/* Relieved smile if head was drawn and player still won */}
        {isWon && wrongCount >= 6 && (
          <g stroke="#16A34A" strokeLinecap="round" fill="none">
            <circle cx="131.5" cy="59" r="1.1" fill="#16A34A" />
            <circle cx="140.5" cy="59" r="1.1" fill="#16A34A" />
            <path d="M131.5,64.5 Q136,68.5 140.5,64.5" strokeWidth="2" />
          </g>
        )}
      </g>

      {/* Celebration sparkles when won */}
      {isWon && (
        <g fill="#F59E0B">
          <path
            className="hangman-sparkle"
            d="M188,36 l2,5 5,2 -5,2 -2,5 -2,-5 -5,-2 5,-2 z"
          />
          <path
            className="hangman-sparkle"
            style={{ animationDelay: '90ms' }}
            d="M46,42 l1.5,3.5 3.5,1.5 -3.5,1.5 -1.5,3.5 -1.5,-3.5 -3.5,-1.5 3.5,-1.5 z"
            fill="#10B981"
          />
          <circle
            className="hangman-sparkle"
            style={{ animationDelay: '160ms' }}
            cx="176"
            cy="64"
            r="3.2"
            fill="#8B5CF6"
          />
        </g>
      )}
    </svg>
  );
}
