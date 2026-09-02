import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function AuthPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setTimeout(() => {
      setIsLoading(false)
      navigate('/dashboard')
    }, 1200)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 overflow-hidden relative bg-surface">
      {/* Ambient Glows */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="soft-glow absolute -top-48 -left-48 w-[600px] h-[600px] rounded-full"></div>
        <div className="soft-glow absolute -bottom-48 -right-48 w-[600px] h-[600px] rounded-full"></div>
      </div>

      {/* Auth Shell */}
      <main className="w-full max-w-[1100px] min-h-[700px] bg-surface-container-lowest rounded-xl flex overflow-hidden z-10 shadow-[0_2px_4px_rgba(0,0,0,0.02),_0_10px_20px_rgba(0,0,0,0.04)] border border-[#E8EDF2]">
        
        {/* Left: AI Illustration Panel */}
        <aside className="hidden lg:flex flex-col justify-between w-[480px] bg-surface-container-low p-12 relative overflow-hidden">
          <div className="absolute inset-0 opacity-40">
            <div
              className="w-full h-full bg-cover bg-center"
              style={{
                backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuBFctuMdD9ZIIZvGXUFlOTYncoPdyPQz-qQy_i854jv0wbZG3wtUq1pPfPRNZNUDZZPH7hJHNMLrJqUMmwNFIEzRFyaCB4Z1XFv1IxuR6Qukbcpkl-8_XRUN0Eg1f8lXN6y-K6D1XXNYFY3yeu-NYP-ZwoW3pUskVHEm63y3AonIWf-Tu_FM5IekvdKDYuloEBVSNALTZs4ajdwccIWAfTTITR0ehW9OgJ9NkzxPcQpA1HRvWkohVax')`
              }}
            />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-12">
              <span className="material-symbols-outlined text-primary text-[32px]">hub</span>
              <h1 className="font-bold tracking-tight text-on-surface text-2xl">Avenor OS</h1>
            </div>
            <div className="space-y-4">
              <h2 className="text-[48px] font-semibold text-on-surface leading-tight tracking-tight">
                Context Before <span className="text-primary">Intelligence.</span>
              </h2>
              <p className="text-[18px] leading-[28px] text-on-surface-variant max-w-[320px]">
                The future of enterprise data orchestration. A seamless extension of your professional workflow.
              </p>
            </div>
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-4">
              <div className="h-[1px] w-12 bg-outline-variant"></div>
              <span className="text-[11px] font-semibold text-outline uppercase tracking-widest">Enterprise Edition 4.0</span>
            </div>
          </div>
        </aside>

        {/* Right: Form Area */}
        <section className="flex-1 flex flex-col justify-center px-10 py-12 bg-surface-container-lowest">
          <div className="max-w-[400px] mx-auto w-full">
            {/* Form Header */}
            <div className="mb-6">
              <h3 className="text-[30px] font-semibold leading-[38px] tracking-tight text-on-surface mb-1">Welcome back</h3>
              <p className="text-[14px] leading-[20px] text-on-surface-variant">Sign in to your enterprise workstation</p>
            </div>

            {/* Social Auth */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button className="flex items-center justify-center gap-2 px-4 py-[10px] border border-outline-variant rounded-lg text-[12px] font-medium text-on-surface hover:bg-surface-container-low transition-all active:scale-[0.98]">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032 s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12 s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" fill="currentColor"/>
                </svg>
                Google
              </button>
              <button className="flex items-center justify-center gap-2 px-4 py-[10px] border border-outline-variant rounded-lg text-[12px] font-medium text-on-surface hover:bg-surface-container-low transition-all active:scale-[0.98]">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" fill="currentColor"/>
                </svg>
                GitHub
              </button>
            </div>

            {/* Separator */}
            <div className="relative mb-6 flex items-center">
              <div className="flex-grow border-t border-outline-variant"></div>
              <span className="flex-shrink mx-4 text-[12px] text-outline">or continue with email</span>
              <div className="flex-grow border-t border-outline-variant"></div>
            </div>

            {/* Email Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-on-surface-variant mb-1" htmlFor="email">Business Email</label>
                <input
                  className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg text-[16px] focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-outline/50"
                  id="email"
                  placeholder="name@company.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[12px] font-medium text-on-surface-variant" htmlFor="password">Password</label>
                  <a className="text-[12px] text-primary hover:underline" href="#">Forgot password?</a>
                </div>
                <input
                  className="w-full px-4 py-3 bg-surface border border-outline-variant rounded-lg text-[16px] focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-outline/50"
                  id="password"
                  placeholder="••••••••"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-primary text-on-primary py-3 rounded-lg text-[14px] font-semibold hover:bg-primary-container transition-all active:scale-[0.99] shadow-md flex items-center justify-center gap-2 mt-6 disabled:opacity-70"
              >
                {isLoading ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                    Authenticating...
                  </>
                ) : (
                  <>
                    Sign In to Workspace
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </>
                )}
              </button>
            </form>

            {/* AI Context Bar */}
            <div className="mt-12 p-4 bg-surface-container-low rounded-lg border border-outline-variant/30 relative overflow-hidden">
              <div className="shimmer-bar absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px] animate-pulse">auto_awesome</span>
                <p className="text-[12px] text-on-surface-variant">
                  AI Shield Active: <span className="text-on-surface font-semibold">Ready for biometric handshake</span>
                </p>
              </div>
            </div>

            <p className="mt-12 text-center text-[14px] text-on-surface-variant">
              Don't have an enterprise account?{' '}
              <a className="text-primary font-semibold hover:underline" href="#">Contact Sales</a>
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="absolute bottom-4 left-0 w-full text-center pointer-events-none">
        <p className="text-[11px] font-semibold text-outline opacity-60 tracking-widest uppercase">
          © 2024 AVENOR TECHNOLOGIES • PRIVACY • SECURITY • COMPLIANCE
        </p>
      </footer>
    </div>
  )
}