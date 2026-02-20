'use client'

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import type { Dayjs } from 'dayjs'
import mmc from '@/app/components/style/resources/css/member.module.css'
import CommonChip from '@/app/components/libs/common/common-chip'
import CommonDatePicker from '@/app/components/libs/muis/mui-date-picker'
import LoadingModal from '@/app/components/libs/modals/modal-loading'
import CommonModal from '@/app/components/libs/modals/modal-common'

/*
 * 01. 구분      : Page 컴포넌트
 * 02. 타입      : Client Component
 * 03. 업무구분   : 멤버권한 - 개발 샘플 시뮬레이션
 * 04. 설명      : 조건 입력 -> 로딩 -> 성공/실패 결과 표시
 * 05. 작성일자   : 2026.02.20
 * 06. 작성자     : Codex
 */

type SimulationResult = 'none' | 'success' | 'fail'

type MachineOption = {
  id: string
  label: string
}

const MACHINE_OPTIONS: MachineOption[] = [
  { id: 'm1', label: '고속톰슨 1호기' },
  { id: 'm3', label: '고속톰슨 3호기' },
  { id: 'm4', label: '고속톰슨 4호기' },
  { id: 'm5', label: '고속톰슨 5호기' },
  { id: 'm71', label: '고속톰슨 7-1호기' },
  { id: 'm72a', label: '고속톰슨 7-2호기' },
  { id: 'm72b', label: '고속톰슨 7-2호기' },
  { id: 'm8', label: '고속톰슨 8호기' },
  { id: 'm9', label: '고속톰슨 9호기' },
  { id: 'm10', label: '고속톰슨 10호기' },
  { id: 'm12', label: '고속톰슨 12호기' },
  { id: 'm13', label: '고속톰슨 13호기' },
  { id: 'm14', label: '고속톰슨 14호기' },
]

const DEFAULT_SELECTED_MACHINES: string[] = []

