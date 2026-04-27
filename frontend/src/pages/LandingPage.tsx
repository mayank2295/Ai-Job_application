import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, Bot, FileText, SquareCheck, Mic, ChartBar,
  Globe, Zap, Star, Users, TrendingUp, Shield, Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './LandingPage.css';

const reveal = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const companies = ['Infosys', 'Wipro', 'TCS', 'HCL', 'Accenture', 'Cognizant', 'Capgemini', 'Tech Mahindra'];

const features = [
  { icon: FileText, title: 'AI Resume Screening', desc: 'Automatically parse and score resumes against job requirements. Save hours of manual review.' },
  { icon: Mic, title: 'Mock Interviews', desc: 'Practice with AI-powered mock interviews. Get instant feedback on your answers and delivery.' },
  { icon: SquareCheck, title: 'ATS Analyzer', desc: 'Check your resume against ATS systems. Optimize keywords and formatting for better pass rates.' },
  { icon: Bot, title: 'Career Bot', desc: 'Get personalized career advice, job search tips, and interview prep from your AI career coach.' },
  { icon: ChartBar, title: 'Skill Assessment', desc: 'Take role-specific skill quizzes. Identify gaps and get curated learning recommendations.' },
  { icon: Globe, title: 'Job Board', desc: 'Browse curated job listings. Apply directly and track your applications in one place.' },
];

const steps = [
  { num: '01', title: 'Create your profile', desc: 'Sign up with Google or email. Complete your profile with your skills, experience, and career goals.' },
  { num: '02', title: 'Use AI-powered tools', desc: 'Analyze your resume, practice interviews, assess your skills, and get personalized career guidance.' },
  { num: '03', title: 'Land your dream job', desc: 'Apply to jobs with confidence. Track applications and get notified at every stage of the process.' },
];

const testimonials = [
  { name: 'Priya Sharma', role: 'Software Engineer at Google', text: 'The ATS analyzer helped me rewrite my resume and I got 3x more callbacks. The mock interview feature is incredibly realistic.' },
  { name: 'Rahul Verma', role: 'Product Manager at Flipkart', text: 'JobFlow AI career bot gave me advice that my mentors never could. It helped me transition from engineering to product management.' },
  { name: 'Ananya Patel', role: 'Data Scientist at Amazon', text: 'The skill assessment pinpointed exactly what I needed to learn. Within 2 months of following the recommendations, I landed my dream role.' },
];

