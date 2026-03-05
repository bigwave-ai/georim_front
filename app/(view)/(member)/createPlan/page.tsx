'use client'

import { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import type { ChangeEvent } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import { useRouter } from 'next/navigation'
import mmc from '@/app/components/style/resources/css/member.module.css'
import CommonDatePicker from '@/app/components/libs/muis/mui-date-picker'
import CommonModal from '@/app/components/libs/modals/modal-common'
import LoadingModal from '@/app/components/libs/modals/modal-loading'
import axiosUtil from '@/app/services/util/axiosUtils'

/*
 * 01. 구분      : Page 컴포넌트
 * 02. 타입      : Client Component
 * 03. 업무구분   : 멤버권한 - 생산 계획 생성
 * 04. 설명      : 주차별 물동 계획 기반 생산 계획 생성 페이지
 * 05. 작성일자   : 2026.02.19
 * 06. 작성자     : 이우창
 */

type DynamicHeader = {
  key: string
  label: string
}

type PlanRow = {
  id: string
  division: string
  customer_name: string
  model: string
  part_no: string
  demand_month_1: number
  demand_month_2: number
}

type DataSourceType = 'none' | 'load' | 'upload'

const POLL_INTERVAL_MS = 3000

export default function CreatePlanPage() {
  /******************** 변수영역 ********************/
  const router = useRouter()
  const PAGE_SIZE = 10
  const ALLOWED_EXTENSIONS = ['csv', 'xlsx']

  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null)
  const [page, setPage] = useState(1)
  const [dataSource, setDataSource] = useState<DataSourceType>('none')

  const [uploadMessage, setUploadMessage] = useState('엑셀형식 물동 계획을 업로드')
  const [uploadedFileName, setUploadedFileName] = useState('')

  const [planRows, setPlanRows] = useState<PlanRow[]>([])
  const [dynamicHeaders, setDynamicHeaders] = useState<DynamicHeader[]>([])
  const [planCardRenderKey, setPlanCardRenderKey] = useState(0)

  // API-011 업로드 후 받은 upload_id (API-012에서 사용)
  const [uploadId, setUploadId] = useState<string | null>(null)
  // API-012 생성 후 받은 plan_id (폴링에서 사용)
  const [generatedPlanId, setGeneratedPlanId] = useState<number | null>(null)

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isGenerationLoadingModalOpen, setIsGenerationLoadingModalOpen] = useState(false)
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false)
  const [isDataLoadingModalOpen, setIsDataLoadingModalOpen] = useState(false)
  // 생성 실패 모달
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

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

  const clearPollTimer = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current)
      pollTimerRef.current = null
    }
  }, [])

  const handlePrev = () => setPage((prev) => Math.max(1, prev - 1))
  const handleNext = () => setPage((prev) => Math.min(totalPages, prev + 1))

  // 기존 데이터 불러오기 (API-010 미구현 - 비활성화)
  const handleLoadClick = () => {
    if (!selectedDate) return
    alert('MES 연동 준비 중입니다. 엑셀 업로드를 이용해주세요.')
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  // 엑셀 업로드 -> API-011 호출
  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    const isAllowed = ALLOWED_EXTENSIONS.includes(ext)

    event.target.value = ''

    if (!isAllowed) {
      setUploadMessage('csv, xlsx 파일만 업로드 가능합니다.')
      return
    }

    setDataSource('none')
    setPlanRows([])
    setPage(1)
    setIsDataLoadingModalOpen(true)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await axiosUtil.postFormData(
        '/production-planning/logistics-plans/upload',
        formData
      )

      if (!res || !res.items) {
        setIsDataLoadingModalOpen(false)
        setUploadMessage('파일 파싱에 실패했습니다.')
        return
      }

      setUploadId(res.upload_id)
      setDynamicHeaders(res.dynamic_headers || [])

      const rows: PlanRow[] = res.items.map((item: any, idx: number) => ({
        id: `plan-row-${idx + 1}`,
        division: item.division || '',
        customer_name: item.customer_name || '',
        model: item.model || '',
        part_no: item.part_no || '',
        demand_month_1: item.demand_month_1 || 0,
        demand_month_2: item.demand_month_2 || 0,
      }))

      setPlanRows(rows)
      setDataSource('upload')
      setUploadedFileName(file.name)
      setUploadMessage(`${file.name} 확인 완료`)
      setPage(1)
      setPlanCardRenderKey((prev) => prev + 1)
    } catch {
      setUploadMessage('파일 업로드에 실패했습니다.')
    } finally {
      setIsDataLoadingModalOpen(false)
    }
  }

  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true)
  }

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false)
  }

  // 생성 확인 -> API-012 호출 -> 폴링 시작
  const handleConfirmCreatePlan = async () => {
    setIsCreateModalOpen(false)

    if (!uploadId) {
      setErrorMessage('업로드된 데이터가 없습니다.')
      setIsErrorModalOpen(true)
      return
    }

    setIsGenerationLoadingModalOpen(true)

    try {
      const res = await axiosUtil.post('/production-planning/plans/generate', {
        upload_id: uploadId,
        source_type: 'UPLOAD',
      })

      if (!res || !res.plan_id) {
        setIsGenerationLoadingModalOpen(false)
        setErrorMessage('생산 계획 생성 요청에 실패했습니다.')
        setIsErrorModalOpen(true)
        return
      }

      setGeneratedPlanId(res.plan_id)

      clearPollTimer()
      pollTimerRef.current = setInterval(async () => {
        try {
          const status = await axiosUtil.get(`/plans/${res.plan_id}`)
          if (!status) return

          if (status.status === 'COMPLETED') {
            clearPollTimer()
            setIsGenerationLoadingModalOpen(false)
            setIsCompleteModalOpen(true)
          } else if (status.status === 'FAILED') {
            clearPollTimer()
            setIsGenerationLoadingModalOpen(false)
            setErrorMessage(status.error_message || '생산 계획 생성에 실패했습니다.')
            setIsErrorModalOpen(true)
          }
        } catch {
          clearPollTimer()
          setIsGenerationLoadingModalOpen(false)
          setErrorMessage('상태 조회 중 오류가 발생했습니다.')
          setIsErrorModalOpen(true)
        }
      }, POLL_INTERVAL_MS)
    } catch {
      setIsGenerationLoadingModalOpen(false)
      setErrorMessage('생산 계획 생성 요청에 실패했습니다.')
      setIsErrorModalOpen(true)
    }
  }

  const handleCompleteConfirm = () => {
    setIsCompleteModalOpen(false)
    const targetId = generatedPlanId ?? ''
    router.push(`/history/${targetId}`)
  }

  const handleErrorConfirm = () => {
    setIsErrorModalOpen(false)
  }

  /******************** 수행영역 ********************/
  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  useEffect(() => {
    return () => {
      clearPollTimer()
    }
  }, [clearPollTimer])

  // 동적 헤더 라벨 (기본값 제공)
  const demandHeader1 = dynamicHeaders[0]?.label ?? '수요량1'
  const demandHeader2 = dynamicHeaders[1]?.label ?? '수요량2'

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
                  <th>{demandHeader1}</th>
                  <th>{demandHeader2}</th>
                </tr>
              </thead>
              <tbody>
                {pagedRows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.division}</td>
                    <td>{row.customer_name}</td>
                    <td>{row.model}</td>
                    <td>{row.part_no}</td>
                    <td>{formatNum(row.demand_month_1)}</td>
                    <td>{formatNum(row.demand_month_2)}</td>
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

      <LoadingModal
        open={isDataLoadingModalOpen}
        message="데이터를 불러오고 있습니다."
        subMessage="잠시만 기다려주세요."
      />

      <CommonModal
        open={isCreateModalOpen}
        title="생산 계획 생성"
        detail="현재 물동 계획을 기반으로 생산계획을 생성하시겠습니까?"
        confirmText="확인"
        cancelText="닫기"
        onConfirm={handleConfirmCreatePlan}
        onCancel={handleCloseCreateModal}
      />

      <LoadingModal
        open={isGenerationLoadingModalOpen}
        message="생산계획을 생성중입니다."
        subMessage="잠시만 기다려주세요."
      />

      <CommonModal
        open={isCompleteModalOpen}
        title="계획 생성 완료"
        detail="생산 계획 생성이 완료되어 이력 페이지로 이동합니다."
        confirmText="확인"
        onConfirm={handleCompleteConfirm}
        showCancel={false}
      />

      <CommonModal
        open={isErrorModalOpen}
        title="오류"
        detail={errorMessage}
        confirmText="확인"
        onConfirm={handleErrorConfirm}
        showCancel={false}
      />
    </div>
  )
}
