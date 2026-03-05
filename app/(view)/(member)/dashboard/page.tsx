'use client'

import { useState, useMemo, useEffect } from 'react'
import mmc from '@/app/components/style/resources/css/member.module.css'
import CommonDonut from '@/app/components/libs/charts/common/common-donut'
import CommonDonutDetail from '@/app/components/libs/charts/common/common-donut-detail'
import CommonDonutDetailTwo from '@/app/components/libs/charts/common/common-donut-detail-two'

/*
 * 01. 구분      : Page 컴포넌트
 * 02. 타입      : Client Component
 * 03. 업무구분  : 멤버권한 - 대시보드
 * 04. 설명      : 설비 현황 대시보드 페이지
 * 05. 작성일자  : 2025.08.25
 * 06. 작성자    : 이우창
 */

type RatioLegendItem = {
  label: string
  value: number
  unit?: string
  color: string
}

type TableRow = {
  key: string
  pno: string
  model: string
  status: '진행중' | '작업 중단' | '진행 완료'
  worker: string
  qc: string
  open: number
  level: '상' | '중' | '하'
  goal: string
  prod: string
  person: string
  rate: number
}

export default function TextDataPage() {
  /******************** 변수영역 ********************/
  // 상단 조회 토글(일/주/월)
  const PERIOD_OPTIONS = [
    { value: 'day', label: '일별 조회' },
    { value: 'week', label: '주별 조회' },
    { value: 'month', label: '월별 조회' },
  ] as const

  const [period, setPeriod] = useState<(typeof PERIOD_OPTIONS)[number]['value']>('week')

  // 페이지당 행 수
  const PAGE_SIZE = 10

  // 설비 카드(상단 3개)
  const MACHINE_CARDS = [
    {
      title: '고속톰슨 1호기',
      status: '가동',
      statusTone: 'run',
      percent: 44,
      ringLabel: '가동',
      rows: [
        { label: '생산 제품명', value: '3260-0024A', dot: 'navy', gradient: false, warn: false },
        { label: '목표', value: '15,000 EA', dot: 'sky', gradient: false, warn: false },
        { label: '달성', value: '8,308 EA', dot: 'sky', gradient: false, warn: false },
        { label: '순가동률', value: '51%', dot: 'sky', gradient: true, warn: false },
        { label: '시간당 생산량', value: '241 EA', dot: 'sky', gradient: false, warn: false },
        { label: '예상 작업 소요 시간', value: '54:61', dot: 'orange', gradient: false, warn: true },
      ],
    },
    {
      title: '고속톰슨 3호기',
      status: '가동',
      statusTone: 'run',
      percent: 89,
      ringLabel: '가동',
      rows: [
        { label: '생산 제품명', value: '3260-0024A', dot: 'navy', gradient: false, warn: false },
        { label: '목표', value: '15,000 EA', dot: 'sky', gradient: false, warn: false },
        { label: '달성', value: '8,308 EA', dot: 'sky', gradient: false, warn: false },
        { label: '순가동률', value: '81%', dot: 'sky', gradient: true, warn: false },
        { label: '시간당 생산량', value: '241 EA', dot: 'sky', gradient: false, warn: false },
        { label: '예상 작업 소요 시간', value: '54:61', dot: 'orange', gradient: false, warn: true },
      ],
    },
    {
      title: '고속톰슨 4호기',
      status: '비가동',
      statusTone: 'stop',
      percent: 44,
      ringLabel: '비가동',
      rows: [
        { label: '생산 제품명', value: '3260-0024A', dot: 'navy', gradient: false, warn: false },
        { label: '목표', value: '15,000 EA', dot: 'sky', gradient: false, warn: false },
        { label: '달성', value: '8,308 EA', dot: 'sky', gradient: false, warn: false },
        { label: '순가동률', value: '64%', dot: 'sky', gradient: true, warn: false },
        { label: '시간당 생산량', value: '241 EA', dot: 'sky', gradient: false, warn: false },
        { label: '예상 작업 소요 시간', value: '54:61', dot: 'orange', gradient: false, warn: true },
      ],
    },
    {
      title: '고속톰슨 5호기',
      status: '가동',
      statusTone: 'run',
      percent: 44,
      ringLabel: '가동',
      rows: [
        { label: '생산 제품명', value: '3260-0024A', dot: 'navy', gradient: false, warn: false },
        { label: '목표', value: '15,000 EA', dot: 'sky', gradient: false, warn: false },
        { label: '달성', value: '8,308 EA', dot: 'sky', gradient: false, warn: false },
        { label: '순가동률', value: '51%', dot: 'sky', gradient: true, warn: false },
        { label: '시간당 생산량', value: '241 EA', dot: 'sky', gradient: false, warn: false },
        { label: '예상 작업 소요 시간', value: '54:61', dot: 'orange', gradient: false, warn: true },
      ],
    },
    {
      title: '고속톰슨 6호기',
      status: '가동',
      statusTone: 'run',
      percent: 89,
      ringLabel: '가동',
      rows: [
        { label: '생산 제품명', value: '3260-0024A', dot: 'navy', gradient: false, warn: false },
        { label: '목표', value: '15,000 EA', dot: 'sky', gradient: false, warn: false },
        { label: '달성', value: '8,308 EA', dot: 'sky', gradient: false, warn: false },
        { label: '순가동률', value: '81%', dot: 'sky', gradient: true, warn: false },
        { label: '시간당 생산량', value: '241 EA', dot: 'sky', gradient: false, warn: false },
        { label: '예상 작업 소요 시간', value: '54:61', dot: 'orange', gradient: false, warn: true },
      ],
    },
    {
      title: '고속톰슨 7호기',
      status: '비가동',
      statusTone: 'stop',
      percent: 44,
      ringLabel: '비가동',
      rows: [
        { label: '생산 제품명', value: '3260-0024A', dot: 'navy', gradient: false, warn: false },
        { label: '목표', value: '15,000 EA', dot: 'sky', gradient: false, warn: false },
        { label: '달성', value: '8,308 EA', dot: 'sky', gradient: false, warn: false },
        { label: '순가동률', value: '64%', dot: 'sky', gradient: true, warn: false },
        { label: '시간당 생산량', value: '241 EA', dot: 'sky', gradient: false, warn: false },
        { label: '예상 작업 소요 시간', value: '54:61', dot: 'orange', gradient: false, warn: true },
      ],
    },
  ] as const

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
      { label: 'PIPE B100', value: 230, unit: 'EA', color: '#f0a345' },
      { label: 'PIPE B150', value: 230, unit: 'EA', color: '#2ba9de' },
      { label: 'PIPE B200', value: 42, unit: 'EA', color: '#123864' },
      { label: 'PIPE B250', value: 16, unit: 'EA', color: '#315b8d' },
      { label: 'PIPE B300', value: 21, unit: 'EA', color: '#95d6f5' },
    ] as RatioLegendItem[],
  } as const

  // 모델별 진행 현황 테이블 원본 데이터
  const BASE_TABLE_ROWS = [
    { pno: '3260-0024A', model: 'LH179AQ4-EM01', status: '진행중', worker: '홍길동', qc: '임꺽정', open: 120, level: '상', goal: '15,000', prod: '15,000', person: '15,00', rate: 100 },
    { pno: '3260-0024A', model: 'LH179AQ4-EM02', status: '작업 중단', worker: '홍길동', qc: '임꺽정', open: 120, level: '하', goal: '15,000', prod: '15,000', person: '15,00', rate: 50 },
    { pno: '3260-0024A', model: 'LH179AQ4-EM03', status: '진행중', worker: '홍길동', qc: '임꺽정', open: 120, level: '하', goal: '15,000', prod: '15,000', person: '15,00', rate: 82 },
    { pno: '3260-0024A', model: 'LH179AQ4-EM04', status: '작업 중단', worker: '홍길동', qc: '임꺽정', open: 120, level: '하', goal: '15,000', prod: '15,000', person: '15,00', rate: 100 },
    { pno: '3260-0024A', model: 'LH179AQ4-EM05', status: '진행중', worker: '홍길동', qc: '임꺽정', open: 120, level: '중', goal: '15,000', prod: '15,000', person: '15,00', rate: 50 },
    { pno: '3260-0024A', model: 'LH179AQ4-EM06', status: '진행중', worker: '홍길동', qc: '임꺽정', open: 120, level: '하', goal: '15,000', prod: '15,000', person: '15,00', rate: 82 },
    { pno: '3260-0024A', model: 'LH179AQ4-EM07', status: '진행 완료', worker: '홍길동', qc: '임꺽정', open: 120, level: '하', goal: '15,000', prod: '15,000', person: '15,00', rate: 100 },
    { pno: '3260-0024A', model: 'LH179AQ4-EM08', status: '진행 완료', worker: '홍길동', qc: '임꺽정', open: 120, level: '중', goal: '15,000', prod: '15,000', person: '15,00', rate: 50 },
    { pno: '3260-0024A', model: 'LH179AQ4-EM09', status: '진행중', worker: '홍길동', qc: '임꺽정', open: 120, level: '중', goal: '15,000', prod: '15,000', person: '15,00', rate: 82 },
    { pno: '3260-0024A', model: 'LH179AQ4-EM10', status: '작업 중단', worker: '홍길동', qc: '임꺽정', open: 120, level: '상', goal: '15,000', prod: '15,000', person: '15,00', rate: 50 },
    { pno: '3260-0024A', model: 'LH179AQ4-EM11', status: '진행중', worker: '홍길동', qc: '임꺽정', open: 120, level: '상', goal: '15,000', prod: '15,000', person: '15,00', rate: 100 },
    { pno: '3260-0024A', model: 'LH179AQ4-EM12', status: '작업 중단', worker: '홍길동', qc: '임꺽정', open: 120, level: '하', goal: '15,000', prod: '15,000', person: '15,00', rate: 50 },
  ] as const

  // 렌더링용 테이블 데이터 생성(고유 key 부여)
  const TABLE_ROWS = useMemo<TableRow[]>(
    () =>
      BASE_TABLE_ROWS.map((row, idx) => ({
        ...row,
        key: `${row.pno}-${row.model}-${idx}`,
      })),
    []
  )

  // 현재 페이지
  const [tablePage, setTablePage] = useState(1)

  // 전체 페이지/안전 페이지 계산
  const totalPages = Math.max(1, Math.ceil(TABLE_ROWS.length / PAGE_SIZE))
  const safePage = Math.min(Math.max(tablePage, 1), totalPages)

  // 현재 페이지에 표시할 10개 데이터
  const pagedRows = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE
    return TABLE_ROWS.slice(start, start + PAGE_SIZE)
  }, [TABLE_ROWS, safePage])

  /******************** 함수영역 ********************/
  // 상태값(진행중/중단/완료) -> CSS 클래스 접미사
  const statusTone = (status: TableRow['status']) => {
    if (status === '진행 완료') return 'done'
    if (status === '작업 중단') return 'stop'
    return 'run'
  }

  // 난이도(상/중/하) -> CSS 클래스 접미사
  const levelTone = (level: TableRow['level']) => {
    if (level === '상') return 'high'
    if (level === '중') return 'mid'
    return 'low'
  }

  /******************** 수행영역 ********************/
  // 데이터 길이 변경으로 현재 페이지가 범위를 벗어나면 자동 보정
  useEffect(() => {
    if (tablePage > totalPages) setTablePage(totalPages)
  }, [tablePage, totalPages])

  return (
    <div className={mmc.dashboard_root}>
      {/* 페이지 헤더 */}
      <section className={mmc.dashboard_pageHead}>
        <h1>설비 현황 대시보드</h1>
        <p>생산 설비 현황을 한눈에 확인할 수 있습니다.</p>
      </section>

      {/* 설비 카드 3개 */}
      <section className={mmc.dashboard_machineGrid}>
        {MACHINE_CARDS.map((card) => (
          <article key={card.title} className={mmc.dashboard_machineCard}>
            <header className={mmc.dashboard_machineHead}>
              <h3>{card.title}</h3>
              <span
                className={`${mmc.dashboard_status} ${
                  card.statusTone === 'run' ? mmc.dashboard_statusRun : mmc.dashboard_statusStop
                }`}
              >
                {card.status}
              </span>
            </header>

            <div className={mmc.dashboard_machineBody}>
              {/* 좌측 메타 정보 */}
              <div className={mmc.dashboard_machineMeta}>
                {card.rows.map((row) => (
                  <div
                    key={`${card.title}-${row.label}`}
                    className={`${mmc.dashboard_machineRow} ${row.gradient ? mmc.dashboard_machineRowGradient : ''}`}
                  >
                    <div className={mmc.dashboard_machineLabelWrap}>
                      <span className={`${mmc.dashboard_machineDot} ${mmc[`dashboard_machineDot_${row.dot}`]}`} />
                      <span className={mmc.dashboard_machineLabel}>{row.label}</span>
                    </div>
                    <strong className={row.warn ? mmc.dashboard_machineWarn : ''}>{row.value}</strong>
                  </div>
                ))}
              </div>

              {/* 우측 도넛 차트 */}
              <div className={mmc.dashboard_machineChartBox}>
                <CommonDonut
                  percent={card.percent}
                  titleLabel="달성률"
                  statusLabel={card.ringLabel}
                  threshold={50}
                  tone="auto"
                  wrapClassName={mmc.dashboard_machineRing}
                  svgClassName={mmc.dashboard_machineRingSvg}
                  trackClassName={mmc.dashboard_machineRingTrack}
                  progressClassName={mmc.dashboard_machineRingProgress}
                  centerClassName={mmc.dashboard_machineRingCenter}
                />
              </div>
            </div>
          </article>
        ))}
      </section>

      {/* 조회 토글(일별/주별/월별) */}
      <section className={mmc.dashboard_filterCard}>
        <div className={mmc.dashboard_filterTitleWrap}>
          <h2>작업 현황</h2>
          <p>작업 현황에 대해서 일별, 주별, 월별로 조회하여 현황을 확인하실 수 있습니다.</p>
        </div>

        <div className={mmc.dashboard_filterButtons}>
          {PERIOD_OPTIONS.map((opt) => {
            const active = period === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPeriod(opt.value)}
                className={`${mmc.dashboard_filterBtn} ${active ? mmc.dashboard_filterBtnActive : ''}`}
                aria-pressed={active}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </section>

      {/* 도넛 상세 카드 2개 */}
      <section className={mmc.dashboard_ratioGrid}>
        {/* 야근 / 특근 비율 */}
        <article className={mmc.dashboard_ratioCard}>
          <header className={mmc.dashboard_ratioHead}>
            <h3>{OVERTIME_RATIO_CARD.title}</h3>
            <p>{OVERTIME_RATIO_CARD.subtitle}</p>
          </header>
          <CommonDonutDetail legend={OVERTIME_RATIO_CARD.legend} summaryLabel="요약" />
        </article>
        {/* 설비별 생산 비율 */}
        <article className={mmc.dashboard_ratioCard}>
          <header className={mmc.dashboard_ratioHead}>
            <h3>{EQUIPMENT_RATIO_CARD.title}</h3>
            <p>{EQUIPMENT_RATIO_CARD.subtitle}</p>
          </header>
          <CommonDonutDetailTwo legend={EQUIPMENT_RATIO_CARD.legend} summaryLabel="요약" />
        </article>
      </section>

      {/* 모델별 진행 현황 테이블 */}
      <section className={mmc.dashboard_tableCard}>
        <header className={mmc.dashboard_tableHead}>
          <div className={mmc.dashboard_tableTitle}>
            <h3>모델별 진행 현황</h3>
            <p>모델별 현재 진행 현황을 확인하실 수 있습니다.</p>
          </div>
          <span>갱신 시간 기준: 2026-01-13 (화) 10:32:05</span>
        </header>

        <div className={mmc.dashboard_tableWrap}>
          <table className={mmc.dashboard_table}>
            <thead>
              <tr>
                <th>P/NO</th>
                <th>생산 모델</th>
                <th>상태</th>
                <th>설비 작업자</th>
                <th>품질 관리자</th>
                <th>모델 교체 시간(분)</th>
                <th>작업 난이도</th>
                <th>목표 수량</th>
                <th>생산 수량</th>
                <th>인당 생산성</th>
                <th>달성률</th>
              </tr>
            </thead>
            <tbody>
              {pagedRows.map((row) => (
                <tr key={row.key}>
                  <td>{row.pno}</td>
                  <td>{row.model}</td>
                  <td className={`${mmc.dashboard_statusCell} ${mmc[`dashboard_status_${statusTone(row.status)}`]}`}>
                    {row.status}
                  </td>
                  <td>{row.worker}</td>
                  <td>{row.qc}</td>
                  <td>{row.open}</td>
                  <td className={`${mmc.dashboard_levelCell} ${mmc[`dashboard_level_${levelTone(row.level)}`]}`}>
                    {row.level}
                  </td>
                  <td>{row.goal}</td>
                  <td>{row.prod}</td>
                  <td>{row.person}</td>
                  <td>
                    <div className={mmc.dashboard_rate}>
                      <div className={mmc.dashboard_rateBar}>
                        <div className={mmc.dashboard_rateFill} style={{ width: `${row.rate}%` }} />
                      </div>
                      <strong>{row.rate}%</strong>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 페이지네이션 */}
        <nav className={mmc.dashboard_pagination} aria-label="모델별 진행 현황 페이지네이션">
          <button
            type="button"
            onClick={() => setTablePage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
            className={mmc.dashboard_pageArrow}
          >
            &lsaquo;
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => setTablePage(num)}
              className={`${mmc.dashboard_pageNum} ${num === safePage ? mmc.dashboard_pageNumActive : ''}`}
            >
              {num}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setTablePage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            className={mmc.dashboard_pageArrow}
          >
            &rsaquo;
          </button>
        </nav>
      </section>
    </div>
  )
}
