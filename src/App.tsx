import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import type { BodyPart, ScanMode, Screen, ToolCard, ToolId } from './types'
import { modeLabel, partLabel, pretendScan, SCAN_DURATION_MS } from './scanLogic'
const MapSizeCompare = lazy(() => import('./mapCompare/MapSizeCompare'))

const TOOLS: ToolCard[] = [
  {
    id: 'germ',
    title: 'Germ Scanner',
    emoji: '🔬',
    blurb: 'Scan tummy or teeth for pretend germs!',
    status: 'live',
  },
  {
    id: 'map',
    title: 'Map Size Compare',
    emoji: '🗺️',
    blurb: 'See how Mercator stretches the world!',
    status: 'live',
  },
  {
    id: 'wash',
    title: 'Hand Wash Coach',
    emoji: '🧼',
    blurb: 'Sing and scrub with Noah.',
    status: 'soon',
  },
  {
    id: 'bath',
    title: 'Bath Bubbles Check',
    emoji: '🫧',
    blurb: 'Find all the bubbly spots.',
    status: 'soon',
  },
  {
    id: 'potty',
    title: 'Potty Sticker Chart',
    emoji: '⭐',
    blurb: 'Earn stickers for big kid wins.',
    status: 'soon',
  },
]

function TopBar({
  showBack,
  onBack,
  subtitle,
}: {
  showBack?: boolean
  onBack?: () => void
  subtitle?: string
}) {
  return (
    <header className="topbar">
      {showBack && (
        <button type="button" className="back-btn" onClick={onBack} aria-label="Go back">
          ←
        </button>
      )}
      <div className="brand">
        <div className="brand-mark" aria-hidden>
          🧸
        </div>
        <div>
          <h1>Noah Tools</h1>
          <p>{subtitle ?? 'Playful tools for little helpers'}</p>
        </div>
      </div>
    </header>
  )
}

function Home({ onOpenTool }: { onOpenTool: (id: ToolId) => void }) {
  return (
    <>
      <TopBar />
      <h2 className="screen-title">Pick a tool</h2>
      <p className="screen-sub">A growing kit for Noah — tap a Live tool to play.</p>
      <div className="tool-grid">
        {TOOLS.map((tool) => {
          const live = tool.status === 'live'
          return (
            <button
              key={tool.id}
              type="button"
              data-id={tool.id}
              className={`tool-card ${live ? 'live' : 'soon'}`}
              disabled={!live}
              onClick={() => live && onOpenTool(tool.id)}
              aria-label={live ? `Open ${tool.title}` : `${tool.title}, coming soon`}
            >
              <div className="tool-emoji" aria-hidden>
                {tool.emoji}
              </div>
              <div className="tool-copy">
                <h2>{tool.title}</h2>
                <p>{tool.blurb}</p>
              </div>
              <span className={`badge ${live ? 'live' : 'soon'}`}>
                {live ? 'Live' : 'Coming soon'}
              </span>
            </button>
          )
        })}
      </div>
      <p className="footnote">Just for fun — not a real medical scanner.</p>
    </>
  )
}

function PartSelect({ onBack, onPick }: { onBack: () => void; onPick: (p: BodyPart) => void }) {
  return (
    <>
      <TopBar showBack onBack={onBack} subtitle="Germ Scanner" />
      <h2 className="screen-title">What are we scanning?</h2>
      <p className="screen-sub">Big taps — tummy or teeth!</p>
      <div className="choice-grid">
        <button type="button" className="choice-btn tummy" onClick={() => onPick('tummy')}>
          <div className="choice-icon" aria-hidden>
            🟡
          </div>
          <div>
            <strong>Tummy</strong>
            <span>Belly check time</span>
          </div>
        </button>
        <button type="button" className="choice-btn teeth" onClick={() => onPick('teeth')}>
          <div className="choice-icon" aria-hidden>
            😁
          </div>
          <div>
            <strong>Teeth</strong>
            <span>Sparkly smile check</span>
          </div>
        </button>
      </div>
    </>
  )
}

