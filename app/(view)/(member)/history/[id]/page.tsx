'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import dayjs from 'dayjs'
import { useParams, useRouter } from 'next/navigation'
import mmc from '@/app/components/style/resources/css/member.module.css'
import CommonDonut from '@/app/components/libs/charts/common/common-donut'
import CommonLineDetail, {
  type CommonLineDetailItem,
} from '@/app/components/libs/charts/common/common-line-detail'
import CommonModal from '@/app/components/libs/modals/modal-common'
import RejectModal from '@/app/components/libs/modals/modal-reject'
import axiosUtil from '@/app/services/util/axiosUtils'

/*
 * 01. 구분      : Page 컴포넌트
 * 02. 타입      : Client Component
 * 03. 업무구분  : 멤버권한 - 생산 계획 생성 이력
 * 04. 설명      : 생산 계획 결과 상세 조회 및 승인/반려 처리 페이지
 * 05. 작성일자  : 2026.02.27
 * 06. 작성자    : 이우창
 */

type DisplayStatus = '승인' | '대기' | '반려'

type MachineTask = {
  shift?: string
  model?: string
  order?: string
  qty?: number | string
  time?: string
  is_dev_sample?: boolean
}

type PivotDateGroup = {
  date_label: string
  raw_date: string
  rows: Array<Record<string, MachineTask | null | undefined>>
}

type UnavailableModel = {
  model_name: string
  target_qty: number
  possible_qty: number
  impossible_qty: number
}

type MachineRatioItem = {
  label: string
  value: number
}

type DailyPlanRow = {
  key: string
  editKey: string
  dateLabel: string
  rawDate: string
  machine: string
  shift: string
  model: string
  order: string
  qty: number | string
  time: string
  isDevSample: boolean
}

const CHART_COLORS = [
  '#f0a345',
  '#2ba9de',
  '#0f2f57',
  '#355e8f',
  '#89d2f3',
  '#e85d75',
  '#6bc5a0',
  '#9b59b6',
  '#34495e',
  '#f39c12',
]

const PLAN_ROWS_PER_PAGE = 10
const PAGE_BUTTON_WINDOW = 10

/******************** 함수영역 ********************/
function mapBackendStatus(status: string | null | undefined): DisplayStatus {
  switch (status) {
    case 'APPROVED':
      return '승인'
    case 'REJECTED':
      return '반려'
    case 'PENDING':
    default:
      return '대기'
  }
}

function normalizeMachineRatio(value: unknown): MachineRatioItem[] {
  if (!Array.isArray(value)) return []

  return value
    .map((row): MachineRatioItem | null => {
      if (!row || typeof row !== 'object') return null

      const label = String((row as { label?: unknown }).label ?? '').trim()
      const numeric = Number((row as { value?: unknown }).value ?? 0)
      if (!label) return null

      return {
        label,
        value: Number.isFinite(numeric) ? numeric : 0,
      }
    })
    .filter((row): row is MachineRatioItem => row !== null)
}

function normalizeUnavailableModels(value: unknown): UnavailableModel[] {
  if (!Array.isArray(value)) return []

  return value
    .map((row): UnavailableModel | null => {
      if (!row || typeof row !== 'object') return null
      const typed = row as Record<string, unknown>
      const model = String(typed.model_name ?? '').trim()
      if (!model) return null

      return {
        model_name: model,
        target_qty: Number(typed.target_qty ?? 0) || 0,
        possible_qty: Number(typed.possible_qty ?? 0) || 0,
        impossible_qty: Number(typed.impossible_qty ?? 0) || 0,
      }
    })
    .filter((row): row is UnavailableModel => row !== null)
}

function normalizePivotMachines(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((machine) => (typeof machine === 'string' ? machine.trim() : ''))
    .filter((machine) => machine.length > 0)
}

