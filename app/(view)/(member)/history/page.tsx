'use client'

import { useMemo, useState, useEffect, type FormEvent } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import mmc from '@/app/components/style/resources/css/member.module.css'
import CommonDatePicker from '@/app/components/libs/muis/mui-date-picker'
import { useRouter } from 'next/navigation'

/*
 * 01. 구분      : Page 컴포넌트
 * 02. 타입      : Client Component
 * 03. 업무구분  : 멤버권한 - 생산 계획 생성 이력 조회
 * 04. 설명      : 조건별 생산 계획 생성 이력 조회 페이지
 * 05. 작성일자  : 2026.02.20
 * 06. 작성자    : 이우창
 */

type HistoryStatus = '승인' | '등록' | '승인요청' | '반려'
type HistoryDivision = '생산' | '개발'

type HistoryRow = {
  id: number
  division: HistoryDivision
  status: HistoryStatus
  createdAt: Dayjs
  creator: string
  runRate: number
}

type FilterState = {
  division: '전체' | HistoryDivision
  status: '전체' | HistoryStatus
  creator: string
  startDate: Dayjs | null
  endDate: Dayjs | null
}

const DIVISION_OPTIONS: Array<FilterState['division']> = ['전체', '생산', '개발']
const STATUS_OPTIONS: Array<FilterState['status']> = ['전체', '승인', '등록', '승인요청', '반려']

