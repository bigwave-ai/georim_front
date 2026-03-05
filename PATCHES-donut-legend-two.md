# 도넛차트 2줄 범례 패치 가이드

아래 패치/스니펫을 순서대로 적용하세요.

---

## 1. 신규 파일: `common-donut-detail-two.tsx`

**경로:** `app/components/libs/charts/common/common-donut-detail-two.tsx`

**작업:** 새 파일 생성 후 아래 내용 전체 복사

```tsx
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
 * 05. 작성일자  : 2025.08.26
 * 06. 작성자   : 이우창
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
```

---

## 2. CSS 추가: `member.module.css`

**경로:** `app/components/style/resources/css/member.module.css`

**위치:** `.dashboard_legendActive` 블록 바로 다음 (약 709행 아래)

**추가할 스니펫:**

```css
.dashboard_legendTwo{
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.dashboard_legendTwo li{
  border: 1px solid #dbe4ec;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.78);
  padding: 8px 10px;
  display: grid;
  grid-template-columns: 10px 1fr auto auto;
  gap: 8px;
  align-items: center;
}

.dashboard_legendTwo li span{
  width: 10px;
  height: 10px;
  border-radius: 999px;
}

.dashboard_legendTwo li em{
  font-style: normal;
  color: #4f6880;
  font-size: 13px;
  font-weight: 700;
}

.dashboard_legendTwo li strong{
  color: #1f2d39;
  font-size: 13px;
  font-weight: 900;
}
```

---

## 3. 대시보드 페이지 수정: `page.tsx`

**경로:** `app/(view)/(member)/dashboard/page.tsx`

### 3-1. import 추가

**기존:**
```tsx
import CommonDonutDetail from '@/app/components/libs/charts/common/common-donut-detail'
```

**변경 후:**
```tsx
import CommonDonutDetail from '@/app/components/libs/charts/common/common-donut-detail'
import CommonDonutDetailTwo from '@/app/components/libs/charts/common/common-donut-detail-two'
```

### 3-2. RATIO_CARDS 분리

**기존 (147~170행):**
```tsx
  // 도넛 상세 카드(야근/특근, 설비별 생산)
  const RATIO_CARDS = [
    {
      title: '야근 / 특근 비율',
      ...
    },
    {
      title: '설비별 생산 비율',
      ...
    },
  ] as const
```

**변경 후:**
```tsx
  // 도넛 상세 카드 - 야근/특근 (1열 범례)
  const OVERTIME_RATIO_CARD = {
    title: '야근 / 특근 비율',
    subtitle: '근무자의 야근 / 특근 현황을 확인하실 수 있습니다.',
    legend: [
      { label: '특근', value: 230, unit: '분', color: '#f0a345' },
      { label: '주간', value: 230, unit: '분', color: '#2ba9de' },
      { label: '야간', value: 42, unit: '분', color: '#123864' },
      { label: '기타', value: 16, unit: '분', color: '#315b8d' },
    ] as RatioLegendItem[],
  } as const

  // 도넛 상세 카드 - 설비별 생산 (2열 범례)
  const EQUIPMENT_RATIO_CARD = {
    title: '설비별 생산 비율',
    subtitle: '설비별로 얼마나 생산에 기여하였는지 확인하실 수 있습니다.',
    legend: [
      { label: 'PIPE A100', value: 230, unit: 'EA', color: '#f0a345' },
      { label: 'PIPE A150', value: 230, unit: 'EA', color: '#2ba9de' },
      { label: 'PIPE A200', value: 42, unit: 'EA', color: '#123864' },
      { label: 'PIPE A250', value: 16, unit: 'EA', color: '#315b8d' },
      { label: 'PIPE A300', value: 21, unit: 'EA', color: '#95d6f5' },
    ] as RatioLegendItem[],
  } as const
```

### 3-3. 렌더링 섹션 변경

**기존 (317~329행):**
```tsx
      {/* 도넛 상세 카드 2개 */}
      <section className={mmc.dashboard_ratioGrid}>
        {RATIO_CARDS.map((card) => (
          <article key={card.title} className={mmc.dashboard_ratioCard}>
            <header className={mmc.dashboard_ratioHead}>
              <h3>{card.title}</h3>
              <p>{card.subtitle}</p>
            </header>

            <CommonDonutDetail legend={card.legend} summaryLabel="요약" />
          </article>
        ))}
      </section>
```

**변경 후:**
```tsx
      {/* 도넛 상세 카드 2개 */}
      <section className={mmc.dashboard_ratioGrid}>
        <article className={mmc.dashboard_ratioCard}>
          <header className={mmc.dashboard_ratioHead}>
            <h3>{OVERTIME_RATIO_CARD.title}</h3>
            <p>{OVERTIME_RATIO_CARD.subtitle}</p>
          </header>
          <CommonDonutDetail legend={OVERTIME_RATIO_CARD.legend} summaryLabel="요약" />
        </article>
        <article className={mmc.dashboard_ratioCard}>
          <header className={mmc.dashboard_ratioHead}>
            <h3>{EQUIPMENT_RATIO_CARD.title}</h3>
            <p>{EQUIPMENT_RATIO_CARD.subtitle}</p>
          </header>
          <CommonDonutDetailTwo legend={EQUIPMENT_RATIO_CARD.legend} summaryLabel="요약" />
        </article>
      </section>
```

---

## 적용 순서 요약

1. `app/components/libs/charts/common/common-donut-detail-two.tsx` 파일 생성
2. `app/components/style/resources/css/member.module.css`에 `.dashboard_legendTwo` 스타일 추가
3. `app/(view)/(member)/dashboard/page.tsx` 수정 (import, 상수 분리, 렌더링)
