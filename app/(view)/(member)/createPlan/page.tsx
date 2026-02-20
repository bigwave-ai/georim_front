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
 * 03. 업무구분  : 멤버권한 - 생산 계획 생성
 * 04. 설명      : 주차별 물동 계획 기반 생산 계획 생성 페이지
 * 05. 작성일자  : 2026.02.19
 * 06. 작성자    : 이우창
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

  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null)
  const [page, setPage] = useState(1)

  const [dataSource, setDataSource] = useState<DataSourceType>('none')
  const [uploadMessage, setUploadMessage] = useState('엑셀형식 물동 계획 파일을 업로드')
  const [uploadedFileName, setUploadedFileName] = useState('')
  const [planRows, setPlanRows] = useState<PlanRow[]>([])

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isLoadingModalOpen, setIsLoadingModalOpen] = useState(false)
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false)

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const generationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  const handlePrev = () => setPage((prev) => Math.max(1, prev - 1))
  const handleNext = () => setPage((prev) => Math.min(totalPages, prev + 1))

  const handleLoadClick = () => {
    if (!selectedDate) return
    setDataSource('load')
    setUploadedFileName('')
    setPlanRows(MOCK_ROWS)
    setPage(1)
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    const isAllowed = ALLOWED_EXTENSIONS.includes(ext)

    // 같은 파일 재선택 허용
    event.target.value = ''

    if (!isAllowed) {
      setUploadMessage('csv, xlsx 파일만 업로드 가능합니다.')
      return
    }

    setUploadedFileName(file.name)
    setUploadMessage(`${file.name} 업로드 완료`)
    setDataSource('upload')
    setPlanRows(MOCK_ROWS)
    setPage(1)
  }

  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true)
  }

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false)
  }

  // 1) 생성 확인 모달 -> 2) 로딩 모달 -> 3) 완료 모달
  const handleConfirmCreatePlan = () => {
    setIsCreateModalOpen(false)
    setIsLoadingModalOpen(true)

    clearGenerationTimer()
    generationTimerRef.current = setTimeout(() => {
      setIsLoadingModalOpen(false)
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

  useEffect(() => {
    return () => {
      clearGenerationTimer()
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
            />

            <button
              type="button"
              className={`${mmc.plan_actionBtn} ${mmc.plan_actionBtnLoad}`}
              onClick={handleLoadClick}
              disabled={!selectedDate}
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
            >
              업로드
            </button>
          </div>
        </div>
      </section>

      {isPlanVisible && (
        <section className={mmc.plan_tableCard}>
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
        open={isLoadingModalOpen}
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
