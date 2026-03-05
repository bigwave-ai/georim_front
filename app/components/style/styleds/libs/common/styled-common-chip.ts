'use client'

import styled, { css } from 'styled-components'

type ChipButtonProps = {
  $selected?: boolean
}

export const ChipButtonStyled = styled.button<ChipButtonProps>`
  height: 34px;
  min-width: 104px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid #2f8fc0;
  background: #fff;
  color: #2a7098;
  font-family: Pretendard, system-ui, -apple-system, 'Segoe UI', sans-serif;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: -0.5px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  transition: filter 0.16s ease, transform 0.08s ease, box-shadow 0.16s ease;

  ${({ $selected }) =>
    $selected &&
    css`
      border-color: none;
      color: #fff;
      background: linear-gradient(180deg, #248fbe 0%, #0f3f64 100%);
      box-shadow: 0 4px 10px rgba(18, 81, 120, 0.25);
    `}

  &:hover {
    filter: brightness(0.98);
  }

  &:active {
    transform: translateY(1px);
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    transform: none;
  }
`

export const ChipCheckStyled = styled.span`
  font-size: 12px;
  font-weight: 800;
  line-height: 1;
`

export const ChipLabelStyled = styled.span`
  display: inline-block;
  line-height: 1;
  white-space: nowrap;
`
