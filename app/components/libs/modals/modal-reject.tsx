'use client'

import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import Image from 'next/image'
import systemLogo from '@/app/components/style/resources/imgs/system_logo_image_x2.png'
import {
  Overlay,
  ModalWrap,
  LogoWrap,
  Title,
  Detail,
  ReasonInput,
  ErrorText,
  Actions,
  BtnPrimary,
  BtnGhost,
} from '@/app/components/style/styleds/libs/modals/styled-modal-reject'

export type RejectModalMode = 'edit' | 'view'

export type RejectModalProps = {
  open: boolean
  mode?: RejectModalMode
  title?: string
  detail?: string
  reason?: string
  placeholder?: string
  confirmText?: string
  cancelText?: string
  requireReason?: boolean
  onConfirm?: (reason: string) => void
  onCancel: () => void
}

export default function RejectModal({
  open,
  mode = 'edit',
  title,
  detail,
  reason = '',
  placeholder = '반려 사유를 입력해주세요.',
  confirmText = '확인',
  cancelText = '닫기',
  requireReason = true,
  onConfirm,
  onCancel,
}: RejectModalProps) {
  const [mounted, setMounted] = useState(false)
  const [text, setText] = useState(reason)
  const [error, setError] = useState('')

  const isEdit = mode === 'edit'

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || !open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open, mounted])

  useEffect(() => {
    if (open) {
      setText(reason)
      setError('')
    }
  }, [open, reason])

  if (!open || !mounted) return null

  const resolvedTitle = title ?? (isEdit ? '생산 계획 반려 확인' : '반려 사유 확인')
  const resolvedDetail =
    detail ??
    (isEdit
      ? '생산 계획을 반려하시겠습니까? 반려하신다면 사유를 입력해주세요.'
      : '입력된 반려 사유를 확인해주세요.')

  const handleConfirm = () => {
    const trimmed = text.trim()

    if (isEdit && requireReason && !trimmed) {
      setError('반려 사유를 입력해주세요.')
      return
    }

    if (isEdit && onConfirm) {
      onConfirm(trimmed)
      return
    }

    onCancel()
  }

  const modalUi = (
    <>
      <Overlay onClick={onCancel} />
      <ModalWrap role="dialog" aria-modal="true" aria-labelledby="reject-title">
        <LogoWrap>
          <Image
            src={systemLogo}
            alt="GEORM TECH 로고"
            fill
            sizes="220px"
            priority
            style={{ objectFit: 'contain' }}
          />
        </LogoWrap>

        <Title id="reject-title">{resolvedTitle}</Title>
        <Detail>{resolvedDetail}</Detail>

        <ReasonInput
          $readonly={!isEdit}
          readOnly={!isEdit}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          aria-label="반려 사유 입력"
        />

        {isEdit && error ? <ErrorText>{error}</ErrorText> : null}

        <Actions>
          {isEdit ? (
            <>
              <BtnPrimary type="button" onClick={handleConfirm}>
                {confirmText}
              </BtnPrimary>
              <BtnGhost type="button" onClick={onCancel}>
                {cancelText}
              </BtnGhost>
            </>
          ) : (
            <BtnGhost type="button" onClick={onCancel}>
              닫기
            </BtnGhost>
          )}
        </Actions>
      </ModalWrap>
    </>
  )

  return createPortal(modalUi, document.body)
}
