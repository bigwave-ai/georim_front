import styled from 'styled-components'

export const ScdWrap = styled.div`
  position: relative;
  width: 200px;
  height: 200px;
  display: grid;
  place-items: center;
  overflow: hidden;
  isolation: isolate;
  background: transparent;
`

export const ScdSvg = styled.svg`
  width: 200px;
  height: 200px;
  max-width: 100%;
  max-height: 100%;
  display: block;
  transform: rotate(-90deg);
  background: transparent;
`

export const ScdTrack = styled.circle`
  fill: none;
  stroke: #b8c2d0;
  stroke-width: 18;
`

export const ScdProgress = styled.circle`
  fill: none;
  stroke-width: 18;
  stroke-linecap: round;
`

export const ScdCenter = styled.div`
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  text-align: center;
  align-content: center;
  gap: 2px;
  pointer-events: none;
  background: transparent;

  span {
    color: #556e87;
    font-size: 13px;
    font-weight: 700;
  }

  strong {
    color: #0f2540;
    font-size: 28px;
    font-weight: 900;
    line-height: 1;
  }

  small {
    color: #556e87;
    font-size: 14px;
    font-weight: 700;
  }
`
