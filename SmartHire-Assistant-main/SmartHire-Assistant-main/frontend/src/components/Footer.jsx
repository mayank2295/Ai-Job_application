export default function Footer() {
  return (
    <footer className="bg-navy-900 text-gray-400 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-gold rounded-md flex items-center justify-center">
                <span className="text-navy-900 font-bold text-xs">SH</span>
              </div>
              <span className="text-white font-bold text-lg">SmartHire</span>
            </div>
            <p className="text-sm leading-relaxed">
              AI-powered candidate engagement platform built for Wissen Technology Hackathon 2026.
            </p>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#about" className="hover:text-white transition-colors">About</a></li>
              <li><a href="/login" className="hover:text-white transition-colors">Login</a></li>
              <li><a href="/signup" className="hover:text-white transition-colors">Sign Up</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-3">Wissen Technology</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="https://www.wissen.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Website</a></li>
              <li><a href="https://www.linkedin.com/company/wissen-technology" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">LinkedIn</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 pt-6 text-center text-sm">
          © 2026 SmartHire · Built for Wissen Technology Hackathon 2026
        </div>
      </div>
    </footer>
  )
}
