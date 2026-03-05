import { Theme } from '@mui/material/styles'

/*
 * 01. 구분     : Style Component
 * 02. 타입     : -
 * 03. 업무구분  : 모든권한 - 스타일 - Mui
 * 03. 설명     : Mui Grid 스타일 제공 (문서 목록 UI 톤에 맞춤)
 * 04. 작성일자  : 2025.08.26
 * 05. 작성자   : 이우창
 */

//border: 1px solid #E7E7E8;
//background: #FCFCFC;

export const muiGridStyle = (theme: Theme) => {
  return {
    // 📌 DataGrid 기본
    '& .MuiDataGrid-root': {
      backgroundColor: '#FFFFFF',
      border: '1px solid #E7E7E8',
      borderRadius: '0 0 10px 10px',
      fontFamily: 'Pretendard, sans-serif',
    },

    // 📌 컬럼 헤더 컨테이너
    '& .MuiDataGrid-columnHeaders': {
      minWidth: '100%',
      backgroundColor: '#FCFCFC',    // ✅ background 변경
    },

    // 📌 컬럼 헤더 텍스트
    '& .MuiDataGrid-columnHeaderTitleContainer': {
      justifyContent: 'center',
    },
    '& .MuiDataGrid-columnHeaderTitle': {
      fontWeight: 700,
      fontSize: '14px',
      textAlign: 'center',
      fontFamily: 'Pretendard',
      color: '#312E37',
    },

    // 📌 셀 텍스트
    '& .MuiDataGrid-cell': {
      textAlign: 'center',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontSize: '13px',
      fontFamily: 'Pretendard',
      color: '#312E37',
      borderRight: 'none',   // ← 세로줄 제거
    },

    '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
      outline: 'none',
    },

    // 📌 행 hover 스타일
    '& .MuiDataGrid-row': {
      height: '40px',
      cursor: 'pointer',
      '&:hover': {
        backgroundColor: '#F5F7FB', // 연보라 hover
      },
    },

    // 📌 Footer (Pagination 영역)
    '& .MuiDataGrid-footerContainer': {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      borderTop: '1px solid #C3C4C6',
      padding: '0',
    },
  }
}