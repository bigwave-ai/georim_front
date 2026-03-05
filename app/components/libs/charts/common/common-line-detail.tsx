'use client'

import { useMemo, useState } from 'react'
import {
  CldDot,
  CldFill,
  CldItem,
  CldLabel,
  CldLabelGroup,
  CldLabelRow,
  CldList,
  CldRoot,
  CldSummary,
  CldTrack,
  CldValue,
} from '@/app/components/style/styleds/libs/charts/common/styled-common-line-detail'

/*
 * 01. 구분      : Library 컴포넌트
 * 02. 타입      : Client Component
 * 03. 업무구분  : 공통 - 가로 막대 상세 차트
 * 04. 설명      : 설비별 비율을 선택 가능한 가로 막대 차트로 표현
 * 05. 작성일자  : 2026.02.27
 * 06. 작성자    : 이우창
 */

export type CommonLineDetailItem = {
  label: string
  value: number | string
  unit?: string
  color: string
}

type CommonLineDetailProps = {
  items: CommonLineDetailItem[]
  selectedLabel?: string | null
  summaryLabel?: string
  onSelect?: (label: string) => void
}

type PreparedItem = CommonLineDetailItem & {
  rawValue: number
  share: number
  barWidth: number
  displayValue: string
}

/******************** 함수영역 ********************/
const toNumber = (value: number | string) => {
  const parsed =
    typeof value === 'string' ? Number(value.replaceAll(',', '').trim()) : Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const toDisplayValue = (value: number, unit: string) =>
  `${value.toLocaleString('ko-KR', { minimumFractionDigits: 0, maximumFractionDigits: 1 })}${unit}`

const toPercent = (value: number) => `${value.toFixed(1)}%`

export default function CommonLineDetail({
  items,
  selectedLabel = null,
  summaryLabel = '요약',
  onSelect,
}: CommonLineDetailProps) {
  /******************** 변수영역 ********************/
  const prepared = useMemo<PreparedItem[]>(() => {
    const normalized = items.map((item) => {
      const rawValue = toNumber(item.value)
      return {
        ...item,
        rawValue,
        unit: item.unit ?? '',
      }
    })

    const total = normalized.reduce((sum, item) => sum + item.rawValue, 0) || 1
    const maxValue = normalized.reduce((best, item) => Math.max(best, item.rawValue), 0) || 1

    return normalized.map((item) => ({
      ...item,
      share: (item.rawValue / total) * 100,
      barWidth: (item.rawValue / maxValue) * 100,
      displayValue: toDisplayValue(item.rawValue, item.unit ?? ''),
    }))
  }, [items])

  const [hoverLabel, setHoverLabel] = useState<string | null>(null)

  if (prepared.length === 0) return null

  const top = prepared.reduce(
    (winner, item) => (item.share > winner.share ? item : winner),
    prepared[0]
  )

  /******************** 함수영역 ********************/
  const focusLabel = hoverLabel ?? selectedLabel ?? top.label

  /******************** 수행영역 ********************/
  return (
    <CldRoot>
      <CldList role="listbox" aria-label="설비별 생산 비율 차트">
        {prepared.map((item) => {
          const isActive = focusLabel === item.label
          const isSelected = selectedLabel === item.label

          return (
            <CldItem
              key={item.label}
              type="button"
              $active={isActive}
              aria-selected={isSelected}
              onMouseEnter={() => setHoverLabel(item.label)}
              onMouseLeave={() => setHoverLabel(null)}
              onFocus={() => setHoverLabel(item.label)}
              onBlur={() => setHoverLabel(null)}
              onClick={() => onSelect?.(item.label)}
            >
              <CldLabelRow>
                <CldLabelGroup>
                  <CldDot $color={item.color} />
                  <CldLabel>{item.label}</CldLabel>
                </CldLabelGroup>
                <CldValue>
                  {toPercent(item.share)} ({item.displayValue})
                </CldValue>
              </CldLabelRow>

              <CldTrack>
                <CldFill $active={isActive} $color={item.color} $width={item.barWidth} />
              </CldTrack>
            </CldItem>
          )
        })}
      </CldList>

      <CldSummary>
        {summaryLabel}: {top.label} 비중이 {toPercent(top.share)}로 가장 큽니다.
      </CldSummary>
    </CldRoot>
  )
}
