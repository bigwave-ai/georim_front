'use client'

import { useMemo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAtom } from 'jotai'
import mmc from '../../style/resources/css/member.module.css'
import {
  AtomSideMenuItem,
  type AtomSideMenuItemType,
} from '@/app/models/atoms/atom-side-menu'
import imag from '../../style/resources/css/image.module.css'

/*
 * 01. 구분     : Layout Component
 * 02. 타입     : Client Component
 * 03. 업무구분 : 멤버권한 - Layout
 * 04. 설명     : 멤버 좌측 사이드바(LSB)
 * 05. 작성일자 : 2025.08.27
 * 06. 작성자   : 이우창
 */

type LayoutMemberLsbProps = {
  isMobileOpen?: boolean
  onClose?: () => void
}

export default function LayoutMemberLsb({
  isMobileOpen = false,
  onClose,
}: LayoutMemberLsbProps) {
  /******************** 변수영역 ********************/
  const pathname = usePathname()
  const router = useRouter()
  const [, setSelected] = useAtom(AtomSideMenuItem)

  const menuItems: AtomSideMenuItemType[] = useMemo(
    () => [
      { menuId: 'dashboard', menuNm: '설비 현황', path: '/dashboard', isOpen: false, isButton: false },
      { menuId: 'plan-create', menuNm: '생산 계획 생성', path: '/createPlan', isOpen: false, isButton: false },
      { menuId: 'sample-sim', menuNm: '개발 샘플 시뮬레이션', path: '/simulation', isOpen: false, isButton: false },
      { menuId: 'plan-history', menuNm: '생산 계획 생성 이력', path: '/history', isOpen: false, isButton: false },
    ],
    []
  )

  const now = '2026.02.04 오후 04:09'

  /******************** 함수영역 ********************/
  const handleSelect = (item: AtomSideMenuItemType) => {
    setSelected(item)
    if (pathname !== item.path) router.push(item.path)
    onClose?.() // 모바일에서는 메뉴 선택 후 자동 닫기
  }

  const isActive = (path: string) =>
    pathname === path || (pathname?.startsWith(path + '/') ?? false)

  /******************** 수행영역 ********************/
  return (
    <aside
      id="member-lsb"
      className={`${mmc.lsb} ${isMobileOpen ? mmc.lsbMobileOpen : ''}`}
    >
      {/* 모바일 닫기 버튼 */}
      <button
        type="button"
        className={mmc.lsbCloseBtn}
        onClick={onClose}
        aria-label="사이드바 닫기"
      >
        ×
      </button>

      <div className={mmc.lsb_brand}>
        <div className={imag.company_logo} aria-label="GEORIM 로고" />
        <div className={mmc.lsb_brand_texts}>
          <strong>거림테크</strong>
          <span>생산계획 AI Agent</span>
        </div>
      </div>

      <div className={mmc.lsb_inner}>
        <div className={mmc.lsb_section_title}>menu</div>

        <nav className={mmc.lsb_nav}>
          {menuItems.map((item) => {
            const active = isActive(item.path)
            return (
              <button
                key={item.menuId}
                type="button"
                onClick={() => handleSelect(item)}
                className={`${mmc.lsb_item} ${active ? mmc.lsb_item_active : ''}`}
                aria-current={active ? 'page' : undefined}
                aria-label={item.menuNm}
                title={item.menuNm}
              >
                <span className={mmc.lsb_item_dot} aria-hidden="true" />
                <span className={mmc.lsb_item_label}>{item.menuNm}</span>
              </button>
            )
          })}
        </nav>
      </div>

      <div className={mmc.lsb_footer}>
        <span>마지막 갱신</span>
        <strong>{now}</strong>
      </div>
    </aside>
  )
}
