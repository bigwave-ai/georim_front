'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import type { ChangeEvent } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import { useRouter } from 'next/navigation'
import mmc from '@/app/components/style/resources/css/member.module.css'
import CommonDatePicker from '@/app/components/libs/muis/mui-date-picker'
import CommonModal from '@/app/components/libs/modals/modal-common'
import LoadingModal from '@/app/components/libs/modals/modal-loading'

/*
 * 01. 구분      : Page 컴포넌트
 * 02. 타입      : Client Component
 * 03. 업무구분   : 멤버권한 - 생산 계획 생성
 * 04. 설명      : 주차별 물동 계획 기반 생산 계획 생성 페이지
 * 05. 작성일자   : 2026.02.19
 * 06. 작성자     : 이우창
 */

type PlanRow = {
  id: string
  division: string
  customerName: string
  model: string
  partNo: string
  decDemand: number
  janDemand: number
}

type DataSourceType = 'none' | 'load' | 'upload'

export default function CreatePlanPage() {
  /******************** 변수영역 ********************/
  const router = useRouter()
  const PAGE_SIZE = 10
  const ALLOWED_EXTENSIONS = ['csv', 'xlsx']

  // 기준일 선택
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null)

  // 테이블 페이지네이션
  const [page, setPage] = useState(1)

  // 현재 데이터 출처(없음/기존 불러오기/새 데이터 업로드)
  const [dataSource, setDataSource] = useState<DataSourceType>('none')

  // 업로드 상태 문구 및 파일명
  const [uploadMessage, setUploadMessage] = useState('엑셀형식 물동 계획을 업로드')
  const [uploadedFileName, setUploadedFileName] = useState('')

  // 실제 렌더링되는 테이블 데이터
  const [planRows, setPlanRows] = useState<PlanRow[]>([])

  // 카드 등장 애니메이션 트리거용 key
  const [planCardRenderKey, setPlanCardRenderKey] = useState(0)

  // 생산 계획 생성 모달 흐름 상태
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isGenerationLoadingModalOpen, setIsGenerationLoadingModalOpen] = useState(false)
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false)

  // 데이터 불러오기/업로드 로딩 모달 상태
  const [isDataLoadingModalOpen, setIsDataLoadingModalOpen] = useState(false)

  // 숨김 파일 input ref
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // 타이머 ref (언마운트 시 clear)
  const generationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dataLoadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 목업 데이터 기본 row
  const BASE_ROW: Omit<PlanRow, 'id'> = {
    division: 'Macbook LCD (AR Film)',
    customerName: '엘앤에프',
    model: 'LH179QA5-EM01(D1B3)',
    partNo: 'LH179QA5-EM01(D1B3)',
    decDemand: 640000,
    janDemand: 640000,
  }

  // API 연동 전 목업 데이터
  const MOCK_ROWS = useMemo<PlanRow[]>(
    () =>
      Array.from({ length: 37 }, (_, idx) => ({
        id: `plan-row-${idx + 1}`,
        ...BASE_ROW,
      })),
    []
  )

  // 페이지네이션 계산
  const totalPages = Math.max(1, Math.ceil(planRows.length / PAGE_SIZE))
  const safePage = Math.min(Math.max(1, page), totalPages)

  const pagedRows = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE
    return planRows.slice(start, start + PAGE_SIZE)
  }, [planRows, safePage])

  const pageNumbers = useMemo(
    () => Array.from({ length: totalPages }, (_, idx) => idx + 1),
    [totalPages]
  )

  // 화면 표시용 값
  const selectedDateText = selectedDate?.format('YYYY-MM-DD') ?? '-'
  const isPlanVisible = dataSource !== 'none' && planRows.length > 0
  const sourceLabel = dataSource === 'load' ? '기존 데이터' : '새로운 데이터'

  /******************** 함수영역 ********************/
  const formatNum = (value: number) => value.toLocaleString('ko-KR')

  const clearGenerationTimer = () => {
    if (generationTimerRef.current) {
      clearTimeout(generationTimerRef.current)
      generationTimerRef.current = null
    }
  }

  const clearDataLoadingTimer = () => {
    if (dataLoadingTimerRef.current) {
      clearTimeout(dataLoadingTimerRef.current)
      dataLoadingTimerRef.current = null
    }
  }

  // 로딩 종료 후 실제 데이터 반영
  const applyLoadedPlanData = (source: DataSourceType, fileName = '') => {
    setDataSource(source)
    setUploadedFileName(fileName)
    setPlanRows(MOCK_ROWS)
    setPage(1)

    // 카드가 "새로 등장"하도록 key 갱신
    setPlanCardRenderKey((prev) => prev + 1)
  }

  // 데이터 로딩 시작(기존 불러오기/업로드 공통)
  const startDataLoading = (source: DataSourceType, fileName = '') => {
    // 로딩 중에는 카드를 잠깐 숨겼다가 다시 표시(등장 애니메이션 목적)
    setDataSource('none')
    setPlanRows([])
    setPage(1)

    setIsDataLoadingModalOpen(true)
    clearDataLoadingTimer()

    dataLoadingTimerRef.current = setTimeout(() => {
      setIsDataLoadingModalOpen(false)
      applyLoadedPlanData(source, fileName)
    }, 900)
  }

  const handlePrev = () => setPage((prev) => Math.max(1, prev - 1))
  const handleNext = () => setPage((prev) => Math.min(totalPages, prev + 1))

  // 기존 데이터 불러오기
  const handleLoadClick = () => {
    if (!selectedDate) return
    startDataLoading('load')
  }

  // 파일 선택창 열기
  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  // 새 데이터 업로드
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    const isAllowed = ALLOWED_EXTENSIONS.includes(ext)

    // 같은 파일 재선택 가능하도록 초기화
    event.target.value = ''

    if (!isAllowed) {
      setUploadMessage('csv, xlsx 파일만 업로드 가능합니다.')
      return
    }

    setUploadMessage(`${file.name} 확인 완료`)
    startDataLoading('upload', file.name)
  }

  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true)
  }

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false)
  }

  // 1) 생성 확인 모달 -> 2) 생성 로딩 모달 -> 3) 완료 모달
  const handleConfirmCreatePlan = () => {
    setIsCreateModalOpen(false)
    setIsGenerationLoadingModalOpen(true)

    clearGenerationTimer()
    generationTimerRef.current = setTimeout(() => {
      setIsGenerationLoadingModalOpen(false)
      setIsCompleteModalOpen(true)
    }, 1600)
  }

  // 완료 모달 확인 -> 이력 페이지 이동
  const handleCompleteConfirm = () => {
    setIsCompleteModalOpen(false)
    router.push('/history')
  }

  /******************** 수행영역 ********************/
  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  // 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      clearGenerationTimer()
      clearDataLoadingTimer()
    }
  }, [])

  return (
    <div className={mmc.plan_root}>
      <section className={mmc.plan_pageHead}>
        <h1>생산 계획 생성</h1>
        <p>주차별 물동 계획을 기준으로 생산 계획을 생성합니다.</p>
      </section>

      <section className={mmc.plan_controlCard}>
        <div className={mmc.plan_controlTitleWrap}>
          <h2>물동 계획 선택/입력</h2>
          <p>주차별 물동 계획을 선택하거나 엑셀 파일을 통해 업로드해주세요.</p>
        </div>

        <div className={mmc.plan_controlActions}>
          <div className={mmc.plan_actionGroup}>
            <span className={mmc.plan_actionLabel}>기존 데이터 불러오기</span>

            <CommonDatePicker
              className={mmc.plan_datePicker}
              value={selectedDate}
              onChange={setSelectedDate}
              width={150}
              tone="plan"
            />

            <button
              type="button"
              className={`${mmc.plan_actionBtn} ${mmc.plan_actionBtnLoad}`}
              onClick={handleLoadClick}
              disabled={!selectedDate || isDataLoadingModalOpen}
            >
              불러오기
            </button>
          </div>

          <div className={mmc.plan_actionGroup}>
            <span className={mmc.plan_actionLabel}>새로운 데이터 업로드</span>
            <span className={mmc.plan_actionHint} aria-live="polite">
              {uploadMessage}
            </span>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />

            <button
              type="button"
              className={`${mmc.plan_actionBtn} ${mmc.plan_actionBtnUpload}`}
              onClick={handleUploadClick}
              disabled={isDataLoadingModalOpen}
            >
              업로드
            </button>
          </div>
        </div>
      </section>

      {isPlanVisible && (
        <section
          key={planCardRenderKey}
          className={`${mmc.plan_tableCard} ${mmc.plan_tableCardEnter}`}
        >
          <header className={mmc.plan_tableHead}>
            <div className={mmc.plan_tableHeadLeft}>
              <h3>주차별 물동 계획</h3>
              <span className={mmc.plan_chip}>{sourceLabel}</span>

              {dataSource === 'load' ? (
                <span className={mmc.plan_baseDate}>일자 기준: {selectedDateText}</span>
              ) : (
                <span className={mmc.plan_baseDate}>파일명: {uploadedFileName || '-'}</span>
              )}
            </div>

            <button
              type="button"
              className={mmc.plan_createBtn}
              onClick={handleOpenCreateModal}
            >
              생산 계획 생성
            </button>
          </header>

          <div className={mmc.plan_tableWrap}>
            <table className={mmc.plan_table}>
              <thead>
                <tr>
                  <th>DIVISION</th>
                  <th>거래처명</th>
                  <th>MODEL</th>
                  <th>PartNo</th>
                  <th>12월수요량</th>
                  <th>01월수요량</th>
                </tr>
              </thead>
              <tbody>
                {pagedRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.division}</td>
                    <td>{row.customerName}</td>
                    <td>{row.model}</td>
                    <td>{row.partNo}</td>
                    <td>{formatNum(row.decDemand)}</td>
                    <td>{formatNum(row.janDemand)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <nav className={mmc.plan_pagination} aria-label="물동 계획 페이지네이션">
            <button
              type="button"
              className={mmc.plan_pageArrow}
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
                className={`${mmc.plan_pageNum} ${num === safePage ? mmc.plan_pageNumActive : ''}`}
                onClick={() => setPage(num)}
                aria-current={num === safePage ? 'page' : undefined}
              >
                {num}
              </button>
            ))}

            <button
              type="button"
              className={mmc.plan_pageArrow}
              onClick={handleNext}
              disabled={safePage === totalPages}
              aria-label="다음 페이지"
            >
              &rsaquo;
            </button>
          </nav>
        </section>
      )}

      {/* 데이터 로딩 모달(기존 데이터 불러오기 / 업로드 공통) */}
      <LoadingModal
        open={isDataLoadingModalOpen}
        message="데이터를 불러오고 있습니다."
        subMessage="잠시만 기다려주세요."
      />

      {/* 1) 생성 확인 모달 */}
      <CommonModal
        open={isCreateModalOpen}
        title="생산 계획 생성"
        detail="현재 물동 계획을 기반으로 생산계획을 생성하시겠습니까?"
        confirmText="확인"
        cancelText="닫기"
        onConfirm={handleConfirmCreatePlan}
        onCancel={handleCloseCreateModal}
      />

      {/* 2) 생성 중 로딩 모달 */}
      <LoadingModal
        open={isGenerationLoadingModalOpen}
        message="생산계획을 생성중입니다."
        subMessage="잠시만 기다려주세요."
      />

      {/* 3) 생성 완료 모달 */}
      <CommonModal
        open={isCompleteModalOpen}
        title="계획 생성 완료"
        detail="생산 계획 생성이 완료되어 이력 페이지로 이동합니다."
        confirmText="확인"
        onConfirm={handleCompleteConfirm}
        showCancel={false}
      />
    </div>
  )
}