export default function LandingPage() {
  const { user, isAdmin } = useAuth();
  const dashboardPath = isAdmin ? '/admin/dashboard' : '/jobs';

  return (
    <div className="lp-page">
      {/* Header */}
      <header className="lp-header">
        <div className="lp-brand">
          <Zap size={20} color="#6366f1" />
          <span>JobFlow AI</span>
        </div>
        <nav className="lp-nav-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
          <a href="#pricing">Pricing</a>
          <a href="#testimonials">Reviews</a>
        </nav>
        <div className="lp-header-actions">
          {user ? (
            <Link to={dashboardPath} className="lp-btn lp-btn-primary">
              Go to Dashboard <ArrowRight size={15} />
            </Link>
          ) : (
            <>
              <Link to="/login" className="lp-btn lp-btn-ghost">Log in</Link>
              <Link to="/login" className="lp-btn lp-btn-primary">Get Started Free</Link>
            </>
          )}
        </div>
      </header>

      <main className="lp-main">
        {/* Hero */}
        <section className="lp-hero" id="hero">
          <motion.div className="lp-hero-copy" initial="hidden" animate="visible" variants={stagger}>
            <motion.div className="lp-kicker" variants={reveal}>
              <Star size={13} /> Trusted by 500+ companies across India
            </motion.div>
            <motion.h1 className="lp-title" variants={reveal}>
              The AI-powered hiring platform for modern teams
            </motion.h1>
            <motion.p className="lp-subtitle" variants={reveal}>
              JobFlow AI helps candidates land jobs faster and helps recruiters hire smarter. From resume analysis to mock interviews - everything you need in one place.
            </motion.p>
            <motion.div className="lp-actions" variants={reveal}>
              <Link to={user ? dashboardPath : '/login'} className="lp-btn lp-btn-primary lp-btn-lg">
                {user ? 'Open Dashboard' : 'Get Started Free'} <ArrowRight size={16} />
              </Link>
              <a href="#how-it-works" className="lp-btn lp-btn-secondary lp-btn-lg">See how it works</a>
            </motion.div>
            <motion.p className="lp-microcopy" variants={reveal}>
              Free forever plan available. No credit card required.
            </motion.p>
          </motion.div>

          <motion.div className="lp-hero-visual" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
            <div className="lp-hero-card">
              <div className="lp-hero-card-header">
                <div className="lp-hero-card-dots"><span /><span /><span /></div>
                <span className="lp-hero-card-title">AI Resume Score</span>
              </div>
              <div className="lp-hero-card-body">
                <div className="lp-score-ring">
                  <svg viewBox="0 0 80 80" width="80" height="80">
                    <circle cx="40" cy="40" r="34" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                    <circle cx="40" cy="40" r="34" fill="none" stroke="#6366f1" strokeWidth="8"
                      strokeDasharray="213.6" strokeDashoffset="42.7" strokeLinecap="round"
                      transform="rotate(-90 40 40)" />
                  </svg>
                  <div className="lp-score-text">82%</div>
                </div>
                <div className="lp-score-details">
                  <div className="lp-score-row"><span>Keywords match</span><span className="lp-score-good">Good</span></div>
                  <div className="lp-score-row"><span>ATS compatibility</span><span className="lp-score-good">High</span></div>
                  <div className="lp-score-row"><span>Formatting</span><span className="lp-score-warn">Improve</span></div>
                  <div className="lp-score-row"><span>Skills coverage</span><span className="lp-score-good">Strong</span></div>
                </div>
              </div>
            </div>
            <div className="lp-hero-badge lp-badge-1"><TrendingUp size={13} /> 3x more callbacks</div>
            <div className="lp-hero-badge lp-badge-2"><Users size={13} /> 500+ companies hiring</div>
          </motion.div>
        </section>

        {/* Social proof */}
        <section className="lp-social-proof">
          <p className="lp-social-label">Trusted by teams at</p>
          <div className="lp-companies">
            {companies.map(c => (
              <span key={c} className="lp-company-name">{c}</span>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="lp-section" id="features">
          <motion.div className="lp-section-head" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.p className="lp-section-label" variants={reveal}>Features</motion.p>
            <motion.h2 variants={reveal}>Everything you need to succeed</motion.h2>
            <motion.p className="lp-section-sub" variants={reveal}>
              From AI resume screening to mock interviews, JobFlow AI has all the tools candidates and recruiters need.
            </motion.p>
          </motion.div>
          <div className="lp-feature-grid">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div key={f.title} className="lp-feature-card" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={reveal} transition={{ delay: i * 0.07 }}>
                  <div className="lp-feature-icon"><Icon size={20} /></div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* How it works */}
        <section className="lp-section lp-how-section" id="how-it-works">
          <motion.div className="lp-section-head" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.p className="lp-section-label" variants={reveal}>How it works</motion.p>
            <motion.h2 variants={reveal}>Get started in minutes</motion.h2>
          </motion.div>
          <div className="lp-steps-grid">
            {steps.map((step, i) => (
              <motion.div key={step.num} className="lp-step-card" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={reveal} transition={{ delay: i * 0.1 }}>
                <div className="lp-step-num">{step.num}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section className="lp-section" id="pricing">
          <motion.div className="lp-section-head" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.p className="lp-section-label" variants={reveal}>Pricing</motion.p>
            <motion.h2 variants={reveal}>Simple, transparent pricing</motion.h2>
          </motion.div>
          <div className="lp-pricing-grid">
            <motion.div className="lp-pricing-card" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={reveal}>
              <div className="lp-pricing-name">Free</div>
              <div className="lp-pricing-price">
                <span className="lp-price-amount">0</span>
                <span className="lp-price-currency">INR</span>
                <span className="lp-price-period">/month</span>
              </div>
              <p className="lp-pricing-desc">Perfect for getting started with your job search.</p>
              <ul className="lp-pricing-features">
                {['Job board access', 'Basic resume analysis', '3 mock interviews/month', 'Career bot (limited)', 'Application tracking'].map(f => (
                  <li key={f}><Check size={15} /> {f}</li>
                ))}
              </ul>
              <Link to="/login" className="lp-btn lp-btn-secondary" style={{ width: '100%', justifyContent: 'center', marginTop: 'auto' }}>Get started free</Link>
            </motion.div>

            <motion.div className="lp-pricing-card lp-pricing-featured" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={reveal} transition={{ delay: 0.1 }}>
              <div className="lp-pricing-badge">Most Popular</div>
              <div className="lp-pricing-name">Pro</div>
              <div className="lp-pricing-price">
                <span className="lp-price-amount">999</span>
                <span className="lp-price-currency">INR</span>
                <span className="lp-price-period">/month</span>
              </div>
              <p className="lp-pricing-desc">For serious job seekers who want every advantage.</p>
              <ul className="lp-pricing-features">
                {['Everything in Free', 'Unlimited mock interviews', 'Advanced ATS analyzer', 'Resume builder (4 templates)', 'Priority career bot', 'Skill assessments', 'Course recommendations', 'Web search integration'].map(f => (
                  <li key={f}><Check size={15} /> {f}</li>
                ))}
              </ul>
              <Link to="/login" className="lp-btn lp-btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 'auto' }}>Start free trial</Link>
            </motion.div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="lp-section" id="testimonials">
          <motion.div className="lp-section-head" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.p className="lp-section-label" variants={reveal}>Testimonials</motion.p>
            <motion.h2 variants={reveal}>Loved by job seekers</motion.h2>
          </motion.div>
          <div className="lp-testimonials-grid">
            {testimonials.map((t, i) => (
              <motion.div key={t.name} className="lp-testimonial-card" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={reveal} transition={{ delay: i * 0.1 }}>
                <div className="lp-testimonial-stars">
                  {[1,2,3,4,5].map(s => <Star key={s} size={14} fill="#f59e0b" color="#f59e0b" />)}
                </div>
                <p className="lp-testimonial-text">"{t.text}"</p>
                <div className="lp-testimonial-author">
                  <div className="lp-testimonial-avatar">{t.name.charAt(0)}</div>
                  <div>
                    <div className="lp-testimonial-name">{t.name}</div>
                    <div className="lp-testimonial-role">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="lp-cta-section">
          <motion.div className="lp-cta-inner" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.div className="lp-cta-icon" variants={reveal}><Shield size={28} color="#6366f1" /></motion.div>
            <motion.h2 variants={reveal}>Start your free trial today</motion.h2>
            <motion.p variants={reveal}>Join thousands of job seekers and recruiters already using JobFlow AI. No credit card required.</motion.p>
            <motion.div className="lp-actions" style={{ justifyContent: 'center' }} variants={reveal}>
              <Link to={user ? dashboardPath : '/login'} className="lp-btn lp-btn-primary lp-btn-lg">
                {user ? 'Go to Dashboard' : 'Get Started Free'} <ArrowRight size={16} />
              </Link>
              <a href="#features" className="lp-btn lp-btn-secondary lp-btn-lg">Explore features</a>
            </motion.div>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <Zap size={18} color="#6366f1" />
            <span>JobFlow AI</span>
          </div>
          <div className="lp-footer-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How it works</a>
            <a href="#pricing">Pricing</a>
            <Link to="/login">Login</Link>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
          </div>
          <div className="lp-footer-copy">
            2024 JobFlow AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
