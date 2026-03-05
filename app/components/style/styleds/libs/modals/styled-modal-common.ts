'use client'

import styled from 'styled-components'

/*
 * 01. 구분     : Style Component
 * 02. 타입     : -
 * 03. 업무구분  : 모든권한 - 스타일 - 일반 메시지 모달
 * 03. 설명     : 모달 스타일 제공
 * 04. 작성일자  : 2025.10.14
 * 05. 작성자   : 이우창
 */


/* 배경 오버레이 */
export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 30000;
  background: rgba(12, 26, 43, 0.42);
  backdrop-filter: blur(1px);
`

/* 모달 박스 */
export const ModalWrap = styled.div`
  position: fixed;
  z-index: 30001;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: min(620px, calc(90vw - 40px));
  border-radius: 14px;
  border: 1px solid #d7e1ea;
  padding: 34px 40px 28px;
  text-align: center;
  background: linear-gradient(180deg, #ffffff 0%, #ffffff 78%, #e9f6f1 100%);
  box-shadow: 0 24px 60px rgba(13, 30, 53, 0.24);

  @media (max-width: 768px) {
    padding: 24px 18px 20px;
    width: min(820px, calc(100vw - 20px));
  }
`

/* 로고 영역 */
export const LogoWrap = styled.div`
  position: relative;
  width: 220px;
  height: 68px;
  margin: 2px auto 16px;

  @media (max-width: 768px) {
    width: 180px;
    height: 56px;
    margin-bottom: 12px;
  }
`

/* 제목 */
export const Title = styled.h3`
  margin: 0 0 18px;
  color: #079a7f;
  text-align: center;
  font-family: Pretendard, system-ui, -apple-system, 'Segoe UI', sans-serif;
  font-size: 48px;
  font-size: 40px;
  font-size: 34px;
  font-weight: 700;
  letter-spacing: -1.6px;
  line-height: 1.2;

  @media (max-width: 768px) {
    font-size: 28px;
    letter-spacing: -1px;
  }
`

/* 상세 문구 */
export const Detail = styled.p`
  margin: 0 0 26px;
  color: #2b2b2b;
  text-align: center;
  font-family: Pretendard, system-ui, -apple-system, 'Segoe UI', sans-serif;
  font-size: 24px;
  font-size: 20px;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.7px;
  line-height: 1.45;
  white-space: pre-line;

  @media (max-width: 768px) {
    font-size: 16px;
    margin-bottom: 20px;
  }
`

/* 버튼 영역 */
export const Actions = styled.div`
  display: flex;
  justify-content: center;
  gap: 12px;
`

/* 공통 버튼 */
export const Btn = styled.button`
  border: 0;
  min-width: 120px;
  height: 48px;
  padding: 0 20px;
  border-radius: 12px;
  cursor: pointer;
  text-align: center;
  font-family: Pretendard, system-ui, -apple-system, 'Segoe UI', sans-serif;
  font-size: 24px;
  font-size: 20px;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.7px;
  transition: filter 0.16s ease, transform 0.08s ease;

  &:hover {
    filter: brightness(0.98);
  }

  &:active {
    transform: translateY(1px);
  }

  @media (max-width: 768px) {
    min-width: 120px;
    height: 46px;
    font-size: 16px;
  }
`

/* 확인 버튼 */
export const BtnPrimary = styled(Btn)`
  background: #0b9f85;
  color: #fff;
`

/* 닫기 버튼 */
export const BtnGhost = styled(Btn)`
  background: #fff;
  color: #0b9f85;
  border: 1px solid #0b9f85;
`