export default function SimulationPage() {
  /******************** 변수영역 ********************/
  const [selectedMachineIds, setSelectedMachineIds] = useState<string[]>(DEFAULT_SELECTED_MACHINES)
  const [estimatedMinutes, setEstimatedMinutes] = useState('')
  const [shippingDate, setShippingDate] = useState<Dayjs | null>(null)

  const [resultType, setResultType] = useState<SimulationResult>('none')
  const [nextSuccessResult, setNextSuccessResult] = useState(true)

  const [isLoadingModalOpen, setIsLoadingModalOpen] = useState(false)
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)

  const loadingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const selectedMachines = useMemo(
    () => MACHINE_OPTIONS.filter((option) => selectedMachineIds.includes(option.id)),
    [selectedMachineIds]
  )

  const selectedMachineText = selectedMachines.map((item) => item.label).join(', ')
  const shippingDateText = shippingDate ? shippingDate.format('YYYY-MM-DD') : '-'
  const estimatedMinuteValue = Number(estimatedMinutes || '0')
  const isEstimatedValid = Number.isFinite(estimatedMinuteValue) && estimatedMinuteValue > 0

  const canStartSimulation =
    selectedMachineIds.length > 0 &&
    isEstimatedValid &&
    Boolean(shippingDate) &&
    !isLoadingModalOpen

  /******************** 함수영역 ********************/
  const clearLoadingTimer = () => {
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current)
      loadingTimerRef.current = null
    }
  }

  const handleToggleMachine = (machineId: string) => {
    setSelectedMachineIds((prev) =>
      prev.includes(machineId) ? prev.filter((id) => id !== machineId) : [...prev, machineId]
    )
  }

  const handleEstimatedMinutesChange = (event: ChangeEvent<HTMLInputElement>) => {
    const onlyNumber = event.target.value.replace(/\D/g, '')
    setEstimatedMinutes(onlyNumber)
  }

  const handleStartSimulation = () => {
    if (!canStartSimulation) return

    setResultType('none')
    setIsLoadingModalOpen(true)

    clearLoadingTimer()
    loadingTimerRef.current = setTimeout(() => {
      setIsLoadingModalOpen(false)
      setResultType(nextSuccessResult ? 'success' : 'fail')
      setNextSuccessResult((prev) => !prev)
    }, 1600)
  }

  const handleOpenRequestModal = () => {
    setIsRequestModalOpen(true)
  }

  const handleCloseRequestModal = () => {
    setIsRequestModalOpen(false)
  }

  const handleConfirmRequestModal = () => {
    setIsRequestModalOpen(false)
  }

  /******************** 수행영역 ********************/
  useEffect(() => {
    return () => {
      clearLoadingTimer()
    }
  }, [])

  return (
    <div className={mmc.simulation_root}>
      <section className={mmc.simulation_pageHead}>
        <h1>개발 샘플 시뮬레이션</h1>
        <p>생산계획에 대하여 시뮬레이션하여 결과를 확인 및 반영할 수 있습니다.</p>
      </section>

      <section className={mmc.simulation_formCard}>
        <header className={mmc.simulation_cardHead}>
          <div className={mmc.simulation_cardTitleWrap}>
            <h3>시뮬레이션 정보 입력</h3>
            <p>원하시는 조건에 맞게 선택 및 입력해주세요.</p>
          </div>
        </header>

        <div className={mmc.simulation_inputRows}>
          <div className={mmc.simulation_row}>
            <div className={mmc.simulation_rowLabel}>호기 정보 선택</div>
            <div className={mmc.simulation_rowContent}>
              <div className={mmc.simulation_chipGroup}>
                {MACHINE_OPTIONS.map((option) => (
                  <CommonChip
                    key={option.id}
                    label={option.label}
                    selected={selectedMachineIds.includes(option.id)}
                    onClick={() => handleToggleMachine(option.id)}
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
                value={estimatedMinutes}
                onChange={handleEstimatedMinutesChange}
                inputMode="numeric"
                placeholder="분 단위 입력"
                aria-label="예상 소요 시간(분)"
              />
              <span className={mmc.simulation_help}>*모델 교체 시간을 포함하여 입력해주세요.</span>
            </div>
          </div>

          <div className={mmc.simulation_row}>
            <div className={mmc.simulation_rowLabel}>출하 일자</div>
            <div className={mmc.simulation_rowContent}>
              <CommonDatePicker
                className={mmc.simulation_datePicker}
                value={shippingDate}
                onChange={setShippingDate}
                width={180}
                tone="simulation"
              />
              <span className={mmc.simulation_help}>*샘플 개발 마감 일자를 선택해주세요.</span>
            </div>
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

      {resultType !== 'none' && (
        <section className={mmc.simulation_resultCard}>
          <header className={mmc.simulation_resultHead}>
            <div className={mmc.simulation_cardTitleWrap}>
              <h3 className={resultType === 'fail' ? mmc.simulation_titleFail : undefined}>
                시뮬레이션 결과
              </h3>
              <p>시뮬레이션 결과가 아래와 같이 나타났습니다.</p>
            </div>
          </header>

          <div className={mmc.simulation_resultBox}>
            <p className={mmc.simulation_resultLead}>
              {resultType === 'success' ? (
                <>
                  요청하신 개발 샘플 시뮬레이션 결과, 생산계획 반영이 아래와 같이{' '}
                  <strong className={mmc.simulation_resultPossible}>가능</strong>합니다.
                </>
              ) : (
                <>
                  요청하신 개발 샘플 시뮬레이션 결과 생산계획 반영이{' '}
                  <strong className={mmc.simulation_resultImpossible}>불가능</strong>합니다.
                  생산팀에 문의해주세요.
                </>
              )}
            </p>

            <div className={mmc.simulation_resultRows}>
              {resultType === 'success' ? (
                <>
                  <div className={mmc.simulation_resultRow}>
                    <div className={mmc.simulation_resultKey}>호기 정보</div>
                    <div className={mmc.simulation_resultValue}>
                      <div className={mmc.simulation_resultChipGroup}>
                        {selectedMachines.map((machine) => (
                          <CommonChip
                            key={`result-${machine.id}`}
                            label={machine.label}
                            selected
                            showCheck={false}
                            className={mmc.simulation_resultChip}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className={mmc.simulation_resultRow}>
                    <div className={mmc.simulation_resultKey}>개발 가능 시간</div>
                    <div className={mmc.simulation_resultValue}>{shippingDateText} 09:00~18:00</div>
                  </div>

                  <div className={mmc.simulation_resultRow}>
                    <div className={mmc.simulation_resultKey}>메시지</div>
                    <div className={mmc.simulation_resultValue}>
                      생산계획에 해당 시뮬레이션 결과를 반영하고 싶으시다면 아래 &quot;생산계획 반영
                      요청&quot; 버튼을 눌러주세요.
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className={mmc.simulation_resultRow}>
                    <div className={`${mmc.simulation_resultKey} ${mmc.simulation_resultKeyDanger}`}>
                      불가능 사유
                    </div>
                    <div className={mmc.simulation_resultValue}>
                      {shippingDateText} 18:00 까지 필요한 공정 시간(
                      {estimatedMinuteValue.toLocaleString('ko-KR')}분) 대비 선택하신{' '}
                      <span className={mmc.simulation_dangerText}>{selectedMachineText || '-'}</span>의
                      잔여 가용 시간이 부족하여 변경 시 기존 확정 오더의 세팅 및 공정 순서가 재조정되어
                      납기 지연 위험이 발생합니다.
                    </div>
                  </div>

                  <div className={mmc.simulation_resultRow}>
                    <div className={`${mmc.simulation_resultKey} ${mmc.simulation_resultKeyGuide}`}>
                      추천 방향 가이드
                    </div>
                    <div className={mmc.simulation_resultValue}>
                      영향 최소화를 위해 가용률이 높은{' '}
                      <span className={mmc.simulation_linkText}>고속물손 4호기</span> 또는 세팅 전환이 적은
                      라인에 우선 배치하는 것을 권장합니다.
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {resultType === 'success' && (
            <div className={mmc.simulation_resultActions}>
              <button
                type="button"
                className={mmc.simulation_otherDateBtn}
                onClick={handleStartSimulation}
              >
                다른 날짜 알아보기
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
        message="시뮬레이션을 진행중입니다. 조금만 기다려주세요."
      />

      <CommonModal
        open={isRequestModalOpen}
        title="생산계획 반영 요청"
        detail="시뮬레이션 결과를 생산계획에 반영 요청하시겠습니까?"
        confirmText="확인"
        cancelText="닫기"
        onConfirm={handleConfirmRequestModal}
        onCancel={handleCloseRequestModal}
      />
    </div>
  )
}
