'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDown, ArrowRight, ArrowUp, ArrowUpRight, Bookmark, CalendarDays, Check,
  CircleHelp, Clock3, Copy, Dices, Download, Heart, Info, Menu, RefreshCw, ShieldCheck,
  Sparkles, Ticket, Trash2, X, Zap,
} from 'lucide-react'
import drawData from '../../public/data/rounds.json'
import type { DrawStatus, LottoMode, LotteryType, PensionMode, Ticket as TicketType } from '@/types'
import { lottoModeLabel, makeLottoNumbers, makePensionNumber, pensionModeLabel } from '@/lib/lottery'

type Page = 'home' | 'lotto' | 'pension' | 'favorites' | 'guide'
const STORE_KEY = 'lottery-simulator-v1'
const DRAW = drawData as DrawStatus
const LINKS: { href: string; label: string; page: Page }[] = [
  { href: '/', label: '홈', page: 'home' },
  { href: '/lotto/', label: '로또 6/45', page: 'lotto' },
  { href: '/pension/', label: '연금복권', page: 'pension' },
  { href: '/favorites/', label: '즐겨찾기', page: 'favorites' },
  { href: '/guide/', label: '이용 안내', page: 'guide' },
]

type Store = { favorites: TicketType[]; history: TicketType[]; total: number }
const emptyStore: Store = { favorites: [], history: [], total: 0 }
const formatDate = (date: string) => new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric', weekday: 'short', timeZone: 'Asia/Seoul' }).format(new Date(`${date}T12:00:00+09:00`))
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
const drawTarget = (type: LotteryType) => {
  const info = type === 'lotto' ? DRAW.lotto : DRAW.pension
  const verified = info.status === 'next-draw'
  return { ... (verified ? info.next : info.lastVerified), verified }
}

export function AppShell({ page }: { page: Page }) {
  const [store, setStore] = useState<Store>(emptyStore)
  const [ready, setReady] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const latest = store.history[0]
  const favorites = store.favorites

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEY)
      if (raw) setStore({ ...emptyStore, ...JSON.parse(raw) })
    } catch {
      localStorage.removeItem(STORE_KEY)
    }
    setReady(true)
  }, [])

  useEffect(() => {
    if (ready) localStorage.setItem(STORE_KEY, JSON.stringify(store))
  }, [store, ready])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(''), 2600)
    return () => window.clearTimeout(timer)
  }, [notice])

  const toggleFavorite = (ticket: TicketType) => {
    setStore((current) => {
      const exists = current.favorites.some((item) => item.id === ticket.id)
      return { ...current, favorites: exists ? current.favorites.filter((item) => item.id !== ticket.id) : [ticket, ...current.favorites] }
    })
    setNotice(store.favorites.some((item) => item.id === ticket.id) ? '즐겨찾기에서 삭제했어요.' : '즐겨찾기에 저장했어요.')
  }

  const deleteFavorite = (id: string) => {
    setStore((current) => ({ ...current, favorites: current.favorites.filter((item) => item.id !== id) }))
    setNotice('저장한 번호를 삭제했어요.')
  }

  const addHistory = (tickets: TicketType[]) => setStore((current) => ({ ...current, history: [...tickets, ...current.history].slice(0, 40), total: current.total + tickets.length }))

  return <div className="app-frame">
    <header className="topbar">
      <div className="topbar-inner">
        <Link href="/" className="brand" aria-label="복권 시뮬레이터 홈">
          <span className="brand-mark"><Dices size={19} strokeWidth={2.2} /></span>
          <span className="brand-name">복권<span>시뮬레이터</span></span>
        </Link>
        <nav className="desktop-nav" aria-label="주 메뉴">
          {LINKS.map((item) => <Link key={item.page} href={item.href} className={`nav-link ${page === item.page ? 'active' : ''}`}>{item.label}</Link>)}
        </nav>
        <Link className="nav-cta" href="/lotto/"><Sparkles size={15} /> 번호 뽑기</Link>
        <button className="icon-button mobile-menu" aria-label={mobileOpen ? '메뉴 닫기' : '메뉴 열기'} onClick={() => setMobileOpen((value) => !value)}>{mobileOpen ? <X /> : <Menu />}</button>
      </div>
      {mobileOpen && <nav className="mobile-nav" aria-label="모바일 메뉴">{LINKS.map((item) => <Link key={item.page} href={item.href} onClick={() => setMobileOpen(false)} className={page === item.page ? 'active' : ''}>{item.label}<ArrowRight size={15} /></Link>)}</nav>}
    </header>

    <main>
      {page === 'home' && <HomePage store={store} ready={ready} latest={latest} />}
      {page === 'lotto' && <GeneratorPage type="lotto" addHistory={addHistory} history={store.history} favorites={favorites} toggleFavorite={toggleFavorite} notify={setNotice} />}
      {page === 'pension' && <GeneratorPage type="pension" addHistory={addHistory} history={store.history} favorites={favorites} toggleFavorite={toggleFavorite} notify={setNotice} />}
      {page === 'favorites' && <FavoritesPage tickets={favorites} onDelete={deleteFavorite} notify={setNotice} />}
      {page === 'guide' && <GuidePage />}
    </main>

    <footer className="footer"><div className="footer-main"><Link href="/" className="brand footer-brand"><span className="brand-mark"><Dices size={18} /></span><span className="brand-name">복권<span>시뮬레이터</span></span></Link><p>숫자를 고르는 즐거움, 가볍고 건강하게.</p><div className="footer-links"><Link href="/guide/">이용 안내</Link><a href="https://www.dhlottery.co.kr/" target="_blank" rel="noreferrer">동행복권 공식 사이트 <ArrowUpRight size={13} /></a></div></div><div className="footer-bottom"><span>© 2026 복권 시뮬레이터</span><span><ShieldCheck size={13} /> 당첨 예측·보장 서비스가 아닙니다.</span></div></footer>
    {notice && <div className="toast" role="status"><Check size={16} />{notice}</div>}
  </div>
}