function ModeSelect({
  part,
  onBack,
  onPick,
}: {
  part: BodyPart
  onBack: () => void
  onPick: (m: ScanMode) => void
}) {
  const modes: { mode: ScanMode; emoji: string; hint: string }[] =
    part === 'tummy'
      ? [
          { mode: 'before-potty', emoji: '🚽', hint: 'Usually more germs' },
          { mode: 'after-potty', emoji: '✨', hint: 'Always a clean tummy!' },
        ]
      : [
          { mode: 'before-brushing', emoji: '🍪', hint: 'Usually more germs' },
          { mode: 'after-brushing', emoji: '🪥', hint: 'Always clean teeth!' },
        ]

  return (
    <>
      <TopBar showBack onBack={onBack} subtitle="Germ Scanner" />
      <h2 className="screen-title">{partLabel(part)} check</h2>
      <p className="screen-sub">When are we scanning?</p>
      <div className="choice-grid">
        {modes.map((m) => (
          <button
            key={m.mode}
            type="button"
            className="choice-btn mode"
            onClick={() => onPick(m.mode)}
          >
            <div className="choice-icon" aria-hidden>
              {m.emoji}
            </div>
            <div>
              <strong>{modeLabel(m.mode)}</strong>
              <span>{m.hint}</span>
            </div>
          </button>
        ))}
      </div>
    </>
  )
}

/** Clear kid-friendly tummy illustration with a defined belly surface for germs. */
function TummyArt({ showGerms }: { showGerms?: boolean }) {
  return (
    <div className="character tummy-art" aria-hidden>
      <svg viewBox="0 0 220 240" className="body-svg" role="img">
        <ellipse cx="110" cy="128" rx="88" ry="92" fill="#f6c48a" />
        <ellipse cx="110" cy="128" rx="88" ry="92" fill="url(#tummyShade)" />
        <ellipse cx="78" cy="78" rx="14" ry="16" fill="#f0b478" opacity="0.55" />
        <circle cx="78" cy="96" r="7" fill="#3d2c22" />
        <circle cx="142" cy="96" r="7" fill="#3d2c22" />
        <circle cx="80" cy="94" r="2.2" fill="#fff" />
        <circle cx="144" cy="94" r="2.2" fill="#fff" />
        <path
          d="M88 118 Q110 136 132 118"
          fill="none"
          stroke="#3d2c22"
          strokeWidth="5"
          strokeLinecap="round"
        />
        {/* Clear tummy / belly surface */}
        <ellipse cx="110" cy="168" rx="52" ry="42" fill="#ffddb0" stroke="#e0a05a" strokeWidth="3" />
        <ellipse cx="110" cy="168" rx="52" ry="42" fill="url(#bellyGlow)" />
        <circle cx="110" cy="172" r="6" fill="#e8a868" stroke="#d09048" strokeWidth="2" />
        <circle cx="110" cy="174" r="2" fill="#c87838" opacity="0.5" />
        {/* Soft arms hint */}
        <ellipse cx="28" cy="140" rx="18" ry="28" fill="#f6c48a" transform="rotate(-18 28 140)" />
        <ellipse cx="192" cy="140" rx="18" ry="28" fill="#f6c48a" transform="rotate(18 192 140)" />
        <defs>
          <radialGradient id="tummyShade" cx="40%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#ffe0b8" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#e8a060" stopOpacity="0.35" />
          </radialGradient>
          <radialGradient id="bellyGlow" cx="45%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#fff6e8" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#f0b878" stopOpacity="0.15" />
          </radialGradient>
        </defs>
      </svg>
      {showGerms && (
        <div className="germ-layer tummy-germs">
          <span className="germ g1">🦠</span>
          <span className="germ g2">🟢</span>
          <span className="germ g3">🦠</span>
          <span className="germ g4">🟣</span>
          <span className="germ g5">🦠</span>
        </div>
      )}
    </div>
  )
}

