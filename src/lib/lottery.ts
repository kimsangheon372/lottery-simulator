import type { LottoMode, PensionMode } from '@/types'

const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min

function shuffled<T>(items: T[]): T[] {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = randomInt(0, index)
    ;[result[index], result[target]] = [result[target], result[index]]
  }
  return result
}

function sample(source: number[], count: number) {
  return shuffled(source).slice(0, count).sort((a, b) => a - b)
}

export function makeLottoNumbers(mode: LottoMode, excluded: number[] = []): number[] {
  const available = Array.from({ length: 45 }, (_, index) => index + 1).filter((value) => !excluded.includes(value))
  if (available.length < 6) throw new Error('제외 번호를 빼고 최소 6개의 숫자가 남아 있어야 해요.')
  if (mode === 'random') return sample(available, 6)
  if (mode === 'odd-even' && (available.filter((number) => number % 2).length < 3 || available.filter((number) => number % 2 === 0).length < 3)) {
    throw new Error('홀짝 균형 조합을 만들 수 없어요. 제외 번호를 줄여 주세요.')
  }
  if (mode === 'low-high' && (available.filter((number) => number <= 22).length < 3 || available.filter((number) => number >= 23).length < 3)) {
    throw new Error('저·고번호를 3개씩 고를 수 없어요. 제외 번호를 줄여 주세요.')
  }
  if (mode === 'spread' && new Set(available.map((number) => Math.floor((number - 1) / 10))).size < 4) {
    throw new Error('번호 구간을 4곳 이상 사용할 수 없어요. 제외 번호를 줄여 주세요.')
  }

  for (let attempt = 0; attempt < 5000; attempt += 1) {
    const numbers = sample(available, 6)
    const odd = numbers.filter((number) => number % 2 === 1).length
    const low = numbers.filter((number) => number <= 22).length
    const runs = numbers.slice(1).filter((number, index) => number - numbers[index] === 1).length
    if (mode === 'spread' && new Set(numbers.map((number) => Math.floor((number - 1) / 10))).size >= 4) return numbers
    if (mode === 'odd-even' && odd === 3) return numbers
    if (mode === 'low-high' && low === 3) return numbers
    if (mode === 'no-consecutive' && runs <= 1) return numbers
  }
  throw new Error('선택한 조건에 맞는 조합을 찾지 못했어요. 조건을 바꾸거나 제외 번호를 줄여 주세요.')
}

export function makePensionNumber(mode: PensionMode, chosenGroup: number): { group: number; digits: string } {
  const group = mode === 'chosen-group' ? chosenGroup : randomInt(1, 5)
  let digits: string
  if (mode === 'unique') {
    digits = sample(Array.from({ length: 10 }, (_, index) => index), 6).join('')
  } else if (mode === 'repeat') {
    const repeated = String(randomInt(0, 9))
    const values = Array.from({ length: 4 }, () => String(randomInt(0, 9)))
    values.push(repeated, repeated)
    digits = shuffled(values).join('')
  } else if (mode === 'balanced') {
    // Spread digits across low/high ranges, then shuffle the positions; keep leading zeroes.
    const values = [randomInt(0, 2), randomInt(3, 6), randomInt(7, 9), randomInt(0, 9), randomInt(0, 9), randomInt(0, 9)]
    digits = shuffled(values).map(String).join('')
  } else {
    digits = Array.from({ length: 6 }, () => String(randomInt(0, 9))).join('')
  }
  return { group, digits }
}

export function lottoModeLabel(mode: LottoMode) {
  return ({ random: '완전 무작위', spread: '균등 분산', 'odd-even': '홀짝 균형', 'low-high': '저·고번호 분산', 'no-consecutive': '연속 번호 제한' })[mode]
}

export function pensionModeLabel(mode: PensionMode) {
  return ({ random: '완전 무작위', 'random-group': '조 무작위 선택', balanced: '6자리 균등 분포', unique: '중복 숫자 최소화', repeat: '반복 숫자 포함', 'chosen-group': '원하는 조 선택' })[mode]
}
