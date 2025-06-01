import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import { keyframes } from '@mui/system';
import IconButton from '@mui/material/IconButton';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import ChatPanel from './components/ChatPanel';
import AnalysisPanel from './components/AnalysisPanel';
import GraphPanel from './components/GraphPanel';

// Animation keyframes
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const gradientAnimation = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

// Create themes for both modes
const getTheme = (mode) => createTheme({
  palette: {
    mode,
    primary: {
      main: mode === 'dark' ? '#1A237E' : '#0D47A1',
      light: mode === 'dark' ? '#534BAE' : '#5472D3',
      dark: mode === 'dark' ? '#000051' : '#002171',
    },
    secondary: {
      main: mode === 'dark' ? '#0D47A1' : '#1A237E',
      light: mode === 'dark' ? '#5472D3' : '#534BAE',
      dark: mode === 'dark' ? '#002171' : '#000051',
    },
    background: {
      default: mode === 'dark' ? '#000000' : '#F5F7FA',
      paper: mode === 'dark' ? '#0A1929' : '#FFFFFF',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      letterSpacing: '-0.02em',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: mode === 'dark' 
              ? '0 4px 12px rgba(26, 35, 126, 0.3)'
              : '0 4px 12px rgba(13, 71, 161, 0.2)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: mode === 'dark'
            ? 'linear-gradient(45deg, #0A1929 0%, #000000 100%)'
            : 'linear-gradient(45deg, #FFFFFF 0%, #F5F7FA 100%)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: mode === 'dark'
              ? '0 8px 24px rgba(26, 35, 126, 0.2)'
              : '0 8px 24px rgba(13, 71, 161, 0.1)',
          },
        },
      },
    },
  },
});

// Styled components
const AppContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  background: theme.palette.mode === 'dark'
    ? 'linear-gradient(135deg, #000000 0%, #0A1929 100%)'
    : 'linear-gradient(135deg, #F5F7FA 0%, #FFFFFF 100%)',
  backgroundSize: '200% 200%',
  animation: `${gradientAnimation} 15s ease infinite`,
}));

const Header = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  background: theme.palette.mode === 'dark'
    ? 'rgba(10, 25, 41, 0.8)'
    : 'rgba(255, 255, 255, 0.8)',
  backdropFilter: 'blur(10px)',
  borderBottom: `1px solid ${theme.palette.mode === 'dark'
    ? 'rgba(26, 35, 126, 0.2)'
    : 'rgba(13, 71, 161, 0.1)'}`,
  animation: `${fadeIn} 0.8s ease-out`,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
}));

const HeaderContent = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
});

const ContentContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flex: 1,
  padding: theme.spacing(2),
  gap: theme.spacing(2),
}));

const Panel = styled(Box)(({ theme }) => ({
  background: theme.palette.mode === 'dark'
    ? 'rgba(10, 25, 41, 0.6)'
    : 'rgba(255, 255, 255, 0.6)',
  backdropFilter: 'blur(10px)',
  borderRadius: 16,
  border: `1px solid ${theme.palette.mode === 'dark'
    ? 'rgba(26, 35, 126, 0.2)'
    : 'rgba(13, 71, 161, 0.1)'}`,
  padding: theme.spacing(2),
  transition: 'all 0.3s ease',
  animation: `${fadeIn} 0.8s ease-out`,
  height: 'calc(100vh - 100px)',
  display: 'flex',
  flexDirection: 'column',
  '&:hover': {
    boxShadow: theme.palette.mode === 'dark'
      ? '0 8px 32px rgba(26, 35, 126, 0.2)'
      : '0 8px 32px rgba(13, 71, 161, 0.1)',
  },
}));

const PanelContent = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: 'auto',
  '&::-webkit-scrollbar': {
    width: '8px',
  },
  '&::-webkit-scrollbar-track': {
    background: theme.palette.mode === 'dark'
      ? 'rgba(26, 35, 126, 0.1)'
      : 'rgba(13, 71, 161, 0.1)',
    borderRadius: '4px',
  },
  '&::-webkit-scrollbar-thumb': {
    background: theme.palette.mode === 'dark'
      ? 'rgba(26, 35, 126, 0.3)'
      : 'rgba(13, 71, 161, 0.2)',
    borderRadius: '4px',
    '&:hover': {
      background: theme.palette.mode === 'dark'
        ? 'rgba(26, 35, 126, 0.5)'
        : 'rgba(13, 71, 161, 0.3)',
    },
  },
}));

const LeftPanel = styled(Panel)({
  width: '25%',
});

const MiddlePanel = styled(Panel)({
  width: '25%',
});

const RightPanel = styled(Panel)({
  width: '50%',
});

function App() {
  const [mode, setMode] = React.useState('dark');
  const [refreshKey, setRefreshKey] = React.useState(0);

  const theme = React.useMemo(() => getTheme(mode), [mode]);

  const toggleColorMode = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const triggerRefresh = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppContainer>
        <Header>
          <HeaderContent>
            <Typography variant="h4" sx={{ 
              fontWeight: 700,
              background: 'linear-gradient(45deg, #1A237E, #0D47A1)',
              backgroundClip: 'text',
              textFillColor: 'transparent',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              ThoughtFlow
            </Typography>
          </HeaderContent>
          <IconButton 
            onClick={toggleColorMode} 
            color="inherit"
            sx={{
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'rotate(180deg)',
              },
            }}
          >
            {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </Header>
        <ContentContainer>
          <LeftPanel>
            <PanelContent>
              <ChatPanel onMessageProcessed={triggerRefresh} />
            </PanelContent>
          </LeftPanel>
          <MiddlePanel>
            <PanelContent>
              <AnalysisPanel refreshKey={refreshKey} />
            </PanelContent>
          </MiddlePanel>
          <RightPanel>
            <PanelContent>
              <GraphPanel refreshKey={refreshKey} />
            </PanelContent>
          </RightPanel>
        </ContentContainer>
      </AppContainer>
    </ThemeProvider>
  );
}

export default App; 