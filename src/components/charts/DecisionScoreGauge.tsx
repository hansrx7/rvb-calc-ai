// src/components/charts/DecisionScoreGauge.tsx

import './DecisionScoreGauge.css';

interface DecisionScoreGaugeProps {
  score: number; // 0-720 score
  advantage: 'buying' | 'renting' | 'neutral';
}

export function DecisionScoreGauge({ score, advantage }: DecisionScoreGaugeProps) {
  // Calculate percentage for arc (0-100%)
  const percentage = (score / 720) * 100;
  
  // Full arc length for 270 degrees (3/4 circle) with radius 80
  // Circumference = 2πr, so 270/360 of that = (3/4) * 2π * 80 ≈ 377
  const fullArcLength = 377;
  const dashLength = (percentage / 100) * fullArcLength;
  const dashArray = `${dashLength} ${fullArcLength}`;
  
  // Determine color based on advantage
  const getColor = () => {
    if (advantage === 'buying') {
      return `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`;
    } else if (advantage === 'renting') {
      return `linear-gradient(135deg, #f093fb 0%, #f5576c 100%)`;
    } else {
      return `linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)`;
    }
  };
  
  return (
    <div className="decision-score-gauge">
      <div className="gauge-container">
        <svg className="gauge-svg" viewBox="0 0 200 120">
          {/* Background arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="#e0e0e0"
            strokeWidth="12"
            strokeLinecap="round"
          />
          
          {/* Animated arc */}
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke={`url(#gauge-gradient-${advantage})`}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={dashArray}
            className="gauge-arc"
          />
          
          {/* Gradient definition */}
          <defs>
            <linearGradient id="gauge-gradient-buying" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#667eea" />
              <stop offset="100%" stopColor="#764ba2" />
            </linearGradient>
            <linearGradient id="gauge-gradient-renting" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f093fb" />
              <stop offset="100%" stopColor="#f5576c" />
            </linearGradient>
            <linearGradient id="gauge-gradient-neutral" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ffecd2" />
              <stop offset="100%" stopColor="#fcb69f" />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Label */}
        <div className="gauge-label" style={{ background: getColor() }}>
          {advantage === 'buying' && 'Buying Advantage'}
          {advantage === 'renting' && 'Renting Advantage'}
          {advantage === 'neutral' && 'Neutral Zone'}
        </div>
      </div>
    </div>
  );
}