/** Clear smile / teeth illustration with germs landing on the teeth. */
function TeethArt({ showGerms }: { showGerms?: boolean }) {
  return (
    <div className="character teeth-art" aria-hidden>
      <svg viewBox="0 0 240 220" className="body-svg" role="img">
        <ellipse cx="120" cy="110" rx="100" ry="95" fill="#ffd7b0" />
        <ellipse cx="120" cy="110" rx="100" ry="95" fill="url(#faceShade)" />
        <circle cx="78" cy="88" r="9" fill="#3d2c22" />
        <circle cx="162" cy="88" r="9" fill="#3d2c22" />
        <circle cx="81" cy="85" r="2.8" fill="#fff" />
        <circle cx="165" cy="85" r="2.8" fill="#fff" />
        <ellipse cx="68" cy="108" rx="14" ry="8" fill="#ffb090" opacity="0.55" />
        <ellipse cx="172" cy="108" rx="14" ry="8" fill="#ffb090" opacity="0.55" />
        {/* Big smile mouth with clear teeth */}
        <path
          d="M60 128 Q120 188 180 128 Q120 158 60 128 Z"
          fill="#5b3a2e"
        />
        <g className="teeth-row">
          <rect x="78" y="132" width="18" height="26" rx="4" fill="#fffef8" stroke="#e8e0d0" strokeWidth="1.5" />
          <rect x="99" y="130" width="18" height="28" rx="4" fill="#fff" stroke="#e8e0d0" strokeWidth="1.5" />
          <rect x="120" y="130" width="18" height="28" rx="4" fill="#fff" stroke="#e8e0d0" strokeWidth="1.5" />
          <rect x="141" y="132" width="18" height="26" rx="4" fill="#fffef8" stroke="#e8e0d0" strokeWidth="1.5" />
        </g>
        <path
          d="M70 126 Q120 148 170 126"
          fill="none"
          stroke="#3d2c22"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.25"
        />
        <defs>
          <radialGradient id="faceShade" cx="40%" cy="28%" r="70%">
            <stop offset="0%" stopColor="#fff8ef" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#f0b070" stopOpacity="0.3" />
          </radialGradient>
        </defs>
      </svg>
      {showGerms && (
        <div className="germ-layer teeth-germs">
          <span className="germ g1">🦠</span>
          <span className="germ g2">🟢</span>
          <span className="germ g3">🦠</span>
          <span className="germ g4">🟣</span>
          <span className="germ g5">🦠</span>
        </div>
      )}
    </div>
  )
}

