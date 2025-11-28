// Placeholder component for charts that are being recreated
import React from 'react';

interface ChartPlaceholderProps {
  title: string;
  description?: string;
}

export const ChartPlaceholder: React.FC<ChartPlaceholderProps> = ({ title, description }) => {
  return (
    <div className="chart-wrapper" style={{ 
      padding: '40px', 
      textAlign: 'center',
      background: 'rgba(30, 30, 40, 0.9)',
      borderRadius: '12px',
      border: '1px solid rgba(139, 92, 246, 0.2)',
      display: 'block',
      visibility: 'visible',
      opacity: 1,
      minHeight: '200px',
      width: '100%',
      marginTop: '20px'
    }}>
      <div style={{ 
        fontSize: '48px', 
        marginBottom: '16px',
        opacity: 0.5
      }}>
        📊
      </div>
      <h3 style={{ 
        color: 'rgba(255, 255, 255, 0.9)', 
        marginBottom: '8px',
        fontSize: '18px',
        fontWeight: 600
      }}>
        {title}
      </h3>
      {description && (
        <p style={{ 
          color: 'rgba(255, 255, 255, 0.7)', 
          fontSize: '14px',
          margin: 0
        }}>
          {description}
        </p>
      )}
      <p style={{ 
        color: 'rgba(255, 255, 255, 0.5)', 
        fontSize: '12px',
        marginTop: '16px',
        fontStyle: 'italic'
      }}>
        Chart component is being recreated. This will display the full chart once available.
      </p>
    </div>
  );
};

