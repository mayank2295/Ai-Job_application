import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  Bot,
  FileText,
  Gauge,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';
import './LandingPage.css';

const reveal = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

const stepItems = [
  {
    title: 'Connect and log in',
    description: 'Sign in with Google or email/password and enter your team workspace in minutes.',
  },
  {
    title: 'Automate application and resume workflows',
    description: 'Auto-tag applications, parse resumes, trigger events, and keep pipelines synchronized.',
  },
  {
    title: 'Track progress and make faster decisions',
    description: 'Monitor status, bottlenecks, and top candidate signals from one clear dashboard.',
  },
];

const featureItems = [
  {
    icon: Sparkles,
    title: 'AI-first workflow',
    bullets: [
      'Auto-tag applications by role and urgency',
      'Resume parsing with structured candidate fields',
      'Event updates for every hiring stage',
      'Candidate pipeline sync across workflow steps',
    ],
  },
  {
    icon: Gauge,
    title: 'Fast dashboard decisions',
    bullets: [
      'Status overview across active pipelines',
      'Bottleneck detection with visual indicators',
      'Top candidate signals at a glance',
      'Recruiter focus mode for priority queues',
    ],
  },
  {
    icon: ShieldCheck,
    title: 'Secure access',
    bullets: [
      'Google sign-in supported',
      'Email login supported',
      'Protected routes for private workspace pages',
      'Ready for scalable role-based auth flows',
    ],
  },
];

const automationStages: Array<{
  icon: LucideIcon;
  title: string;
  description: string;
  metric: string;
  progress: number;
  state: 'done' | 'running' | 'waiting';
  preview: 'intake' | 'ai' | 'notify';
}> = [
  {
    icon: FileText,
    title: 'Application Intake',
    description: 'New application captured and validated',
    metric: 'Done',
    progress: 100,
    state: 'done',
    preview: 'intake',
  },
  {
    icon: Sparkles,
    title: 'AI Resume Parsing',
    description: 'Skills and fit score are being generated',
    metric: 'Running',
    progress: 74,
    state: 'running',
    preview: 'ai',
  },
  {
    icon: Mail,
    title: 'Notification + Status Sync',
    description: 'Recruiter alerts and dashboard update in next step',
    metric: 'Queued',
    progress: 28,
    state: 'waiting',
    preview: 'notify',
  },
];

