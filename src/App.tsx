import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Stars, Sparkles, Float, Edges, Billboard } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'
import '@fontsource-variable/space-grotesk'

const BLU = new THREE.Color('#2f6bff')
const CYN = new THREE.Color('#22b8ff')
const VIO = new THREE.Color('#7c3aed')
const TAU = Math.PI * 2
const st = { s: 0, slide: 0 }
const clamp = THREE.MathUtils.clamp
const sm = THREE.MathUtils.smoothstep
const lerp = THREE.MathUtils.lerp
const easeOutBack = (x: number) => 1 + 2.70158 * Math.pow(x - 1, 3) + 1.70158 * Math.pow(x - 1, 2)

/* العالم التاني بعيد عن الثقب الأسود */
const OFF = -150
/* بيحوّل التوقيت القديم (0 → 1) لجزء العالم التاني من الـ scroll */
const T = (o: number) => 0.3 + 0.7 * o

/* ================= نظام scroll بسيط ومضمون ================= */
const input = { target: 0, current: 0 }
const drv = { offset: 0 }
const api = { skip: () => { input.target = T(0.6) } }
/* طول الرحلة بعدد الشاشات: قلّليه لو عاوزاه أسرع */
const SCREENS = 11

function useDriver() {
  useEffect(() => {
    const move = (px: number) => {
      input.target = clamp(input.target + px / (window.innerHeight * SCREENS), 0, 1)
    }
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      move(e.deltaMode === 1 ? e.deltaY * 33 : e.deltaY)
    }
    let ty = 0
    const onTS = (e: TouchEvent) => { ty = e.touches[0].clientY }
    const onTM = (e: TouchEvent) => {
      e.preventDefault()
      const y = e.touches[0].clientY
      move((ty - y) * 1.8)
      ty = y
    }
    const onKey = (e: KeyboardEvent) => {
      const k = e.key
      if (k === 'ArrowDown' || k === 'PageDown' || k === ' ') move(window.innerHeight * 0.5)
      else if (k === 'ArrowUp' || k === 'PageUp') move(-window.innerHeight * 0.5)
      else if (k === 'Home') input.target = 0
      else if (k === 'End') input.target = 1
    }
    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('touchstart', onTS, { passive: true })
    window.addEventListener('touchmove', onTM, { passive: false })
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTS)
      window.removeEventListener('touchmove', onTM)
      window.removeEventListener('keydown', onKey)
    }
  }, [])
  useFrame((_, d) => {
    input.current += (input.target - input.current) * Math.min(1, d * 5)
    drv.offset = input.current
  })
  return drv
}

/* ================= شاشات اللابتوب (معلوماتك) ================= */
type Slide = { kicker: string; title: string; sub: string; bullets: string[]; stats?: [string, string][] }
const SLIDES: Slide[] = [
  {
    kicker: 'ABOUT', title: 'Fatima Ibrahim', sub: 'Head of Blockchain Engineering · Senior Software Engineer',
    bullets: [
      '6+ years building production-grade software, Web3 and crypto systems',
      'Smart contracts, backend, APIs, distributed systems and cloud infrastructure',
      'Leads engineering teams while staying hands-on from design to production',
    ],
    stats: [['14+', 'Solidity contracts'], ['10M+', 'Monthly transactions'], ['6+', 'Years experience']],
  },
  {
    kicker: 'EXPERIENCE · 2025 – PRESENT', title: 'FlashVerse', sub: 'Head of Blockchain Engineering · Remote',
    bullets: [
      'Architected and deployed 14+ Solidity smart contracts on Polygon using Foundry',
      'Wallet, identity, treasury, relayer and paymaster infrastructure (ERC-4337)',
      'Led the engineering team and owned the technical roadmap and documentation',
      'Brought investors and partners from my network to help fund the project',
    ],
  },
  {
    kicker: 'EXPERIENCE · 2023 – 2025', title: 'Ant Group', sub: 'Lead Blockchain Architect & Web3 Innovation Specialist · China',
    bullets: [
      'Architected and built 10+ blockchain and Web3 services for financial applications',
      'Designed 15+ blockchain integrations and APIs across on-chain and backend systems',
      'Contributed to infrastructure supporting 10M+ monthly transactions',
      'Led technical architecture and Web3 innovation across cross-functional teams',
    ],
  },
  {
    kicker: 'EXPERIENCE · 2021 – 2023', title: 'Bitwala · Revolut', sub: 'Crypto & Web3 · Germany and UK (Remote)',
    bullets: [
      'Bitwala: crypto and DeFi infrastructure across 10+ core services',
      'Bitcoin wallets, fiat-to-crypto and digital-asset functionality',
      '~25% faster transaction processing across targeted crypto workflows',
      'Revolut: crypto transaction and EVM-based services for financial applications',
    ],
  },
  {
    kicker: 'TECHNICAL EXPERTISE', title: 'Skills', sub: 'Blockchain · Software · Cloud · Security',
    bullets: [
      'Blockchain: Solidity, Rust, Move, EVM, DeFi, Bitcoin, ERC-20/721/1155/4337, Foundry, Hardhat',
      'Software: TypeScript, React, Next.js, Node.js, Python, Go, Java, system design',
      'Backend and cloud: APIs, WebSockets, microservices, AWS, GCP, Docker, Kubernetes, CI/CD',
      'Security: smart contract auditing, fuzz testing, formal verification, cryptography',
    ],
  },
  {
    kicker: 'SELECTED PROJECTS', title: 'Projects', sub: 'Web3 infrastructure · DeFi · AI agents',
    bullets: [
      'FlashVerse Wallet: production Web3 wallet ecosystem with 14+ contracts, ERC-4337 and FlashID',
      'Crypto trading and DeFi infrastructure connecting EVM networks with backend services',
      'AI × Blockchain autonomous financial agent executing through secure smart-contract rails',
    ],
  },
  {
    kicker: 'BACKGROUND', title: 'Education & Languages', sub: 'American University in Cairo · Cairo, Egypt',
    bullets: [
      'B.Sc. in Software Engineering, 2020 – 2024',
      'Certified: Web3 Professional (Consensys)',
      'Earlier: Capital One, backend and distributed systems (2020 – 2021)',
      'Arabic, English, French, German, Chinese',
    ],
  },
  {
    kicker: 'CONTACT', title: "Let's build what's next", sub: 'Open to senior roles · Europe',
    bullets: [
      'linkedin.com/in/fatima-ebrahim-9a3625376',
      'github.com/Fatimaibhrahim',
      'fatimaibhrahim721999@gmail.com',
    ],
  },
]

