import { readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dataPath = resolve(root, 'public/data/rounds.json')
const KOREA_OFFSET = 9 * 60 * 60 * 1000
const WEEK = 7 * 24 * 60 * 60 * 1000
const headers = {
  'User-Agent': 'Mozilla/5.0 (compatible; LotterySimulator/1.0; +https://github.com/)',
  Referer: 'https://www.dhlottery.co.kr/',
  'X-Requested-With': 'XMLHttpRequest',
}

const previous = JSON.parse(await readFile(dataPath, 'utf8'))
const now = new Date()
const nowKorea = new Date(now.getTime() + KOREA_OFFSET)

function dateOnly(date) {
  return date.toISOString().slice(0, 10)
}

function nextDate(lastDate) {
  return dateOnly(new Date(`${lastDate}T00:00:00Z`).getTime() + WEEK)
}

function calendarCandidate(firstDrawDate, currentDate) {
  const elapsed = Date.parse(`${currentDate}T00:00:00Z`) - Date.parse(`${firstDrawDate}T00:00:00Z`)
  return Math.max(1, Math.floor(elapsed / WEEK) + 1)
}

async function request(url, init = {}) {
  const response = await fetch(url, { ...init, headers: { ...headers, ...init.headers }, signal: AbortSignal.timeout(12000) })
  if (!response.ok) throw new Error(`공식 결과 응답 오류 (${response.status})`)
  return response
}

async function fetchLotto(round) {
  const urls = [
    `https://www.dhlottery.co.kr/lt645/selectPstLt645Info.do?srchLtEpsd=${round}&_=${Date.now()}`,
    `https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${round}`,
  ]
  for (const url of urls) {
    try {
      const json = await (await request(url)).json()
      const row = json?.data?.list?.[0]
      if (row && Number(row.ltEpsd) === round && row.ltRflYmd) {
        return { round, date: String(row.ltRflYmd).replace(/^(\d{4})(\d{2})(\d{2})$/, '$1-$2-$3') }
      }
      if (json?.returnValue === 'success' && Number(json.drwNo) === round && json.drwNoDate) {
        return { round, date: json.drwNoDate }
      }
    } catch (error) {
      console.warn(`로또 ${round}회 데이터 출처 확인 실패: ${error.message}`)
    }
  }
  return null
}

function textForNumberSpans(html) {
  const values = []
  const openingTag = /<span\b[^>]*class=["'][^"']*\bnum\b[^"']*["'][^>]*>/gi
  for (const match of html.matchAll(openingTag)) {
    let cursor = match.index + match[0].length
    let depth = 1
    const tags = /<\/?span\b[^>]*>/gi
    tags.lastIndex = cursor
    let end = cursor
    for (let tag; (tag = tags.exec(html));) {
      if (/^<\/?span\b[^>]*\/>$/i.test(tag[0])) continue
      if (/^<span\b/i.test(tag[0])) depth += 1
      else depth -= 1
      if (depth === 0) { end = tag.index; break }
    }
    if (depth !== 0) continue
    const rawText = html.slice(cursor, end).replace(/<[^>]*>/g, ' ').replace(/&nbsp;|&#160;/g, ' ')
    const number = rawText.match(/\d+/)?.[0]
    if (number) values.push(number)
  }
  return values
}

async function fetchPension(round) {
  const url = `https://www.dhlottery.co.kr/gameResult.do?method=win720&Round=${round}`
  try {
    const html = await (await request(url, { headers: { Accept: 'text/html,application/xhtml+xml' } })).text()
    const plainText = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ')
    if (!new RegExp(`${round}\\s*회`).test(plainText)) return null
    const spans = textForNumberSpans(html)
    // Result markup uses one number span for the group followed by six digit spans.
    const groupIndex = spans.findIndex((value) => /^[1-5]$/.test(value))
    if (groupIndex < 0 || spans.length < groupIndex + 7) return null
    const group = Number(spans[groupIndex])
    const digits = spans.slice(groupIndex + 1, groupIndex + 7).map((value) => value.slice(-1)).join('')
    if (!/^\d{6}$/.test(digits)) return null
    const resultDate = extractDrawDate(plainText, expectedPensionDate(round))
    if (!resultDate) return null
    return { round, date: resultDate, group, digits }
  } catch (error) {
    console.warn(`연금복권 ${round}회 데이터 출처 확인 실패: ${error.message}`)
    return null
  }
}

function extractDrawDate(text, expected) {
  const candidates = []
  for (const match of text.matchAll(/(20\d{2})년\s*(\d{1,2})월\s*(\d{1,2})일/g)) {
    candidates.push(`${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`)
  }
  for (const match of text.matchAll(/(20\d{2})[-./](\d{1,2})[-./](\d{1,2})/g)) {
    candidates.push(`${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`)
  }
  const target = Date.parse(`${expected}T00:00:00Z`)
  return candidates.filter((date) => Number.isFinite(Date.parse(`${date}T00:00:00Z`)))
    .sort((a, b) => Math.abs(Date.parse(`${a}T00:00:00Z`) - target) - Math.abs(Date.parse(`${b}T00:00:00Z`) - target))[0] || null
}

function expectedPensionDate(round) {
  const first = Date.parse('2020-04-30T00:00:00Z')
  return dateOnly(first + (round - 1) * WEEK)
}

async function latestVerified(kind, firstDrawDate, maxLookback = 4) {
  const baseline = previous[kind].lastVerified
  const candidate = calendarCandidate(firstDrawDate, dateOnly(nowKorea))
  const start = Math.max(baseline.round, candidate)
  for (let round = start; round >= Math.max(1, start - maxLookback); round -= 1) {
    const data = kind === 'lotto' ? await fetchLotto(round) : await fetchPension(round)
    if (data && data.date <= dateOnly(nowKorea)) {
      if (data.round >= baseline.round) return data
      break
    }
  }
  return null
}

for (const kind of ['lotto', 'pension']) {
  const firstDraw = kind === 'lotto' ? '2002-12-07' : '2020-04-30'
  const latest = await latestVerified(kind, firstDraw)
  const old = previous[kind]
  if (latest) {
    const targetRound = latest.round + 1
    const targetDate = nextDate(latest.date)
    previous[kind] = {
      lastVerified: { round: latest.round, date: latest.date },
      next: { round: targetRound, date: targetDate },
      status: 'next-draw',
    }
  } else {
    const targetIsPast = old.next?.date <= dateOnly(nowKorea)
    previous[kind] = { ...old, status: targetIsPast ? 'needs-verification' : old.status }
    console.warn(`${kind}: 공식 회차를 새로 확인하지 못해 기존 회차를 유지합니다.`)
  }
}

previous.updatedAt = now.toISOString()
previous.source = 'https://www.dhlottery.co.kr/'
previous.status = Object.values(previous).some((value) => value?.status === 'needs-verification') ? 'needs-verification' : 'verified-schedule'
await writeFile(dataPath, `${JSON.stringify(previous, null, 2)}\n`, 'utf8')
console.log(`회차 데이터 처리 완료: 로또 ${previous.lotto.next.round}회 / 연금복권 ${previous.pension.next.round}회 (${previous.status})`)
