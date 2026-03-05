import styled, { css } from 'styled-components'

/*
 * 01. 구분      : Styled 컴포넌트
 * 02. 타입      : Style Module
 * 03. 업무구분  : 공통 - 차트 스타일
 * 04. 설명      : 설비별 생산 비율 가로 막대 차트 스타일 정의
 * 05. 작성일자  : 2026.02.27
 * 06. 작성자    : 이우창
 */

/******************** 변수영역 ********************/
const PRETENDARD = `Pretendard, system-ui, -apple-system, "Segoe UI", sans-serif`

/******************** 함수영역 ********************/
// styled-components 선언형 스타일 파일로 별도 함수 정의는 사용하지 않습니다.

/******************** 수행영역 ********************/
export const CldRoot = styled.div`
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  gap: 10px;
  min-height: 0;
  height: 100%;
  align-content: start;
  font-family: ${PRETENDARD};
`

export const CldList = styled.div`
  display: grid;
  gap: 9px;
  min-height: 0;
  height: 100%;
  overflow: auto;
  padding-right: 4px;

  @media (max-width: 980px) {
    height: auto;
    max-height: 360px;
  }
`

export const CldItem = styled.button<{ $active?: boolean }>`
  border: 1px solid #d7e3ef;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.88);
  padding: 9px 12px;
  display: grid;
  gap: 8px;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.14s ease;
  font-family: ${PRETENDARD};

  &:hover {
    border-color: #8fc1e8;
    box-shadow: 0 6px 14px rgba(20, 63, 110, 0.14);
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: 2px solid #2b8fd7;
    outline-offset: 2px;
  }

  ${({ $active }) =>
    $active &&
    css`
      border-color: #58a8e2;
      box-shadow: 0 0 0 2px rgba(63, 148, 214, 0.16);
      background: linear-gradient(180deg, #ffffff 0%, #f4f9ff 100%);
    `}
`

export const CldLabelRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
`

export const CldLabelGroup = styled.div`
  min-width: 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
`

export const CldDot = styled.span<{ $color: string }>`
  width: 10px;
  height: 10px;
  flex: 0 0 10px;
  border-radius: 999px;
  background: ${({ $color }) => $color};
  box-shadow: 0 0 0 4px rgba(67, 141, 197, 0.16);
`

export const CldLabel = styled.em`
  margin: 0;
  font-style: normal;
  color: #24415f;
  font-size: 14px;
  font-weight: 800;
  letter-spacing: -0.3px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`

export const CldValue = styled.strong`
  color: #15334f;
  font-size: 14px;
  font-weight: 900;
  letter-spacing: -0.2px;
  white-space: nowrap;
`

export const CldTrack = styled.div`
  width: 100%;
  height: 14px;
  border-radius: 999px;
  background: #e7edf4;
  overflow: hidden;
`

export const CldFill = styled.span<{ $color: string; $active?: boolean; $width: number }>`
  display: block;
  height: 100%;
  width: ${({ $width }) => `${$width}%`};
  border-radius: inherit;
  background: ${({ $color }) => `linear-gradient(90deg, ${$color} 0%, ${$color} 100%)`};
  box-shadow: inset 0 -1px 0 rgba(255, 255, 255, 0.24);
  transition: width 0.4s ease, filter 0.2s ease;
  filter: ${({ $active }) => ($active ? 'saturate(1.15)' : 'saturate(0.92)')};
`

export const CldSummary = styled.div`
  border: 1px solid #d6e3ea;
  background: linear-gradient(90deg, #e0f1f5 0%, #fbf0e4 100%);
  border-radius: 12px;
  padding: 11px 12px;
  color: #2f4358;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: -0.2px;
`