const FONT = '"Space Grotesk Variable", system-ui, sans-serif'

function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number) {
  const words = text.split(' ')
  let line = ''
  for (const w of words) {
    const test = line ? line + ' ' + w : w
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, y)
      line = w
      y += lh
    } else line = test
  }
  ctx.fillText(line, x, y)
  return y + lh
}

function drawSlide(c: HTMLCanvasElement, i: number) {
  const ctx = c.getContext('2d')!
  const W = 1280
  const H = 800
  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#040616')
  bg.addColorStop(1, '#0a0430')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)
  ctx.strokeStyle = 'rgba(60,110,255,0.08)'
  ctx.lineWidth = 1
  for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke() }
  for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }
  ctx.fillStyle = 'rgba(40,70,200,0.22)'
  ctx.fillRect(0, 0, W, 58)
  ;['#2f6bff', '#7c3aed', '#22b8ff'].forEach((col, k) => {
    ctx.fillStyle = col
    ctx.beginPath(); ctx.arc(34 + k * 26, 29, 7, 0, TAU); ctx.fill()
  })
  ctx.textAlign = 'left'
  ctx.fillStyle = '#5b8cff'
  ctx.font = `500 20px ${FONT}`
  ctx.fillText(`fatima.eth  ›  block #${String(i + 1).padStart(4, '0')}`, 130, 36)

  const s = SLIDES[i]
  ctx.fillStyle = '#4f8cff'
  ctx.font = `600 22px ${FONT}`
  ctx.fillText(s.kicker, 70, 125)
  ctx.fillStyle = '#ffffff'
  ctx.font = `700 60px ${FONT}`
  let y = wrap(ctx, s.title, 70, 195, 1140, 68)
  ctx.fillStyle = '#8b7bff'
  ctx.font = `500 27px ${FONT}`
  y = wrap(ctx, s.sub, 70, y - 14, 1140, 36)
  const dg = ctx.createLinearGradient(70, 0, 1210, 0)
  dg.addColorStop(0, '#2f6bff')
  dg.addColorStop(1, 'rgba(124,58,237,0)')
  ctx.fillStyle = dg
  ctx.fillRect(70, y, 1140, 3)
  y += 46
  ctx.font = `400 27px ${FONT}`
  for (const b of s.bullets) {
    ctx.fillStyle = '#2f6bff'
    ctx.fillRect(70, y - 19, 13, 13)
    ctx.fillStyle = '#dbe4ff'
    y = wrap(ctx, b, 104, y, 1100, 37) + 8
  }
  if (s.stats) {
    s.stats.forEach(([v, l], k) => {
      const x = 70 + k * 380
      ctx.strokeStyle = 'rgba(80,130,255,0.7)'
      ctx.lineWidth = 2
      ctx.strokeRect(x, H - 190, 340, 130)
      ctx.fillStyle = '#ffffff'
      ctx.font = `700 54px ${FONT}`
      ctx.fillText(v, x + 24, H - 120)
      ctx.fillStyle = '#7aa2ff'
      ctx.font = `500 22px ${FONT}`
      ctx.fillText(l, x + 24, H - 82)
    })
  }
}

