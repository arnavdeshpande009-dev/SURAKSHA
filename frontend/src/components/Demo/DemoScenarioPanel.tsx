import type { DemoStep } from '../../data/demoScenario';
import { DEMO_NARRATIVE_STEPS } from '../../data/demoScenario';
import { Play, RotateCcw, Truck, ShieldAlert, ArrowRight, CheckCircle, CloudRain, Cpu } from 'lucide-react';

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
      backgroundColor: '#0f172a',
      border: '1px solid #0284c7',
      borderRadius: '8px',
      padding: '14px',
      boxShadow: '0 0 16px rgba(56, 189, 248, 0.15)',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    }}>
      {/* Panel Title Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Truck size={16} color="#38bdf8" />
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#38bdf8', letterSpacing: '0.05em' }}>
            DEMO / SIMULATION: EMERGENCY MEDICINE SCENARIO
          </span>
        </div>
        <button
          onClick={onResetDemo}
          title="Reset Simulation to Initial State"
          style={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '4px',
            color: '#94a3b8',
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
              backgroundColor: idx <= currentStep ? '#38bdf8' : '#334155',
              transition: 'all 0.3s ease'
            }}
          />
        ))}
      </div>

      {/* Narrative Step Details */}
      <div style={{ backgroundColor: '#1e293b', borderRadius: '6px', padding: '10px', fontSize: '0.8rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <span style={{ fontWeight: 700, color: '#f8fafc' }}>{activeNarrative.title}</span>
          <span style={{
            fontSize: '0.65rem',
            fontWeight: 800,
            padding: '2px 6px',
            borderRadius: '4px',
            backgroundColor: currentStep === 5 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(56, 189, 248, 0.2)',
            color: currentStep === 5 ? '#4ade80' : '#38bdf8'
          }}>
            {activeNarrative.badge}
          </span>
        </div>
        <p style={{ margin: '4px 0 6px 0', color: '#cbd5e1', lineHeight: '1.3' }}>
          {activeNarrative.description}
        </p>
        <div style={{ fontSize: '0.725rem', color: '#94a3b8', fontWeight: 600 }}>
          📍 Route Focus: <span style={{ color: '#f8fafc' }}>{activeNarrative.route}</span>
        </div>
      </div>

      {/* Step Action Button */}
      {currentStep < 5 ? (
        <button
          onClick={onNextStep}
          style={{
            backgroundColor: '#0284c7',
            border: 'none',
            borderRadius: '6px',
            color: '#ffffff',
            padding: '8px 12px',
            fontSize: '0.8rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)'
          }}
        >
          <span>{activeNarrative.actionText}</span>
          <ArrowRight size={14} />
        </button>
      ) : (
        <div style={{
          backgroundColor: 'rgba(34, 197, 94, 0.15)',
          border: '1px solid #22c55e',
          borderRadius: '6px',
          padding: '8px',
          color: '#4ade80',
          fontSize: '0.8rem',
          fontWeight: 700,
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px'
        }}>
          <CheckCircle size={16} /> Demo Scenario Successfully Completed!
        </div>
      )}
    </div>
  );
};
