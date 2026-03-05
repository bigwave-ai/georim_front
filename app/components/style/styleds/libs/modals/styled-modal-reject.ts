'use client'

import styled from 'styled-components'

/*
 * 01. 구분     : Style Component
 * 02. 타입     : -
 * 03. 업무구분 : 모든권한 - 스타일 - 반려 입력 모달
 * 04. 설명     : 반려 사유 입력/조회 모달 스타일
 * 05. 작성일자 : 2026.02.20
 * 06. 작성자   : Codex
 */

export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 30000;
  background: rgba(12, 26, 43, 0.42);
  backdrop-filter: blur(1px);
`

export const ModalWrap = styled.div`
  position: fixed;
  z-index: 30001;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: min(620px, calc(90vw - 40px));
  border-radius: 12px;
  border: 1px solid #d7e1ea;
  padding: 24px 22px 18px;
  text-align: center;
  background: linear-gradient(180deg, #ffffff 0%, #ffffff 76%, #fff3ed 100%);
  box-shadow: 0 24px 60px rgba(13, 30, 53, 0.24);

  @media (max-width: 768px) {
    width: calc(100vw - 20px);
    padding: 18px 12px 14px;
  }
`

export const LogoWrap = styled.div`
  position: relative;
  width: 220px;
  height: 68px;
  margin: 2px auto 8px;

  @media (max-width: 768px) {
    width: 180px;
    height: 56px;
  }
`

export const Title = styled.h3`
  margin: 0 0 12px;
  color: #ff4d4f;
  text-align: center;
  font-family: Pretendard, system-ui, -apple-system, 'Segoe UI', sans-serif;
  font-size: 34px;
  font-size: 30px;
  font-size: 26px;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -1px;
  line-height: 1.2;
`

export const Detail = styled.p`
  margin: 0 0 10px;
  color: #2b2b2b;
  text-align: center;
  font-family: Pretendard, system-ui, -apple-system, 'Segoe UI', sans-serif;
  font-size: 20px;
  font-size: 18px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.5px;
  line-height: 1.45;
  white-space: pre-line;
`

export const ReasonInput = styled.textarea<{ $readonly?: boolean }>`
  width: 100%;
  min-height: 250px;
  border: 1px solid #cfd7e1;
  border-radius: 10px;
  background: ${({ $readonly }) => ($readonly ? '#f8f9fb' : '#fff')};
  padding: 12px;
  resize: none;
  outline: none;
  color: #2b2b2b;
  font-family: Pretendard, system-ui, -apple-system, 'Segoe UI', sans-serif;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.3px;
  line-height: 1.45;

  &::placeholder {
    color: #7c8fa3;
  }

  &:focus {
    border-color: ${({ $readonly }) => ($readonly ? '#cfd7e1' : '#ef6565')};
    box-shadow: ${({ $readonly }) => ($readonly ? 'none' : '0 0 0 3px rgba(239, 101, 101, 0.16)')};
  }

  @media (max-width: 768px) {
    min-height: 200px;
    font-size: 14px;
  }
`

export const ErrorText = styled.div`
  margin-top: 8px;
  text-align: left;
  color: #ed4444;
  font-family: Pretendard, system-ui, -apple-system, 'Segoe UI', sans-serif;
  font-size: 13px;
  font-weight: 700;
`

export const Actions = styled.div`
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 14px;
`

export const Btn = styled.button`
  border: 0;
  min-width: 96px;
  height: 40px;
  padding: 0 16px;
  border-radius: 10px;
  cursor: pointer;
  text-align: center;
  font-family: Pretendard, system-ui, -apple-system, 'Segoe UI', sans-serif;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.4px;
  transition: filter 0.16s ease, transform 0.08s ease;

  &:hover {
    filter: brightness(0.98);
  }

  &:active {
    transform: translateY(1px);
  }
`

export const BtnPrimary = styled(Btn)`
  background: #ef4444;
  color: #fff;
`

export const BtnGhost = styled(Btn)`
  background: #fff;
  color: #ef4444;
  border: 1px solid #ef4444;
`