/* ================= Shaders ================= */
const noiseGLSL = `
float h(vec3 p){ p = fract(p*0.3183099+.1); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float n(vec3 x){
  vec3 i=floor(x); vec3 f=fract(x); f=f*f*(3.-2.*f);
  return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z);
}
float fbm(vec3 p){ float a=.5,s=0.; for(int i=0;i<4;i++){ s+=a*n(p); p*=2.02; a*=.5; } return s; }
`

const skyVert = `
varying vec3 vW;
void main(){ vW = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`
const skyFrag = `
uniform float uTime;
varying vec3 vW;
${noiseGLSL}
void main(){
  float g = smoothstep(-0.2, 1.0, vW.y);
  vec3 col = mix(vec3(0.0,0.0,0.005), vec3(0.012,0.015,0.05), g);
  float a = fbm(vW*2.0 + vec3(0., uTime*0.01, 0.));
  float b = fbm(vW*3.1 + 5.2);
  col += vec3(0.10,0.04,0.30) * smoothstep(.55,.9,a) * 0.35;
  col += vec3(0.02,0.10,0.35) * smoothstep(.58,.9,b) * 0.30;
  gl_FragColor = vec4(col,1.0);
}`

const uvVert = `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`

const diskFrag = `
uniform float uTime; uniform float uBright; uniform float uIn;
varying vec2 vUv;
${noiseGLSL}
void main(){
  vec2 p = vUv - 0.5;
  float r = length(p) * 2.0;
  float rr = clamp((r - uIn) / (1.0 - uIn), 0.0, 1.0);
  float a = atan(p.y, p.x);
  float ang = a + uTime * 0.9 / (rr + 0.25);
  vec3 q = vec3(cos(ang) * 2.5, sin(ang) * 2.5, rr * 9.0);
  float v = 0.55 * n(q) + 0.45 * n(q * 2.3 + 3.7);
  float inten = pow(1.0 - rr, 1.5) * (0.3 + 1.5 * v);
  inten *= 0.65 + 0.6 * cos(a + 0.8);
  vec3 hot = vec3(0.75, 0.88, 1.0);
  vec3 mid = vec3(0.18, 0.42, 1.0);
  vec3 far = vec3(0.32, 0.10, 0.78);
  vec3 col = mix(hot, mid, smoothstep(0.0, 0.3, rr));
  col = mix(col, far, smoothstep(0.3, 1.0, rr));
  float alpha = smoothstep(0.0, 0.05, rr) * (1.0 - smoothstep(0.7, 1.0, rr));
  gl_FragColor = vec4(col * inten * uBright, alpha);
}`

const tunFrag = `
uniform float uTime;
varying vec2 vUv;
${noiseGLSL}
void main(){
  float ang = vUv.x * 6.28318;
  float z = vUv.y * 115.0;
  float tw = ang + z * 0.04 + uTime * 0.15;
  float s1 = smoothstep(0.62, 0.95, n(vec3(cos(ang) * 14.0, sin(ang) * 14.0, z * 0.07)));
  float rb = smoothstep(0.93, 1.0, sin(z * 0.8) * 0.5 + 0.5);
  float sw = n(vec3(cos(tw) * 3.0, sin(tw) * 3.0, z * 0.09));
  vec3 col = vec3(0.005, 0.01, 0.05);
  col += vec3(0.30, 0.60, 1.8) * s1;
  col += vec3(0.8, 0.3, 1.6) * rb * 0.7;
  col += vec3(0.08, 0.10, 0.5) * smoothstep(0.45, 0.9, sw);
  gl_FragColor = vec4(col, 1.0);
}`

function makeDiskMat(uIn: number) {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uBright: { value: 1 }, uIn: { value: uIn } },
    vertexShader: uvVert,
    fragmentShader: diskFrag,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
}

/* ================= الخلفية ================= */
function Sky() {
  const g = useRef<THREE.Group>(null)
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        vertexShader: skyVert,
        fragmentShader: skyFrag,
        side: THREE.BackSide,
        depthWrite: false,
      }),
    []
  )
  useFrame(({ clock, camera }) => {
    mat.uniforms.uTime.value = clock.elapsedTime
    g.current?.position.copy(camera.position)
  })
  return (
    <group ref={g}>
      <mesh material={mat} renderOrder={-10}>
        <sphereGeometry args={[140, 32, 32]} />
      </mesh>
      <Stars radius={90} depth={30} count={500} factor={4} fade speed={0.5} />
    </group>
  )
}

