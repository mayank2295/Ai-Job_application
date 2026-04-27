import { useState } from 'react';
import { ArrowLeft, ArrowRight, Download, Save, Check, CircleAlert, Clock } from 'lucide-react';
import Stepper from '../ui/Stepper';
import PersonalInfoStep from './steps/PersonalInfoStep';
import SummaryStep from './steps/SummaryStep';
import ExperienceStep from './steps/ExperienceStep';
import EducationStep from './steps/EducationStep';
import SkillsStep from './steps/SkillsStep';
import ProjectsStep from './steps/ProjectsStep';
import TemplateStep from './steps/TemplateStep';
import { useAutoSave, loadSavedData } from '../../hooks/useAutoSave';
import type { ResumeData, Template } from './types';

const STEPS = [
  { id: 'template',   label: 'Template',   description: 'Choose your style' },
  { id: 'personal',   label: 'Personal',   description: 'Basic info' },
  { id: 'summary',    label: 'Summary',    description: 'About you' },
  { id: 'experience', label: 'Experience', description: 'Work history' },
  { id: 'education',  label: 'Education',  description: 'Qualifications' },
  { id: 'skills',     label: 'Skills',     description: 'Your expertise' },
  { id: 'projects',   label: 'Projects',   description: 'Portfolio' },
];

const DEFAULT_DATA: ResumeData = {
  personal: { name: '', email: '', phone: '', location: '', Link2: '', website: '' },
  summary: '', experience: [], education: [], skills: [], projects: [],
};

const STORAGE_KEY = 'resume_builder_draft';
const TEMPLATE_KEY = 'resume_builder_template';

interface ResumeWizardProps {
  onComplete: (data: ResumeData, template: Template) => void;
}

export default function ResumeWizard({ onComplete }: ResumeWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<ResumeData>(() => loadSavedData(STORAGE_KEY, DEFAULT_DATA));
  const [template, setTemplate] = useState<Template>(() => loadSavedData(TEMPLATE_KEY, 'modern' as Template));

  const dataAutoSave = useAutoSave({ data, key: STORAGE_KEY, delay: 500 });
  const templateAutoSave = useAutoSave({ data: template, key: TEMPLATE_KEY, delay: 300 });

  const updateData = (field: keyof ResumeData, value: any) => setData(prev => ({ ...prev, [field]: value }));

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(p => p + 1);
    } else {
      onComplete(data, template);
      dataAutoSave.clearSaved();
      templateAutoSave.clearSaved();
    }
  };

  const handleBack = () => { if (currentStep > 0) setCurrentStep(p => p - 1); };

  const handleManualSave = async () => {
    await dataAutoSave.manualSave();
    await templateAutoSave.manualSave();
  };

  const renderStep = () => {
    switch (STEPS[currentStep].id) {
      case 'template':   return <TemplateStep selected={template} onSelect={setTemplate} />;
      case 'personal':   return <PersonalInfoStep data={data.personal} onChange={v => updateData('personal', v)} />;
      case 'summary':    return <SummaryStep value={data.summary} onChange={v => updateData('summary', v)} />;
      case 'experience': return <ExperienceStep data={data.experience} onChange={v => updateData('experience', v)} />;
      case 'education':  return <EducationStep data={data.education} onChange={v => updateData('education', v)} />;
      case 'skills':     return <SkillsStep data={data.skills} onChange={v => updateData('skills', v)} />;
      case 'projects':   return <ProjectsStep data={data.projects} onChange={v => updateData('projects', v)} />;
      default: return null;
    }
  };

  const SaveStatus = () => {
    const { status, lastSaved } = dataAutoSave;
    if (status === 'saving') return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
        <div className="loading-spinner" style={{ width: 12, height: 12, borderWidth: 2 }} /> Saving...
      </div>
    );
    if (status === 'saved') return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#10b981' }}>
        <Check size={13} /> Saved
      </div>
    );
    if (status === 'error') return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#ef4444' }}>
        <CircleAlert size={13} /> Save failed
      </div>
    );
    if (lastSaved) {
      const diff = Math.floor((Date.now() - lastSaved.getTime()) / 1000);
      const ago = diff < 60 ? 'just now' : diff < 3600 ? `${Math.floor(diff / 60)}m ago` : `${Math.floor(diff / 3600)}h ago`;
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
          <Clock size={13} /> Saved {ago}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 4px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Resume Builder</h2>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '2px 0 0' }}>Progress is automatically saved</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <SaveStatus />
          <button
            onClick={handleManualSave}
            disabled={dataAutoSave.status === 'saving'}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
              borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-glass)',
              color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit', transition: 'all 0.15s',
            }}
          >
            <Save size={13} /> Save Now
          </button>
        </div>
      </div>

      {/* Stepper */}
      <div style={{ marginBottom: 28 }}>
        <Stepper steps={STEPS} currentStep={currentStep} onStepClick={i => setCurrentStep(i)} />
      </div>

      {/* Step content */}
      <div style={{ minHeight: 380, marginBottom: 24 }}>
        {renderStep()}
      </div>

      {/* Navigation */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 20, borderTop: '1px solid var(--border-primary)',
      }}>
        <button
          onClick={handleBack}
          disabled={currentStep === 0}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px',
            borderRadius: 8, border: '1px solid var(--border-primary)', background: 'var(--bg-glass)',
            color: currentStep === 0 ? 'var(--text-muted)' : 'var(--text-secondary)',
            fontSize: 14, fontWeight: 600, cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit', opacity: currentStep === 0 ? 0.5 : 1,
          }}
        >
          <ArrowLeft size={15} /> Back
        </button>

        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Step {currentStep + 1} of {STEPS.length}
        </span>

        <button
          onClick={handleNext}
          className="btn btn-primary"
          style={{ padding: '9px 20px', fontSize: 14, gap: 8 }}
        >
          {currentStep === STEPS.length - 1 ? (
            <><Download size={15} /> Generate Resume</>
          ) : (
            <>Next <ArrowRight size={15} /></>
          )}
        </button>
      </div>
    </div>
  );
}
