import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

const TRUST_LOGOS = ['Google', 'Microsoft', 'Amazon', 'Airbnb', 'Spotify'];

const STEPS = [
  { icon: 'fa-brands fa-github', title: 'Connect', desc: 'Link your GitHub account securely.' },
  { icon: 'fa-solid fa-code-branch', title: 'Analyze', desc: 'We analyze your code, commits, and PRs.' },
  { icon: 'fa-solid fa-file-lines', title: 'Generate', desc: 'Get a professional, ATS-optimized resume.' },
];

function ResumeMockup() {
  return (
    <div className="relative mx-auto max-w-md animate-float">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
        <div className="border-b border-gray-100 pb-4">
          <div className="h-3 w-32 rounded bg-gray-900" />
          <div className="mt-2 h-2 w-24 rounded bg-gray-200" />
        </div>
        <div className="mt-4 space-y-2">
          {[100, 85, 70].map((w) => (
            <div key={w} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#7C3AED]" />
              <div className="h-2 rounded-full bg-gray-100" style={{ width: `${w}%` }} />
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-medium text-[#7C3AED]">React</span>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-600">Node.js</span>
        </div>
      </div>
      <span className="absolute -left-4 top-8 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-md">
        Analyzed from commits & PRs
      </span>
      <span className="absolute -right-2 top-1/3 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-md">
        Impact-focused bullets
      </span>
      <span className="absolute -bottom-2 left-1/4 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 shadow-md">
        ATS-optimized
      </span>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="cursor-pointer text-lg font-bold text-gray-900">
            <span className="cursor-pointer">
              <Link to="/dashboard">
              GitHired
              </Link>
            </span>
          </span>
          <nav className="hidden items-center gap-8 text-sm text-gray-500 md:flex">
            <a href="#how-it-works" className="cursor-pointer hover:text-gray-900">How it works</a>
            <a href="#features" className="cursor-pointer hover:text-gray-900">Features</a>
            <Link to="/dashboard" className="cursor-pointer hover:text-gray-900">Dashboard</Link>
          </nav>
          <Link to="/connect" className="btn-primary !rounded-lg !px-4 !py-2 !text-sm">
            Get Started
          </Link>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-6 py-16 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <span className="badge-purple">
                <Sparkles className="h-3.5 w-3.5" />
                AI-Powered
              </span>
              <h1 className="mt-6 text-5xl font-bold leading-tight tracking-tight text-gray-900 lg:text-[3.5rem]">
                Turn your GitHub into a{' '}
                <em className="italic text-[#7C3AED]">job-winning</em> resume.
              </h1>
              <p className="mt-6 max-w-lg text-sm leading-relaxed text-gray-500">
                We analyze your code, commits, and projects to automatically create ATS-optimized resumes that get you noticed.
              </p>
              <Link to="/connect" className="btn-primary mt-8">
                <i className="fa-brands fa-github" />
                Connect GitHub
              </Link>
              <p className="mt-4 text-sm text-gray-400">No credit card required</p>
              <div className="mt-10">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                  Trusted by developers from
                </p>
                <div className="mt-3 flex flex-wrap gap-6 text-sm font-semibold text-gray-300">
                  {TRUST_LOGOS.map((logo) => (
                    <span key={logo} className="text-gray-400">{logo}</span>
                  ))}
                </div>
              </div>
            </div>
            <ResumeMockup />
          </div>
        </section>

        <section id="how-it-works" className="border-t border-gray-200 bg-gray-50 py-16">
          <div className="mx-auto grid max-w-6xl gap-8 px-6 md:grid-cols-3">
            {STEPS.map((item) => (
              <div key={item.title} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-50 text-[#7C3AED]">
                  <i className={`${item.icon} text-lg`} />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-2 text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="features" className="py-16">
          <div className="mx-auto max-w-6xl px-6 text-center">
            <h2 className="text-2xl font-semibold text-gray-900">Built for developers who ship</h2>
            <p className="mt-2 text-sm text-gray-500">From GitHub activity to interview-ready PDF in minutes.</p>
          </div>
        </section>
      </main>
    </div>
  );
}
