'use client'

import { useMemo, useState, useEffect } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import { useParams, useRouter } from 'next/navigation'
import mmc from '@/app/components/style/resources/css/member.module.css'
import CommonDonut from '@/app/components/libs/charts/common/common-donut'
import CommonDonutDetail, {
  type CommonDonutDetailItem,
} from '@/app/components/libs/charts/common/common-donut-detail'
import CommonModal from '@/app/components/libs/modals/modal-common'
import RejectModal from '@/app/components/libs/modals/modal-reject'

/*
 * 01. 구분      : Page 컴포넌트
 * 02. 타입      : Client Component
 * 03. 업무구분  : 멤버권한 - 생산 계획 결과 상세
 * 04. 설명      : 생산 이력 상세 조회 페이지
 * 05. 작성일자  : 2026.02.20
 * 06. 작성자    : Codex
 */

type HistoryStatus = '승인' | '등록' | '승인요청' | '반려'
type HistoryDivision = '생산' | '개발'

type DetailMeta = {
  id: number
  creator: string
  division: HistoryDivision
  status: HistoryStatus
  createdAt: Dayjs
  runRate: number
}

type UnavailableModelRow = {
  order: number
  model: string
  goal: number
  possible: number
  impossible: number
}

type DailyPlanRow = {
  id: number
  model: string
  partNo: string
  decDemand: number
  janDemand: number
  dailyValues: number[]
}

// 일별 계획 컬럼(12-01 ~ 12-14)
const DAY_COLUMNS = Array.from({ length: 14 }, (_, idx) => `12-${String(idx + 1).padStart(2, '0')}`)

