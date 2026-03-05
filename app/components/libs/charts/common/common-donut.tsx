'use client'

import { useEffect, useId, useMemo, useState, type CSSProperties } from 'react'
import {
  ScdCenter,
  ScdProgress,
  ScdSvg,
  ScdTrack,
  ScdWrap,
} from '@/app/components/style/styleds/libs/charts/common/styled-common-donut'

/*
 * 01. 구분     : Library
 * 02. 타입     : Server Component
 * 03. 업무구분  : 모든권한 - 도넛차트 제공
 * 03. 설명     : 도넛차트 기능 제공
 * 04. 작성일자  : 2025.08.26
 * 05. 작성자   : 이우창
 */

type Tone = 'green' | 'amber' | 'auto'

type CommonDonutProps = {
  percent: number
  statusLabel?: string
  titleLabel?: string
  threshold?: number
  tone?: Tone
  wrapClassName?: string
  svgClassName?: string
  trackClassName?: string
  progressClassName?: string
  centerClassName?: string
}

const DONUT_SVG_SIZE = 200

export default function CommonDonut({
  percent,
  statusLabel = '',
  titleLabel = '달성률',
  threshold = 50,
  tone = 'auto',
  wrapClassName,
  svgClassName,
  trackClassName,
  progressClassName,
  centerClassName,
}: CommonDonutProps) {
  const gradientId = useId()
  const [mounted, setMounted] = useState(false)

  const safe = Math.max(0, Math.min(100, Number(percent) || 0))
  const radius = 72
  const circumference = 2 * Math.PI * radius
  const dash = (safe / 100) * circumference
  const targetOffset = circumference - dash

  const resolvedTone = useMemo(() => {
    if (tone !== 'auto') return tone
    return safe >= threshold ? 'amber' : 'green'
  }, [safe, threshold, tone])

  const stops = useMemo(
    () =>
      resolvedTone === 'amber'
        ? [
            { offset: '0%', color: '#f6d300' },
            { offset: '100%', color: '#f39e1e' },
          ]
        : [
            { offset: '0%', color: '#4fd58f' },
            { offset: '100%', color: '#24b978' },
          ],
    [resolvedTone]
  )

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(raf)
  }, [])

  const progressStyle: CSSProperties = {
    strokeDasharray: circumference,
    strokeDashoffset: mounted ? targetOffset : circumference,
    transition: 'stroke-dashoffset 1800ms cubic-bezier(0.16, 1, 0.3, 1) 80ms',
    willChange: 'stroke-dashoffset',
  }

  return (
    <ScdWrap className={wrapClassName} role="img" aria-label={`${titleLabel} ${safe}%`}>
      <ScdSvg
        className={svgClassName}
        viewBox="0 0 180 180"
        width={DONUT_SVG_SIZE}
        height={DONUT_SVG_SIZE}
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            {stops.map((stop) => (
              <stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
            ))}
          </linearGradient>
        </defs>

        <ScdTrack className={trackClassName} cx="90" cy="90" r={radius} />
        <ScdProgress
          className={progressClassName}
          cx="90"
          cy="90"
          r={radius}
          stroke={`url(#${gradientId})`}
          style={progressStyle}
        />
      </ScdSvg>

      <ScdCenter className={centerClassName}>
        <span>{titleLabel}</span>
        <strong>{safe}%</strong>
        <small>{statusLabel}</small>
      </ScdCenter>
    </ScdWrap>
  )
}