function RoundPill({ type, compact = false }: { type: LotteryType; compact?: boolean }) {
  const info = type === 'lotto' ? DRAW.lotto : DRAW.pension
  const label = type === 'lotto' ? '로또 6/45' : '연금복권 720+'
  const verified = info.status === 'next-draw'
  const target = verified ? info.next : info.lastVerified
  return <div className={`round-pill ${compact ? 'compact' : ''} ${verified ? '' : 'round-needs-check'}`}><span className="live-dot" /><span>{label}</span><b>제{target.round}회</b><span className="round-date">{verified ? formatDate(target.date) : '마지막 확인'}</span></div>
}

function HomePage({ store, ready, latest }: { store: Store; ready: boolean; latest?: TicketType }) {
  const lottoTarget = drawTarget('lotto')
  const pensionTarget = drawTarget('pension')
  const dayWords = ['차분한 마음이 좋은 선택을 만들어요.', '작은 기대가 오늘을 조금 더 즐겁게 해요.', '행운은 가벼운 마음으로 기다려 보세요.', '오늘의 숫자는 오늘의 재미로 충분해요.', '좋은 하루에 작은 설렘을 더해 보세요.', '기분 좋은 선택이 하루를 밝혀줘요.', '무리하지 않는 즐거움이 가장 오래가요.']
  const daily = dayWords[Math.floor(Date.now() / 86400000) % dayWords.length]
  return <div className="page-wrap home-page">
    <section className="hero">
      <div className="hero-copy"><div className="eyebrow"><span className="eyebrow-line" /> NEXT DRAW · YOUR PICK</div><h1>오늘의 행운 번호를<br /><span>만나보세요.</span></h1><p>일반복권과 연금복권, 다음 회차를 위한<br className="desktop-break" /> 나만의 조합을 가볍게 만들어 보세요.</p><div className="hero-actions"><Link href="/lotto/" className="button button-gold">번호 추천받기 <ArrowRight size={17} /></Link><Link href="/guide/" className="text-action">이용 방법 <ArrowUpRight size={15} /></Link></div><div className="hero-note"><ShieldCheck size={15} /> 모든 조합은 무작위 생성이며 당첨을 예측하지 않아요.</div></div>
      <div className="hero-art" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="spark spark-a">✦</div><div className="spark spark-b">✧</div><div className="lotto-ball ball-hero ball-hero-one">7</div><div className="lotto-ball ball-hero ball-hero-two">18</div><div className="lotto-ball ball-hero ball-hero-three">31</div><div className="lotto-ball ball-hero ball-hero-four">42</div><div className="hero-ticket"><span>LUCKY PICK</span><b>오늘의 조합</b><i>YOUR NEXT CHAPTER</i></div></div>
    </section>

    <section className="next-round-section"><div className="section-heading"><div><div className="eyebrow">UPCOMING DRAWS</div><h2>다가오는 추첨</h2></div><span className="section-caption"><span className="live-dot" /> 다음 추첨 회차</span></div><div className="draw-cards">
      <Link className="draw-card lotto-card" href="/lotto/"><div className="draw-card-top"><span className="type-icon type-lotto"><Ticket size={18} /></span><span className="draw-arrow"><ArrowUpRight size={17} /></span></div><div className="draw-type">LOTTO 6/45</div><div className="draw-round">제 <strong>{lottoTarget.round}</strong> 회차{!lottoTarget.verified && <small className="verify-tag">마지막 확인</small>}</div><div className="draw-date"><CalendarDays size={14} /> {lottoTarget.verified ? `${formatDate(lottoTarget.date)} 추첨` : `${formatDate(lottoTarget.date)} 확인됨`}</div><div className="draw-divider" /><div className="draw-card-bottom"><span>1부터 45까지, 6개의 숫자</span><ArrowRight size={15} /></div></Link>
      <Link className="draw-card pension-card" href="/pension/"><div className="draw-card-top"><span className="type-icon type-pension"><Sparkles size={18} /></span><span className="draw-arrow"><ArrowUpRight size={17} /></span></div><div className="draw-type">PENSION LOTTERY 720+</div><div className="draw-round">제 <strong>{pensionTarget.round}</strong> 회차{!pensionTarget.verified && <small className="verify-tag">마지막 확인</small>}</div><div className="draw-date"><CalendarDays size={14} /> {pensionTarget.verified ? `${formatDate(pensionTarget.date)} 추첨` : `${formatDate(pensionTarget.date)} 확인됨`}</div><div className="draw-divider" /><div className="draw-card-bottom"><span>1조–5조 · 여섯 자리 숫자</span><ArrowRight size={15} /></div></Link>
    </div><p className="round-footnote"><Info size={13} /> 회차 정보 업데이트 {new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeZone: 'Asia/Seoul' }).format(new Date(DRAW.updatedAt))} · <a href={DRAW.source} target="_blank" rel="noreferrer">동행복권 기준 확인 <ArrowUpRight size={11} /></a></p></section>

    <section className="dashboard-row"><div className="recent-card"><div className="card-heading"><div><div className="eyebrow">RECENTLY GENERATED</div><h3>최근 생성한 번호</h3></div><Link href={latest ? (latest.type === 'lotto' ? '/lotto/' : '/pension/') : '/lotto/'} className="small-arrow" aria-label="번호 더 보기"><ArrowRight size={17} /></Link></div>{ready && latest ? <TicketDisplay ticket={latest} compact /> : <div className="empty-recent"><span className="empty-icon"><Dices size={18} /></span><div><b>아직 생성한 번호가 없어요</b><span>첫 조합을 만들고 저장해 보세요.</span></div><Link href="/lotto/">번호 만들기 <ArrowRight size={14} /></Link></div>}</div><div className="stats-card"><span className="stats-icon"><Zap size={17} /></span><div className="stats-label">지금까지 생성한 번호</div><div className="stats-number">{ready ? store.total.toLocaleString('ko-KR') : '—'}<small>개</small></div><div className="stats-rule" /><div className="daily-luck"><Sparkles size={15} /><div><span>오늘의 한마디</span><b>{daily}</b></div></div></div></section>

    <section className="method-section"><div className="method-intro"><div className="eyebrow">PICK YOUR STYLE</div><h2>오늘은 어떤<br />방식으로 뽑아볼까요?</h2><p>취향에 맞는 번호 생성 방식을 선택해 보세요.<br />어떤 방식도 당첨 확률을 높이지는 않아요.</p></div><div className="method-mini-grid"><Link href="/lotto/" className="method-mini"><span className="mini-number">01</span><b>무작위</b><span>조건 없이 가볍게</span><ArrowUpRight size={15} /></Link><Link href="/lotto/" className="method-mini"><span className="mini-number">02</span><b>균등 분산</b><span>구간을 넓게 나눠서</span><ArrowUpRight size={15} /></Link><Link href="/pension/" className="method-mini"><span className="mini-number">03</span><b>숫자 조합</b><span>중복 또는 균형 있게</span><ArrowUpRight size={15} /></Link></div></section>
  </div>
}

