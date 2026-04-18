import Navbar from '../components/Navbar'
import HeroSection from '../components/HeroSection'
import FeatureCards from '../components/FeatureCards'
import Footer from '../components/Footer'

const steps = [
  { num: '01', title: 'Post a Job', desc: 'Recruiter uploads a JD. System instantly makes it available to candidates.' },
  { num: '02', title: 'Candidates Engage', desc: 'Candidates chat with AI, ask questions, and express interest — all anchored to the JD.' },
  { num: '03', title: 'Upload Resume', desc: 'Interested candidates upload their PDF resume for instant AI-powered analysis.' },
  { num: '04', title: 'Get Ranked', desc: 'Recruiters see all candidates ranked by match % with skill gap analysis.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <FeatureCards />

      {/* How it works */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-gray-500 text-lg">Four simple steps from JD to ranked candidates</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {steps.map(s => (
              <div key={s.num} className="text-center">
                <div className="w-12 h-12 bg-primary-600 text-white rounded-2xl flex items-center justify-center text-sm font-bold mx-auto mb-4">
                  {s.num}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">About Wissen Technology</h2>
          <p className="text-gray-600 text-lg leading-relaxed mb-8">
            Founded in 2015, Wissen Technology delivers niche, custom-built products solving complex business challenges worldwide.
            With 2000+ employees across US, UK, UAE, India, and Australia, we deliver <strong>2X impact</strong> compared to traditional service providers.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { v: '2015', l: 'Founded' },
              { v: '2000+', l: 'Employees' },
              { v: '5', l: 'Global Offices' },
              { v: '2X', l: 'Impact Delivered' },
            ].map(s => (
              <div key={s.l} className="bg-gray-50 rounded-xl p-4">
                <div className="text-2xl font-black text-primary-600">{s.v}</div>
                <div className="text-sm text-gray-500 mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
