import React from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CircularProgress from '@mui/material/CircularProgress';
import TimelineIcon from '@mui/icons-material/Timeline';
import PsychologyIcon from '@mui/icons-material/Psychology';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';

const AnalysisContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  padding: theme.spacing(2),
}));

const MetricsContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  backgroundColor: theme.palette.mode === 'dark' 
    ? 'rgba(10, 25, 41, 0.6)' 
    : 'rgba(255, 255, 255, 0.6)',
  borderRadius: '12px',
  backdropFilter: 'blur(10px)',
}));

const MetricCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1.5),
  marginBottom: theme.spacing(1),
  backgroundColor: theme.palette.mode === 'dark' 
    ? 'rgba(26, 35, 126, 0.2)' 
    : 'rgba(13, 71, 161, 0.1)',
  borderRadius: '8px',
  '&:last-child': {
    marginBottom: 0,
  },
}));

const MetricHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(1),
}));

const StyledChip = styled(Chip)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' 
    ? 'rgba(255, 255, 255, 0.1)' 
    : 'rgba(0, 0, 0, 0.05)',
  '& .MuiChip-label': {
    fontSize: '0.75rem',
  },
}));

const StyledAccordion = styled(Accordion)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  borderRadius: '8px !important',
  marginBottom: theme.spacing(1),
  '&:before': {
    display: 'none',
  },
}));

const ArrowIcon = styled(ArrowForwardIcon)(({ theme }) => ({
  fontSize: '1rem',
  color: theme.palette.mode === 'dark' 
    ? 'rgba(255, 255, 255, 0.4)'
    : 'rgba(0, 0, 0, 0.3)',
  margin: theme.spacing(0, 0.5), // Adjust spacing around arrow
  alignSelf: 'center', // Align vertically in the stack
}));

function AnalysisPanel(props) {
  const [analysis, setAnalysis] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [expandedSections, setExpandedSections] = React.useState({
    reasoning: true,
    toolUsage: false
  });

  React.useEffect(() => {
    const fetchAnalysis = async () => {
      setLoading(true);
      try {
        const response = await fetch('http://localhost:6969/get_analysis');
        const data = await response.json();
        setAnalysis(data);
      } catch (error) {
        console.error('Error fetching analysis:', error);
      }
      setLoading(false);
    };

    fetchAnalysis();
  }, [props.refreshKey]);

  const handleAccordionChange = (section) => (event, isExpanded) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: isExpanded
    }));
  };

  const renderMetrics = () => {
    if (!analysis?.successful_patterns) return null;

    return (
      <MetricsContainer>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TimelineIcon /> Metrics
        </Typography>
        {analysis.successful_patterns.map((metric, index) => (
          <MetricCard key={index}>
            <MetricHeader>
              <PsychologyIcon fontSize="small" />
              <Typography variant="subtitle2" sx={{ flex: 1 }}>
                {metric.strategy}
              </Typography>
            </MetricHeader>
            
            <Stack direction="row" spacing={0} sx={{ mb: 1, alignItems: 'center' }} flexWrap="wrap" useFlexGap>
              {metric.thought_sequence.map((step, idx) => (
                <React.Fragment key={idx}>
                  <StyledChip
                    label={`${idx + 1}. ${step}`}
                    size="small"
                  />
                  {idx < metric.thought_sequence.length - 1 && <ArrowIcon />}
                </React.Fragment>
              ))}
            </Stack>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {metric.indicators.map((indicator, idx) => (
                <StyledChip
                  key={idx}
                  label={indicator}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Stack>
          </MetricCard>
        ))}
      </MetricsContainer>
    );
  };

  if (loading) {
    return (
      <AnalysisContainer>
        <Box display="flex" justifyContent="center" alignItems="center" height="100%">
          <CircularProgress />
        </Box>
      </AnalysisContainer>
    );
  }

  return (
    <AnalysisContainer>
      <Typography variant="h6" gutterBottom>
        Analysis Output
      </Typography>

      {analysis && (
        <>
          {renderMetrics()}

          <StyledAccordion 
            expanded={expandedSections.reasoning}
            onChange={handleAccordionChange('reasoning')}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Reasoning Patterns</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <pre style={{ 
                margin: 0, 
                whiteSpace: 'pre-wrap',
                color: 'inherit',
                fontFamily: 'inherit'
              }}>
                {JSON.stringify(analysis.reasoning_patterns, null, 2)}
              </pre>
            </AccordionDetails>
          </StyledAccordion>

          <StyledAccordion
            expanded={expandedSections.toolUsage}
            onChange={handleAccordionChange('toolUsage')}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography>Tool Usage Patterns</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <pre style={{ 
                margin: 0, 
                whiteSpace: 'pre-wrap',
                color: 'inherit',
                fontFamily: 'inherit'
              }}>
                {JSON.stringify(analysis.tool_usage_patterns, null, 2)}
              </pre>
            </AccordionDetails>
          </StyledAccordion>
        </>
      )}
    </AnalysisContainer>
  );
}

export default AnalysisPanel; 