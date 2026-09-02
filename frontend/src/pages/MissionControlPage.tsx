import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'

// WebGL neural-net background shader
function CinematicShader() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const syncSize = () => {
      const w = canvas.clientWidth || 1280
      const h = canvas.clientHeight || 720
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
    }

    const ro = new ResizeObserver(syncSize)
    ro.observe(canvas)
    syncSize()

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null
    if (!gl) return

    const vs = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`
    const fs = `precision highp float;
varying vec2 v_texCoord;
uniform float u_time;
uniform vec2 u_resolution;

float network(vec2 uv, float t) {
    vec2 p = uv * 8.0;
    vec2 i = floor(p);
    vec2 f = fract(p);
    float dist = 1.0;
    for(int y=-1; y<=1; y++) {
        for(int x=-1; x<=1; x++) {
            vec2 neighbor = vec2(float(x), float(y));
            vec2 point = 0.5 + 0.3 * sin(t + 6.2831 * fract(sin(dot(i + neighbor, vec2(12.9898, 78.233))) * 43758.5453));
            float d = length(neighbor + point - f);
            dist = min(dist, d);
        }
    }
    return smoothstep(0.05, 0.0, dist) * 0.2;
}

void main() {
    vec2 uv = v_texCoord;
    float t = u_time * 0.2;
    vec3 bgColor = vec3(0.98, 0.984, 0.988);
    vec3 accentColor = vec3(0.145, 0.388, 0.922);
    float net = network(uv, t);
    float glow = 0.05 / length(uv - 0.5);
    vec3 color = mix(bgColor, accentColor, net + glow * 0.02);
    gl_FragColor = vec4(color, 1.0);
}`

    const createShader = (type: number, src: string) => {
      const s = gl.createShader(type)!
      gl.shaderSource(s, src)
      gl.compileShader(s)
      return s
    }

    const prog = gl.createProgram()!
    gl.attachShader(prog, createShader(gl.VERTEX_SHADER, vs))
    gl.attachShader(prog, createShader(gl.FRAGMENT_SHADER, fs))
    gl.linkProgram(prog)
    gl.useProgram(prog)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)

    const pos = gl.getAttribLocation(prog, 'a_position')
    gl.enableVertexAttribArray(pos)
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0)

    const uTime = gl.getUniformLocation(prog, 'u_time')
    const uRes = gl.getUniformLocation(prog, 'u_resolution')

    let animId: number
    const render = (t: number) => {
      syncSize()
      gl.viewport(0, 0, canvas.width, canvas.height)
      if (uTime) gl.uniform1f(uTime, t * 0.001)
      if (uRes) gl.uniform2f(uRes, canvas.width, canvas.height)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      animId = requestAnimationFrame(render)
    }
    animId = requestAnimationFrame(render)

    return () => {
      ro.disconnect()
      cancelAnimationFrame(animId)
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
}

const recentInvestigations = [
  {
    icon: 'monitoring',
    status: 'Completed',
    statusColor: 'bg-green-100 text-green-700',
    title: 'Fiscal Year Delta Analysis',
    desc: 'Uncovered a 4.2% discrepancy in overhead allocation across APAC units.',
    time: '2 hours ago',
  },
  {
    icon: 'security',
    status: 'Archived',
    statusColor: 'bg-blue-100 text-blue-700',
    title: 'Threat Vector Map v2',
    desc: 'Comprehensive audit of external API endpoints and permissions.',
    time: '1 day ago',
  },
]

const platformHealth = [
  { icon: 'memory', label: 'Neural Load', value: '42%' },
  { icon: 'storage', label: 'Vector Indexing', value: 'Optimal' },
  { icon: 'hub', label: 'Node Sync', value: '99.9%' },
]

export default function MissionControlPage() {
  return (
    <div className="relative min-h-full">
      {/* Background Shader */}
      <div className="fixed inset-0 ml-[280px] mt-16 z-0 opacity-40 pointer-events-none">
        <CinematicShader />
      </div>

      <div className="relative z-10 p-6 max-w-[1440px] mx-auto flex flex-col gap-12">
        {/* Command Bar */}
        <section className="mt-12 flex flex-col items-center">
          <div className="ai-glow -translate-y-1/2 left-1/2 -translate-x-1/2 absolute" style={{ top: 0, left: '50%' }}></div>
          <h2 className="text-[48px] font-semibold text-on-surface text-center mb-6 max-w-3xl leading-tight tracking-tight">
            What would you like Avenor to investigate today?
          </h2>
          <div className="w-full max-w-3xl glass-card rounded-2xl p-4 flex items-center gap-4 transition-all hover:border-primary-container shadow-xl">
            <div className="p-3 bg-primary/5 rounded-xl text-primary">
              <span className="material-symbols-outlined text-[28px]">search_spark</span>
            </div>
            <input
              className="flex-1 bg-transparent border-none focus:ring-0 text-[18px] leading-[28px] text-on-surface placeholder:text-on-surface-variant/50 outline-none"
              placeholder="Explain the anomaly in North Region supply chain..."
              type="text"
            />
            <button className="bg-primary text-on-primary px-6 py-3 rounded-xl text-[12px] font-medium flex items-center gap-2 hover:opacity-90 transition-all">
              Execute
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
          <div className="mt-4 flex gap-2 flex-wrap justify-center">
            <span className="text-[12px] text-on-surface-variant opacity-60">Trending:</span>
            {['Quarterly Risk Matrix', 'Productivity Leak Detection', 'Market Sentiment Delta'].map(tag => (
              <button key={tag} className="bg-surface-container text-on-surface-variant px-3 py-1 rounded-full text-[12px] hover:bg-surface-container-high transition-colors">
                {tag}
              </button>
            ))}
          </div>
        </section>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Investigations */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="flex justify-between items-end mb-2">
              <h3 className="text-2xl font-bold text-on-surface">Recent Investigations</h3>
              <Link to="/investigations/history" className="text-primary text-[12px] hover:underline">View All</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentInvestigations.map((inv) => (
                <div key={inv.title} className="glass-card p-4 rounded-2xl hover:-translate-y-1 transition-all cursor-pointer group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="bg-surface-container-highest p-2 rounded-lg text-on-surface-variant group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                      <span className="material-symbols-outlined">{inv.icon}</span>
                    </div>
                    <span className={`${inv.statusColor} px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider`}>
                      {inv.status}
                    </span>
                  </div>
                  <h4 className="text-[16px] font-bold mb-1">{inv.title}</h4>
                  <p className="text-[14px] text-on-surface-variant mb-4">{inv.desc}</p>
                  <div className="flex items-center gap-2 text-[12px] text-on-surface-variant/60">
                    <span className="material-symbols-outlined text-[16px]">schedule</span>
                    {inv.time}
                  </div>
                </div>
              ))}
            </div>

            {/* Live Investigations */}
            <div className="glass-card rounded-2xl p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">data_exploration</span>
                  <h3 className="text-[16px] font-bold">Live Investigations</h3>
                </div>
                <span className="text-[12px] text-on-surface-variant">2 Processing</span>
              </div>
              <div className="space-y-4">
                {[
                  { label: 'Knowledge Graph Expansion (Global)', pct: 78, note: 'Refining entity relations in European data silos...' },
                  { label: 'Anomaly Detection: Logistics', pct: 32, note: 'Cross-referencing maritime weather logs with arrival delays...' },
                ].map(({ label, pct, note }) => (
                  <div key={label} className="space-y-2">
                    <div className="flex justify-between text-[12px]">
                      <span className="text-on-surface font-medium">{label}</span>
                      <span className="text-primary font-bold">{pct}%</span>
                    </div>
                    <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden shimmer-bar">
                      <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${pct}%` }}></div>
                    </div>
                    <p className="text-[11px] text-on-surface-variant italic">{note}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: AI Insights + Platform Health */}
          <div className="flex flex-col gap-4">
            {/* AI Insights */}
            <div className="glass-card rounded-2xl overflow-hidden border-t-4 border-t-primary">
              <div className="p-4 bg-primary/5 border-b border-outline-variant">
                <h3 className="text-[16px] font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                  Avenor Insights
                </h3>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex gap-2 p-3 rounded-xl bg-surface/50 border border-outline-variant/30 hover:border-primary/30 transition-all cursor-pointer">
                  <span className="material-symbols-outlined text-error text-[20px]">warning</span>
                  <div>
                    <p className="text-[14px] font-bold leading-tight mb-1">Unusual pattern detected in EMEA accounts</p>
                    <p className="text-[12px] text-on-surface-variant">Recommended: Trigger deep forensic audit.</p>
                  </div>
                </div>
                <div className="flex gap-2 p-3 rounded-xl bg-surface/50 border border-outline-variant/30 hover:border-primary/30 transition-all cursor-pointer">
                  <span className="material-symbols-outlined text-tertiary text-[20px]">verified</span>
                  <div>
                    <p className="text-[14px] font-bold leading-tight mb-1">Entity duplication in Knowledge Graph</p>
                    <p className="text-[12px] text-on-surface-variant">Recommended: Merge 14 'Acme Corp' nodes.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Platform Health */}
            <div className="glass-card rounded-2xl p-4">
              <h3 className="text-[16px] font-bold mb-4">Platform Health</h3>
              <div className="space-y-4">
                {platformHealth.map(({ icon, label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center">
                        <span className="material-symbols-outlined text-[18px]">{icon}</span>
                      </div>
                      <span className="text-[12px] font-medium">{label}</span>
                    </div>
                    <span className="text-[12px] font-bold text-on-surface">{value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-outline-variant">
                <div className="bg-surface-container-highest h-32 rounded-xl flex flex-col items-center justify-center relative overflow-hidden">
                  <div
                    className="absolute inset-0 opacity-10 bg-cover bg-center"
                    style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuByK3nwP5hLJiTzX1KumVIfg1foaOzlLqHi79kGGdQuK5_IPUHlbJ2t66iWcoxKwbVWv2fnWT_D5wcct01n5ugQIU17xthE_M-0OxS1dWBDxFgyA3N20qymKdIGBq-PMu-QhsirM-5AMYEJyFncskTOSz1BjJrPTs1SgoTnRagsxLNvjf4BapfReo2M6JdLCVg8IJogPjmIzKfVN1thIjQdTkFEIoQp8vUFdOrUo7Ke8BwYw3stCmw2')` }}
                  />
                  <p className="text-[11px] font-semibold text-on-surface-variant/60 uppercase tracking-wider">Realtime Throughput</p>
                  <p className="text-2xl font-bold text-primary">1.2 TB/s</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-4 border-t border-outline-variant flex flex-col md:flex-row justify-between items-center gap-4 text-on-surface-variant/60">
          <p className="text-[12px]">© 2024 Avenor Enterprise Intelligence. All nodes synchronized.</p>
          <div className="flex gap-6">
            {['Privacy Policy', 'System Status', 'Documentation'].map(link => (
              <a key={link} className="hover:text-primary transition-colors text-[12px]" href="#">{link}</a>
            ))}
          </div>
        </footer>
      </div>
    </div>
  )
}
