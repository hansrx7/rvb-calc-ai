import React from 'react';
import './LoadingIndicator.css';

interface LoadingIndicatorProps {
  message: string;
  progress?: number; // 0-100
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ 
  message, 
  progress 
}) => {
  return (
    <div className="loading-indicator">
      <div className="loading-spinner" />
      <p className="loading-message">{message}</p>
      {progress !== undefined && (
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progress}%` }}
          />
          <span className="progress-text">{Math.round(progress)}%</span>
        </div>
      )}
    </div>
  );
};

