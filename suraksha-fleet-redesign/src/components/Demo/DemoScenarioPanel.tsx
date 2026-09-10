import type { DemoStep } from '../../data/demoScenario';
import { DEMO_NARRATIVE_STEPS } from '../../data/demoScenario';
import { Truck, RotateCcw, ArrowRight, CheckCircle } from 'lucide-react';
import { theme } from '../../theme';

const { color, radius, shadow } = theme;

interface DemoPanelProps {
  currentStep: DemoStep;
  onNextStep: () => void;
  onResetDemo: () => void;
  rainfallSimulated: boolean;
}

export const DemoScenarioPanel: React.FC<DemoPanelProps> = ({
  currentStep,
  onNextStep,
  onResetDemo,
  rainfallSimulated,
}) => {
  const activeNarrative = DEMO_NARRATIVE_STEPS[currentStep];

  return (
    <div style={{
      backgroundColor: color.navy,
      borderRadius: radius.lg,
      padding: '14px',
      boxShadow: shadow.md,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    }}>
      {/* Panel Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Truck size={16} color="#7DD3FC" />
          <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#7DD3FC', letterSpacing: '0.04em' }}>
            DEMO: EMERGENCY MEDICINE SCENARIO
          </span>
        </div>
        <button
          onClick={onResetDemo}
          title="Reset Simulation to Initial State"
          style={{
            backgroundColor: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.14)',
            borderRadius: radius.sm,
            color: color.onDarkMuted,
            padding: '3px 8px',
            fontSize: '0.7rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <RotateCcw size={12} /> Reset
        </button>
      </div>

      {/* Step Progress Pills */}
      <div style={{ display: 'flex', gap: '4px' }}>
        {DEMO_NARRATIVE_STEPS.map((s, idx) => (
          <div
            key={`step-pill-${idx}`}
            style={{
              flex: 1,
              height: '4px',
              borderRadius: '2px',
              backgroundColor: idx <= currentStep ? '#7DD3FC' : 'rgba(255,255,255,0.14)',
              transition: 'all 0.3s ease'
            }}
          />
        ))}
      </div>

      {/* Narrative Step Details */}
      <div style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: radius.sm, padding: '10px', fontSize: '0.8rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <span style={{ fontWeight: 700, color: '#ffffff' }}>{activeNarrative.title}</span>
          <span style={{
            fontSize: '0.65rem',
            fontWeight: 800,
            padding: '2px 7px',
            borderRadius: radius.pill,
            backgroundColor: currentStep === 5 ? 'rgba(74, 222, 128, 0.18)' : 'rgba(125, 211, 252, 0.18)',
            color: currentStep === 5 ? '#4ADE80' : '#7DD3FC'
          }}>
            {activeNarrative.badge}
          </span>
        </div>
        <p style={{ margin: '4px 0 6px 0', color: color.onDarkMuted, lineHeight: '1.3' }}>
          {activeNarrative.description}
        </p>
        <div style={{ fontSize: '0.725rem', color: color.onDarkMuted, fontWeight: 600 }}>
          Route focus: <span style={{ color: '#ffffff' }}>{activeNarrative.route}</span>
        </div>
      </div>

      {/* Step Action Button */}
      {currentStep < 5 ? (
        <button
          onClick={onNextStep}
          style={{
            backgroundColor: color.accent,
            border: 'none',
            borderRadius: radius.sm,
            color: '#ffffff',
            padding: '9px 12px',
            fontSize: '0.8rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s ease'
          }}
        >
          <span>{activeNarrative.actionText}</span>
          <ArrowRight size={14} />
        </button>
      ) : (
        <div style={{
          backgroundColor: 'rgba(74, 222, 128, 0.15)',
          border: '1px solid rgba(74, 222, 128, 0.4)',
          borderRadius: radius.sm,
          padding: '8px',
          color: '#4ADE80',
          fontSize: '0.8rem',
          fontWeight: 700,
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px'
        }}>
          <CheckCircle size={16} /> Demo scenario successfully completed!
        </div>
      )}
    </div>
  );
};
