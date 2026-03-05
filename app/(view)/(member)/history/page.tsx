'use client'

import { useMemo, useState, useEffect, useCallback, type FormEvent } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import mmc from '@/app/components/style/resources/css/member.module.css'
import CommonDatePicker from '@/app/components/libs/muis/mui-date-picker'
import { useRouter } from 'next/navigation'
import axiosUtil from '@/app/services/util/axiosUtils'

/*
 * 01. 구분      : Page 컴포넌트
 * 02. 타입      : Client Component
 * 03. 업무구분  : 멤버권한 - 생산 계획 생성 이력 조회
 * 04. 설명      : 조건별 생산 계획 생성 이력 조회 페이지
 * 05. 작성일자  : 2026.02.20
 * 06. 작성자    : 이우창
 */

type HistoryStatus = '승인' | '대기' | '반려'
type HistoryDivision = '생산' | '개발'

type HistoryRow = {
  id: number
  division: HistoryDivision
  approvalStatus: HistoryStatus
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
const STATUS_OPTIONS: Array<FilterState['status']> = ['전체', '승인', '대기', '반려']

function mapBackendStatus(status: string | null | undefined): HistoryStatus {
  switch (status) {
    case 'APPROVED':
      return '승인'
    case 'PENDING':
      return '대기'
    case 'REJECTED':
      return '반려'
    default:
      return '대기'
  }
}

function mapType(type: string | null | undefined): HistoryDivision {
  return type === 'DEVELOPMENT' ? '개발' : '생산'
}

export default function HistoryPage() {
  /******************** 변수영역 ********************/
  const router = useRouter()

  const PAGE_SIZE = 10
  const PAGE_BUTTON_WINDOW = 10

  const [filter, setFilter] = useState<FilterState>({
    division: '전체',
    status: '전체',
    creator: '',
    startDate: null,
    endDate: null,
  })

  const [appliedFilter, setAppliedFilter] = useState<FilterState>({
    division: '전체',
    status: '전체',
    creator: '',
    startDate: null,
    endDate: null,
  })

  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<HistoryRow[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null)

  const safePage = Math.min(Math.max(1, page), totalPages)
  const startIndex = (safePage - 1) * PAGE_SIZE

  const pageStart = Math.floor((safePage - 1) / PAGE_BUTTON_WINDOW) * PAGE_BUTTON_WINDOW + 1
  const pageEnd = Math.min(totalPages, pageStart + PAGE_BUTTON_WINDOW - 1)

  const pageNumbers = useMemo(
    () => Array.from({ length: pageEnd - pageStart + 1 }, (_, i) => pageStart + i),
    [pageStart, pageEnd]
  )

  const fetchHistory = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params: Record<string, string | number | undefined> = {
        page,
        size: PAGE_SIZE,
      }
      if (appliedFilter.division !== '전체') {
        params.type = appliedFilter.division === '생산' ? 'PRODUCTION' : 'DEVELOPMENT'
      }
      if (appliedFilter.status !== '전체') {
        params.approval_status =
          appliedFilter.status === '승인'
            ? 'APPROVED'
            : appliedFilter.status === '대기'
              ? 'PENDING'
              : 'REJECTED'
      }
      if (appliedFilter.startDate) {
        params.start_date = appliedFilter.startDate.format('YYYY-MM-DD')
      }
      if (appliedFilter.endDate) {
        params.end_date = appliedFilter.endDate.format('YYYY-MM-DD')
      }
      if (appliedFilter.creator.trim()) {
        params.creator = appliedFilter.creator.trim()
      }

      const res = await axiosUtil.get('/production-plans/history', params)
      if (!res) {
        setError('데이터를 불러오는데 실패했습니다.')
        setRows([])
        setTotalCount(0)
        setTotalPages(1)
        return
      }

      const items = res.items ?? []
      const pagination = res.pagination ?? {}
      setTotalCount(pagination.total_elements ?? 0)
      setTotalPages(Math.max(1, pagination.total_pages ?? 1))

      const mapped: HistoryRow[] = items.map((item: any) => ({
        id: item.plan_id,
        division: mapType(item.type),
        approvalStatus: mapBackendStatus(item.approval_status),
        createdAt: item.created_at ? dayjs(item.created_at) : dayjs(),
        creator: item.creator_name ?? '',
        runRate: Number(item.utilization_rate) || 0,
      }))
      setRows(mapped)
    } catch {
      setError('데이터를 불러오는데 실패했습니다.')
      setRows([])
      setTotalCount(0)
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }, [appliedFilter, page])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  const pagedRows = rows

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
    if (status === '대기') return mmc.history_statusRequest
    if (status === '반려') return mmc.history_statusReject
    return mmc.history_statusApproved // 승인 / 대기
  }

  // 행 클릭 처리 (현재는 선택 강조만, 추후 상세보기 연결 가능)
  const handleRowClick = (row: HistoryRow) => {
    router.push(`/history/${row.id}`)
    }

  /******************** 수행 영역 ********************/
  useEffect(() => {
    if (page > totalPages && totalPages > 0) setPage(totalPages)
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

          <button type="submit" className={mmc.history_searchBtn} disabled={loading}>
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
              {loading ? (
                <tr>
                  <td colSpan={6} className={mmc.history_empty}>
                    데이터를 불러오고 있습니다...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className={mmc.history_empty}>
                    {error}
                  </td>
                </tr>
              ) : pagedRows.length === 0 ? (
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
                    <td className={`${mmc.history_status} ${getStatusClassName(row.approvalStatus)}`}>
                      {row.approvalStatus}
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
            disabled={safePage === 1 || loading}
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
            disabled={safePage === totalPages || loading}
            aria-label="다음 페이지"
          >
            &rsaquo;
          </button>
        </nav>
      </section>
    </div>
  )
}
