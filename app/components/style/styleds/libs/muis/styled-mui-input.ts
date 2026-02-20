/*
 * 01. 구분     : Style Component
 * 02. 타입     : -
 * 03. 업무구분  : 모든권한 - 스타일 - Mui
 * 03. 설명     : Mui Input 스타일 제공
 * 04. 작성일자  : 2023.12.20
 * 05. 작성자   : 이희준
 */

import React from 'react';

const muiInputStyle = {
  '& .MuiSelect-select': {
    minHeight: '1rem !important',
  },
  '& .MuiOutlinedInput-input': {
    padding: '3px 12px',
    border: '1px solid #cccccc !important',
  },
  '& .MuiInputBase-inputAdorendEnd': {
    textAlign: 'center',
  },
  '& .MuiInputAdorment-root': {
    marginLeft: '0px !important',
  },
};

export const muiTextFieldStyle: React.CSSProperties = {
  margin: '0px 3px',
  padding: '3px',
  backgroundColor: '#ffffff',
};

export const muiTextAreaStyle: React.CSSProperties = {
  maxWidth: 'calc(100% - 16px)',
  minWidth: 'fit-content',
  margin: '3px 3px 0px 3px',
  padding: '5px',
  boxSizing: 'content-box',
};

export const muiSelectStyle: React.CSSProperties = {
  minWidth: '80px',
  height: '25px',
  margin: '0px 3px',
  fontSize: '13px',
  backgroundColor: '#ffffff',
  verticalAlign: 'middle',
  lineHeight: 'initial',
  ...muiInputStyle,
};

export const muiCalendarStyle: React.CSSProperties = {
  minWidth: '150px',
  margin: '3px',
  fontSize: '13px',
  ...muiInputStyle,
};

export const muiformControlLabelStyle = {
  '& .MuiFormControlLabel-label': {
    fontSize: '13px',
  },
};

export const selectFormControlStyle = {
  display: "flex",
};

export const selectBoxStyle = {
  lineHeight: "35px", // 텍스트 수직 정렬
  fontSize: "14px", // 폰트 크기
};