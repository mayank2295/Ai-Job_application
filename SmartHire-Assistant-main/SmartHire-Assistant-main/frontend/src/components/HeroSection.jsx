import { Link } from 'react-router-dom'

export default function HeroSection() {
  return (
    <section className="bg-gradient-to-br from-navy-900 via-navy-800 to-primary-900 text-white py-24 px-4">
      <div className="max-w-5xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-1.5 mb-8">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          <span className="text-sm text-gray-200">Powered by Claude AI · Wissen Technology Hackathon 2026</span>
        </div>

        <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6 tracking-tight">
          Hire Smarter <br />
          <span className="text-gold">with AI</span>
        </h1>

        <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed">
          Engage candidates, analyze resumes, and find the perfect match instantly.
          AI-powered conversations anchored to your Job Description.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/signup"
            className="bg-gold hover:bg-yellow-500 text-navy-900 font-bold px-8 py-3.5 rounded-xl text-base transition-all hover:shadow-lg hover:-translate-y-0.5">
            Get Started Free
          </Link>
          <Link to="/login"
            className="border-2 border-white/40 hover:border-white text-white font-semibold px-8 py-3.5 rounded-xl text-base transition-all hover:bg-white/10">
            Try Demo →
          </Link>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
          {[
            { value: '2000+', label: 'Employees' },
            { value: 'AI-First', label: 'Platform' },
            { value: '3 Roles', label: 'Dashboards' },
          ].map(stat => (
            <div key={stat.label}>
              <div className="text-2xl font-bold text-gold">{stat.value}</div>
              <div className="text-sm text-gray-400 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
