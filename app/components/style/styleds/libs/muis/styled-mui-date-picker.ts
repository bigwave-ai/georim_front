import type { SxProps, Theme } from '@mui/material/styles'

type DatePickerTone = 'default' | 'plan' | 'simulation'

export const getDatePickerSx = (
  width: number | string = 150,
  tone: DatePickerTone = 'plan'
): SxProps<Theme> => {
  const isPlan = tone === 'plan'
  const isSimulation = tone === 'simulation'

  return {
    width,
    '& .MuiInputBase-root': {
      height: isSimulation ? 52 : isPlan ? 34 : 40,
      borderRadius: isSimulation ? '12px' : isPlan ? '8px' : '10px',
      backgroundColor: '#fff',
      fontFamily: 'Pretendard',
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: isSimulation
        ? '#c7d8e8'
        : isPlan
        ? '#cbd9e6'
        : 'var(--_input_, #C3C4C6)',
      borderRadius: isSimulation ? '12px' : isPlan ? '8px' : '10px',
    },
    '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: isSimulation
        ? '#9fb8cf'
        : isPlan
        ? '#9fb8cf'
        : 'var(--_input_, #C3C4C6)',
    },
    '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: isSimulation ? '#4d98c8' : isPlan ? '#4d98c8' : 'var(--_input_, #C3C4C6)',
      boxShadow: isSimulation
        ? '0 0 0 3px rgba(40, 140, 196, 0.15)'
        : isPlan
        ? '0 0 0 3px rgba(40, 140, 196, 0.15)'
        : 'none',
    },
    '& .MuiInputBase-input': {
      padding: isSimulation ? '0 14px' : isPlan ? '8px 10px' : '9px 12px',
      fontFamily: 'Pretendard',
      fontSize: isSimulation ? '16px' : isPlan ? '13px' : '12px',
      fontWeight: isSimulation ? 600 : 500,
      color: isSimulation ? '#2b2b2b' : '#5a6f85',
      letterSpacing: '-0.3px',
    },
    '& .MuiInputBase-input::placeholder': {
      color: isSimulation ? '#9aa8b7' : '#5a6f85',
      opacity: 1,
    },
    '& .MuiInputAdornment-root .MuiIconButton-root': {
      color: '#5a6f85',
      padding: isSimulation ? '8px' : '6px',
    },
    '& .MuiSvgIcon-root': {
      fontSize: isSimulation ? '20px' : '18px',
    },
  }
}
