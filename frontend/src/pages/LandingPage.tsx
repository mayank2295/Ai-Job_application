
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bot, Zap, TrendingUp, ShieldCheck, ArrowRight } from 'lucide-react';
import './LandingPage.css';

export default function LandingPage() {
  return (
    <div className="landing-page">
      {/* Background Elements */}
      <div className="bg-glow bg-glow-1"></div>
      <div className="bg-glow bg-glow-2"></div>
      
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="landing-logo">
          <Bot size={28} className="logo-icon" />
          <span>JobFlow AI</span>
        </div>
        <div className="landing-links">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it Works</a>
          <Link to="/dashboard" className="btn-primary-sm">Open App</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <motion.div 
          className="hero-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="badge">🚀 The Future of Job Hunting</div>
          <h1 className="hero-title">
            Automate Your Job Search with <span className="gradient-text">Advanced AI</span>
          </h1>
          <p className="hero-subtitle">
            JobFlow AI is an intelligent agent that auto-applies to jobs, tracks your progress, and generates custom resumes for every application. 
          </p>
          <div className="hero-cta">
            <Link to="/dashboard" className="btn-primary glass-effect">
              Get Started <ArrowRight size={20} />
            </Link>
            <a href="#features" className="btn-secondary">Learn More</a>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="section-header">
          <h2>Supercharge your career</h2>
          <p>Everything you need to land your dream job faster.</p>
        </div>
        <div className="features-grid">
          <motion.div className="feature-card" whileHover={{ y: -10 }}>
            <div className="icon-wrapper"><Zap size={24} /></div>
            <h3>Auto Apply</h3>
            <p>Automatically applies to matching jobs on popular platforms while you sleep.</p>
          </motion.div>
          <motion.div className="feature-card" whileHover={{ y: -10 }}>
            <div className="icon-wrapper"><Bot size={24} /></div>
            <h3>AI Resumes</h3>
            <p>Tailors your resume and cover letter for each specific job description instantly.</p>
          </motion.div>
          <motion.div className="feature-card" whileHover={{ y: -10 }}>
            <div className="icon-wrapper"><TrendingUp size={24} /></div>
            <h3>Track Everything</h3>
            <p>Visual dashboard tracking interviews, offers, and all metrics in real time.</p>
          </motion.div>
          <motion.div className="feature-card" whileHover={{ y: -10 }}>
            <div className="icon-wrapper"><ShieldCheck size={24} /></div>
            <h3>Privacy First</h3>
            <p>Your data is processed locally and securely. We never sell your personal info.</p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <Bot size={24} className="logo-icon" />
            <span>JobFlow AI</span>
          </div>
          <p>© 2026 JobFlow AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}