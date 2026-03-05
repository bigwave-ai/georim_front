'use client'

import { useState } from 'react'
import LayoutMemberContents from './layout-member-contents'
import LayoutMemberLsb from './layout-member-lsb'
import mmc from '../../style/resources/css/member.module.css'

/*
 * 01. 구분     : Layout Component
 * 02. 타입     : Client Component
 * 03. 업무구분 : 멤버 권한 - Layout
 * 04. 설명     : 멤버 레이아웃 컴포넌트
 * 05. 작성일자 : 2023.12.20
 * 06. 작성자   : 이우창
 */

const LayoutMember = ({ children }: { children: React.ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className={mmc.total}>
      <LayoutMemberLsb
        isMobileOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* 모바일에서만 표시되는 메뉴 열기 버튼 */}
      {!isSidebarOpen && (
        <button
          type="button"
          className={mmc.mobileMenuBtn}
          onClick={() => setIsSidebarOpen(true)}
          aria-label="사이드바 열기"
          aria-expanded={isSidebarOpen}
          aria-controls="member-lsb"
        >
          메뉴
        </button>
      )}

      {/* 모바일 오버레이(바깥 클릭 시 닫기) */}
      {isSidebarOpen && (
        <button
          type="button"
          className={mmc.mobileMenuOverlay}
          onClick={() => setIsSidebarOpen(false)}
          aria-label="사이드바 닫기"
        />
      )}

      <div className={mmc.total_content}>
        <LayoutMemberContents>{children}</LayoutMemberContents>
      </div>
    </div>
  )
}

export default LayoutMember