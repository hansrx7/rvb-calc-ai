import React from 'react';

export interface BasicInputValues {
  homePrice: number | null;
  monthlyRent: number | null;
  downPaymentPercent: number | null;
  timeHorizonYears: number | null;
}

interface BasicInputsCardProps {
  values: BasicInputValues;
  editingValues: BasicInputValues;
  isEditMode: boolean;
  onFieldChange: (field: keyof BasicInputValues, value: number | null) => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}

const cardStyle: React.CSSProperties = {
  background: 'rgba(12, 16, 27, 0.85)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '18px',
  padding: '20px',
  marginBottom: '20px',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  marginBottom: '16px',
};

const phaseLabelStyle: React.CSSProperties = {
  fontSize: '12px',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'rgba(255, 255, 255, 0.55)',
};

const fieldRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '8px 0',
  borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
};

const fieldLabelStyle: React.CSSProperties = {
  color: 'rgba(255, 255, 255, 0.8)',
  fontSize: '14px',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
};

const fieldValueStyle: React.CSSProperties = {
  color: 'rgba(255, 255, 255, 0.95)',
  fontWeight: 600,
};

const inputStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: '8px',
  color: 'white',
  padding: '8px 10px',
  width: '160px',
};

const actionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  marginTop: '16px',
};

const actionButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: '10px 12px',
  borderRadius: '10px',
  border: 'none',
  cursor: 'pointer',
  fontWeight: 600,
};

export function BasicInputsCard({
  values,
  editingValues,
  isEditMode,
  onFieldChange,
  onEdit,
  onSave,
  onCancel,
}: BasicInputsCardProps) {
  const formatted = (value: number | null, options?: { suffix?: string; currency?: boolean }) => {
    if (value === null || value === undefined) {
      return 'Not set';
    }
    if (options?.currency) {
      return `$${value.toLocaleString()}`;
    }
    if (options?.suffix) {
      return `${value}${options.suffix}`;
    }
    return value.toString();
  };

  const handleInputChange = (field: keyof BasicInputValues, raw: string) => {
    if (raw.trim() === '') {
      onFieldChange(field, null);
      return;
    }
    const parsed = Number(raw);
    onFieldChange(field, Number.isNaN(parsed) ? null : parsed);
  };

  return (
    <section style={cardStyle} data-tour-id="basic-inputs-card">
      <div style={headerStyle}>
        <span style={phaseLabelStyle}>Phase 2 · Your Situation</span>
        <h3 style={{ margin: 0, fontSize: '18px', color: 'rgba(255, 255, 255, 0.92)' }}>Basic Inputs</h3>
        <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.6)', fontSize: '13px' }}>
          These four numbers define most of the scenario. Adjust them anytime.
        </p>
      </div>

      <div>
        <div style={fieldRowStyle}>
          <span style={fieldLabelStyle}>🏠 Home price</span>
          {isEditMode ? (
            <input
              type="number"
              style={inputStyle}
              placeholder="e.g. 650000"
              value={editingValues.homePrice ?? ''}
              onChange={(e) => handleInputChange('homePrice', e.target.value)}
            />
          ) : (
            <span style={fieldValueStyle}>{formatted(values.homePrice, { currency: true })}</span>
          )}
        </div>

        <div style={fieldRowStyle}>
          <span style={fieldLabelStyle}>💵 Monthly rent</span>
          {isEditMode ? (
            <input
              type="number"
              style={inputStyle}
              placeholder="e.g. 3200"
              value={editingValues.monthlyRent ?? ''}
              onChange={(e) => handleInputChange('monthlyRent', e.target.value)}
            />
          ) : (
            <span style={fieldValueStyle}>{formatted(values.monthlyRent, { currency: true })}/mo</span>
          )}
        </div>

        <div style={fieldRowStyle}>
          <span style={fieldLabelStyle}>💰 Down payment %</span>
          {isEditMode ? (
            <input
              type="number"
              style={inputStyle}
              placeholder="e.g. 20"
              value={editingValues.downPaymentPercent ?? ''}
              onChange={(e) => handleInputChange('downPaymentPercent', e.target.value)}
            />
          ) : (
            <span style={fieldValueStyle}>{formatted(values.downPaymentPercent, { suffix: '%' })}</span>
          )}
        </div>

        <div style={{ ...fieldRowStyle, borderBottom: 'none' }}>
          <span style={fieldLabelStyle}>⏱️ Timeline</span>
          {isEditMode ? (
            <input
              type="number"
              style={inputStyle}
              placeholder="Years"
              value={editingValues.timeHorizonYears ?? ''}
              onChange={(e) => handleInputChange('timeHorizonYears', e.target.value)}
            />
          ) : (
            <span style={fieldValueStyle}>{formatted(values.timeHorizonYears, { suffix: ' yrs' })}</span>
          )}
        </div>
      </div>

      <div style={actionsStyle}>
        {isEditMode ? (
          <>
            <button style={{ ...actionButtonStyle, background: '#4ade80', color: '#0b1120' }} onClick={onSave}>
              Save
            </button>
            <button style={{ ...actionButtonStyle, background: 'rgba(255,255,255,0.08)', color: '#e2e8f0' }} onClick={onCancel}>
              Cancel
            </button>
          </>
        ) : (
          <button style={{ ...actionButtonStyle, background: '#6366f1', color: 'white' }} onClick={onEdit}>
            Edit Inputs
          </button>
        )}
      </div>
    </section>
  );
}

