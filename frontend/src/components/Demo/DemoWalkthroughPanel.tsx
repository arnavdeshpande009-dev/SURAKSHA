import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Play, RotateCcw, Truck } from 'lucide-react';
import type { DemoStep } from '../../data/demoScenario';
import { DEMO_NARRATIVE_STEPS } from '../../data/demoScenario';
import { theme } from '../../theme';

const { color, radius, shadow } = theme;

interface DemoWalkthroughPanelProps {
  currentStep: DemoStep;
  onNextStep: () => void;
  onResetDemo: () => void;
}

export const DemoWalkthroughPanel: React.FC<DemoWalkthroughPanelProps> = ({
  currentStep,
  onNextStep,
  onResetDemo,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const activeNarrative = DEMO_NARRATIVE_STEPS[currentStep];
  const isComplete = currentStep === 5;

  return (
    <div style={{
      backgroundColor: color.surface,
      borderRadius: radius.lg,
      border: `1px solid ${color.border}`,
      boxShadow: shadow.sm,
      overflow: 'hidden'
    }}>
      <button
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-controls="emergency-demo-walkthrough"
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '14px 16px',
          border: 'none',
          backgroundColor: 'transparent',
          color: color.textPrimary,
          cursor: 'pointer',
          textAlign: 'left'
        }}
      >
          <Truck size={14} color={color.accent} />
        <span style={{ flex: 1, fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.04em' }}>
          6. EMERGENCY DEMO WALKTHROUGH
        </span>
          <span style={{
            fontSize: '0.7rem',
            backgroundColor: isComplete ? color.success : color.accent,
            color: '#ffffff',
            padding: '2px 8px',
            borderRadius: radius.pill,
            fontWeight: 700
          }}>
            {isComplete ? 'DONE' : `${currentStep + 1}/6`}
          </span>
        {isOpen ? <ChevronUp size={16} color={color.textMuted} /> : <ChevronDown size={16} color={color.textMuted} />}
      </button>

      {isOpen && (
        <div id="emergency-demo-walkthrough" style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '4px' }}>
            {DEMO_NARRATIVE_STEPS.map((step) => (
              <div
                key={step.step}
                style={{
                  flex: 1,
                  height: '4px',
                  borderRadius: radius.pill,
                  backgroundColor: step.step <= currentStep ? color.accent : color.borderStrong
                }}
              />
            ))}
          </div>

          <div style={{ backgroundColor: color.surfaceAlt, borderRadius: radius.sm, padding: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: color.textPrimary }}>
                {activeNarrative.title}
              </span>
              <span style={{
                flexShrink: 0,
                fontSize: '0.63rem',
                fontWeight: 800,
                color: isComplete ? color.success : color.accent,
                backgroundColor: isComplete ? color.successSoft : color.accentSoft,
                borderRadius: radius.pill,
                padding: '3px 7px'
              }}>
                {activeNarrative.badge}
              </span>
            </div>
            <p style={{ margin: '8px 0', fontSize: '0.78rem', lineHeight: 1.4, color: color.textSecondary }}>
              {activeNarrative.description}
            </p>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: color.textMuted }}>
              Route focus: <span style={{ color: color.textPrimary }}>{activeNarrative.route}</span>
            </div>
          </div>

          <button
            onClick={isComplete ? onResetDemo : onNextStep}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '7px',
              padding: '9px 12px',
              border: 'none',
              borderRadius: radius.sm,
              backgroundColor: isComplete ? color.surfaceAlt : color.accent,
              color: isComplete ? color.textSecondary : '#ffffff',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            {isComplete ? <RotateCcw size={14} /> : <Play size={14} />}
            {isComplete ? 'Restart walkthrough' : activeNarrative.actionText}
          </button>
        </div>
      )}
    </div>
  );
};