function SubjectFrame({
  part,
  photoUrl,
  showGerms,
  scanning,
}: {
  part: BodyPart
  photoUrl: string | null
  showGerms?: boolean
  scanning?: boolean
}) {
  return (
    <div className={`art-frame ${part} ${photoUrl ? 'has-photo' : ''}`}>
      {photoUrl ? (
        <div className="photo-subject">
          <img src={photoUrl} alt="Scan subject" className="scan-photo" />
          {showGerms && (
            <div className={`germ-layer photo-germs ${part}`}>
              <span className="germ g1">🦠</span>
              <span className="germ g2">🟢</span>
              <span className="germ g3">🦠</span>
              <span className="germ g4">🟣</span>
              <span className="germ g5">🦠</span>
            </div>
          )}
        </div>
      ) : part === 'tummy' ? (
        <TummyArt showGerms={showGerms} />
      ) : (
        <TeethArt showGerms={showGerms} />
      )}
      {scanning && (
        <>
          <div className="scan-beam" />
          <div className="radar-ring" />
          <div className="scan-corners" aria-hidden>
            <i />
            <i />
            <i />
            <i />
          </div>
        </>
      )}
    </div>
  )
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function PhotoScreen({
  part,
  mode,
  existingPhoto,
  onBack,
  onReady,
}: {
  part: BodyPart
  mode: ScanMode
  existingPhoto?: string | null
  onBack: () => void
  onReady: (photoUrl: string | null) => void
}) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(existingPhoto ?? null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [liveCam, setLiveCam] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setLiveCam(false)
  }, [])

  useEffect(() => () => stopCamera(), [stopCamera])

  const startCamera = async () => {
    setCameraError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      })
      streamRef.current = stream
      setLiveCam(true)
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          void videoRef.current.play()
        }
      })
    } catch {
      setCameraError('Camera not available — try the gallery or snap button below.')
      // Fall back to capture input
      fileInputRef.current?.click()
    }
  }

  const captureFromVideo = () => {
    const video = videoRef.current
    if (!video || !video.videoWidth) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0)
    const url = canvas.toDataURL('image/jpeg', 0.85)
    setPhotoUrl(url)
    stopCamera()
  }

  const onFile = async (file: File | undefined) => {
    if (!file) return
    try {
      const url = await readFileAsDataUrl(file)
      setPhotoUrl(url)
      stopCamera()
      setCameraError(null)
    } catch {
      setCameraError('Could not read that photo — try another, or use the illustration.')
    }
  }

  return (
    <>
      <TopBar showBack onBack={onBack} subtitle="Germ Scanner" />
      <h2 className="screen-title">Take a photo</h2>
      <p className="screen-sub">
        Snap Noah&apos;s {partLabel(part).toLowerCase()} once — then we scan it. ({modeLabel(mode)})
      </p>

      <div className="photo-stage">
        {liveCam ? (
          <div className="camera-live">
            <video ref={videoRef} playsInline muted autoPlay className="camera-video" />
            <button type="button" className="btn primary snap-btn" onClick={captureFromVideo}>
              📸 Snap
            </button>
            <button type="button" className="btn secondary" onClick={stopCamera}>
              Cancel camera
            </button>
          </div>
        ) : photoUrl ? (
          <div className="photo-preview-wrap">
            <img src={photoUrl} alt="Ready to scan" className="photo-preview" />
          </div>
        ) : (
          <div className={`art-frame ${part} preview-art`}>
            {part === 'tummy' ? <TummyArt /> : <TeethArt />}
            <p className="preview-hint">Illustration standby — or add a photo</p>
          </div>
        )}
      </div>

      {cameraError && <p className="cam-note">{cameraError}</p>}

      <div className="actions">
        {!liveCam && (
          <>
            {!photoUrl && (
              <>
                <button type="button" className="btn primary" onClick={() => void startCamera()}>
                  📷 Open camera
                </button>
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  📱 Phone camera / capture
                </button>
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => galleryInputRef.current?.click()}
                >
                  🖼️ Pick from gallery
                </button>
              </>
            )}
            {photoUrl && (
              <>
                <button type="button" className="btn primary" onClick={() => onReady(photoUrl)}>
                  Start scan ▶
                </button>
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => {
                    setPhotoUrl(null)
                    fileInputRef.current?.click()
                  }}
                >
                  Retake photo
                </button>
              </>
            )}
            <button type="button" className="btn ghost" onClick={() => onReady(null)}>
              {photoUrl ? 'Scan without photo (use art)' : 'Skip photo — use illustration'}
            </button>
          </>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => void onFile(e.target.files?.[0])}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => void onFile(e.target.files?.[0])}
      />
      <p className="footnote">Photos stay on this device — nothing is uploaded.</p>
    </>
  )
}

function ScanScreen({
  part,
  mode,
  photoUrl,
  onDone,
}: {
  part: BodyPart
  mode: ScanMode
  photoUrl: string | null
  onDone: () => void
}) {
  useEffect(() => {
    const t = window.setTimeout(onDone, SCAN_DURATION_MS)
    return () => window.clearTimeout(t)
  }, [onDone])

  return (
    <>
      <TopBar subtitle="Germ Scanner" />
      <h2 className="screen-title">Scanning {partLabel(part).toLowerCase()}…</h2>
      <p className="screen-sub">{modeLabel(mode)} · beep beep!</p>
      <div className="scan-stage">
        <SubjectFrame part={part} photoUrl={photoUrl} scanning />
        <div className="progress-wrap">
          <div className="progress-label">
            <span>Looking for pretend germs</span>
            <span>Radar on</span>
          </div>
          <div className="progress-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100}>
            <div className="progress-fill" style={{ animationDuration: `${SCAN_DURATION_MS}ms` }} />
          </div>
        </div>
      </div>
    </>
  )
}

