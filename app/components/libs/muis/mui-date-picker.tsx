'use client'

import React from 'react'
import type { Dayjs } from 'dayjs'
import 'dayjs/locale/ko'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import type { SxProps, Theme } from '@mui/material/styles'
import { getDatePickerSx } from '../../style/styleds/libs/muis/styled-mui-date-picker'


/*
 * 01. 구분     : Library
 * 02. 타입     : Client Component
 * 03. 업무구분 : 모든권한 - date picker 컴포넌트
 * 04. 설명     : date picker 컴포넌트 제공
 * 05. 작성일자 : 2025.08.26
 * 06. 작성자   : 이우창
 */

type DatePickerTone = 'default' | 'plan' | 'simulation'

interface Props {
  value: Dayjs | null
  onChange: (v: Dayjs | null) => void
  width?: number | string
  sx?: SxProps<Theme>
  className?: string
  format?: string
  tone?: DatePickerTone
  minDate?: Dayjs
  maxDate?: Dayjs
  disableFuture?: boolean
  disablePast?: boolean
}

export default function CommonDatePicker({
  value,
  onChange,
  width = 150,
  sx,
  className,
  format = 'YYYY-MM-DD',
  tone = 'plan',
  minDate,
  maxDate,
  disableFuture = false,
  disablePast = false,
}: Props) {
  const mergedSx = Array.isArray(sx)
    ? [getDatePickerSx(width, tone), ...sx]
    : [getDatePickerSx(width, tone), sx]

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ko">
      <DatePicker
        className={className}
        value={value}
        onChange={onChange}
        format={format}
        minDate={minDate}
        maxDate={maxDate}
        disableFuture={disableFuture}
        disablePast={disablePast}
        slotProps={{
          textField: {
            size: 'small',
            sx: mergedSx,
            placeholder: 'YYYY-MM-DD',
          },
        }}
      />
    </LocalizationProvider>
  )
}