/* شهب: ذيل بنفسجي غامق وراس فضي مزرق (بتتحرك مع الكاميرا) */
function Rain() {
  const g = useRef<THREE.Group>(null)
  const { geo, data } = useMemo(() => {
    const n = 120
    const pos = new Float32Array(n * 6)
    const col = new Float32Array(n * 6)
    const data = Array.from({ length: n }, () => ({
      x: (Math.random() - 0.5) * 70,
      z: (Math.random() - 0.5) * 70,
      y: Math.random() * 60 - 30,
      v: 5 + Math.random() * 9,
      len: 2 + Math.random() * 5,
    }))
    for (let i = 0; i < n; i++) col.set([0.25, 0.08, 0.6, 0.7, 0.8, 1.0], i * 6)
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
    return { geo, data }
  }, [])
  useFrame(({ camera }, d) => {
    if (g.current) {
      g.current.position.copy(camera.position)
      g.current.visible = st.s < 0.03 || st.s > 0.32
    }
    const dt = Math.min(d, 0.05)
    const p = geo.attributes.position.array as Float32Array
    data.forEach((s, i) => {
      s.y -= s.v * dt
      if (s.y < -30) s.y = 30
      p[i * 6] = s.x; p[i * 6 + 1] = s.y + s.len; p[i * 6 + 2] = s.z
      p[i * 6 + 3] = s.x; p[i * 6 + 4] = s.y; p[i * 6 + 5] = s.z
    })
    geo.attributes.position.needsUpdate = true
  })
  return (
    <group ref={g}>
      <lineSegments geometry={geo} frustumCulled={false}>
        <lineBasicMaterial vertexColors transparent opacity={0.9} fog={false} toneMapped={false} />
      </lineSegments>
    </group>
  )
}

/* ================= الثقب الأسود ================= */
function BlackHole() {
  const root = useRef<THREE.Group>(null)
  const diskMat = useMemo(() => makeDiskMat(4.8 / 13), [])
  const haloMat = useMemo(() => makeDiskMat(4.7 / 7.6), [])
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const b = lerp(0.8, 1.8, sm(st.s, 0.04, 0.14))
    diskMat.uniforms.uTime.value = t
    diskMat.uniforms.uBright.value = b
    haloMat.uniforms.uTime.value = t
    haloMat.uniforms.uBright.value = b * 1.1
    if (root.current) root.current.visible = st.s < 0.2
  })
  return (
    <group ref={root}>
      <mesh>
        <sphereGeometry args={[4.4, 48, 48]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      <mesh rotation={[-Math.PI / 2 + 0.28, 0, 0]} material={diskMat}>
        <ringGeometry args={[4.8, 13, 160, 1]} />
      </mesh>
      <Billboard>
        <mesh material={haloMat}>
          <ringGeometry args={[4.7, 7.6, 128, 1]} />
        </mesh>
      </Billboard>
    </group>
  )
}

/* النفق اللي بنعدي منه */
function Tunnel() {
  const m = useRef<THREE.Mesh>(null)
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 } },
        vertexShader: uvVert,
        fragmentShader: tunFrag,
        side: THREE.BackSide,
        depthWrite: false,
      }),
    []
  )
  useFrame(({ clock }) => {
    mat.uniforms.uTime.value = clock.elapsedTime
    if (m.current) m.current.visible = st.s > 0.13 && st.s < 0.34
  })
  return (
    <mesh ref={m} material={mat} position={[0, 0, -67.5]} rotation={[Math.PI / 2, 0, 0]}>
      <cylinderGeometry args={[6, 6, 115, 48, 1, true]} />
    </mesh>
  )
}

/* ================= العالم التاني ================= */
function Decor() {
  const items = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => {
        const a = Math.random() * TAU
        const r = 26 + Math.random() * 22
        return {
          pos: [Math.cos(a) * r, (Math.random() - 0.5) * 24, Math.sin(a) * r] as [number, number, number],
          size: 0.8 + Math.random() * 1.2,
          rot: [Math.random() * 3, Math.random() * 3, 0] as [number, number, number],
          col: i % 2 ? BLU : VIO,
        }
      }),
    []
  )
  return (
    <>
      {items.map((b, i) => (
        <Float key={i} speed={1} rotationIntensity={0.8} floatIntensity={1.2}>
          <mesh position={b.pos} rotation={b.rot}>
            <boxGeometry args={[b.size, b.size, b.size]} />
            <meshStandardMaterial color="#05050d" metalness={0.8} roughness={0.3} />
            <Edges threshold={15} color={b.col.clone().multiplyScalar(1.8)} />
          </mesh>
        </Float>
      ))}
    </>
  )
}

const GS = 1.5
const gCells = Array.from({ length: 27 }, (_, i) => ({
  ix: (i % 3) - 1,
  iy: (Math.floor(i / 3) % 3) - 1,
  iz: Math.floor(i / 9) - 1,
})).filter((c) => !(c.ix === 0 && c.iy === 0 && c.iz === 0))

