'use client'

import React from 'react'
import {
  ChipButtonStyled,
  ChipCheckStyled,
  ChipLabelStyled,
} from '@/app/components/style/styleds/libs/common/styled-common-chip'

type CommonChipProps = {
  label: string
  selected?: boolean
  disabled?: boolean
  showCheck?: boolean
  onClick?: () => void
  className?: string
  type?: 'button' | 'submit' | 'reset'
}

export default function CommonChip({
  label,
  selected = false,
  disabled = false,
  showCheck = true,
  onClick,
  className,
  type = 'button',
}: CommonChipProps) {
  return (
    <ChipButtonStyled
      type={type}
      className={className}
      $selected={selected}
      disabled={disabled}
      onClick={onClick}
      aria-pressed={selected}
    >
      {selected && showCheck ? <ChipCheckStyled>✓</ChipCheckStyled> : null}
      <ChipLabelStyled>{label}</ChipLabelStyled>
    </ChipButtonStyled>
  )
}
