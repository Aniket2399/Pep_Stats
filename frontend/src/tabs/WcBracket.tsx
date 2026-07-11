import Flag from '../components/Flag'
import type { BracketRound, BracketTie } from '../data/types'

const TBD = (): BracketTie => ({
  stage: '', home_team: null, away_team: null, home_flag: '', away_flag: '',
  home_score: null, away_score: null, status: 'UP',
})

function Tie({ t, final = false }: { t: BracketTie; final?: boolean }) {
  const played = t.home_score != null && t.away_score != null
  const homeWin = played && (t.home_score as number) > (t.away_score as number)
  const awayWin = played && (t.away_score as number) > (t.home_score as number)
  const up = !played
  return (
    <div className={`btie${final ? ' final' : ''}${up ? ' up' : ''}`}>
      <div className="kt-row">
        <Flag code={t.home_flag} size={18} />
        <span className={`kt-name ${homeWin ? 'kw' : played ? 'kl' : ''}`}>{t.home_team ?? 'TBD'}</span>
        <span className="kt-sc">{played ? t.home_score : ''}</span>
      </div>
      <div className="kt-row">
        <Flag code={t.away_flag} size={18} />
        <span className={`kt-name ${awayWin ? 'kw' : played ? 'kl' : ''}`}>{t.away_team ?? 'TBD'}</span>
        <span className="kt-sc">{played ? t.away_score : ''}</span>
      </div>
    </div>
  )
}

const leftHalf = (t: BracketTie[]) => t.slice(0, Math.ceil(t.length / 2))
const rightHalf = (t: BracketTie[]) => t.slice(Math.ceil(t.length / 2))
const Col = ({ side, ties }: { side: 'l' | 'r'; ties: BracketTie[] }) => (
  <div className={`bcol bcol-${side}`}>{ties.map((t, i) => <Tie key={i} t={t} />)}</div>
)

export default function WcBracket({ rounds }: { rounds: BracketRound[] }) {
  const stage = (re: RegExp) => rounds.find((r) => re.test(r.stage))?.ties ?? []
  const r32 = stage(/32/)
  const r16 = stage(/16/)
  if (!r32.length && !r16.length) return <div className="panel">No knockout matches yet.</div>

  const mk = (n: number) => Array.from({ length: n }, TBD)
  const qf = stage(/quarter/i)
  const sf = stage(/semi/i)
  const fin = stage(/^final$/i)[0] ?? TBD()

  // Outer→inner rounds present (Final rendered in the centre). R32 becomes the
  // outermost column pair when present, so all real matches are shown.
  const cols: BracketTie[][] = [r32, r16, qf.length ? qf : mk(4), sf.length ? sf : mk(2)].filter((t) => t.length)

  return (
    <div>
      <div className="sec-title" style={{ marginBottom: 12 }}>Knockout Bracket</div>
      <div className="bracket2">
        {cols.map((ties, i) => <Col key={`l${i}`} side="l" ties={leftHalf(ties)} />)}
        <div className="bcol bcenter">
          <div className="wc26-lockup">
            <img className="wc26-img" src="/wc-trophy.jpg" alt="FIFA World Cup trophy" style={{ borderRadius: 12 }} />
            <div className="wc26-wm wm-c">FIFA WORLD CUP<span className="wc26-yr">2026</span></div>
            <div className="wc26-hosts">USA · CANADA · MEXICO</div>
          </div>
          <Tie t={fin} final />
        </div>
        {[...cols].reverse().map((ties, i) => <Col key={`r${i}`} side="r" ties={rightHalf(ties)} />)}
      </div>
    </div>
  )
}