function Genesis() {
  const root = useRef<THREE.Group>(null)
  const refs = useRef<(THREE.Group | null)[]>([])
  const core = useRef<THREE.Mesh>(null)
  useFrame(({ clock }, d) => {
    const ex = sm(st.s, T(0.1), T(0.22))
    const sc = Math.max(1 - sm(st.s, T(0.22), T(0.3)), 0.0001)
    if (root.current) root.current.rotation.y += d * 0.25 * (1 - ex)
    refs.current.forEach((g, i) => {
      if (!g) return
      const c = gCells[i]
      const k = 1 + ex * 9
      g.position.set(c.ix * GS * k, c.iy * GS * k, c.iz * GS * k)
      g.rotation.set(ex * (i % 5) * 0.6, ex * (i % 7) * 0.5, 0)
      g.scale.setScalar(sc)
    })
    if (core.current) {
      const p = 1 + Math.sin(clock.elapsedTime * 3) * 0.1
      core.current.scale.setScalar(p * 2.2 * (1 - sm(st.s, T(0.16), T(0.21))) + 0.0001)
    }
  })
  return (
    <group ref={root}>
      {gCells.map((_, i) => (
        <group key={i} ref={(el) => { refs.current[i] = el }}>
          <mesh>
            <boxGeometry args={[GS * 0.92, GS * 0.92, GS * 0.92]} />
            <meshStandardMaterial color="#050818" metalness={0.7} roughness={0.3} emissive="#1e3a8a" emissiveIntensity={0.4} />
            <Edges threshold={15} color={BLU.clone().multiplyScalar(2.6)} />
          </mesh>
        </group>
      ))}
      <mesh ref={core}>
        <sphereGeometry args={[0.9, 24, 24]} />
        <meshBasicMaterial color={new THREE.Color(1.2, 2.0, 4)} toneMapped={false} />
      </mesh>
    </group>
  )
}

function Shock() {
  const m = useRef<THREE.Mesh>(null)
  const mat = useRef<THREE.MeshBasicMaterial>(null)
  useFrame(() => {
    const x = clamp((st.s - T(0.15)) / (T(0.27) - T(0.15)), 0, 1)
    if (m.current) m.current.scale.setScalar(0.1 + x * 16)
    if (mat.current) mat.current.opacity = x > 0 && x < 1 ? (1 - x) * 0.9 : 0
  })
  return (
    <Billboard>
      <mesh ref={m}>
        <torusGeometry args={[1, 0.03, 8, 96]} />
        <meshBasicMaterial ref={mat} color={CYN.clone().multiplyScalar(3)} transparent opacity={0} depthWrite={false} toneMapped={false} />
      </mesh>
    </Billboard>
  )
}

function Appear({ from, to, children }: { from: number; to: number; children: ReactNode }) {
  const g = useRef<THREE.Group>(null)
  useFrame(() => {
    const x = sm(st.s, from, to)
    const e = x < 1 ? easeOutBack(x) : 1
    g.current?.scale.setScalar(Math.max(e, 0.0001))
  })
  return <group ref={g}>{children}</group>
}/* ================= اللابتوب ================= */
function Laptop() {
  const lid = useRef<THREE.Group>(null)
  const screenMat = useRef<THREE.MeshBasicMaterial>(null)
  const last = useRef(-1)
  const screens = useMemo(
    () =>
      SLIDES.map(() => {
        const c = document.createElement('canvas')
        c.width = 1280
        c.height = 800
        const t = new THREE.CanvasTexture(c)
        t.colorSpace = THREE.SRGBColorSpace
        t.anisotropy = 8
        return { c, t }
      }),
    []
  )
  const keyTex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 1024
    c.height = 512
    const x = c.getContext('2d')!
    x.fillStyle = '#03040c'
    x.fillRect(0, 0, 1024, 512)
    x.lineWidth = 3
    for (let r = 0; r < 5; r++) {
      for (let k = 0; k < 14; k++) {
        x.fillStyle = 'rgba(30,60,160,0.2)'
        x.fillRect(24 + k * 70, 24 + r * 94, 60, 80)
        x.strokeStyle = 'rgba(70,130,255,0.9)'
        x.strokeRect(24 + k * 70, 24 + r * 94, 60, 80)
      }
    }
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [])
  useEffect(() => {
    const draw = () => screens.forEach((sc, i) => { drawSlide(sc.c, i); sc.t.needsUpdate = true })
    draw()
    document.fonts
      .load(`700 40px ${FONT}`)
      .then(() => document.fonts.load(`400 30px ${FONT}`))
      .then(draw)
      .catch(() => {})
  }, [screens])
  useFrame(() => {
    const open = sm(st.s, T(0.5), T(0.58))
    if (lid.current) lid.current.rotation.x = lerp(Math.PI / 2, -0.2, open)
    const idx = clamp(Math.floor(((st.s - T(0.58)) / (T(0.96) - T(0.58))) * SLIDES.length), 0, SLIDES.length - 1)
    st.slide = idx
    if (idx !== last.current && screenMat.current) {
      screenMat.current.map = screens[idx].t
      last.current = idx
    }
  })
  return (
    <Float speed={1.4} rotationIntensity={0.12} floatIntensity={0.5}>
      <pointLight position={[0, 2.5, 5]} color="#3b82f6" intensity={20} distance={16} />
      <mesh position={[0, 0.11, 0]}>
        <boxGeometry args={[7, 0.22, 4.6]} />
        <meshStandardMaterial color="#070a1c" metalness={0.8} roughness={0.35} />
        <Edges threshold={15} color={BLU.clone().multiplyScalar(2.4)} />
      </mesh>
      <mesh position={[0, 0.225, 0.25]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[6.4, 3.2]} />
        <meshBasicMaterial map={keyTex} toneMapped={false} />
      </mesh>
      <group ref={lid} position={[0, 0.22, -2.3]}>
        <mesh position={[0, 2.25, 0]}>
          <boxGeometry args={[7, 4.5, 0.16]} />
          <meshStandardMaterial color="#070a1c" metalness={0.8} roughness={0.35} />
          <Edges threshold={15} color={VIO.clone().multiplyScalar(2.4)} />
        </mesh>
        <mesh position={[0, 2.28, 0.09]}>
          <planeGeometry args={[6.5, 4.06]} />
          <meshBasicMaterial ref={screenMat} map={screens[0].t} toneMapped={false} />
        </mesh>
      </group>
    </Float>
  )
}

