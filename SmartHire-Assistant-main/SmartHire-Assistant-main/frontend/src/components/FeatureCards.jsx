const features = [
  {
    icon: '💬',
    title: 'AI Chatbot',
    desc: 'JD-anchored conversations powered by Claude. Answers role, team, culture, and company questions accurately.',
    color: 'from-indigo-50 to-purple-50 border-indigo-100',
    iconBg: 'bg-indigo-100',
  },
  {
    icon: '📄',
    title: 'Resume Matching',
    desc: 'Upload a PDF resume and get an instant match score — skills (50%), experience (30%), education (20%).',
    color: 'from-emerald-50 to-teal-50 border-emerald-100',
    iconBg: 'bg-emerald-100',
  },
  {
    icon: '📊',
    title: 'Recruiter Dashboard',
    desc: 'View all candidates ranked by match %, manage JDs, see analytics, and identify top talent instantly.',
    color: 'from-amber-50 to-orange-50 border-amber-100',
    iconBg: 'bg-amber-100',
  },
]

export default function FeatureCards() {
  return (
    <section id="features" className="py-20 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Everything You Need to Hire Better
          </h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            From first contact to final match — SmartHire handles the entire candidate engagement pipeline.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map(f => (
            <div key={f.title}
              className={`rounded-2xl border bg-gradient-to-br ${f.color} p-8 hover:shadow-md transition-shadow`}>
              <div className={`w-12 h-12 ${f.iconBg} rounded-xl flex items-center justify-center text-2xl mb-5`}>
                {f.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{f.title}</h3>
              <p className="text-gray-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