export default function HistoryDetailPage() {
  /******************** 변수영역 ********************/
  const router = useRouter()
  const params = useParams<{ id: string }>()

  // URL 파라미터 id를 안전하게 숫자로 변환
  const parsedId = Number(params?.id ?? 1)
  const historyId = Number.isFinite(parsedId) && parsedId > 0 ? parsedId : 1

  // 하단 "일별 생산 계획" 테이블 페이지네이션 설정
  const PAGE_SIZE = 10
  const PAGE_BUTTON_WINDOW = 10

  // 상세 메타 예시 데이터 (id 기반)
  const detailMeta = useMemo<DetailMeta>(() => {
    const statusPattern: HistoryStatus[] = ['승인', '승인요청', '반려', '등록']
    const status = statusPattern[(historyId - 1) % statusPattern.length]
    const division: HistoryDivision = historyId % 3 === 0 ? '개발' : '생산'
    const creatorPattern = ['송기석', '홍길동', '배준현']
    const creator = creatorPattern[(historyId - 1) % creatorPattern.length]
    const createdAt = dayjs('2026-01-13 09:13:00').add((historyId - 1) % 7, 'minute')
    const runRate = status === '승인요청' ? 89 : status === '반려' ? 44 : 100

    return {
      id: historyId,
      creator,
      division,
      status,
      createdAt,
      runRate,
    }
  }, [historyId])

  // 현재 상태 (UI에서 상태 변경 시 즉시 반영하기 위한 로컬 상태)
  const [currentStatus, setCurrentStatus] = useState<HistoryStatus>(detailMeta.status)

  // 승인 확인 모달 상태
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false)

  // 반려 입력 모달 / 반려 사유 보기 모달 상태
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
  const [isRejectViewModalOpen, setIsRejectViewModalOpen] = useState(false)

  // 저장된 반려 사유 (반려 처리 후 readonly 확인용)
  const [rejectReason, setRejectReason] = useState('')

  // 설비별 생산비율 (도넛 상세)
  const productionRatioLegend = useMemo<CommonDonutDetailItem[]>(
    () => [
      { label: 'PIPE A100', value: 26.0, unit: '%', color: '#f0a345' },
      { label: 'PIPE A150', value: 55.0, unit: '%', color: '#2ba9de' },
      { label: 'PIPE A200', value: 10.0, unit: '%', color: '#0f2f57' },
      { label: 'PIPE A250', value: 4.0, unit: '%', color: '#355e8f' },
      { label: 'PIPE A300', value: 5.0, unit: '%', color: '#89d2f3' },
    ],
    []
  )

  // 납기 불가 모델 정보 테이블
  const unavailableRows = useMemo<UnavailableModelRow[]>(
    () => [
      { order: 1, model: 'LP140WT1-SJA1', goal: 50000, possible: 15000, impossible: 35000 },
      { order: 2, model: 'LP140WT1-SJA1', goal: 25000, possible: 18000, impossible: 7000 },
      { order: 3, model: 'LP140WT1-SJA1', goal: 15000, possible: 9000, impossible: 6000 },
      { order: 4, model: 'LP140WT1-SJA1', goal: 50000, possible: 15000, impossible: 35000 },
      { order: 5, model: 'LP140WT1-SJA1', goal: 25000, possible: 18000, impossible: 7000 },
    ],
    []
  )

  // 일별 생산 계획 예시 데이터
  const dailyPlanRows = useMemo<DailyPlanRow[]>(
    () =>
      Array.from({ length: 28 }, (_, idx) => ({
        id: idx + 1,
        model: 'LH179QA5-EM01(D1B3)',
        partNo: 'LH179QA5-EM01(D1B3)',
        decDemand: 640000,
        janDemand: 640000,
        dailyValues: Array.from({ length: DAY_COLUMNS.length }, () => 4200),
      })),
    []
  )

  // 변경 반영(노란색) 셀 위치: `${rowId}-${dayIndex(1~14)}`
  const changedCellKeys = useMemo(
    () =>
      new Set<string>([
        '2-6',
        '3-9',
        '5-9',
        '6-4',
        '7-7',
      ]),
    []
  )

  // 일별 생산 계획 현재 페이지
  const [page, setPage] = useState(1)

  // 페이지네이션 계산
  const totalPages = Math.max(1, Math.ceil(dailyPlanRows.length / PAGE_SIZE))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const startIndex = (safePage - 1) * PAGE_SIZE

  const pagedRows = useMemo(
    () => dailyPlanRows.slice(startIndex, startIndex + PAGE_SIZE),
    [dailyPlanRows, startIndex]
  )

  // 버튼 묶음 범위 계산 (예: 1~10)
  const pageStart = Math.floor((safePage - 1) / PAGE_BUTTON_WINDOW) * PAGE_BUTTON_WINDOW + 1
  const pageEnd = Math.min(totalPages, pageStart + PAGE_BUTTON_WINDOW - 1)

  const pageNumbers = useMemo(
    () => Array.from({ length: pageEnd - pageStart + 1 }, (_, i) => pageStart + i),
    [pageStart, pageEnd]
  )

  /******************** 함수영역 ********************/
  // 숫자 천단위 포맷
  const formatNumber = (value: number) => value.toLocaleString('ko-KR')

  // 목록 페이지 이동
  const handleBackToList = () => {
    router.push('/history')
  }

  // 승인 버튼 클릭 시 확인 모달 오픈
  const handleApproveClick = () => {
    setIsApproveModalOpen(true)
  }

  const handleApproveCancel = () => {
    setIsApproveModalOpen(false)
  }

  // 승인 확인 시 상태를 '승인'으로 반영
  const handleApproveConfirm = () => {
    setCurrentStatus('승인')
    setIsApproveModalOpen(false)
  }

  // 반려 버튼 클릭 시 반려 사유 입력 모달 오픈
  const handleRejectClick = () => {
    setIsRejectModalOpen(true)
  }

  const handleRejectCancel = () => {
    setIsRejectModalOpen(false)
  }

  // 반려 확인 시 상태/사유 저장
  const handleRejectConfirm = (reason: string) => {
    setRejectReason(reason)
    setCurrentStatus('반려')
    setIsRejectModalOpen(false)
  }

  // 반려 상태일 때 상태 텍스트 클릭 시 readonly 모달 오픈
  const handleOpenRejectReason = () => {
    if (currentStatus !== '반려') return
    setIsRejectViewModalOpen(true)
  }

  const handleCloseRejectReason = () => {
    setIsRejectViewModalOpen(false)
  }

  // 페이지 이동
  const handlePrev = () => setPage((prev) => Math.max(1, prev - 1))
  const handleNext = () => setPage((prev) => Math.min(totalPages, prev + 1))

  // 상태별 텍스트 컬러 클래스
  const getStatusClassName = (status: HistoryStatus) => {
    if (status === '승인요청') return mmc.historyDetail_statusRequest
    if (status === '반려') return mmc.historyDetail_statusReject
    return mmc.historyDetail_statusApproved // 승인/등록
  }

  /******************** 수행영역 ********************/
  useEffect(() => {
    // id 변경 시 상세 상태/모달/사유 초기화
    setCurrentStatus(detailMeta.status)
    setIsApproveModalOpen(false)
    setIsRejectModalOpen(false)
    setIsRejectViewModalOpen(false)
    setRejectReason('')
  }, [detailMeta.status])

  useEffect(() => {
    // 페이지 보정
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  // 현재 상태가 '승인요청'일 때만 승인/반려 버튼 노출
  const isDecisionVisible = currentStatus === '승인요청'

  return (
    <div className={mmc.historyDetail_root}>
      {/* 페이지 헤더 */}
      <section className={mmc.historyDetail_pageHead}>
        <div>
          <h1>생산 계획 결과 상세</h1>
          <p>선택하신 생산계획에 대한 결과를 확인하실 수 있습니다.</p>
        </div>

        <button type="button" className={mmc.historyDetail_backBtn} onClick={handleBackToList}>
          &lsaquo; 목록으로 돌아가기
        </button>
      </section>

      {/* 상단 메타 정보 + 상태 액션 */}
      <section className={mmc.historyDetail_infoCard}>
        <div className={mmc.historyDetail_metaGroup}>
          <div className={mmc.historyDetail_metaPill}>
            <span>생성자</span>
            <strong>{detailMeta.creator}</strong>
          </div>

          <div className={mmc.historyDetail_metaPill}>
            <span>구분</span>
            <strong>{detailMeta.division}</strong>
          </div>

          <div className={mmc.historyDetail_metaPill}>
            <span>현재 상태</span>

            {/* 반려 상태일 때만 클릭 가능한 상태 텍스트로 표시 */}
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

          {/* 반려 상태 안내 메시지 */}
          {currentStatus === '반려' && (
            <span className={mmc.historyDetail_rejectHint}>
              반려 텍스트를 클릭하여, 반려 사유를 확인해주세요.
            </span>
          )}

          <div className={mmc.historyDetail_metaPill}>
            <span>생성 일시</span>
            <strong>{detailMeta.createdAt.format('YYYY-MM-DD HH:mm:ss')}</strong>
          </div>
        </div>

        {/* 승인요청 상태일 때만 액션 버튼 노출 */}
        {isDecisionVisible && (
          <div className={mmc.historyDetail_actionGroup}>
            <button
              type="button"
              className={mmc.historyDetail_btnApprove}
              onClick={handleApproveClick}
            >
              승인
            </button>
            <button
              type="button"
              className={mmc.historyDetail_btnReject}
              onClick={handleRejectClick}
            >
              반려
            </button>
          </div>
        )}
      </section>

      {/* 상단 3개 카드 (가동률 / 비율 / 납기불가) */}
      <section className={mmc.historyDetail_topGrid}>
        <article className={mmc.historyDetail_panelCard}>
          <header className={mmc.historyDetail_panelHead}>
            <h3>설비 가동률</h3>
          </header>

          <div className={mmc.historyDetail_chartBox}>
            <CommonDonut
              percent={detailMeta.runRate}
              titleLabel="가동률"
              statusLabel={detailMeta.runRate >= 50 ? '가동' : '비가동'}
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
            <h3>설비별 생산 비율</h3>
          </header>

          <CommonDonutDetail legend={productionRatioLegend} summaryLabel="요약" />
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
                {unavailableRows.map((row) => (
                  <tr key={`${row.order}-${row.model}`}>
                    <td>{row.order}</td>
                    <td>{row.model}</td>
                    <td>{formatNumber(row.goal)}</td>
                    <td className={mmc.historyDetail_possible}>{formatNumber(row.possible)}</td>
                    <td className={mmc.historyDetail_impossible}>{formatNumber(row.impossible)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>

      {/* 일별 생산 계획 */}
      <section className={mmc.historyDetail_planCard}>
        <header className={mmc.historyDetail_planHead}>
          <h3>일별 생산 계획</h3>

          <div className={mmc.historyDetail_changeNote}>
            <span />
            <em>*노란색으로 표시된 곳은 변경이 반영된 수치입니다.</em>
          </div>
        </header>

        <div className={mmc.historyDetail_planWrap}>
          <table className={mmc.historyDetail_planTable}>
            <thead>
              <tr>
                <th>MODEL</th>
                <th>PartNo</th>
                <th>12월수요량</th>
                <th>01월수요량</th>
                {DAY_COLUMNS.map((day) => (
                  <th key={day}>{day}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {pagedRows.map((row) => (
                <tr key={row.id}>
                  <td>{row.model}</td>
                  <td>{row.partNo}</td>
                  <td>{formatNumber(row.decDemand)}</td>
                  <td>{formatNumber(row.janDemand)}</td>

                  {row.dailyValues.map((value, colIdx) => {
                    const cellKey = `${row.id}-${colIdx + 1}`
                    const changed = changedCellKeys.has(cellKey)

                    return (
                      <td
                        key={`${row.id}-${DAY_COLUMNS[colIdx]}`}
                        className={changed ? mmc.historyDetail_changedCell : undefined}
                      >
                        {formatNumber(value)}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 하단 페이지네이션 */}
        <nav className={mmc.historyDetail_pagination} aria-label="일별 생산 계획 페이지네이션">
          <button
            type="button"
            className={mmc.historyDetail_pageArrow}
            onClick={handlePrev}
            disabled={safePage === 1}
            aria-label="이전 페이지"
          >
            &lsaquo;
          </button>

          {pageNumbers.map((num) => (
            <button
              key={num}
              type="button"
              className={`${mmc.historyDetail_pageNum} ${num === safePage ? mmc.historyDetail_pageNumActive : ''}`}
              onClick={() => setPage(num)}
              aria-current={num === safePage ? 'page' : undefined}
            >
              {num}
            </button>
          ))}

          <button
            type="button"
            className={mmc.historyDetail_pageArrow}
            onClick={handleNext}
            disabled={safePage === totalPages}
            aria-label="다음 페이지"
          >
            &rsaquo;
          </button>
        </nav>
      </section>

      {/* 승인 확인 모달 */}
      <CommonModal
        open={isApproveModalOpen}
        title="생산계획 승인 확인"
        detail="생산계획을 승인하시겠습니까?"
        confirmText="확인"
        cancelText="닫기"
        onConfirm={handleApproveConfirm}
        onCancel={handleApproveCancel}
      />

      {/* 반려 사유 입력 모달 */}
      <RejectModal
        open={isRejectModalOpen}
        mode="edit"
        title="생산 계획 반려 확인"
        detail="생산 계획을 반려하시겠습니까? 반려하신다면 사유를 입력해주세요."
        reason={rejectReason || '해당 생산계획대로 진행 시, 차질이 있을 것으로 보입니다.'}
        onConfirm={handleRejectConfirm}
        onCancel={handleRejectCancel}
      />

      {/* 반려 사유 readonly 확인 모달 */}
      <RejectModal
        open={isRejectViewModalOpen}
        mode="view"
        title="반려 사유 확인"
        detail="입력된 반려 사유를 확인해주세요."
        reason={rejectReason}
        onCancel={handleCloseRejectReason}
      />
    </div>
  )
}