function Pedestal() {
  const g = useRef<THREE.Group>(null)
  useFrame((_, d) => {
    g.current?.children.forEach((c, i) => {
      c.rotation.z += d * 0.3 * (i % 2 ? 1 : -1)
    })
  })
  return (
    <group position={[0, -0.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <group ref={g}>
        {[4.2, 5.4, 6.8].map((r, i) => (
          <mesh key={i}>
            <torusGeometry args={[r, 0.04, 8, 128, Math.PI * 1.4]} />
            <meshBasicMaterial color={(i === 1 ? VIO : BLU).clone().multiplyScalar(2.4)} toneMapped={false} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

function makeLinks(pts: THREE.Vector3[], per: number) {
  const arr: { pos: THREE.Vector3; q: THREE.Quaternion }[] = []
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]
    const b = pts[(i + 1) % pts.length]
    const dir = b.clone().sub(a).normalize()
    const base = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), dir)
    for (let k = 0; k < per; k++) {
      const pos = a.clone().lerp(b, (k + 1) / (per + 1))
      const twist = new THREE.Quaternion().setFromAxisAngle(dir, (k % 2) * (Math.PI / 2))
      arr.push({ pos, q: twist.multiply(base) })
    }
  }
  return arr
}
const WN = 10
const WR = 6.5
const wPts = Array.from({ length: WN }, (_, i) =>
  new THREE.Vector3(Math.cos((i / WN) * TAU) * WR, Math.sin((i / WN) * TAU) * WR, 0)
)
const wLinks = makeLinks(wPts, 5)

function Wheel() {
  const spin = useRef<THREE.Group>(null)
  useFrame((_, d) => {
    if (spin.current) spin.current.rotation.z += d * 0.12
  })
  return (
    <group position={[0, 2.6, -4]}>
      <group ref={spin}>
        {wPts.map((p, i) => (
          <Float key={i} speed={1.2} rotationIntensity={0.6} floatIntensity={0.4}>
            <mesh position={p}>
              <boxGeometry args={[1.2, 1.2, 1.2]} />
              <meshStandardMaterial color="#050818" metalness={0.8} roughness={0.3} emissive="#1e3a8a" emissiveIntensity={0.5} />
              <Edges threshold={15} color={(i % 2 ? CYN : VIO).clone().multiplyScalar(2.4)} />
            </mesh>
          </Float>
        ))}
        {wLinks.map((l, i) => (
          <mesh key={i} position={l.pos} quaternion={l.q} scale={[1.5, 1, 1]}>
            <torusGeometry args={[0.32, 0.07, 10, 24]} />
            <meshBasicMaterial color={(i % 2 ? BLU : VIO).clone().multiplyScalar(2.2)} toneMapped={false} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

function CryptoField() {
  const tex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = c.height = 256
    const x = c.getContext('2d')!
    x.beginPath(); x.arc(128, 128, 118, 0, TAU); x.fillStyle = '#0b1a5c'; x.fill()
    x.lineWidth = 10; x.strokeStyle = '#2f6bff'; x.stroke()
    x.fillStyle = '#cfe0ff'
    x.font = 'bold 150px Arial'; x.textAlign = 'center'; x.textBaseline = 'middle'
    x.fillText('B', 128, 138)
    x.fillRect(104, 52, 10, 28); x.fillRect(140, 52, 10, 28)
    x.fillRect(104, 176, 10, 28); x.fillRect(140, 176, 10, 28)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [])
  const spots = (n: number, seed: number) =>
    Array.from({ length: n }, (_, i) => ({
      pos: [
        (i % 2 ? 1 : -1) * (5.5 + ((i * 7 + seed) % 5) * 2),
        -1 + ((i * 17 + seed * 3) % 10),
        -10 + ((i + seed) % 5) * 1.8,
      ] as [number, number, number],
      s: 0.9 + (i % 4) * 0.3,
    }))
  const coins = useMemo(() => spots(12, 1), [])
  const eths = useMemo(() => spots(8, 3), [])
  return (
    <>
      {coins.map((it, i) => (
        <Float key={'c' + i} speed={1 + (i % 4) * 0.4} floatIntensity={2} rotationIntensity={0}>
          <Billboard position={it.pos}>
            <mesh scale={it.s}>
              <planeGeometry args={[1.6, 1.6]} />
              <meshBasicMaterial map={tex} transparent toneMapped={false} depthWrite={false} color={new THREE.Color(1.5, 1.5, 2)} />
            </mesh>
          </Billboard>
        </Float>
      ))}
      {eths.map((it, i) => (
        <Float key={'e' + i} speed={1.2} floatIntensity={2} rotationIntensity={1}>
          <mesh position={it.pos} scale={[0.8 * it.s, 1.3 * it.s, 0.8 * it.s]}>
            <octahedronGeometry args={[0.6]} />
            <meshStandardMaterial color="#050818" metalness={0.8} roughness={0.3} />
            <Edges threshold={15} color={(i % 2 ? CYN : VIO).clone().multiplyScalar(2.4)} />
          </mesh>
        </Float>
      ))}
    </>
  )
}

/* ================= الكاميرا: ثقب أسود ← نفق ← العالم التاني ================= */
function Rig() {
  const scroll = useDriver()
  const pos = useMemo(() => new THREE.Vector3(), [])
  const look = useMemo(() => new THREE.Vector3(), [])
  const lookB = useMemo(() => new THREE.Vector3(), [])
  const els = useRef<Record<string, HTMLElement | null> | null>(null)
  const lastCap = useRef(-2)

  useFrame((state) => {
    const s = scroll.offset
    st.s = s
    const cam = state.camera as THREE.PerspectiveCamera
    const aspect = state.size.width / state.size.height
    const dist = clamp(6.4 / (0.62 * 1.274 * aspect), 4.6, 15)
    const u1 = clamp((s - 0.04) / 0.11, 0, 1)
    const u2 = clamp((s - 0.15) / 0.15, 0, 1)
    const kw1 = sm(s, T(0), T(0.2))
    const kw2 = sm(s, T(0.44), T(0.58))

    let z: number
    if (s < 0.15) z = lerp(26, 7, u1 * u1)
    else if (s < 0.3) z = lerp(7, OFF + 24, sm(s, 0.15, 0.3))
    else z = lerp(lerp(OFF + 24, OFF + 13, kw1), OFF + dist, kw2)

    const yWorld = lerp(3, 2.9, kw2)
    const y = s < 0.15 ? lerp(3, 0, sm(s, 0.06, 0.15)) : s < 0.28 ? 0 : lerp(0, yWorld, sm(s, 0.28, 0.32))
    const sway = 1 - sm(s, 0.06, 0.12) * (1 - sm(s, 0.3, 0.34))
    pos.set(state.pointer.x * 0.6 * sway, y + state.pointer.y * 0.4 * sway, z)
    cam.position.lerp(pos, 0.08)

    if (s < 0.15) look.set(0, lerp(1, 0, sm(s, 0.06, 0.15)), 0)
    else look.set(0, 0, cam.position.z - 10)
    if (s >= 0.3) {
      lookB.set(0, lerp(1, 2.45, kw2), OFF)
      look.lerp(lookB, sm(s, 0.3, 0.34))
    }
    cam.lookAt(look)
    cam.fov = 65 + 50 * Math.sin(Math.PI * u2)
    cam.updateProjectionMatrix()

    if (!els.current) {
      const q = (id: string) => document.getElementById(id)
      els.current = {
        hero: q('hero'), hint: q('hint'), sig: q('sig'), who: q('who'), cap: q('cap'),
        contact: q('contact'), veil: q('veil'), flash: q('flash'),
      }
    }
    const E = els.current
    const hp = sm(s, 0.03, 0.1)
    if (E.hero) {
      E.hero.style.opacity = String(1 - hp)
      E.hero.style.transform = `scale(${1 + hp * 1.3})`
    }
    if (E.hint) E.hint.style.opacity = String(1 - sm(s, 0.01, 0.04))
    if (E.veil) E.veil.style.opacity = String(sm(s, 0.11, 0.15) * (1 - sm(s, 0.18, 0.21)))
    if (E.flash) E.flash.style.opacity = String(Math.max(0, 1 - Math.abs(s - 0.31) / 0.03) * 0.6)

    const out = 1 - sm(s, T(0.44), T(0.5))
    const p = clamp((s - T(0.16)) / (T(0.26) - T(0.16)), 0, 1)
    if (E.sig) {
      E.sig.style.opacity = String((p > 0 ? 1 : 0) * out)
      E.sig.style.clipPath = `inset(-20% ${(1 - p) * 100}% -20% -20%)`
      E.sig.style.transform = `scale(${0.7 + 0.3 * p})`
    }
    if (E.who) {
      const v = sm(s, T(0.26), T(0.33)) * out
      E.who.style.opacity = String(v)
      E.who.style.transform = `translateY(${(1 - v) * 24}px)`
    }
    if (E.cap) {
      E.cap.style.opacity = String(sm(s, T(0.58), T(0.62)))
      if (st.slide !== lastCap.current) {
        lastCap.current = st.slide
        E.cap.textContent = `${String(st.slide + 1).padStart(2, '0')} / ${String(SLIDES.length).padStart(2, '0')} · ${SLIDES[st.slide].title.toUpperCase()}`
      }
    }
    if (E.contact) {
      const v = sm(s, T(0.93), T(0.96))
      E.contact.style.opacity = String(v)
      E.contact.style.visibility = v > 0.05 ? 'visible' : 'hidden'
    }
  })
  return null
}

const NODES: [number, number][] = [[70, 130], [540, 110], [60, 470], [545, 495]]

export default function App() {
  return (
    <>
      <header className="hud">
        <span><em className="dot" />Open to senior roles · Europe</span>
      </header>
      <button className="skip" onClick={() => api.skip()}>SKIP INTRO →</button>

      <div id="hero" className="hero">
        <div className="heroin">
          <svg className="ring" viewBox="0 0 600 600">
            <circle className="r1" cx="300" cy="300" r="250" fill="none" stroke="#2f6bff" strokeWidth="12" strokeDasharray="170 30 40 30 100 50" />
            <circle className="r3" cx="300" cy="300" r="278" fill="none" stroke="#22b8ff" strokeWidth="3" strokeDasharray="210 110" />
            <circle className="r2" cx="300" cy="300" r="222" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 9" />
            {NODES.map(([x, y], i) => (
              <g key={i}>
                <line x1={x} y1={y} x2={300 + (x - 300) * 0.88} y2={300 + (y - 300) * 0.88} stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="6 6" />
                <circle cx={x} cy={y} r="16" fill="rgba(10,30,90,0.6)" stroke="#38bdf8" strokeWidth="2" />
                <circle cx={x} cy={y} r="5" fill="#7dd3fc" />
              </g>
            ))}
          </svg>
          <div className="hword"><span>BLOCK</span><span>CHAIN</span></div>
        </div>
      </div>
      <div id="hint" className="hint">SCROLL ↓</div>

      <div id="veil" className="veil" />
      <div id="flash" className="flash" />

      <div id="sig" className="sig"><span>f</span></div>
      <div id="who" className="who">
        <h1 className="wname">FATIMA IBRAHIM</h1>
        <div className="wtitle">HEAD OF BLOCKCHAIN ENGINEERING</div>
        <p className="wline">I build trustless systems that move real value, and lead the teams that ship them.</p>
      </div>

      <div id="cap" className="cap" />
      <div id="contact" className="contact">
        <a href="https://linkedin.com/in/fatima-ebrahim-9a3625376" target="_blank" rel="noreferrer">LinkedIn</a>
        <a href="https://github.com/Fatimaibhrahim" target="_blank" rel="noreferrer">GitHub</a>
        <a href="mailto:fatimaibhrahim721999@gmail.com">Email</a>
      </div>

      <Canvas dpr={[1, 1.5]} camera={{ position: [0, 3, 26], fov: 65, near: 0.1, far: 500 }}>
        <color attach="background" args={['#000000']} />
        <ambientLight intensity={0.4} />
        <Sky />
        <Rain />

        <BlackHole />
        <Tunnel />

        <group position={[0, 0, OFF]}>
          <Decor />
          <Sparkles count={100} scale={[60, 40, 60]} size={3} speed={0.3} color="#3b82f6" />
          <Genesis />
          <Shock />
          <Appear from={T(0.44)} to={T(0.54)}><Laptop /></Appear>
          <Appear from={T(0.44)} to={T(0.54)}><Pedestal /></Appear>
          <Appear from={T(0.42)} to={T(0.54)}><Wheel /></Appear>
          <Appear from={T(0.42)} to={T(0.54)}><CryptoField /></Appear>
        </group>

        <Rig />

        <EffectComposer multisampling={0}>
          <Bloom intensity={1.3} luminanceThreshold={0.6} luminanceSmoothing={0.2} mipmapBlur />
          <Vignette darkness={0.6} offset={0.3} />
        </EffectComposer>
      </Canvas>
    </>
  )
}