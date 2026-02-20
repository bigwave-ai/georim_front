import {
  GridColDef,
  GridRowSelectionModel,
  DataGrid,
  GridToolbar,
  GridToolbarContainer,
  GridToolbarExport,
  koKR,
  GridToolbarColumnsButton,
  GridToolbarDensitySelector,
  GridToolbarFilterButton,
  GridToolbarQuickFilter,
  GridColumnVisibilityModel,
} from '@mui/x-data-grid';
import { muiGridStyle } from '../../style/styleds/libs/muis/styled-mui-grid';
import { EnumGridStyleProps } from '@/app/models/enums/enum-grid-group';
import { muiBoxStyle, muiBoxStyle2 } from '../../style/styleds/libs/muis/styled-mui-box';
import { Box } from '@mui/material';
import MuiPagination from './mui-pagination';

/*
 * 01. 구분     : Library
 * 02. 타입     : Server Component
 * 03. 업무구분  : 모든권한 - 데이터 그리드 컴포넌트
 * 03. 설명     : 데이터 그리드 컴포넌트 제공
 * 04. 작성일자  : 2024.11.18
 * 05. 작성자   : 이우창
 */

interface DataGridProps {
  rows: any;
  columns: GridColDef<any>[];
  isPagination: boolean;
  isCheckboxSelection: boolean;
  rowId?: string;
  rowHeight?: number;
  pageSize?: number; // ✅ 기본값 15개를 외부에서 전달 가능
  extraHeader?: React.ReactNode; // ✅ GridTable 상단 UI 추가 가능
  columnVisibilityModel?: GridColumnVisibilityModel | undefined; // ✅ 열 가시성 제어
  handleChangeGridCellCheckbox?: (rowSelectionModel: GridRowSelectionModel) => void;
  onRowClick?: (rowData: any) => void; // ✅ 각 행을 클릭했을 때 실행할 이벤트
  customBoxStyle?: object; // ✅ 사용자 지정 Box 스타일
}

// ✅ 그리드 내 툴바 제공
function CustomToolbar() {
  return (
    <GridToolbarContainer>
      <GridToolbarColumnsButton />
      <GridToolbarFilterButton />
      <GridToolbarDensitySelector />
      <GridToolbarExport
        csvOptions={{
          utf8WithBom: true,
        }}
      />
      <GridToolbarQuickFilter style={{ marginLeft: 'auto' }} />
    </GridToolbarContainer>
  );
}

export const CustomDataGrid = ({
  rows,
  columns,
  isPagination,
  isCheckboxSelection,
  rowHeight,
  rowId,
  pageSize = 15,
  extraHeader,
  columnVisibilityModel,
  handleChangeGridCellCheckbox,
  onRowClick,
  customBoxStyle,
}: DataGridProps) => {
  return (
    <Box sx={customBoxStyle || (!pageSize ? muiBoxStyle : muiBoxStyle2)}>
      {extraHeader}
      <DataGrid
        sx={muiGridStyle}
        localeText={koKR.components.MuiDataGrid.defaultProps.localeText}
        columnHeaderHeight={EnumGridStyleProps.COLUMN_HEADER_HEIGHT}
        rowHeight={rowHeight ?? EnumGridStyleProps.ROW_HEIGHT}
        slots={{
          // toolbar: CustomToolbar,
          pagination: MuiPagination,
        }}
        pagination={isPagination || undefined}
        checkboxSelection={isCheckboxSelection || undefined}
        initialState={{
          pagination: {
            paginationModel: {
              pageSize,
            },
          },
        }}
        rows={rows || []}
        getRowId={rowId ? (row) => row[rowId] : (row) => row['id']}
        columns={columns}
        disableColumnMenu={true} // ✅ 열 메뉴 비활성화
        // disableColumnSorting={true} // ✅ 정렬 비활성화
        columnVisibilityModel={columnVisibilityModel}
        hideFooterSelectedRowCount
        onRowSelectionModelChange={handleChangeGridCellCheckbox}
        onCellClick={(params) => {
          if (onRowClick) {
            onRowClick(params.row); // ✅ 행 클릭 시 데이터 전달
          }
        }}
      />
    </Box>
  );
};