export default function HistoryPage() {
  /******************** 변수영역 ********************/
  const router = useRouter()

  // 페이지당 표시 건수
  const PAGE_SIZE = 10
  // 하단 페이지네이션에서 한 번에 보여줄 페이지 버튼 수
  const PAGE_BUTTON_WINDOW = 10

  // 예시 데이터 (API 연동 전)
  const HISTORY_ROWS = useMemo<HistoryRow[]>(() => {
    const base = dayjs('2026-01-13 09:13:00')
    const statusPattern: HistoryStatus[] = ['승인', '승인요청', '반려', '등록', '승인요청', '반려', '승인', '승인요청', '등록', '반려']
    const creators = ['송기석', '홍길동', '배준현']

    return Array.from({ length: 119 }, (_, idx) => {
      const status = statusPattern[idx % statusPattern.length]
      const division: HistoryDivision = idx % 3 === 0 ? '생산' : '개발'
      const runRate = status === '승인' || status === '등록' ? 100 : status === '승인요청' ? 50 : 82

      return {
        id: idx + 1,
        division,
        status,
        createdAt: base.subtract(Math.floor(idx / 10), 'day').add(idx % 6, 'minute'),
        creator: creators[idx % creators.length],
        runRate,
      }
    })
  }, [])

  // 입력 중인 필터 상태 (폼 컨트롤 상태)
  const [filter, setFilter] = useState<FilterState>({
    division: '전체',
    status: '전체',
    creator: '',
    startDate: null,
    endDate: null,
  })

  // 실제 검색 적용된 필터 상태
  const [appliedFilter, setAppliedFilter] = useState<FilterState>({
    division: '전체',
    status: '전체',
    creator: '',
    startDate: null,
    endDate: null,
  })

  // 현재 페이지
  const [page, setPage] = useState(1)

  // 클릭된 행 강조용
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null)

  // 실제 필터링 결과
  const filteredRows = useMemo(() => {
    return HISTORY_ROWS.filter((row) => {
      if (appliedFilter.division !== '전체' && row.division !== appliedFilter.division) return false
      if (appliedFilter.status !== '전체' && row.status !== appliedFilter.status) return false
      if (appliedFilter.creator && !row.creator.includes(appliedFilter.creator)) return false

      if (appliedFilter.startDate) {
        if (row.createdAt.isBefore(appliedFilter.startDate.startOf('day'))) return false
      }

      if (appliedFilter.endDate) {
        if (row.createdAt.isAfter(appliedFilter.endDate.endOf('day'))) return false
      }

      return true
    })
  }, [HISTORY_ROWS, appliedFilter])

  // 총 건수는 '필터링된 결과' 기준
  const totalCount = filteredRows.length
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const startIndex = (safePage - 1) * PAGE_SIZE

  // 현재 페이지에 보여줄 행
  const pagedRows = useMemo(
    () => filteredRows.slice(startIndex, startIndex + PAGE_SIZE),
    [filteredRows, startIndex]
  )

  // 페이지 번호 계산 (예: 1~10, 11~20)
  const pageStart = Math.floor((safePage - 1) / PAGE_BUTTON_WINDOW) * PAGE_BUTTON_WINDOW + 1
  const pageEnd = Math.min(totalPages, pageStart + PAGE_BUTTON_WINDOW - 1)

  const pageNumbers = useMemo(
    () => Array.from({ length: pageEnd - pageStart + 1 }, (_, i) => pageStart + i),
    [pageStart, pageEnd]
  )

  /******************** 함수영역 ********************/
  // 시작일 변경: 시작일이 종료일보다 커지면 종료일을 시작일로 자동 보정
  const handleStartDateChange = (nextStart: Dayjs | null) => {
    setFilter((prev) => {
      let nextEnd = prev.endDate
      if (nextStart && nextEnd && nextStart.isAfter(nextEnd, 'day')) {
        nextEnd = nextStart
      }

      return {
        ...prev,
        startDate: nextStart,
        endDate: nextEnd,
      }
    })
  }

  // 종료일 변경: 종료일이 시작일보다 작아지면 시작일을 종료일로 자동 보정
  const handleEndDateChange = (nextEnd: Dayjs | null) => {
    setFilter((prev) => {
      let nextStart = prev.startDate
      if (nextStart && nextEnd && nextEnd.isBefore(nextStart, 'day')) {
        nextStart = nextEnd
      }

      return {
        ...prev,
        startDate: nextStart,
        endDate: nextEnd,
      }
    })
  }

  // 검색 버튼 클릭 + Enter 제출 공통 처리
  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    // 방어 로직: 시작일 > 종료일이면 검색 중단
    if (
      filter.startDate &&
      filter.endDate &&
      filter.startDate.isAfter(filter.endDate, 'day')
    ) {
      return
    }

    setAppliedFilter({
      ...filter,
      creator: filter.creator.trim(),
    })
    setPage(1)
  }

  const handlePrev = () => setPage((prev) => Math.max(1, prev - 1))
  const handleNext = () => setPage((prev) => Math.min(totalPages, prev + 1))

  // 상태별 색상 클래스
  const getStatusClassName = (status: HistoryStatus) => {
    if (status === '승인요청') return mmc.history_statusRequest
    if (status === '반려') return mmc.history_statusReject
    return mmc.history_statusApproved // 승인 / 등록
  }

  // 행 클릭 처리 (현재는 선택 강조만, 추후 상세보기 연결 가능)
  const handleRowClick = (row: HistoryRow) => {
    router.push(`/history/${row.id}`)
    }

  /******************** 수행 영역 ********************/
  // 필터 조건 변화로 페이지 수가 줄어든 경우 현재 페이지 보정
  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  return (
    <div className={mmc.history_root}>
      <section className={mmc.history_pageHead}>
        <h1>생산 계획 생성 이력 조회</h1>
        <p>생산 계획이 생성된 이력을 조건별로 조회할 수 있습니다.</p>
      </section>

      <section className={mmc.history_filterCard}>
        <header className={mmc.history_cardHead}>
          <div className={mmc.history_cardTitleWrap}>
            <h3>생산 계획 생성 이력 필터</h3>
            <p>원하시는 조건에 맞게 선택 및 입력해주세요.</p>
          </div>
        </header>

        <form className={mmc.history_filterForm} onSubmit={handleSearch}>
          <div className={mmc.history_filterGrid}>
            <label className={mmc.history_field}>
              <span>구분</span>
              <select
                className={mmc.history_select}
                value={filter.division}
                onChange={(e) =>
                  setFilter((prev) => ({
                    ...prev,
                    division: e.target.value as FilterState['division'],
                  }))
                }
              >
                {DIVISION_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className={mmc.history_field}>
              <span>상태</span>
              <select
                className={mmc.history_select}
                value={filter.status}
                onChange={(e) =>
                  setFilter((prev) => ({
                    ...prev,
                    status: e.target.value as FilterState['status'],
                  }))
                }
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className={mmc.history_field}>
              <span>생성자</span>
              <input
                className={mmc.history_input}
                value={filter.creator}
                onChange={(e) =>
                  setFilter((prev) => ({
                    ...prev,
                    creator: e.target.value,
                  }))
                }
                placeholder="생성자 입력"
              />
            </label>

            <label className={`${mmc.history_field} ${mmc.history_fieldDate}`}>
              <span>생성일시</span>
              <div className={mmc.history_dateRange}>
                <CommonDatePicker
                  value={filter.startDate}
                  onChange={handleStartDateChange}
                  width="100%"
                  maxDate={filter.endDate ?? undefined}
                />
                <em>~</em>
                <CommonDatePicker
                  value={filter.endDate}
                  onChange={handleEndDateChange}
                  width="100%"
                  minDate={filter.startDate ?? undefined}
                />
              </div>
            </label>
          </div>

          <button type="submit" className={mmc.history_searchBtn}>
            검색
          </button>
        </form>
      </section>

      <section className={mmc.history_resultCard}>
        <header className={mmc.history_resultHead}>
          <div className={mmc.history_cardTitleWrap}>
            <h3>생성 이력 조회 결과</h3>
            <p>조회 결과가 아래와 같이 나타납니다.</p>
          </div>

          <div className={mmc.history_total}>
            <span>총</span>
            <strong>{totalCount}건</strong>
          </div>
        </header>

        <div className={mmc.history_tableWrap}>
          <table className={mmc.history_table}>
            <thead>
              <tr>
                <th>순번</th>
                <th>구분</th>
                <th>상태</th>
                <th>생성 일시</th>
                <th>생성자</th>
                <th>설비가동률</th>
              </tr>
            </thead>

            <tbody>
              {pagedRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className={mmc.history_empty}>
                    검색 결과가 없습니다.
                  </td>
                </tr>
              ) : (
                pagedRows.map((row, idx) => (
                  <tr
                    key={row.id}
                    className={`${mmc.history_clickableRow} ${selectedRowId === row.id ? mmc.history_rowActive : ''}`}
                    onClick={() => handleRowClick(row)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleRowClick(row)
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`${row.id}번 이력 행 선택`}
                  >
                    <td>{startIndex + idx + 1}</td>
                    <td>{row.division}</td>
                    <td className={`${mmc.history_status} ${getStatusClassName(row.status)}`}>
                      {row.status}
                    </td>
                    <td>{row.createdAt.format('YYYY-MM-DD HH:mm:ss')}</td>
                    <td>{row.creator}</td>
                    <td>
                      <div className={mmc.history_rate}>
                        <div className={mmc.history_rateBar}>
                          <div
                            className={mmc.history_rateFill}
                            style={{ width: `${row.runRate}%` }}
                          />
                        </div>
                        <strong>{row.runRate}%</strong>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <nav className={mmc.history_pagination} aria-label="생성 이력 페이지네이션">
          <button
            type="button"
            className={mmc.history_pageArrow}
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
              className={`${mmc.history_pageNum} ${num === safePage ? mmc.history_pageNumActive : ''}`}
              onClick={() => setPage(num)}
              aria-current={num === safePage ? 'page' : undefined}
            >
              {num}
            </button>
          ))}

          <button
            type="button"
            className={mmc.history_pageArrow}
            onClick={handleNext}
            disabled={safePage === totalPages}
            aria-label="다음 페이지"
          >
            &rsaquo;
          </button>
        </nav>
      </section>
    </div>
  )
}
