export type LotteryType = 'lotto' | 'pension'

export type LottoMode = 'random' | 'spread' | 'odd-even' | 'low-high' | 'no-consecutive'
export type PensionMode = 'random' | 'random-group' | 'balanced' | 'unique' | 'repeat' | 'chosen-group'

export type Ticket = {
  id: string
  type: LotteryType
  round: number
  drawDate: string
  values: number[] | { group: number; digits: string }
  mode: string
  createdAt: string
}

export type DrawInfo = {
  round: number
  date: string
}

export type DrawStatus = {
  updatedAt: string
  source: string
  status: string
  lotto: { lastVerified: DrawInfo; next: DrawInfo; status: string }
  pension: { lastVerified: DrawInfo; next: DrawInfo; status: string }
}
