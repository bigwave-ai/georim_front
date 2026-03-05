import styled, { css } from 'styled-components'

const PRETENDARD = `Pretendard, system-ui, -apple-system, "Segoe UI", sans-serif`

export const CddSide = styled.div`
  display: grid;
  gap: 10px;
  align-content: start;
  font-family: ${PRETENDARD};
`

export const CddVisual = styled.div`
  display: grid;
  place-items: center;
  min-height: 220px;
  background: transparent;

  @media (max-width: 980px) {
    min-height: auto;
  }
`

export const CddDonut = styled.div`
  position: relative;
  width: 220px;
  height: 220px;
  display: grid;
  place-items: center;
  background: transparent;
  overflow: hidden;
  isolation: isolate;

  @media (max-width: 980px) {
    width: 196px;
    height: 196px;
  }

  @media (max-width: 640px) {
    width: 170px;
    height: 170px;
  }
`

export const CddSvg = styled.svg`
  width: 210px;
  height: 210px;
  max-width: 100%;
  max-height: 100%;
  display: block;
  transform: rotate(-90deg);
  background: transparent;
  filter: none;

  @media (max-width: 980px) {
    width: 188px;
    height: 188px;
  }

  @media (max-width: 640px) {
    width: 162px;
    height: 162px;
  }
`

export const CddTrack = styled.circle`
  fill: none;
  stroke: rgba(15, 35, 60, 0.1);
  stroke-width: 16;
`

export const CddSeg = styled.circle<{ $active?: boolean }>`
  fill: none;
  stroke-width: 16;
  stroke-linecap: round;
  opacity: 0.72;
  transition: opacity 0.18s ease, stroke-width 0.18s ease;
  cursor: pointer;

  ${({ $active }) =>
    $active &&
    css`
      opacity: 1;
      stroke-width: 18;
    `}
`

export const CddCenter = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 6px;
  text-align: center;
  pointer-events: none;
  background: transparent;
  font-family: ${PRETENDARD};

  span {
    font-family: ${PRETENDARD};
    font-size: 12px;
    font-weight: 700;
    color: #5c6f87;
  }

  strong {
    font-family: ${PRETENDARD};
    font-size: 28px;
    font-weight: 900;
    letter-spacing: -0.4px;
    color: #0d1b2a;
  }

  small {
    font-family: ${PRETENDARD};
    font-size: 11px;
    color: #5c6f87;
  }

  @media (max-width: 640px) {
    gap: 4px;

    span {
      font-size: 11px;
    }

    strong {
      font-size: 24px;
      letter-spacing: -0.2px;
    }

    small {
      font-size: 10px;
    }
  }
`
