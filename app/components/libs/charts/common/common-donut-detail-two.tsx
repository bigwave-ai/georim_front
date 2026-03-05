'use client'

import { useEffect, useMemo, useState } from 'react'
import mmc from '@/app/components/style/resources/css/member.module.css'
import {
  CddCenter,
  CddDonut,
  CddSeg,
  CddSide,
  CddSvg,
  CddTrack,
  CddVisual,
} from '@/app/components/style/styleds/libs/charts/common/styled-common-donut-detail'
import type { CommonDonutDetailItem } from './common-donut-detail'

/*
 * 01. 구분     : Library
 * 02. 타입     : Client Component
 * 03. 업무구분  : 모든권한 - 도넛차트 제공 (범례 2열)
 * 04. 설명     : 도넛차트 + 범례 2열 배치
 * 05. 작성일자  : 2026.02.25
 * 06. 작성자   : 정현철
 */

type CommonDonutDetailTwoProps = {
  legend: CommonDonutDetailItem[]
  summaryLabel?: string
}

const formatShare = (value: number) => `${value.toFixed(1)}%`

const toNumber = (value: number | string) => {
  const n = typeof value === 'string' ? Number(value.replaceAll(',', '')) : Number(value)
  return Number.isFinite(n) ? n : 0
}

export default function CommonDonutDetailTwo({
  legend,
  summaryLabel = '요약',
}: CommonDonutDetailTwoProps) {
  const prepared = useMemo(() => {
    const normalized = legend.map((item) => {
      const raw = toNumber(item.value)
      return {
        ...item,
        rawValue: raw,
        unit: item.unit ?? '',
      }
    })

    const total = normalized.reduce((acc, item) => acc + item.rawValue, 0) || 1

    return normalized.map((item) => ({
      ...item,
      share: (item.rawValue / total) * 100,
      displayValue: `${item.rawValue.toLocaleString('ko-KR')}${item.unit}`,
    }))
  }, [legend])

  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (prepared.length === 0) return null

  const maxIndex = prepared.reduce(
    (best, item, idx) => (item.rawValue > prepared[best].rawValue ? idx : best),
    0
  )

  const focusIndex = activeIndex ?? maxIndex
  const focus = prepared[focusIndex] ?? prepared[0]
  const top = prepared[maxIndex] ?? prepared[0]

  const totalRawValue = prepared.reduce((acc, item) => acc + item.rawValue, 0) || 1

  const radius = 72
  const circumference = 2 * Math.PI * radius
  const gap = 7
  let offset = 0

  return (
    <div className={mmc.dashboard_ratioBody}>
      <CddVisual>
        <CddDonut role="img" aria-label="구성비 차트">
          <CddSvg
            viewBox="0 0 180 180"
            width={210}
            height={210}
            preserveAspectRatio="xMidYMid meet"
            aria-hidden="true"
          >
            <CddTrack cx="90" cy="90" r={radius} fill="none" />
            {prepared.map((item, idx) => {
              const length = (item.rawValue / totalRawValue) * circumference
              const segment = Math.max(0, length - gap)
              const dashArray = `${segment} ${circumference - segment}`
              const dashOffset = -offset
              offset += length

              return (
                <CddSeg
                  key={item.label}
                  $active={idx === focusIndex}
                  cx="90"
                  cy="90"
                  r={radius}
                  fill="none"
                  stroke={item.color}
                  strokeDasharray={dashArray}
                  strokeDashoffset={dashOffset}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onMouseLeave={() => setActiveIndex(null)}
                />
              )
            })}
          </CddSvg>

          {mounted && (
            <CddCenter>
              <span>{focus?.label ?? ''}</span>
              <strong>{focus?.displayValue ?? ''}</strong>
              <small>실제값</small>
            </CddCenter>
          )}
        </CddDonut>
      </CddVisual>

      <CddSide>
        <ul className={mmc.dashboard_legendTwo}>
          {prepared.map((item, idx) => (
            <li
              key={item.label}
              className={idx === focusIndex ? mmc.dashboard_legendActive : ''}
              onMouseEnter={() => setActiveIndex(idx)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              <span style={{ background: item.color }} />
              <em>{item.label}</em>
              <strong>{`${item.displayValue}(${formatShare(item.share)})`}</strong>
            </li>
          ))}
        </ul>

        <div className={mmc.dashboard_note}>
          {summaryLabel}: {top?.label} 비중이 {formatShare(top?.share ?? 0)}로 가장 큽니다.
        </div>
      </CddSide>
    </div>
  )
}