type GeneratorProps = { type: LotteryType; addHistory: (items: TicketType[]) => void; history: TicketType[]; favorites: TicketType[]; toggleFavorite: (ticket: TicketType) => void; notify: (text: string) => void }
function GeneratorPage({ type, addHistory, history, favorites, toggleFavorite, notify }: GeneratorProps) {
  const isLotto = type === 'lotto'
  const target = drawTarget(type)
  const [lottoMode, setLottoMode] = useState<LottoMode>('random')
  const [pensionMode, setPensionMode] = useState<PensionMode>('random')
  const [count, setCount] = useState(1)
  const [chosenGroup, setChosenGroup] = useState(1)
  const [excluded, setExcluded] = useState<number[]>([])
  const [tickets, setTickets] = useState<TicketType[]>([])
  const [loading, setLoading] = useState(false)

  const make = () => {
    setLoading(true)
    try {
      const round = target
      const generated: TicketType[] = []
      const signatures = new Set<string>()
      let attempts = 0
      while (generated.length < count && attempts < count * 30) {
        attempts += 1
        const values = isLotto ? makeLottoNumbers(lottoMode, excluded) : makePensionNumber(pensionMode, chosenGroup)
        const signature = Array.isArray(values) ? values.join('-') : `${values.group}-${values.digits}`
        if (signatures.has(signature)) continue
        signatures.add(signature)
        generated.push({
          id: uid(), type, round: round.round, drawDate: round.date,
          values, mode: isLotto ? lottoModeLabel(lottoMode) : pensionModeLabel(pensionMode), createdAt: new Date().toISOString(),
        })
      }
      if (generated.length < count) throw new Error('서로 다른 조합을 만들지 못했어요. 생성 개수를 줄여 다시 시도해 주세요.')
      setTickets(generated)
      addHistory(generated)
      notify(`${generated.length}개의 추천 번호를 만들었어요.`)
    } catch (error) {
      notify(error instanceof Error ? error.message : '번호 생성 중 문제가 생겼어요.')
    } finally {
      window.setTimeout(() => setLoading(false), 280)
    }
  }

  const modeOptions = isLotto
    ? ([['random', '완전 무작위', '1–45 중 조건 없이 추첨'], ['spread', '균등 분산', '여러 구간에 골고루 배치'], ['odd-even', '홀짝 균형', '홀수 3개 · 짝수 3개'], ['low-high', '저·고번호 분산', '1–22와 23–45에서 3개씩'], ['no-consecutive', '연속 번호 제한', '연속 숫자 조합을 최소화']] as [LottoMode, string, string][])
    : ([['random', '완전 무작위', '조와 여섯 자리를 모두 추첨'], ['random-group', '조 무작위 선택', '1조부터 5조까지 무작위'], ['balanced', '6자리 균등 분포', '낮은 수와 높은 수를 배치'], ['unique', '중복 숫자 최소화', '여섯 자리를 모두 다르게'], ['repeat', '반복 숫자 포함', '같은 숫자가 두 번 이상'], ['chosen-group', '원하는 조 선택', '선택한 조로 번호 생성']] as [PensionMode, string, string][]) 

  return <div className="page-wrap generator-page">
    <div className="page-kicker"><Link href="/">홈</Link><span>/</span><span>{isLotto ? '로또 6/45 추천' : '연금복권 추천'}</span></div>
    <div className="generator-header"><div><div className="eyebrow">{isLotto ? 'LOTTO 6/45' : 'PENSION LOTTERY 720+'}</div><h1>{isLotto ? '로또 6/45' : '연금복권 720+'}<span> 번호 추천</span></h1><p>{isLotto ? '조건을 골라 다음 추첨 회차의 번호 조합을 만들어 보세요.' : '조와 여섯 자리 숫자를 나만의 방식으로 조합해 보세요.'}</p>{!target.verified && <div className="verification-warning"><Info size={14} /> 공식 회차를 다시 확인 중이에요. 마지막 확인 회차 기준으로 표시합니다.</div>}</div><RoundPill type={type} /></div>
    <div className="generator-layout">
      <aside className="control-panel"><div className="control-title"><span className="control-icon"><Dices size={18} /></span><div><h2>생성 조건</h2><span>원하는 방식으로 설정해 보세요</span></div></div>
        <div className="field-label">추천 방식 <span>필수</span></div><div className="mode-list">{modeOptions.map(([value, label, description]) => <button type="button" key={value} aria-pressed={(isLotto ? lottoMode : pensionMode) === value} className={`mode-option ${(isLotto ? lottoMode : pensionMode) === value ? 'selected' : ''}`} onClick={() => isLotto ? setLottoMode(value as LottoMode) : setPensionMode(value as PensionMode)}><span className="radio-mark" /><span className="mode-copy"><b>{label}</b><small>{description}</small></span></button>)}</div>
        {isLotto && <div className="exclude-field"><div className="field-label">제외 번호 <span>선택</span></div><div className="exclude-caption">눌러서 제외 번호를 추가하세요.</div><div className="exclude-grid">{Array.from({ length: 45 }, (_, index) => index + 1).map((number) => <button type="button" key={number} onClick={() => setExcluded((current) => current.includes(number) ? current.filter((item) => item !== number) : current.length < 39 ? [...current, number] : current)} className={`${excluded.includes(number) ? 'excluded' : ''}`} aria-label={String(number)} aria-pressed={excluded.includes(number)} title={`${number}번 ${excluded.includes(number) ? '제외 취소' : '제외'}`}>{number}</button>)}</div>{excluded.length > 0 && <button type="button" className="clear-excluded" onClick={() => setExcluded([])}><X size={12} /> 제외 번호 초기화 ({excluded.length})</button>}</div>}
        {!isLotto && pensionMode === 'chosen-group' && <div className="group-field"><div className="field-label">원하는 조</div><div className="group-select">{[1, 2, 3, 4, 5].map((group) => <button key={group} type="button" aria-pressed={chosenGroup === group} className={chosenGroup === group ? 'selected' : ''} onClick={() => setChosenGroup(group)}>{group}조</button>)}</div></div>}
        <div className="count-field"><div className="field-label">생성 개수 <span>최대 10개</span></div><div className="count-stepper"><button type="button" aria-label="개수 줄이기" onClick={() => setCount((value) => Math.max(1, value - 1))}><ArrowDown size={15} /></button><strong>{count}<small> 게임</small></strong><button type="button" aria-label="개수 늘리기" onClick={() => setCount((value) => Math.min(10, value + 1))}><ArrowUp size={15} /></button></div><div className="count-presets">{[1, 3, 5, 10].map((n) => <button key={n} type="button" aria-pressed={count === n} onClick={() => setCount(n)} className={count === n ? 'active' : ''}>{n}개</button>)}</div></div>
        <button type="button" className={`button button-gold generate-button ${loading ? 'is-loading' : ''}`} onClick={make} disabled={loading}><Dices size={17} className={loading ? 'spin' : ''} />{loading ? '번호를 고르는 중…' : `제${target.round}회 번호 생성`}</button><div className="panel-disclaimer"><ShieldCheck size={14} /> 재미와 참고를 위한 무작위 조합이에요.</div>
      </aside>
      <section className="results-panel"><div className="results-header"><div><div className="eyebrow">YOUR NUMBER SETS</div><h2>추천 번호 <span>{tickets.length > 0 ? `${tickets.length}개` : ''}</span></h2></div>{tickets.length > 0 && <button type="button" className="button button-outline regenerate" onClick={make} disabled={loading}><RefreshCw size={15} /> 다시 생성</button>}</div>
        <div className="ticket-list">{tickets.length > 0 ? tickets.map((ticket, index) => <TicketCard key={ticket.id} ticket={ticket} index={index} saved={favorites.some((item) => item.id === ticket.id)} onFavorite={() => toggleFavorite(ticket)} notify={notify} />) : <div className="results-empty"><div className="empty-orbit"><span className="empty-ball empty-ball-a">?</span><span className="empty-ball empty-ball-b">?</span><span className="empty-ball empty-ball-c">?</span><Dices size={27} /></div><h3>아직 번호가 없어요</h3><p>왼쪽에서 생성 조건을 고르고<br />버튼을 눌러 나만의 조합을 만들어 보세요.</p><div className="empty-hint"><Sparkles size={14} /> 첫 조합은 금방 만들 수 있어요</div></div>}</div>
        {tickets.length > 0 && <div className="results-bottom"><span><Info size={14} /> 제{tickets[0].round}회 추첨 기준으로 저장돼요.</span><button type="button" className="text-button" onClick={() => { setTickets([]); notify('결과를 비웠어요.') }}>결과 비우기 <X size={14} /></button></div>}
        {history.some((item) => item.type === type) && <section className="history-section"><div className="history-heading"><div><div className="eyebrow">YOUR HISTORY</div><h3>최근 생성 이력</h3></div><span>이 브라우저에 저장됨</span></div><div className="history-list">{history.filter((item) => item.type === type).slice(0, 6).map((item) => <div className="history-row" key={item.id}><TicketDisplay ticket={item} compact /><span className="history-time">{new Date(item.createdAt).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}</span></div>)}</div></section>}
      </section>
    </div>
  </div>
}