const liveEvents = [
  'Resume scored for Frontend Engineer in 2.1s',
  'Interview reminder sent to hiring panel',
  'AI flagged high-fit candidate for priority review',
  'Status moved from Reviewing to Interviewed',
];

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="lp-page">
      <div className="lp-bg-mesh" aria-hidden="true" />
      <div className="lp-bg-particles" aria-hidden="true">
        <span className="lp-particle lp-particle-one" />
        <span className="lp-particle lp-particle-two" />
        <span className="lp-particle lp-particle-three" />
        <span className="lp-particle lp-particle-four" />
      </div>

      <header className="lp-header">
        <div className="lp-brand">
          <Bot size={18} />
          <span>JobFlow AI</span>
        </div>
        <nav className="lp-nav-links">
          <a href="#automation-live">Live Demo</a>
          <a href="#features">Features</a>
          <a href="#workflow">Workflow</a>
          <a href="#security">Security</a>
        </nav>
        <div className="lp-header-actions">
          <ThemeToggle />
          {user ? (
            <Link to="/dashboard" className="lp-user-profile-link">
              {user.photoURL ? (
                <img src={user.photoURL} alt="" className="lp-user-avatar" referrerPolicy="no-referrer" />
              ) : (
                <span className="lp-user-avatar lp-user-avatar-initial">
                  {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                </span>
              )}
              <span className="lp-user-name">{user.displayName || user.email || 'My Account'}</span>
              <ArrowRight size={14} />
            </Link>
          ) : (
            <Link to="/login" className="lp-btn lp-btn-primary">Login</Link>
          )}
        </div>
      </header>

      <main className="lp-main">
        <section className="lp-hero" id="experience">
          <motion.div className="lp-hero-copy" initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}>
            <motion.p className="lp-kicker" variants={reveal}>Built for modern recruiting teams</motion.p>
            <motion.h1 className="lp-title" variants={reveal}>
              AI-powered hiring workflow automation for modern recruiting teams
            </motion.h1>
            <motion.p className="lp-subtitle" variants={reveal}>
              JobFlow AI helps teams automate application tracking, resume screening, and hiring decisions from one streamlined dashboard.
            </motion.p>

            <motion.div className="lp-actions" variants={reveal}>
              <Link to={user ? '/dashboard' : '/login'} className="lp-btn lp-btn-primary">
                {user ? 'Open Dashboard' : 'Login to Dashboard'} <ArrowRight size={16} />
              </Link>
              <a href="#workflow" className="lp-btn lp-btn-secondary">View workflow</a>
            </motion.div>

            <motion.p className="lp-microcopy" variants={reveal}>
              Built for your hiring flow. <span>Google and email login supported.</span>
            </motion.p>
          </motion.div>

          <motion.p
            className="sr-only"
            initial="hidden"
            animate="visible"
            variants={reveal}
            transition={{ duration: 0.45 }}
          >
            Dashboard screenshot
          </motion.p>

          <motion.div className="lp-hero-visual" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}>
            <div className="lp-product-shot">
              <div className="lp-shot-top">
                <span />
                <span />
                <span />
              </div>
              <div className="lp-shot-grid">
                <div className="lp-shot-card">
                  <p>Applications</p>
                  <strong>428</strong>
                </div>
                <div className="lp-shot-card">
                  <p>Screened Today</p>
                  <strong>84</strong>
                </div>
                <div className="lp-shot-row" />
                <div className="lp-shot-row" />
                <div className="lp-shot-row" />
              </div>
            </div>
            <div className="lp-floating-tag lp-tag-one">Resume Analysis</div>
            <div className="lp-floating-tag lp-tag-two">Workflow Health</div>
            <div className="lp-floating-tag lp-tag-three">Candidate Status</div>
          </motion.div>
        </section>

        <section className="lp-section lp-automation-live" id="automation-live">
          <div className="lp-section-head">
            <h2>See automation running in real time</h2>
          </div>

          <div className="lp-live-layout">
            <motion.article
              className="lp-live-video-shell"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.25 }}
              variants={reveal}
              transition={{ duration: 0.4 }}
            >
              <header className="lp-live-topbar">
                <div className="lp-live-dot-row">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="lp-live-status"><Zap size={14} /> Automation Active</div>
              </header>

              <div className="lp-live-canvas">
                <div className="lp-live-rail" />

                {automationStages.map((stage, index) => {
                  const Icon = stage.icon;
                  return (
                    <motion.div
                      key={stage.title}
                      className={`lp-live-node lp-live-node-${stage.state}`}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: index * 0.08 }}
                    >
                      <div className="lp-live-point">{index + 1}</div>
                      <div className="lp-live-node-icon"><Icon size={16} /></div>
                      <div className="lp-live-node-copy">
                        <strong>{stage.title}</strong>
                        <p>{stage.description}</p>
                        <div className="lp-live-progress">
                          <span style={{ width: `${stage.progress}%` }} />
                        </div>
                      </div>
                      <div className={`lp-live-mini-preview lp-live-mini-${stage.preview}`} aria-hidden="true">
                        <span />
                        <span />
                        <span />
                      </div>
                      <div className="lp-live-node-meta">
                        <span className="lp-live-metric">{stage.metric}</span>
                        <span className={`lp-live-state-chip lp-live-state-chip-${stage.state}`}>
                          {stage.state === 'done' ? 'Green' : stage.state === 'running' ? 'Running' : 'Red'}
                        </span>
                      </div>
                      {index < automationStages.length - 1 && <div className="lp-live-next-flow" aria-hidden="true" />}
                    </motion.div>
                  );
                })}

                <div className="lp-live-pulse-dot lp-live-pulse-a" />
                <div className="lp-live-pulse-dot lp-live-pulse-b" />
              </div>
            </motion.article>

            <motion.aside
              className="lp-live-feed"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={reveal}
              transition={{ duration: 0.42, delay: 0.08 }}
            >
              <div className="lp-live-feed-head">
                <span className="lp-live-chip">Event Stream</span>
                <h3>Hiring automation feed</h3>
                <p>Like a live operations panel: every trigger, parse, and update flowing instantly.</p>
              </div>
              <ul className="lp-live-event-list">
                {liveEvents.map((event, index) => (
                  <li key={event} style={{ '--event-delay': `${index * 1.3}s` } as React.CSSProperties}>
                    <span className="lp-live-event-dot" />
                    {event}
                  </li>
                ))}
              </ul>
            </motion.aside>
          </div>
        </section>

        <section className="lp-section" id="workflow">
          <div className="lp-section-head">
            <h2>How it works</h2>
          </div>
          <div className="lp-steps-grid">
            {stepItems.map((item, index) => (
              <motion.article key={item.title} className="lp-step-card" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }} variants={reveal} transition={{ duration: 0.35, delay: index * 0.08 }}>
                <div className="lp-step-badge">{index + 1}</div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </motion.article>
            ))}
          </div>
        </section>

        <section className="lp-section" id="features">
          <div className="lp-section-head">
            <h2>Feature depth that feels real</h2>
          </div>
          <div className="lp-feature-grid">
            {featureItems.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.article key={feature.title} className="lp-feature-card" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }} variants={reveal} transition={{ duration: 0.35, delay: index * 0.08 }}>
                  <div className="lp-feature-top">
                    <div className="lp-feature-icon"><Icon size={16} /></div>
                    <h3>{feature.title}</h3>
                  </div>
                  <ul>
                    {feature.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                </motion.article>
              );
            })}
          </div>
        </section>

        <section className="lp-section lp-security" id="security">
          <div className="lp-security-badge"><Lock size={16} /> Security</div>
          <h2>Protected access with Firebase authentication</h2>
          <p>
            Google and email login are available by default, with secure account handling ready for role-based scaling.
          </p>
        </section>

        <section className="lp-section lp-final-cta" id="contact">
          <h2>Ready to simplify your hiring workflow?</h2>
          <p>Track applications, analyze resumes, and move faster with one AI-first hiring system.</p>
          <div className="lp-actions">
            <Link to={user ? '/dashboard' : '/login'} className="lp-btn lp-btn-primary">
              {user ? 'Open Dashboard' : 'Login to Dashboard'}
            </Link>
            <a href="#features" className="lp-btn lp-btn-secondary">Explore features</a>
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="lp-footer-brand">JobFlow AI</div>
        <div className="lp-footer-links">
          <a href="#automation-live">Live Demo</a>
          <a href="#features">Features</a>
          <a href="#workflow">How it works</a>
          <Link to="/login">Login</Link>
          <a href="#contact">Contact</a>
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
        </div>
      </footer>
    </div>
  );
}
