'use client'

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import type { Dayjs } from 'dayjs'
import mmc from '@/app/components/style/resources/css/member.module.css'
import CommonChip from '@/app/components/libs/common/common-chip'
import CommonDatePicker from '@/app/components/libs/muis/mui-date-picker'
import LoadingModal from '@/app/components/libs/modals/modal-loading'
import CommonModal from '@/app/components/libs/modals/modal-common'
import axiosUtil from '@/app/services/util/axiosUtils'

/*
 * 01. 구분      : Page 컴포넌트
 * 02. 타입      : Client Component
 * 03. 업무구분   : 회원권한 - 개발 샘플 시뮬레이션
 * 04. 설명      : n개 샘플 셋트를 입력받아 배치 시뮬레이션 실행 및 결과 확인/반영
 * 05. 작성일자   : 2026.03.05
 * 06. 작성자    : 이우창 
 */

type SimulationResult = 'none' | 'success' | 'fail'

type MachineOption = {
  id: string
  label: string
}

type SlotInfo = {
  machine: string
  period: string
}

type SampleFormState = {
  formId: string
  sampleName: string
  machineIds: string[]
  estimatedMinutes: string
  shippingDate: Dayjs | null
}

type BatchSimulationRequestItem = {
  sample_name: string
  machine_ids: string[]
  est_duration_min: number
  shipment_date: string
}

type BatchSimulationRunRequest = {
  samples: BatchSimulationRequestItem[]
}

type BatchSimulationResultItem = {
  sample_name: string
  is_possible: boolean
  target_machine: string | null
  available_period: string | null
  all_slots: SlotInfo[]
  message: string
  simulation_result_id?: string
}

type BatchSimulationSummary = {
  total: number
  possible: number
  impossible: number
}

type BatchSimulationRunResponse = {
  batch_id: string
  results: BatchSimulationResultItem[]
  summary: BatchSimulationSummary
}

const createInitialSampleForm = (index: number): SampleFormState => ({
  formId: `sample-${index}`,
  sampleName: '',
  machineIds: [],
  estimatedMinutes: '',
  shippingDate: null,
})