function normalizePivotDates(value: unknown): PivotDateGroup[] {
  if (!Array.isArray(value)) return []

  return value
    .map((row): PivotDateGroup | null => {
      if (!row || typeof row !== 'object') return null
      const typed = row as Record<string, unknown>
      const dateLabel = String(typed.date_label ?? '').trim()
      const rows = Array.isArray(typed.rows)
        ? (typed.rows as Array<Record<string, MachineTask | null | undefined>>)
        : []

      const rawDate = String(typed.raw_date ?? '').trim()
      if (!dateLabel) return null
      return { date_label: dateLabel, raw_date: rawDate, rows }
    })
    .filter((row): row is PivotDateGroup => row !== null)
}

function toQtyText(value: number | string) {
  if (value === '' || value === null || value === undefined) return ''
  if (typeof value === 'number') return value.toLocaleString('ko-KR')

  const numeric = Number(value.replaceAll(',', '').trim())
  if (Number.isFinite(numeric) && value.trim() !== '') {
    return numeric.toLocaleString('ko-KR')
  }

  return value
}

export default function HistoryDetailPage() {
  /******************** 변수영역 ********************/
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const parsedId = Number(params?.id ?? 1)
  const planId = Number.isFinite(parsedId) && parsedId > 0 ? parsedId : 1

  const [loading, setLoading] = useState(true)
  const [utilizationRate, setUtilizationRate] = useState(0)
  const [machineRatio, setMachineRatio] = useState<MachineRatioItem[]>([])
  const [unavailableModels, setUnavailableModels] = useState<UnavailableModel[]>([])
  const [pivotMachines, setPivotMachines] = useState<string[]>([])
  const [pivotDates, setPivotDates] = useState<PivotDateGroup[]>([])
  const [createdAt, setCreatedAt] = useState('')

  const [currentStatus, setCurrentStatus] = useState<DisplayStatus>('대기')
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false)
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
  const [isRejectViewModalOpen, setIsRejectViewModalOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  const [selectedMachine, setSelectedMachine] = useState('')
  const [page, setPage] = useState(1)
  const [planRowHeightPx, setPlanRowHeightPx] = useState<number | null>(null)
  const [qtyEdits, setQtyEdits] = useState<Record<string, number>>({})

  const planWrapRef = useRef<HTMLDivElement | null>(null)
  const planTableRef = useRef<HTMLTableElement | null>(null)

  const creator = '송기석'
  const division = '생산'

  const machineChartItems = useMemo<CommonLineDetailItem[]>(
    () =>
      machineRatio.map((item, idx) => ({
        label: item.label,
        value: item.value,
        unit: '%',
        color: CHART_COLORS[idx % CHART_COLORS.length],
      })),
    [machineRatio]
  )

  const machineNameCandidates = useMemo(() => {
    return Array.from(new Set([...machineRatio.map((item) => item.label), ...pivotMachines]))
  }, [machineRatio, pivotMachines])

  const selectedMachineRows = useMemo<DailyPlanRow[]>(() => {
    if (!selectedMachine) return []

    const rows: DailyPlanRow[] = []

    pivotDates.forEach((dateGroup, dateIdx) => {
      dateGroup.rows.forEach((rowData, rowIdx) => {
        const task = rowData[selectedMachine]
        if (!task) return

        const shift = task.shift ?? '-'
        const model = task.model ?? '-'
        const order = task.order ?? '-'

        rows.push({
          key: `${dateIdx}-${rowIdx}-${selectedMachine}`,
          editKey: `${dateGroup.raw_date}|${selectedMachine}|${model}|${order}|${shift}`,
          dateLabel: dateGroup.date_label,
          rawDate: dateGroup.raw_date,
          machine: selectedMachine,
          shift,
          model,
          order,
          qty: task.qty ?? '',
          time: task.time ?? '-',
          isDevSample: task.is_dev_sample === true,
        })
      })
    })

    return rows
  }, [pivotDates, selectedMachine])

  const totalPages = Math.max(1, Math.ceil(selectedMachineRows.length / PLAN_ROWS_PER_PAGE))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const startIndex = (safePage - 1) * PLAN_ROWS_PER_PAGE

  const pagedPlanRows = useMemo(
    () => selectedMachineRows.slice(startIndex, startIndex + PLAN_ROWS_PER_PAGE),
    [selectedMachineRows, startIndex]
  )

  const planCellFontSizePx = useMemo(() => {
    if (!planRowHeightPx) return null
    const scaled = Math.round(planRowHeightPx * 0.31)
    return Math.max(11, Math.min(15, scaled))
  }, [planRowHeightPx])

  const pageStart = Math.floor((safePage - 1) / PAGE_BUTTON_WINDOW) * PAGE_BUTTON_WINDOW + 1
  const pageEnd = Math.min(totalPages, pageStart + PAGE_BUTTON_WINDOW - 1)

  const pageNumbers = useMemo(
    () => Array.from({ length: pageEnd - pageStart + 1 }, (_, i) => pageStart + i),
    [pageStart, pageEnd]
  )

  const isDecisionVisible = currentStatus === '대기'
  const hasEdits = Object.keys(qtyEdits).length > 0

  /******************** 함수영역 ********************/
  const formatNumber = (value: number) => value.toLocaleString('ko-KR')

  const parseQtyRaw = (val: number | string): number => {
    if (typeof val === 'number') return val
    return parseInt(String(val).replace(/[^0-9]/g, '')) || 0
  }

  const getDisplayQty = (row: DailyPlanRow): string => {
    const edited = qtyEdits[row.editKey]
    if (edited !== undefined) return edited.toLocaleString('ko-KR')
    return toQtyText(row.qty)
  }

  const handleQtyEdit = (editKey: string, raw: string, originalQty: number | string) => {
    const numericStr = raw.replace(/[^0-9]/g, '')
    const val = parseInt(numericStr) || 0
    const original = parseQtyRaw(originalQty)
    if (val === original) {
      setQtyEdits((prev) => {
        const next = { ...prev }
        delete next[editKey]
        return next
      })
    } else {
      setQtyEdits((prev) => ({ ...prev, [editKey]: val }))
    }
  }

  const fetchPlanDetail = useCallback(async () => {
    setLoading(true)
    try {
      const res = await axiosUtil.get(`/production-plans/${planId}`)
      if (!res) return

      const nextMachineRatio = normalizeMachineRatio(res.machine_ratio)
      const nextUnavailable = normalizeUnavailableModels(res.undeliverable_models)
      const nextPivotMachines = normalizePivotMachines(res.daily_plans?.machines)
      const nextPivotDates = normalizePivotDates(res.daily_plans?.dates)

      setUtilizationRate(Number(res.utilization_rate ?? 0) || 0)
      setMachineRatio(nextMachineRatio)
      setUnavailableModels(nextUnavailable)
      setPivotMachines(nextPivotMachines)
      setPivotDates(nextPivotDates)
      setCreatedAt(res.created_at ? dayjs(res.created_at).format('YYYY-MM-DD HH:mm:ss') : '-')
      setCurrentStatus(mapBackendStatus(res.approval_status))
      setRejectReason(typeof res.reject_reason === 'string' ? res.reject_reason : '')
    } catch {
      console.error('Failed to fetch plan detail')
    } finally {
      setLoading(false)
    }
  }, [planId])

  const handleBackToList = () => router.push('/history')
  const handlePrev = () => setPage((prev) => Math.max(1, prev - 1))
  const handleNext = () => setPage((prev) => Math.min(totalPages, prev + 1))

  const handleSaveQuantities = async () => {
    if (!hasEdits) return
    try {
      const modifications = Object.entries(qtyEdits).map(([key, qty]) => {
        const [date, machine, item_code, order, shift] = key.split('|')
        return { date, machine, item_code, order, shift, new_qty: qty }
      })

      const res = await axiosUtil.patch(`/production-plans/${planId}/quantities`, { modifications })
      if (!res) return

      setQtyEdits({})
      setUtilizationRate(Number(res.utilization_rate ?? 0) || 0)
      setMachineRatio(normalizeMachineRatio(res.machine_ratio))
      setPivotMachines(normalizePivotMachines(res.daily_plans?.machines))
      setPivotDates(normalizePivotDates(res.daily_plans?.dates))
    } catch {
      console.error('Failed to save quantities')
    }
  }

  const handleDownloadExcel = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? ''
      const url = `${baseUrl}/plans/${planId}/download/summary_csv`
      const link = document.createElement('a')
      link.href = url
      link.download = ''
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch {
      console.error('Failed to download excel')
    }
  }

  const handleApproveClick = () => setIsApproveModalOpen(true)
  const handleApproveCancel = () => setIsApproveModalOpen(false)

  const handleApproveConfirm = async () => {
    try {
      const res = await axiosUtil.patch(`/production-plans/${planId}/status`, {
        action: 'APPROVE',
      })
      setCurrentStatus(mapBackendStatus(res?.approval_status))
    } catch {
      console.error('Approve failed')
    }
    setIsApproveModalOpen(false)
  }

  const handleRejectClick = () => setIsRejectModalOpen(true)
  const handleRejectCancel = () => setIsRejectModalOpen(false)

  const handleRejectConfirm = async (reason: string) => {
    try {
      const res = await axiosUtil.patch(`/production-plans/${planId}/status`, {
        action: 'REJECT',
        reject_reason: reason,
      })
      setRejectReason(reason)
      setCurrentStatus(mapBackendStatus(res?.approval_status))
    } catch {
      console.error('Reject failed')
    }
    setIsRejectModalOpen(false)
  }

  const handleOpenRejectReason = () => {
    if (currentStatus !== '반려') return
    setIsRejectViewModalOpen(true)
  }
  const handleCloseRejectReason = () => setIsRejectViewModalOpen(false)

  const getStatusClassName = (status: DisplayStatus) => {
    if (status === '대기') return mmc.historyDetail_statusRequest
    if (status === '반려') return mmc.historyDetail_statusReject
    return mmc.historyDetail_statusApproved
  }

  /******************** 수행영역 ********************/
  useEffect(() => {
    fetchPlanDetail()
  }, [fetchPlanDetail])

  useEffect(() => {
    if (selectedMachine && machineNameCandidates.includes(selectedMachine)) return
    setSelectedMachine(machineNameCandidates[0] ?? '')
  }, [machineNameCandidates, selectedMachine])

  useEffect(() => {
    setPage(1)
  }, [selectedMachine])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  useEffect(() => {
    const updatePlanRowHeight = () => {
      const wrapEl = planWrapRef.current
      const tableEl = planTableRef.current
      if (!wrapEl || !tableEl) return

      const tableHead = tableEl.querySelector('thead')
      const headHeight = tableHead ? tableHead.getBoundingClientRect().height : 0
      const availableBodyHeight = wrapEl.clientHeight - headHeight - 6
      if (availableBodyHeight <= 0) return

      const rowCountForLayout = pagedPlanRows.length > 0 ? PLAN_ROWS_PER_PAGE : 1
      const target = availableBodyHeight / rowCountForLayout
      const clamped = Math.max(36, Math.min(64, target))

      setPlanRowHeightPx(Math.round(clamped))
    }

    updatePlanRowHeight()
    window.addEventListener('resize', updatePlanRowHeight)
    return () => window.removeEventListener('resize', updatePlanRowHeight)
  }, [pagedPlanRows.length, safePage, selectedMachine])

  if (loading) {
    return (
      <div className={mmc.historyDetail_root}>
        <section className={mmc.historyDetail_pageHead}>
          <div>
            <h1>생산 계획 결과 상세</h1>
            <p>데이터를 불러오고 있습니다...</p>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className={mmc.historyDetail_root}>
      <section className={mmc.historyDetail_pageHead}>
        <div>
          <h1>생산 계획 결과 상세</h1>
          <p>선택하신 생산 계획에 대한 결과를 확인하실 수 있습니다.</p>
        </div>
        <button type="button" className={mmc.historyDetail_backBtn} onClick={handleBackToList}>
          &lsaquo; 목록으로 되돌아가기
        </button>
      </section>

      <section className={mmc.historyDetail_infoCard}>
        <div className={mmc.historyDetail_metaGroup}>
          <div className={mmc.historyDetail_metaPill}>
            <span>생성자</span>
            <strong>{creator}</strong>
          </div>
          <div className={mmc.historyDetail_metaPill}>
            <span>구분</span>
            <strong>{division}</strong>
          </div>
          <div className={mmc.historyDetail_metaPill}>
            <span>현재 상태</span>
            {currentStatus === '반려' ? (
              <button
                type="button"
                className={`${mmc.historyDetail_statusLink} ${mmc.historyDetail_statusReject}`}
                onClick={handleOpenRejectReason}
              >
                반려
              </button>
            ) : (
              <strong className={getStatusClassName(currentStatus)}>{currentStatus}</strong>
            )}
          </div>
          {currentStatus === '반려' && (
            <span className={mmc.historyDetail_rejectHint}>
              반려 텍스트를 클릭해 반려 사유를 확인하세요.
            </span>
          )}
          <div className={mmc.historyDetail_metaPill}>
            <span>생성 일시</span>
            <strong>{createdAt}</strong>
          </div>
        </div>

        <div className={mmc.historyDetail_actionGroup}>
          <button type="button" className={mmc.historyDetail_btnDownload} onClick={handleDownloadExcel}>
            엑셀 다운로드
          </button>
          {isDecisionVisible && (
            <>
              <button type="button" className={mmc.historyDetail_btnApprove} onClick={handleApproveClick}>
                승인
              </button>
              <button type="button" className={mmc.historyDetail_btnReject} onClick={handleRejectClick}>
                반려
              </button>
            </>
          )}
        </div>
      </section>

      <section className={mmc.historyDetail_dashboardGrid}>
        <div className={mmc.historyDetail_leftColumn}>
          <article className={mmc.historyDetail_panelCard}>
            <header className={mmc.historyDetail_panelHead}>
              <h3>설비 가동률</h3>
            </header>
            <div className={mmc.historyDetail_chartBox}>
              <CommonDonut
                percent={utilizationRate}
                titleLabel="가동률"
                statusLabel={utilizationRate >= 50 ? '가동' : '저조'}
                threshold={50}
                tone="amber"
                wrapClassName={mmc.historyDetail_ringWrap}
                svgClassName={mmc.historyDetail_ringSvg}
                trackClassName={mmc.historyDetail_ringTrack}
                progressClassName={mmc.historyDetail_ringProgress}
                centerClassName={mmc.historyDetail_ringCenter}
              />
            </div>
          </article>

          <article className={mmc.historyDetail_panelCard}>
            <header className={mmc.historyDetail_panelHead}>
              <h3>납기 불가 모델 정보</h3>
            </header>
            <div className={mmc.historyDetail_unavailableWrap}>
              <table className={mmc.historyDetail_unavailableTable}>
                <thead>
                  <tr>
                    <th>구분</th>
                    <th>모델명</th>
                    <th>목표</th>
                    <th>가능</th>
                    <th>불가능</th>
                  </tr>
                </thead>
                <tbody>
                  {unavailableModels.length === 0 ? (
                    <tr>
                      <td colSpan={5} className={mmc.historyDetail_empty}>
                        납기 불가 모델이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    unavailableModels.map((row, idx) => (
                      <tr key={`${idx}-${row.model_name}`}>
                        <td>{idx + 1}</td>
                        <td>{row.model_name}</td>
                        <td>{formatNumber(row.target_qty)}</td>
                        <td className={mmc.historyDetail_possible}>{formatNumber(row.possible_qty)}</td>
                        <td className={mmc.historyDetail_impossible}>{formatNumber(row.impossible_qty)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </article>
        </div>

        <article className={mmc.historyDetail_panelCard}>
          <header className={mmc.historyDetail_panelHead}>
            <h3>설비별 생산 비율</h3>
          </header>
          <CommonLineDetail
            items={machineChartItems}
            selectedLabel={selectedMachine || null}
            summaryLabel="요약"
            onSelect={(machine) => setSelectedMachine(machine)}
          />
        </article>

        <article className={`${mmc.historyDetail_panelCard} ${mmc.historyDetail_planCardInGrid}`}>
          <header className={mmc.historyDetail_planHead}>
            <h3>일별 생산 계획</h3>
            <div className={mmc.historyDetail_planMeta}>
              {selectedMachine && (
                <span className={mmc.historyDetail_machinePill}>{selectedMachine}</span>
              )}
              <span className={mmc.historyDetail_planCount}>
                총 {selectedMachineRows.length.toLocaleString('ko-KR')}건
              </span>
            </div>
          </header>

          <div ref={planWrapRef} className={mmc.historyDetail_planWrap}>
            <table
              ref={planTableRef}
              className={mmc.historyDetail_planTable}
              style={
                {
                  '--history-plan-row-font-size': planCellFontSizePx
                    ? `${planCellFontSizePx}px`
                    : undefined,
                } as CSSProperties
              }
            >
              <thead>
                <tr>
                  <th>일자</th>
                  <th>근무조</th>
                  <th>모델명</th>
                  <th>차수</th>
                  <th>수량</th>
                  <th>시간</th>
                </tr>
              </thead>
              <tbody>
                {pagedPlanRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className={mmc.historyDetail_empty}>
                      선택된 호기의 생산 계획 데이터가 없습니다.
                    </td>
                  </tr>
                ) : (
                  pagedPlanRows.map((row) => {
                    const isEdited = qtyEdits[row.editKey] !== undefined
                    return (
                      <tr
                        key={row.key}
                        className={row.isDevSample ? mmc.historyDetail_devRow : ''}
                        style={planRowHeightPx ? { height: `${planRowHeightPx}px` } : undefined}
                      >
                        <td>{row.dateLabel}</td>
                        <td>{row.shift}</td>
                        <td>{row.model}</td>
                        <td>{row.order}</td>
                        <td>
                          {row.isDevSample ? (
                            toQtyText(row.qty)
                          ) : (
                            <input
                              type="text"
                              value={getDisplayQty(row)}
                              onChange={(e) => handleQtyEdit(row.editKey, e.target.value, row.qty)}
                              className={mmc.historyDetail_qtyInput}
                              style={isEdited ? { backgroundColor: '#fff8e1' } : undefined}
                            />
                          )}
                        </td>
                        <td>{row.time}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className={mmc.historyDetail_planFooter}>
            {totalPages > 1 && (
              <nav className={mmc.historyDetail_pagination} aria-label="일별 생산 계획 페이지네이션">
                <button
                  type="button"
                  className={mmc.historyDetail_pageArrow}
                  onClick={handlePrev}
                  disabled={safePage === 1}
                >
                  &lsaquo;
                </button>
                {pageNumbers.map((num) => (
                  <button
                    key={num}
                    type="button"
                    className={`${mmc.historyDetail_pageNum} ${
                      num === safePage ? mmc.historyDetail_pageNumActive : ''
                    }`}
                    onClick={() => setPage(num)}
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  className={mmc.historyDetail_pageArrow}
                  onClick={handleNext}
                  disabled={safePage === totalPages}
                >
                  &rsaquo;
                </button>
              </nav>
            )}
            <button
              type="button"
              className={mmc.historyDetail_btnApprove}
              onClick={handleSaveQuantities}
              disabled={!hasEdits}
              style={{ marginLeft: 'auto' }}
            >
              저장
            </button>
          </div>
        </article>
      </section>

      <CommonModal
        open={isApproveModalOpen}
        title="생산계획 승인 확인"
        detail="생산계획을 승인하시겠습니까?"
        confirmText="확인"
        cancelText="닫기"
        onConfirm={handleApproveConfirm}
        onCancel={handleApproveCancel}
      />
      <RejectModal
        open={isRejectModalOpen}
        mode="edit"
        title="생산 계획 반려 확인"
        detail="생산 계획을 반려하시겠습니까? 반려 사유를 입력해 주세요."
        reason={rejectReason || '해당 생산계획은 진행 시 차질이 있을 것으로 보입니다.'}
        onConfirm={handleRejectConfirm}
        onCancel={handleRejectCancel}
      />
      <RejectModal
        open={isRejectViewModalOpen}
        mode="view"
        title="반려 사유 확인"
        detail="입력된 반려 사유를 확인해 주세요."
        reason={rejectReason}
        onCancel={handleCloseRejectReason}
      />
    </div>
  )
}
