import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Briefcase,
  FileText,
  Upload,
  CircleCheck,
  ArrowRight,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { api } from '../api/client';
import type { ApplicationFormData } from '../types';

const steps = [
  { label: 'Personal Info', icon: User },
  { label: 'Position', icon: Briefcase },
  { label: 'Resume', icon: Upload },
  { label: 'Review', icon: CircleCheck },
];

const positions = [
  'Software Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Data Analyst',
  'Product Manager',
  'UX Designer',
  'DevOps Engineer',
  'QA Engineer',
  'Project Manager',
];

const MAX_RESUME_SIZE = 10 * 1024 * 1024;
const ALLOWED_RESUME_EXTENSIONS = ['.pdf', '.doc', '.docx'];

export default function ApplyPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<ApplicationFormData>({
    full_name: '',
    email: '',
    phone: '',
    position: '',
    experience_years: 0,
    cover_letter: '',
  });

  const updateField = (field: keyof ApplicationFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 0:
        if (!formData.full_name.trim()) { setError('Full name is required'); return false; }
        if (!formData.email.trim() || !formData.email.includes('@')) { setError('Valid email is required'); return false; }
        return true;
      case 1:
        if (!formData.position) { setError('Please select a position'); return false; }
        return true;
      case 2:
        return true; // Resume is optional
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
      setError('');
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
    setError('');
  };

  const validateResumeFile = (file: File): boolean => {
    const filename = file.name.toLowerCase();
    const isAllowedType = ALLOWED_RESUME_EXTENSIONS.some((ext) => filename.endsWith(ext));

    if (!isAllowedType) {
      setError('Only PDF, DOC, and DOCX files are allowed');
      return false;
    }

    if (file.size > MAX_RESUME_SIZE) {
      setError('Resume file size must be 10MB or less');
      return false;
    }

    setError('');
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const result = await api.createApplication(formData);
      const appId = result.application.id;
      setSubmittedId(appId);

      // Upload resume if selected
      if (resumeFile) {
        try {
          await api.uploadResume(appId, resumeFile);
        } catch (err) {
          console.error('Resume upload failed:', err);
        }
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && validateResumeFile(file)) {
      setResumeFile(file);
    }
  };

  if (submitted) {
    return (
      <div className="page-container">
        <div className="apply-container">
          <div className="apply-card">
            <div className="success-container">
              <div className="success-icon">
                <CircleCheck />
              </div>
              <h2 className="success-title">Application Submitted! 🎉</h2>
              <p className="success-message">
                Your application for <strong>{formData.position}</strong> has been received.
                Our Power Automate workflows are now processing your submission.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="btn btn-primary" onClick={() => navigate(`/applications/${submittedId}`)}>
                  <FileText size={16} /> View Application
                </button>
                <button className="btn btn-secondary" onClick={() => {
                  setSubmitted(false);
                  setCurrentStep(0);
                  setFormData({ full_name: '', email: '', phone: '', position: '', experience_years: 0, cover_letter: '' });
                  setResumeFile(null);
                }}>
                  Submit Another
                </button>
              </div>

              <div style={{
                marginTop: 28, padding: 18,
                background: 'rgba(99, 102, 241, 0.05)',
                border: '1px solid rgba(99, 102, 241, 0.15)',
                borderRadius: 'var(--radius-md)', textAlign: 'left'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <Sparkles size={16} color="var(--accent-primary-light)" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Automation Triggered</span>
                </div>
                <ul style={{ fontSize: 12, color: 'var(--text-muted)', paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <li>📧 Confirmation email sent (if configured)</li>
                  <li>💬 HR team notified on Microsoft Teams</li>
                  <li>📋 Application added to processing queue</li>
                  <li>🤖 AI resume analysis initiated</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="apply-container">
        {/* Stepper */}
        <div className="form-stepper">
          {steps.map((step, i) => (
            <div key={step.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className={`form-step ${i === currentStep ? 'active' : i < currentStep ? 'completed' : ''}`}>
                <div className="form-step-circle">
                  {i < currentStep ? <CircleCheck size={16} /> : i + 1}
                </div>
                <span className="form-step-label">{step.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`form-step-connector ${i < currentStep ? 'completed' : ''}`} />
              )}
            </div>
          ))}
        </div>

        <div className="apply-card">
          {/* Step 1: Personal Info */}
          {currentStep === 0 && (
            <>
              <h2 className="apply-title">Personal Information</h2>
              <p className="apply-subtitle">Tell us about yourself</p>

              <div className="form-group">
                <label className="form-label"><User size={14} style={{ display: 'inline', verticalAlign: -2, marginRight: 6 }} />Full Name *</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.full_name}
                  onChange={(e) => updateField('full_name', e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label"><Mail size={14} style={{ display: 'inline', verticalAlign: -2, marginRight: 6 }} />Email Address *</label>
                  <input
                    className="form-input"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => updateField('email', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label"><Phone size={14} style={{ display: 'inline', verticalAlign: -2, marginRight: 6 }} />Phone Number</label>
                  <input
                    className="form-input"
                    type="tel"
                    placeholder="+91 XXXXXXXXXX"
                    value={formData.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          {/* Step 2: Position */}
          {currentStep === 1 && (
            <>
              <h2 className="apply-title">Position Details</h2>
              <p className="apply-subtitle">Which role are you applying for?</p>

              <div className="form-group">
                <label className="form-label"><Briefcase size={14} style={{ display: 'inline', verticalAlign: -2, marginRight: 6 }} />Position *</label>
                <select
                  className="form-select"
                  value={formData.position}
                  onChange={(e) => updateField('position', e.target.value)}
                >
                  <option value="">Select a position</option>
                  {positions.map((pos) => (
                    <option key={pos} value={pos}>{pos}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Years of Experience</label>
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  max="50"
                  placeholder="0"
                  value={formData.experience_years}
                  onChange={(e) => updateField('experience_years', parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="form-group">
                <label className="form-label"><FileText size={14} style={{ display: 'inline', verticalAlign: -2, marginRight: 6 }} />Cover Letter</label>
                <textarea
                  className="form-textarea"
                  placeholder="Why are you interested in this position? What makes you a great fit?"
                  value={formData.cover_letter}
                  onChange={(e) => updateField('cover_letter', e.target.value)}
                />
              </div>
            </>
          )}

          {/* Step 3: Resume */}
          {currentStep === 2 && (
            <>
              <h2 className="apply-title">Upload Resume</h2>
              <p className="apply-subtitle">Upload your resume for AI-powered analysis</p>

              <div
                className={`file-upload-zone ${resumeFile ? '' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
              >
                <div className="file-upload-icon">
                  <Upload />
                </div>
                <div className="file-upload-text">
                  Click to upload or drag and drop
                </div>
                <div className="file-upload-hint">
                  PDF, DOC, DOCX (max 10MB)
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && validateResumeFile(file)) {
                      setResumeFile(file);
                    }
                  }}
                />
              </div>

              {resumeFile && (
                <div className="file-upload-selected">
                  <FileText size={18} />
                  <span className="file-name">{resumeFile.name}</span>
                  <span className="file-size">{(resumeFile.size / 1024).toFixed(1)} KB</span>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={(e) => { e.stopPropagation(); setResumeFile(null); }}
                    style={{ color: 'var(--accent-rose)' }}
                  >
                    Remove
                  </button>
                </div>
              )}

              <div style={{
                marginTop: 20, padding: 16,
                background: 'rgba(139, 92, 246, 0.05)',
                border: '1px solid rgba(139, 92, 246, 0.15)',
                borderRadius: 'var(--radius-md)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Sparkles size={16} color="var(--accent-secondary)" />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>AI-Powered Analysis</span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  When you submit, Power Automate will trigger an AI Builder workflow to analyze your resume,
                  extract key skills, and generate a match score for the selected position.
                </p>
              </div>
            </>
          )}

          {/* Step 4: Review */}
          {currentStep === 3 && (
            <>
              <h2 className="apply-title">Review & Submit</h2>
              <p className="apply-subtitle">Please review your application before submitting</p>

              <div style={{ display: 'grid', gap: 16 }}>
                <div className="detail-section" style={{ padding: 18 }}>
                  <div className="detail-section-title"><User size={16} /> Personal Info</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="detail-field">
                      <div className="detail-field-label">Full Name</div>
                      <div className="detail-field-value">{formData.full_name}</div>
                    </div>
                    <div className="detail-field">
                      <div className="detail-field-label">Email</div>
                      <div className="detail-field-value">{formData.email}</div>
                    </div>
                    <div className="detail-field">
                      <div className="detail-field-label">Phone</div>
                      <div className="detail-field-value">{formData.phone || '—'}</div>
                    </div>
                  </div>
                </div>

                <div className="detail-section" style={{ padding: 18 }}>
                  <div className="detail-section-title"><Briefcase size={16} /> Position</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div className="detail-field">
                      <div className="detail-field-label">Position</div>
                      <div className="detail-field-value">{formData.position}</div>
                    </div>
                    <div className="detail-field">
                      <div className="detail-field-label">Experience</div>
                      <div className="detail-field-value">{formData.experience_years} years</div>
                    </div>
                  </div>
                  {formData.cover_letter && (
                    <div className="detail-field" style={{ marginTop: 8 }}>
                      <div className="detail-field-label">Cover Letter</div>
                      <div className="detail-field-value" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        {formData.cover_letter}
                      </div>
                    </div>
                  )}
                </div>

                {resumeFile && (
                  <div className="detail-section" style={{ padding: 18 }}>
                    <div className="detail-section-title"><Upload size={16} /> Resume</div>
                    <div className="file-upload-selected">
                      <FileText size={16} />
                      <span className="file-name">{resumeFile.name}</span>
                      <span className="file-size">{(resumeFile.size / 1024).toFixed(1)} KB</span>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Error */}
          {error && (
            <div style={{
              marginTop: 16, padding: '10px 14px',
              background: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid rgba(244, 63, 94, 0.2)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--accent-rose)',
              fontSize: 13
            }}>
              {error}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="form-buttons">
            <button
              className="btn btn-secondary"
              onClick={prevStep}
              disabled={currentStep === 0}
              style={{ visibility: currentStep === 0 ? 'hidden' : 'visible' }}
            >
              <ArrowLeft size={16} /> Back
            </button>

            {currentStep < steps.length - 1 ? (
              <button className="btn btn-primary" onClick={nextStep}>
                Next <ArrowRight size={16} />
              </button>
            ) : (
              <button
                className="btn btn-primary btn-lg"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <div className="loading-spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} /> Submit Application
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