export default function SimulationPage() {
  /******************** 변수 영역 ********************/
  const router = useRouter()

  const [machineOptions, setMachineOptions] = useState<MachineOption[]>([])

  const sampleSeqRef = useRef(1)
  const [sampleForms, setSampleForms] = useState<SampleFormState[]>([createInitialSampleForm(1)])
  const [sampleNameErrors, setSampleNameErrors] = useState<Record<string, boolean>>({})

  const [batchId, setBatchId] = useState('')
  const [batchResults, setBatchResults] = useState<BatchSimulationResultItem[]>([])
  const [batchSummary, setBatchSummary] = useState<BatchSimulationSummary | null>(null)

  const [selectedResultIndex, setSelectedResultIndex] = useState(0)
  const [slotIndex, setSlotIndex] = useState(0)

  const [isLoadingModalOpen, setIsLoadingModalOpen] = useState(false)
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false)
  const [redirectPlanId, setRedirectPlanId] = useState<number | null>(null)

  const mountedRef = useRef(true)

  const canStartSimulation = !isLoadingModalOpen

  const selectedSimulation = useMemo<BatchSimulationResultItem | null>(() => {
    if (batchResults.length === 0) return null
    const safeIndex = Math.min(selectedResultIndex, batchResults.length - 1)
    return batchResults[safeIndex]
  }, [batchResults, selectedResultIndex])

  const resultType: SimulationResult = selectedSimulation
    ? selectedSimulation.is_possible
      ? 'success'
      : 'fail'
    : 'none'

  const batchSummaryText = useMemo(() => {
    if (!batchSummary) return ''
    return `총 ${batchSummary.total}건 시뮬레이션 완료 (가능 ${batchSummary.possible}건 / 불가 ${batchSummary.impossible}건)`
  }, [batchSummary])

  const currentSlot: SlotInfo | null = useMemo(() => {
    if (!selectedSimulation?.all_slots || selectedSimulation.all_slots.length === 0) return null
    if (slotIndex >= selectedSimulation.all_slots.length) return null
    return selectedSimulation.all_slots[slotIndex]
  }, [selectedSimulation, slotIndex])

  const hasNextSlot = useMemo(() => {
    if (!selectedSimulation?.all_slots) return false
    return slotIndex < selectedSimulation.all_slots.length - 1
  }, [selectedSimulation, slotIndex])

  const parseFailMessage = (message: string) => {
    const reasonMatch = message.match(/\[불가]\s*(.+?)(?:\n|$)/)
    const guideMatch = message.match(/\[추천]\s*(.+?)(?:\n|$)/)
    return {
      reason: reasonMatch ? reasonMatch[1].trim() : message,
      guide: guideMatch ? guideMatch[1].trim() : '',
    }
  }

  const failInfo =
    selectedSimulation && !selectedSimulation.is_possible
      ? parseFailMessage(selectedSimulation.message)
      : null

  /******************** 함수 영역 ********************/
  async function fetchMachines() {
    try {
      const data = await axiosUtil.get('/simulation/machines')
      if (!data || !data.machines) return

      const options: MachineOption[] = data.machines.map((name: string) => ({
        id: name,
        label: name,
      }))

      if (mountedRef.current) {
        setMachineOptions(options)
      }
    } catch {
      // ignore
    }
  }

  const handleAddSampleSet = () => {
    sampleSeqRef.current += 1
    setSampleForms((prev) => [...prev, createInitialSampleForm(sampleSeqRef.current)])
  }

  const handleRemoveSampleSet = (formId: string) => {
    setSampleForms((prev) => {
      if (prev.length === 1) return prev
      return prev.filter((item) => item.formId !== formId)
    })

    setSampleNameErrors((prev) => {
      const next = { ...prev }
      delete next[formId]
      return next
    })
  }

  const handleSampleNameChange = (formId: string, value: string) => {
    setSampleForms((prev) =>
      prev.map((item) => (item.formId === formId ? { ...item, sampleName: value } : item))
    )

    setSampleNameErrors((prev) => {
      if (!prev[formId]) return prev
      const next = { ...prev }
      delete next[formId]
      return next
    })
  }

  const handleToggleMachine = (formId: string, machineId: string) => {
    setSampleForms((prev) =>
      prev.map((item) => {
        if (item.formId !== formId) return item

        return {
          ...item,
          machineIds: item.machineIds.includes(machineId)
            ? item.machineIds.filter((id) => id !== machineId)
            : [...item.machineIds, machineId],
        }
      })
    )
  }

  const handleEstimatedMinutesChange = (formId: string, event: ChangeEvent<HTMLInputElement>) => {
    const onlyNumber = event.target.value.replace(/\D/g, '')
    setSampleForms((prev) =>
      prev.map((item) =>
        item.formId === formId ? { ...item, estimatedMinutes: onlyNumber } : item
      )
    )
  }

  const handleShippingDateChange = (formId: string, nextDate: Dayjs | null) => {
    setSampleForms((prev) =>
      prev.map((item) => (item.formId === formId ? { ...item, shippingDate: nextDate } : item))
    )
  }

  const handleStartSimulation = async () => {
    if (!canStartSimulation) return

    const nextNameErrors: Record<string, boolean> = {}
    sampleForms.forEach((item) => {
      if (!item.sampleName.trim()) {
        nextNameErrors[item.formId] = true
      }
    })
    setSampleNameErrors(nextNameErrors)

    if (Object.keys(nextNameErrors).length > 0) {
      setErrorMessage('샘플 이름(*)은 필수 입력입니다. 모든 샘플 이름을 입력해 주세요.')
      setIsErrorModalOpen(true)
      return
    }

    const invalidIndex = sampleForms.findIndex((item) => {
      const minuteValue = Number(item.estimatedMinutes || '0')
      const isMinuteValid = Number.isFinite(minuteValue) && minuteValue > 0
      return item.machineIds.length === 0 || !isMinuteValid || !item.shippingDate
    })

    if (invalidIndex >= 0) {
      setErrorMessage(
        `${invalidIndex + 1}번 샘플 셋트의 호기 정보/예상 소요 시간/출하 일자를 모두 입력해 주세요.`
      )
      setIsErrorModalOpen(true)
      return
    }

    setBatchId('')
    setBatchResults([])
    setBatchSummary(null)
    setSelectedResultIndex(0)
    setSlotIndex(0)
    setRedirectPlanId(null)
    setIsLoadingModalOpen(true)

    try {
      const payload: BatchSimulationRunRequest = {
        samples: sampleForms.map((sample) => ({
          sample_name: sample.sampleName.trim(),
          machine_ids: sample.machineIds,
          est_duration_min: Number(sample.estimatedMinutes),
          shipment_date: sample.shippingDate!.format('YYYY-MM-DD'),
        })),
      }

      const data: BatchSimulationRunResponse = await axiosUtil.post('/simulation/run', payload)

      if (!mountedRef.current) return
      setIsLoadingModalOpen(false)

      if (!data || !Array.isArray(data.results)) {
        setErrorMessage('시뮬레이션 응답을 받지 못했습니다.')
        setIsErrorModalOpen(true)
        return
      }

      setBatchId(data.batch_id || '')
      setBatchResults(data.results)
      setBatchSummary(data.summary ?? null)
      setSelectedResultIndex(0)
      setSlotIndex(0)

      if (data.results.length === 0) {
        setErrorMessage('시뮬레이션 결과가 없습니다.')
        setIsErrorModalOpen(true)
      }
    } catch {
      if (!mountedRef.current) return
      setIsLoadingModalOpen(false)
      setErrorMessage('시뮬레이션 실행 중 오류가 발생했습니다.')
      setIsErrorModalOpen(true)
    }
  }

  const handleSelectResult = (index: number) => {
    setSelectedResultIndex(index)
    setSlotIndex(0)
  }

  const handleNextSlot = () => {
    if (hasNextSlot) {
      setSlotIndex((prev) => prev + 1)
    } else {
      setErrorMessage('더 이상 가용 가능한 슬롯이 없습니다.')
      setIsErrorModalOpen(true)
    }
  }

  const handleOpenRequestModal = () => setIsRequestModalOpen(true)
  const handleCloseRequestModal = () => setIsRequestModalOpen(false)

  const handleConfirmRequestModal = async () => {
    setIsRequestModalOpen(false)
    if (!selectedSimulation) return

    try {
      const applyPayload: Record<string, unknown> = {
        batch_id: batchId || null,
        sample_name: selectedSimulation.sample_name,
        selected_machine: currentSlot?.machine ?? selectedSimulation.target_machine ?? null,
        selected_period: currentSlot?.period ?? selectedSimulation.available_period ?? null,
      }

      if (selectedSimulation.simulation_result_id) {
        applyPayload.simulation_result_id = selectedSimulation.simulation_result_id
      }

      const result = await axiosUtil.post('/simulation/apply', applyPayload)

      if (result?.success) {
        setErrorMessage('생산계획 반영 요청이 완료되었습니다.')
        setRedirectPlanId(result.plan_id)
      } else {
        setErrorMessage(result?.message || '반영 요청 처리 중 문제가 발생했습니다.')
      }
      setIsErrorModalOpen(true)
    } catch {
      setErrorMessage('생산계획 반영 요청 중 오류가 발생했습니다.')
      setIsErrorModalOpen(true)
    }
  }

  /******************** 실행 영역 ********************/
  useEffect(() => {
    mountedRef.current = true
    fetchMachines()

    return () => {
      mountedRef.current = false
    }
  }, [])

  return (
    <div className={mmc.simulation_root}>
      <section className={mmc.simulation_pageHead}>
        <h1>개발 샘플 시뮬레이션</h1>
        <p>생산계획을 기반으로 개발 샘플 시뮬레이션 결과를 확인 및 반영할 수 있습니다.</p>
      </section>

      <section className={mmc.simulation_formCard}>
        <header className={mmc.simulation_cardHead}>
          <div className={mmc.simulation_cardTitleWrap}>
            <h3>시뮬레이션 정보 입력</h3>
            <p>원하시는 조건을 샘플별 셋트로 입력해 주세요.</p>
          </div>
        </header>

        <div className={mmc.simulation_inputRows}>
          {sampleForms.map((sample, index) => {
            const hasNameError = Boolean(sampleNameErrors[sample.formId])

            return (
              <div key={sample.formId} className={mmc.simulation_sampleSet}>
                <div className={mmc.simulation_sampleSetHead}>
                  <strong className={mmc.simulation_sampleSetTitle}>샘플 셋트 {index + 1}</strong>
                  <button
                    type="button"
                    className={mmc.simulation_deleteBtn}
                    onClick={() => handleRemoveSampleSet(sample.formId)}
                    disabled={sampleForms.length === 1}
                  >
                    셋트 삭제
                  </button>
                </div>

                <div className={mmc.simulation_row}>
                  <div className={mmc.simulation_rowLabel}>
                    샘플 이름<span className={mmc.simulation_requiredMark}>*</span>
                  </div>
                  <div className={mmc.simulation_rowContent}>
                    <input
                      className={`${mmc.simulation_nameInput} ${
                        hasNameError ? mmc.simulation_nameInputError : ''
                      }`}
                      value={sample.sampleName}
                      onChange={(e) => handleSampleNameChange(sample.formId, e.target.value)}
                      placeholder="샘플 이름 입력"
                      aria-label={`샘플 ${index + 1} 이름`}
                    />
                    {hasNameError && (
                      <span className={mmc.simulation_requiredError}>
                        샘플 이름은 필수 입력입니다.
                      </span>
                    )}
                  </div>
                </div>

                <div className={mmc.simulation_row}>
                  <div className={mmc.simulation_rowLabel}>호기 정보 선택</div>
                  <div className={mmc.simulation_rowContent}>
                    <div className={mmc.simulation_chipGroup}>
                      {machineOptions.length === 0 && (
                        <span style={{ color: '#999', fontSize: '14px' }}>
                          생산계획 정보가 없어 설비 목록을 불러올 수 없습니다.
                        </span>
                      )}
                      {machineOptions.map((option) => (
                        <CommonChip
                          key={`${sample.formId}-${option.id}`}
                          label={option.label}
                          selected={sample.machineIds.includes(option.id)}
                          onClick={() => handleToggleMachine(sample.formId, option.id)}
                          className={mmc.simulation_chip}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className={mmc.simulation_row}>
                  <div className={mmc.simulation_rowLabel}>예상 소요 시간(분)</div>
                  <div className={mmc.simulation_rowContent}>
                    <input
                      className={mmc.simulation_inlineInput}
                      value={sample.estimatedMinutes}
                      onChange={(e) => handleEstimatedMinutesChange(sample.formId, e)}
                      inputMode="numeric"
                      placeholder="예상 소요 시간 입력"
                      aria-label={`샘플 ${index + 1} 예상 소요 시간(분)`}
                    />
                    <span className={mmc.simulation_help}>*모델 교체 시간을 포함해 입력해 주세요.</span>
                  </div>
                </div>

                <div className={mmc.simulation_row}>
                  <div className={mmc.simulation_rowLabel}>출하 일자</div>
                  <div className={mmc.simulation_rowContent}>
                    <CommonDatePicker
                      className={mmc.simulation_datePicker}
                      value={sample.shippingDate}
                      onChange={(date) => handleShippingDateChange(sample.formId, date)}
                      width={180}
                      tone="simulation"
                    />
                    <span className={mmc.simulation_help}>*샘플 개발 마감 일자를 선택해 주세요.</span>
                  </div>
                </div>
              </div>
            )
          })}

          <div className={mmc.member_simulation_row}>
            <button
              type="button"
              className={mmc.member_simulation_addBtn}
              onClick={handleAddSampleSet}
            >
              + 샘플 셋트 추가
            </button>
          </div>
        </div>

        <div className={mmc.simulation_startWrap}>
          <button
            type="button"
            className={mmc.simulation_startBtn}
            onClick={handleStartSimulation}
            disabled={!canStartSimulation}
          >
            시뮬레이션 시작
          </button>
        </div>
      </section>

      {resultType !== 'none' && selectedSimulation && (
        <section className={mmc.simulation_resultCard}>
          <header className={mmc.simulation_resultHead}>
            <div className={mmc.simulation_cardTitleWrap}>
              <h3 className={resultType === 'fail' ? mmc.simulation_titleFail : undefined}>
                시뮬레이션 결과
              </h3>
              <p>
                선택된 샘플 결과를 확인하세요.
                {resultType === 'success' && selectedSimulation.all_slots.length > 1 && (
                  <span style={{ marginLeft: 8, color: '#888', fontSize: '13px' }}>
                    ({slotIndex + 1} / {selectedSimulation.all_slots.length})
                  </span>
                )}
              </p>
            </div>
          </header>

          {batchSummaryText && <p className={mmc.simulation_batchSummary}>{batchSummaryText}</p>}

          {batchResults.length > 1 && (
            <div className={mmc.simulation_resultSampleTabs}>
              {batchResults.map((item, index) => (
                <button
                  key={`${item.sample_name}-${index}`}
                  type="button"
                  className={`${mmc.simulation_resultSampleTab} ${
                    index === selectedResultIndex ? mmc.simulation_resultSampleTabActive : ''
                  }`}
                  onClick={() => handleSelectResult(index)}
                >
                  {index + 1}. {item.sample_name}
                </button>
              ))}
            </div>
          )}

          <div className={mmc.simulation_resultBox}>
            <p className={mmc.simulation_resultLead}>
              <strong>[{selectedSimulation.sample_name}]</strong>{' '}
              {resultType === 'success' ? (
                <>
                  시뮬레이션 결과, 생산계획 반영이{' '}
                  <strong className={mmc.simulation_resultPossible}>가능</strong>합니다.
                </>
              ) : (
                <>
                  시뮬레이션 결과, 생산계획 반영이{' '}
                  <strong className={mmc.simulation_resultImpossible}>불가</strong>합니다.
                </>
              )}
            </p>

            <div className={mmc.simulation_resultRows}>
              {resultType === 'success' && currentSlot ? (
                <>
                  <div className={mmc.simulation_resultRow}>
                    <div className={mmc.simulation_resultKey}>호기 정보</div>
                    <div className={mmc.simulation_resultValue}>
                      <div className={mmc.simulation_resultChipGroup}>
                        <CommonChip
                          key="result-machine"
                          label={currentSlot.machine}
                          selected
                          showCheck={false}
                          className={mmc.simulation_resultChip}
                        />
                      </div>
                    </div>
                  </div>

                  <div className={mmc.simulation_resultRow}>
                    <div className={mmc.simulation_resultKey}>가용 시간</div>
                    <div className={mmc.simulation_resultValue}>{currentSlot.period}</div>
                  </div>

                  <div className={mmc.simulation_resultRow}>
                    <div className={mmc.simulation_resultKey}>메시지</div>
                    <div className={mmc.simulation_resultValue}>
                      생산계획 반영을 원하시면 아래 &quot;생산계획 반영 요청&quot; 버튼을 눌러주세요.
                    </div>
                  </div>
                </>
              ) : resultType === 'fail' ? (
                <>
                  <div className={mmc.simulation_resultRow}>
                    <div className={`${mmc.simulation_resultKey} ${mmc.simulation_resultKeyDanger}`}>
                      불가 사유
                    </div>
                    <div className={mmc.simulation_resultValue}>
                      {failInfo?.reason || selectedSimulation.message}
                    </div>
                  </div>

                  {failInfo?.guide && (
                    <div className={mmc.simulation_resultRow}>
                      <div className={`${mmc.simulation_resultKey} ${mmc.simulation_resultKeyGuide}`}>
                        추천 가이드
                      </div>
                      <div className={mmc.simulation_resultValue}>{failInfo.guide}</div>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>

          {resultType === 'success' && (
            <div className={mmc.simulation_resultActions}>
              <button
                type="button"
                className={mmc.simulation_otherDateBtn}
                onClick={handleNextSlot}
                disabled={!hasNextSlot}
                style={!hasNextSlot ? { opacity: 0.5, cursor: 'not-allowed' } : undefined}
              >
                다른 날짜 찾아보기
              </button>
              <button
                type="button"
                className={mmc.simulation_requestBtn}
                onClick={handleOpenRequestModal}
              >
                생산계획 반영 요청
              </button>
            </div>
          )}
        </section>
      )}

      <LoadingModal
        open={isLoadingModalOpen}
        message="시뮬레이션을 진행 중입니다. 잠시만 기다려주세요."
      />

      <CommonModal
        open={isRequestModalOpen}
        title="생산계획 반영 요청"
        detail="선택한 시뮬레이션 결과를 생산계획에 반영 요청하시겠습니까?"
        confirmText="확인"
        cancelText="닫기"
        onConfirm={handleConfirmRequestModal}
        onCancel={handleCloseRequestModal}
      />

      <CommonModal
        open={isErrorModalOpen}
        title="알림"
        detail={errorMessage}
        confirmText="확인"
        onConfirm={() => {
          setIsErrorModalOpen(false)

          if (redirectPlanId) {
            const nextPlanId = redirectPlanId
            setRedirectPlanId(null)
            router.push(`/history/${nextPlanId}`)
          }
        }}
      />
    </div>
  )
}