function TicketCard({ ticket, index, saved, onFavorite, notify }: { ticket: TicketType; index: number; saved: boolean; onFavorite: () => void; notify: (message: string) => void }) {
  const isLotto = ticket.type === 'lotto'
  const label = isLotto ? '로또 6/45' : '연금복권 720+'
  const copyText = isLotto ? (ticket.values as number[]).join(', ') : `${(ticket.values as { group: number }).group}조 ${(ticket.values as { digits: string }).digits}`
  const copy = async () => {
    try { await navigator.clipboard.writeText(`${label} 제${ticket.round}회 · ${copyText}`); notify('번호를 클립보드에 복사했어요.') }
    catch { notify('복사할 수 없어요. 브라우저 권한을 확인해 주세요.') }
  }
  const saveImage = () => {
    const values = isLotto ? (ticket.values as number[]).map((number) => `<circle cx="${70 + (number - 1) * 63}" cy="130" r="23" fill="${getBallColor(number)}"/><text x="${70 + (number - 1) * 63}" y="138" text-anchor="middle" font-size="23" font-weight="700" fill="#18202c">${number}</text>`).join('') : `<text x="350" y="146" text-anchor="middle" font-size="32" font-weight="700" fill="#e5bc68">${(ticket.values as { group: number }).group}조</text><text x="570" y="146" text-anchor="middle" font-size="48" letter-spacing="12" font-weight="700" fill="#f5f2eb">${(ticket.values as { digits: string }).digits}</text>`
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${isLotto ? 500 : 700}" height="220"><rect width="100%" height="100%" rx="22" fill="#0b1422"/><text x="30" y="43" fill="#e5bc68" font-size="14" font-family="sans-serif">${label} · 제${ticket.round}회 추천</text>${values}<text x="30" y="194" fill="#99a2ad" font-size="12" font-family="sans-serif">복권 시뮬레이터 · 재미와 참고를 위한 번호 조합</text></svg>`
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `${isLotto ? '로또' : '연금복권'}-${ticket.round}회-${index + 1}.svg`; link.click(); URL.revokeObjectURL(link.href)
    notify('번호 이미지를 저장했어요.')
  }
  return <article className="ticket-card" style={{ animationDelay: `${index * 70}ms` }}><div className="ticket-card-top"><span className={`ticket-index ${isLotto ? 'index-lotto' : 'index-pension'}`}>{String(index + 1).padStart(2, '0')}</span><div className="ticket-meta"><b>{label} · 제{ticket.round}회</b><span><Clock3 size={12} /> {formatDate(ticket.drawDate)} 추첨 · {ticket.mode}</span></div><button type="button" className={`icon-button favorite-toggle ${saved ? 'is-saved' : ''}`} onClick={onFavorite} aria-pressed={saved} aria-label={saved ? '즐겨찾기 삭제' : '즐겨찾기 저장'}><Heart size={17} fill={saved ? 'currentColor' : 'none'} /></button></div><div className={`ticket-numbers ${isLotto ? 'lotto-numbers' : 'pension-numbers'}`}>{isLotto ? (ticket.values as number[]).map((number) => <NumberBall key={number} value={number} />) : <><span className="pension-group">{(ticket.values as { group: number }).group}<small>조</small></span><span className="pension-digits">{(ticket.values as { digits: string }).digits}</span></>}</div><div className="ticket-card-bottom"><span className="ticket-ref">추천 조합 · {new Date(ticket.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</span><div className="ticket-actions"><button type="button" onClick={copy}><Copy size={13} /> 복사</button><button type="button" onClick={saveImage}><Download size={13} /> 이미지</button></div></div></article>
}

function getBallColor(number: number) {
  if (number <= 10) return '#f5ca6f'
  if (number <= 20) return '#92b9ed'
  if (number <= 30) return '#ec9292'
  if (number <= 40) return '#b4a3e1'
  return '#91caa9'
}

function NumberBall({ value, small = false }: { value: number; small?: boolean }) {
  return <span className={`number-ball ${small ? 'small' : ''}`} style={{ '--ball-color': getBallColor(value) } as React.CSSProperties}>{value}</span>
}

function TicketDisplay({ ticket, compact = false }: { ticket: TicketType; compact?: boolean }) {
  const isLotto = ticket.type === 'lotto'
  return <div className={`ticket-display ${compact ? 'display-compact' : ''}`}><div className="ticket-display-top"><span className="ticket-display-round">{ticket.type === 'lotto' ? '로또 6/45' : '연금복권 720+'} · 제{ticket.round}회</span><span className="ticket-display-date">{formatDate(ticket.drawDate)} 추첨</span></div><div className={`ticket-numbers ${isLotto ? 'lotto-numbers' : 'pension-numbers'}`}>{isLotto ? (ticket.values as number[]).map((number) => <NumberBall key={number} value={number} small={compact} />) : <><span className="pension-group">{(ticket.values as { group: number }).group}<small>조</small></span><span className="pension-digits">{(ticket.values as { digits: string }).digits}</span></>}</div></div>
}

function FavoritesPage({ tickets, onDelete, notify }: { tickets: TicketType[]; onDelete: (id: string) => void; notify: (message: string) => void }) {
  const [filter, setFilter] = useState<'all' | LotteryType>('all')
  const shown = useMemo(() => filter === 'all' ? tickets : tickets.filter((ticket) => ticket.type === filter), [filter, tickets])
  const copy = async (ticket: TicketType) => {
    const values = Array.isArray(ticket.values) ? ticket.values.join(', ') : `${ticket.values.group}조 ${ticket.values.digits}`
    try { await navigator.clipboard.writeText(`${ticket.type === 'lotto' ? '로또' : '연금복권'} 제${ticket.round}회 · ${values}`); notify('번호를 복사했어요.') } catch { notify('복사할 수 없어요.') }
  }
  return <div className="page-wrap favorites-page"><div className="page-kicker"><Link href="/">홈</Link><span>/</span><span>즐겨찾기</span></div><div className="simple-page-heading"><div className="eyebrow">YOUR COLLECTION</div><h1>저장한 번호<span>.</span></h1><p>마음에 드는 조합을 모아두고 다시 확인해 보세요.</p></div><div className="favorites-toolbar"><div className="filter-tabs"><button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>전체 <span>{tickets.length}</span></button><button className={filter === 'lotto' ? 'active' : ''} onClick={() => setFilter('lotto')}>로또 6/45</button><button className={filter === 'pension' ? 'active' : ''} onClick={() => setFilter('pension')}>연금복권</button></div><span className="saved-count">총 {shown.length}개 저장됨</span></div>{shown.length > 0 ? <div className="favorites-grid">{shown.map((ticket) => <article className="favorite-card" key={ticket.id}><div className="favorite-card-head"><div><span className="favorite-tag">{ticket.type === 'lotto' ? 'LOTTO 6/45' : 'PENSION 720+'}</span><h3>제{ticket.round}회 추천 번호</h3></div><button className="icon-button delete-button" aria-label="저장 번호 삭제" onClick={() => onDelete(ticket.id)}><Trash2 size={16} /></button></div><div className="favorite-result"><TicketDisplay ticket={ticket} compact /></div><div className="favorite-footer"><span><CalendarDays size={13} /> 저장 {new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium' }).format(new Date(ticket.createdAt))}</span><button type="button" onClick={() => copy(ticket)}><Copy size={13} /> 복사</button></div></article>)}</div> : <div className="favorites-empty"><div className="empty-orbit"><Bookmark size={28} /></div><h3>{filter === 'all' ? '아직 저장한 번호가 없어요' : '이 복권 종류의 저장 번호가 없어요'}</h3><p>추천 페이지에서 마음에 드는 조합의<br />하트 버튼을 눌러 저장해 보세요.</p><div className="empty-actions"><Link href="/lotto/" className="button button-outline">로또 추천</Link><Link href="/pension/" className="button button-gold">연금복권 추천</Link></div></div>}</div>
}

function GuidePage() {
  return <div className="page-wrap guide-page"><div className="page-kicker"><Link href="/">홈</Link><span>/</span><span>이용 안내</span></div><div className="simple-page-heading"><div className="eyebrow">HOW IT WORKS</div><h1>가볍게 즐기는<br />번호 시뮬레이터<span>.</span></h1><p>조건을 고르고, 번호를 만들고, 마음에 드는 조합을 저장해 보세요.</p></div><div className="guide-content"><section className="guide-block"><div className="guide-number">01</div><div><h2>복권 종류를 선택해요</h2><p>로또 6/45는 중복 없는 여섯 개 숫자를, 연금복권 720+는 1조부터 5조와 여섯 자리 숫자를 각각 생성합니다. 연금복권 번호는 문자열로 관리해 앞자리 0도 그대로 유지돼요.</p></div></section><section className="guide-block"><div className="guide-number">02</div><div><h2>추천 방식을 고르고 생성해요</h2><p>무작위 생성 외에 홀짝 균형, 숫자 구간 분산, 중복 숫자 포함 등 여러 조건을 선택할 수 있어요. 조건 생성은 선택한 형태를 적용할 뿐, 당첨 가능성을 높이거나 결과를 예측하지 않습니다.</p></div></section><section className="guide-block"><div className="guide-number">03</div><div><h2>저장하고 편하게 다시 봐요</h2><p>생성한 번호는 최근 이력에 남고, 하트 버튼으로 즐겨찾기에 저장할 수 있어요. 저장된 조합에는 생성 당시의 복권 종류, 회차와 추첨 날짜가 함께 보존됩니다. 데이터는 이 브라우저에 저장됩니다.</p></div></section><div className="important-notice"><div className="notice-icon"><CircleHelp size={19} /></div><div><b>꼭 확인해 주세요</b><ul><li>본 서비스는 재미와 참고를 위한 번호 생성 서비스입니다.</li><li>번호는 무작위 또는 선택 조건에 따라 생성되며 특정 번호의 당첨을 보장하지 않습니다.</li><li>과거 당첨 결과가 미래의 당첨 확률을 높여주지 않습니다.</li><li>복권 구매는 만 19세 이상, 건전한 오락 범위에서 이용해 주세요.</li></ul></div></div><div className="official-link-card"><div><span className="eyebrow">OFFICIAL INFORMATION</span><h3>회차와 당첨 결과는 공식 사이트에서 확인하세요.</h3><p>본 서비스는 복권 판매나 당첨금 지급과 관련이 없습니다.</p></div><a href="https://www.dhlottery.co.kr/" target="_blank" rel="noreferrer" className="button button-outline">동행복권 방문 <ArrowUpRight size={15} /></a></div></div></div>
}
