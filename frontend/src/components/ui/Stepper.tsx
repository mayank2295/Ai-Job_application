import { Check } from 'lucide-react';

interface Step { id: string; label: string; description?: string; }
interface StepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (index: number) => void;
  orientation?: 'horizontal' | 'vertical';
}

export default function Stepper({ steps, currentStep, onStepClick, orientation = 'horizontal' }: StepperProps) {
  if (orientation === 'vertical') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {steps.map((step, index) => {
          const done = index < currentStep;
          const active = index === currentStep;
          const clickable = onStepClick && done;
          return (
            <div key={step.id} style={{ display: 'flex', gap: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <button
                  onClick={() => clickable && onStepClick(index)}
                  disabled={!clickable}
                  style={{
                    width: 36, height: 36, borderRadius: '50%', border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 700, fontSize: 13, cursor: clickable ? 'pointer' : 'default',
                    background: done ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : active ? 'rgba(99,102,241,0.12)' : 'var(--bg-tertiary)',
                    color: done ? '#fff' : active ? 'var(--accent-primary)' : 'var(--text-muted)',
                    boxShadow: active ? '0 0 0 3px rgba(99,102,241,0.2)' : 'none',
                    transition: 'all 0.2s', flexShrink: 0,
                  }}
                >
                  {done ? <Check size={16} /> : index + 1}
                </button>
                {index < steps.length - 1 && (
                  <div style={{ width: 2, flex: 1, minHeight: 24, background: done ? '#6366f1' : 'var(--border-primary)', margin: '4px 0' }} />
                )}
              </div>
              <div style={{ paddingBottom: index < steps.length - 1 ? 20 : 0, paddingTop: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: active ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>{step.label}</div>
                {step.description && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{step.description}</div>}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Horizontal
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', width: '100%', overflowX: 'auto' }}>
      {steps.map((step, index) => {
        const done = index < currentStep;
        const active = index === currentStep;
        const clickable = onStepClick && done;
        return (
          <div key={step.id} style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
              <button
                onClick={() => clickable && onStepClick(index)}
                disabled={!clickable}
                style={{
                  width: 34, height: 34, borderRadius: '50%', border: 'none', marginBottom: 6,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: 12, cursor: clickable ? 'pointer' : 'default',
                  background: done ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : active ? 'rgba(99,102,241,0.12)' : 'var(--bg-tertiary)',
                  color: done ? '#fff' : active ? 'var(--accent-primary)' : 'var(--text-muted)',
                  boxShadow: active ? '0 0 0 3px rgba(99,102,241,0.2)' : 'none',
                  transition: 'all 0.2s', flexShrink: 0,
                }}
              >
                {done ? <Check size={14} /> : index + 1}
              </button>
              <span style={{ fontSize: 11, fontWeight: 600, color: active ? 'var(--accent-primary)' : 'var(--text-muted)', textAlign: 'center', whiteSpace: 'nowrap' }}>
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div style={{ height: 2, flex: 1, background: done ? '#6366f1' : 'var(--border-primary)', marginBottom: 28, minWidth: 8 }} />
            )}
          </div>
        );
      })}
    </div>
  );
}