function ResultScreen({
  part,
  mode,
  photoUrl,
  germPercent,
  isClean,
  onRetake,
  onAgain,
  onHome,
}: {
  part: BodyPart
  mode: ScanMode
  photoUrl: string | null
  germPercent: number
  isClean: boolean
  onRetake: () => void
  onAgain: () => void
  onHome: () => void
}) {
  const title = isClean
    ? part === 'tummy'
      ? 'Clean tummy!'
      : 'Clean teeth!'
    : part === 'tummy'
      ? 'Tummy germs spotted!'
      : 'Tooth germs spotted!'

  return (
    <>
      <TopBar subtitle="Germ Scanner" />
      <div className={`result-card ${isClean ? 'clean' : 'germy'}`}>
        <SubjectFrame part={part} photoUrl={photoUrl} showGerms={!isClean} />
        {isClean ? (
          <div className="clean-badge" aria-hidden>
            <span className="green-tick">✓</span>
          </div>
        ) : (
          <div className="result-emoji" aria-hidden>
            👾
          </div>
        )}
        <h2>{title}</h2>
        <p>
          {modeLabel(mode)} · {partLabel(part)}
        </p>
        {isClean ? (
          <>
            <div className="percent clean-pct">
              <strong>0%</strong>
              <span>pretend germs</span>
            </div>
            <div className="confetti cheer" aria-hidden>
              <span>⭐</span>
              <span>✨</span>
              <span>🌟</span>
              <span>🎈</span>
              <span>🎉</span>
              <span>💫</span>
            </div>
            <p className="cheer-line">High five! Looking sparkly and fresh.</p>
          </>
        ) : (
          <>
            <div className="percent">
              <strong>{germPercent}%</strong>
              <span>pretend germs</span>
            </div>
            <p className="result-hint">Cute germs popped onto the {partLabel(part).toLowerCase()}!</p>
            <p>Time for a wash or brush — then scan again!</p>
          </>
        )}
      </div>
      <div className="actions">
        <button type="button" className="btn primary" onClick={onAgain}>
          Scan again
        </button>
        <button type="button" className="btn secondary" onClick={onRetake}>
          Retake photo
        </button>
        <button type="button" className="btn ghost" onClick={onHome}>
          Back to tools
        </button>
      </div>
      <p className="footnote">Pretend play only — not medical advice.</p>
    </>
  )
}

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' })

  const openTool = (id: ToolId) => {
    if (id === 'germ') setScreen({ name: 'part' })
    else if (id === 'map') setScreen({ name: 'map' })
  }

  return (
    <div className="app">
      {screen.name === 'home' && <Home onOpenTool={openTool} />}

      {screen.name === 'map' && (
        <Suspense fallback={<p className="screen-sub">Loading map…</p>}>
          <MapSizeCompare onBack={() => setScreen({ name: 'home' })} />
        </Suspense>
      )}

      {screen.name === 'part' && (
        <PartSelect
          onBack={() => setScreen({ name: 'home' })}
          onPick={(part) => setScreen({ name: 'mode', part })}
        />
      )}

      {screen.name === 'mode' && (
        <ModeSelect
          part={screen.part}
          onBack={() => setScreen({ name: 'part' })}
          onPick={(mode) => setScreen({ name: 'photo', part: screen.part, mode })}
        />
      )}

      {screen.name === 'photo' && (
        <PhotoScreen
          part={screen.part}
          mode={screen.mode}
          existingPhoto={screen.photoUrl}
          onBack={() => setScreen({ name: 'mode', part: screen.part })}
          onReady={(photoUrl) =>
            setScreen({ name: 'scan', part: screen.part, mode: screen.mode, photoUrl })
          }
        />
      )}

      {screen.name === 'scan' && (
        <ScanScreen
          part={screen.part}
          mode={screen.mode}
          photoUrl={screen.photoUrl}
          onDone={() => {
            const result = pretendScan(screen.part, screen.mode)
            setScreen({
              name: 'result',
              part: screen.part,
              mode: screen.mode,
              photoUrl: screen.photoUrl,
              germPercent: result.germPercent,
              isClean: result.isClean,
            })
          }}
        />
      )}

      {screen.name === 'result' && (
        <ResultScreen
          part={screen.part}
          mode={screen.mode}
          photoUrl={screen.photoUrl}
          germPercent={screen.germPercent}
          isClean={screen.isClean}
          onAgain={() =>
            setScreen({
              name: 'scan',
              part: screen.part,
              mode: screen.mode,
              photoUrl: screen.photoUrl,
            })
          }
          onRetake={() =>
            setScreen({
              name: 'photo',
              part: screen.part,
              mode: screen.mode,
              photoUrl: null,
            })
          }
          onHome={() => setScreen({ name: 'home' })}
        />
      )}
    </div>
  )
}
