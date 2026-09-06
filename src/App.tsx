import { useEffect, useState } from 'react'
import './App.css'
import type { BodyPart, ScanMode, Screen, ToolCard } from './types'
import { modeLabel, partLabel, pretendScan } from './scanLogic'

const TOOLS: ToolCard[] = [
  {
    id: 'germ',
    title: 'Germ Scanner',
    emoji: '🔬',
    blurb: 'Scan tummy or teeth for pretend germs!',
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

function Home({ onOpenGerm }: { onOpenGerm: () => void }) {
  return (
    <>
      <TopBar />
      <h2 className="screen-title">Pick a tool</h2>
      <p className="screen-sub">A growing kit for Noah — tap Germ Scanner to play.</p>
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
              onClick={() => live && onOpenGerm()}
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
          { mode: 'after-potty', emoji: '✨', hint: 'Usually cleaner' },
        ]
      : [
          { mode: 'before-brushing', emoji: '🍪', hint: 'Usually more germs' },
          { mode: 'after-brushing', emoji: '🪥', hint: 'Usually cleaner' },
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

function TummyArt() {
  return (
    <div className="character" aria-hidden>
      <div className="tummy-body">
        <div className="tummy-smile" />
        <div className="tummy-belly" />
      </div>
    </div>
  )
}

function TeethArt() {
  return (
    <div className="character" aria-hidden>
      <div className="teeth-face">
        <div className="teeth-eyes">
          <i />
          <i />
        </div>
        <div className="teeth-mouth">
          <span className="tooth" />
          <span className="tooth" />
          <span className="tooth" />
          <span className="tooth" />
        </div>
      </div>
    </div>
  )
}

function ScanScreen({
  part,
  mode,
  onDone,
}: {
  part: BodyPart
  mode: ScanMode
  onDone: () => void
}) {
  useEffect(() => {
    const t = window.setTimeout(onDone, 2600)
    return () => window.clearTimeout(t)
  }, [onDone])

  return (
    <>
      <TopBar subtitle="Germ Scanner" />
      <h2 className="screen-title">Scanning {partLabel(part).toLowerCase()}…</h2>
      <p className="screen-sub">{modeLabel(mode)}</p>
      <div className="scan-stage">
        <div className={`art-frame ${part}`}>
          {part === 'tummy' ? <TummyArt /> : <TeethArt />}
          <div className="scan-beam" />
          <div className="radar-ring" />
        </div>
        <div className="progress-wrap">
          <div className="progress-label">
            <span>Looking for pretend germs</span>
            <span>Beep beep!</span>
          </div>
          <div className="progress-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100}>
            <div className="progress-fill" />
          </div>
        </div>
      </div>
    </>
  )
}

function ResultScreen({
  part,
  mode,
  germPercent,
  isClean,
  onAgain,
  onHome,
}: {
  part: BodyPart
  mode: ScanMode
  germPercent: number
  isClean: boolean
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
        <div className="result-emoji" aria-hidden>
          {isClean ? '🎉' : '👾'}
        </div>
        <h2>{title}</h2>
        <p>
          {modeLabel(mode)} · {partLabel(part)}
        </p>
        <div className={`percent ${isClean ? 'clean-pct' : ''}`}>
          <strong>{germPercent}%</strong>
          <span>pretend germs</span>
        </div>
        {isClean ? (
          <div className="confetti" aria-hidden>
            <span>⭐</span>
            <span>✨</span>
            <span>🌟</span>
            <span>🎈</span>
          </div>
        ) : (
          <div className="germs" aria-hidden>
            <span className="germ">🦠</span>
            <span className="germ">🦠</span>
            <span className="germ">🦠</span>
            <span className="germ">🟢</span>
            <span className="germ">🟣</span>
          </div>
        )}
        <p>
          {isClean
            ? 'High five! Looking sparkly and fresh.'
            : 'Time for a wash or brush — then scan again!'}
        </p>
      </div>
      <div className="actions">
        <button type="button" className="btn primary" onClick={onAgain}>
          Scan again
        </button>
        <button type="button" className="btn secondary" onClick={onHome}>
          Back to tools
        </button>
      </div>
      <p className="footnote">Pretend play only — not medical advice.</p>
    </>
  )
}

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' })

  return (
    <div className="app">
      {screen.name === 'home' && (
        <Home onOpenGerm={() => setScreen({ name: 'part' })} />
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
          onPick={(mode) => setScreen({ name: 'scan', part: screen.part, mode })}
        />
      )}

      {screen.name === 'scan' && (
        <ScanScreen
          part={screen.part}
          mode={screen.mode}
          onDone={() => {
            const result = pretendScan(screen.part, screen.mode)
            setScreen({
              name: 'result',
              part: screen.part,
              mode: screen.mode,
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
          germPercent={screen.germPercent}
          isClean={screen.isClean}
          onAgain={() => setScreen({ name: 'part' })}
          onHome={() => setScreen({ name: 'home' })}
        />
      )}
    </div>
  )
}
