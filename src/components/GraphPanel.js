import React, { useCallback, useEffect, useRef, useState } from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import ForceGraph2D from 'react-force-graph-2d';
import { useTheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';

const GraphContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  padding: theme.spacing(2),
}));

const GraphWrapper = styled(Box)(({ theme }) => ({
  flex: 1,
  backgroundColor: 'transparent',
  borderRadius: '12px',
  overflow: 'hidden',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: theme.palette.mode === 'dark'
      ? 'radial-gradient(circle at center, rgba(26, 35, 126, 0.15) 0%, rgba(0, 0, 0, 0.3) 100%)'
      : 'radial-gradient(circle at center, rgba(13, 71, 161, 0.1) 0%, rgba(245, 247, 250, 0.15) 100%)',
    pointerEvents: 'none',
  },
}));

const PanelHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(2),
}));

function GraphPanel(props) {
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [particleCount, setParticleCount] = useState(0);
  const [activeEdges, setActiveEdges] = useState([]);
  const [currentEdgeIndex, setCurrentEdgeIndex] = useState(0);
  const [isPassiveMode, setIsPassiveMode] = useState(false);
  const [firstPhaseActiveEdges, setFirstPhaseActiveEdges] = useState([]);
  const graphRef = useRef();
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const theme = useTheme();
  const animationIntervalRef = useRef(null);
  const firstPhaseIntervalRef = useRef(null);

  useEffect(() => {
    const fetchGraphData = async () => {
      setLoading(true);
      try {
        const response = await fetch('http://localhost:6969/get_graph_data');
        const data = await response.json();
        setGraphData(data);
      } catch (error) {
        console.error('Error fetching graph data:', error);
      }
      setLoading(false);
    };

    fetchGraphData();
  }, [props.refreshKey]);

  // Start passive animation when graph data is loaded
  useEffect(() => {
    if (graphData && graphData.links) {
      // Clear any existing animation
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
      }

      // Only start passive animation if we're in passive mode
      if (isPassiveMode) {
        setCurrentEdgeIndex(0);
        setActiveEdges([]);
        
        animationIntervalRef.current = setInterval(() => {
          setCurrentEdgeIndex(prev => {
            // Random number of edges to activate (2-4)
            const numEdges = Math.floor(Math.random() * 3) + 2;
            const nextIndex = prev + numEdges;
            if (nextIndex >= graphData.links.length) {
              return 0; // Reset to start
            }
            return nextIndex;
          });
        }, 5000 / (graphData.links.length / 3)); // Adjusted for average of 3 edges
      }
    }

    return () => {
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
      }
    };
  }, [graphData, isPassiveMode]);

  // Update active edges based on current index
  useEffect(() => {
    if (graphData && graphData.links) {
      const newActiveEdges = [];
      // Random number of edges to activate (2-4)
      const numEdges = Math.floor(Math.random() * 3) + 2;
      for (let i = 0; i < numEdges; i++) {
        const edgeIndex = (currentEdgeIndex + i) % graphData.links.length;
        newActiveEdges.push(graphData.links[edgeIndex]);
      }
      setActiveEdges(newActiveEdges);
    }
  }, [currentEdgeIndex, graphData]);

  // Handle animation sequence on refresh
  useEffect(() => {
    if (props.refreshKey > 0 && graphData) {
      console.log('Starting animation sequence');
      setIsPassiveMode(false);
      
      // Clear any existing animations
      if (animationIntervalRef.current) {
        clearInterval(animationIntervalRef.current);
      }
      if (firstPhaseIntervalRef.current) {
        clearInterval(firstPhaseIntervalRef.current);
      }
      
      // Start with random two-to-four animation
      setCurrentEdgeIndex(0);
      
      // Create a new interval for the first phase animation
      firstPhaseIntervalRef.current = setInterval(() => {
        if (graphData && graphData.links) {
          const newActiveEdges = [];
          const numEdges = Math.floor(Math.random() * 3) + 2;
          for (let i = 0; i < numEdges; i++) {
            const edgeIndex = Math.floor(Math.random() * graphData.links.length);
            newActiveEdges.push(graphData.links[edgeIndex]);
          }
          setFirstPhaseActiveEdges(newActiveEdges);
        }
      }, 100); // Faster animation during first phase
      
      // After a maximum of 3 seconds, switch to passive mode
      setTimeout(() => {
        console.log('Switching to passive mode');
        if (firstPhaseIntervalRef.current) {
          clearInterval(firstPhaseIntervalRef.current);
        }
        setFirstPhaseActiveEdges([]);
        setIsPassiveMode(true);
        setParticleCount(4); // Set persistent particle count
      }, 3000); // Maximum duration for the first phase
    }
  }, [props.refreshKey, graphData]);

  // Update dimensions on window resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };

    updateDimensions(); // Set initial dimensions
    window.addEventListener('resize', updateDimensions);

    return () => {
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  const handleNodeClick = useCallback((node) => {
    const distance = 40;
    const distRatio = 1 + distance/Math.hypot(node.x, node.y);

    graphRef.current.centerAt(node.x, node.y, 1000);
    graphRef.current.zoom(2.5, 1000);
  }, []);

  const handleNodeHover = useCallback((node) => {
    setHoveredNode(node);
  }, []);

  const toggleLabels = () => {
    setShowLabels(prev => !prev);
  };

  const getNodeColor = useCallback((node) => {
    const baseColor = node.type === 'session' 
      ? (theme.palette.mode === 'dark' ? '#4A90E2' : '#0D47A1')
      : (theme.palette.mode === 'dark' ? '#357ABD' : '#1A237E');
    
    return baseColor;
  }, [theme.palette.mode]);

  const getLinkColor = useCallback((link) => {
    if (isPassiveMode) {
      return theme.palette.mode === 'dark'
        ? 'rgba(74, 144, 226, 0.4)'
        : 'rgba(13, 71, 161, 0.3)';
    }
    
    const isActive = firstPhaseActiveEdges.includes(link);
    return isActive
      ? (theme.palette.mode === 'dark' ? '#FF4081' : '#D500F9')
      : (theme.palette.mode === 'dark'
          ? 'rgba(74, 144, 226, 0.4)'
          : 'rgba(13, 71, 161, 0.3)');
  }, [theme.palette.mode, firstPhaseActiveEdges, isPassiveMode]);

  const getLinkWidth = useCallback((link) => {
    if (isPassiveMode) return 2;
    return firstPhaseActiveEdges.includes(link) ? 4 : 2;
  }, [firstPhaseActiveEdges, isPassiveMode]);

  const getParticleColor = useCallback(() => {
    // Always use node color for particles
    return theme.palette.mode === 'dark' ? '#4A90E2' : '#0D47A1';
  }, [theme.palette.mode]);

  const getTextColor = useCallback(() => {
    return theme.palette.mode === 'dark' 
      ? theme.palette.text.primary 
      : '#1A237E';
  }, [theme.palette.mode, theme.palette.text.primary]);

  const handleRecenter = useCallback(() => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(400);
    }
  }, []);

  if (loading) {
    return (
      <GraphContainer>
        <Box display="flex" justifyContent="center" alignItems="center" height="100%">
          <CircularProgress />
        </Box>
      </GraphContainer>
    );
  }

  return (
    <GraphContainer>
      <PanelHeader>
        <Typography variant="h6" sx={{ color: getTextColor() }}>
          Knowledge Graph Visualization
        </Typography>
        <Box>
          <Tooltip title="Recenter Graph">
            <IconButton 
              onClick={handleRecenter}
              color="primary"
              sx={{
                transition: 'transform 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.1)',
                },
                mr: 1
              }}
            >
              <CenterFocusStrongIcon />
            </IconButton>
          </Tooltip>
        <Tooltip title={showLabels ? "Hide Labels" : "Show Labels"}>
          <IconButton 
            onClick={toggleLabels}
            color="primary"
            sx={{
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'scale(1.1)',
              },
            }}
          >
            {showLabels ? <VisibilityIcon /> : <VisibilityOffIcon />}
          </IconButton>
        </Tooltip>
        </Box>
      </PanelHeader>

      <GraphWrapper ref={containerRef}>
        {graphData ? (
          <ForceGraph2D
            ref={graphRef}
            graphData={graphData}
            nodeColor={getNodeColor}
            nodeRelSize={6}
            nodeCanvasObject={(node, ctx, globalScale) => {
              const label = node.label;
              const fontSize = 12/globalScale;
              ctx.font = `${fontSize}px Inter`;
              const textWidth = ctx.measureText(label).width;
              const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);

              // Draw outer glow
              ctx.shadowColor = getNodeColor(node);
              ctx.shadowBlur = 25;
              ctx.beginPath();
              ctx.arc(node.x, node.y, 8, 0, 2 * Math.PI, false);
              ctx.fillStyle = getNodeColor(node);
              ctx.fill();

              // Draw inner glow
              ctx.shadowBlur = 15;
              ctx.beginPath();
              ctx.arc(node.x, node.y, 6, 0, 2 * Math.PI, false);
              ctx.fillStyle = getNodeColor(node);
              ctx.fill();

              if (showLabels || hoveredNode === node) {
                ctx.shadowBlur = 10;
                ctx.shadowColor = theme.palette.mode === 'dark' 
                  ? 'rgba(26, 35, 126, 0.3)'
                  : 'rgba(13, 71, 161, 0.2)';
                ctx.fillStyle = theme.palette.mode === 'dark'
                  ? 'rgba(10, 25, 41, 0.9)'
                  : 'rgba(255, 255, 255, 0.95)';
                ctx.fillRect(
                  node.x - bckgDimensions[0] / 2,
                  node.y + 8,
                  bckgDimensions[0],
                  bckgDimensions[1]
                );

                ctx.shadowBlur = 0;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = getTextColor();
                ctx.fillText(
                  label,
                  node.x,
                  node.y + 8 + fontSize / 2
                );
              }
            }}
            linkColor={getLinkColor}
            linkWidth={getLinkWidth}
            linkDirectionalParticles={particleCount}
            linkDirectionalParticleWidth={4}
            linkDirectionalParticleColor={getParticleColor}
            linkDirectionalParticleSpeed={0.01}
            linkDirectionalArrowLength={6}
            linkDirectionalArrowRelPos={1}
            onNodeHover={handleNodeHover}
            onNodeClick={handleNodeClick}
            backgroundColor="transparent"
            width={dimensions.width}
            height={dimensions.height}
            cooldownTicks={100}
            onEngineStop={() => graphRef.current.zoomToFit(400)}
            customLinkCanvasObject={(link, ctx, globalScale) => {
              const isActive = activeEdges.includes(link);
              
              // Draw the link
              ctx.beginPath();
              ctx.moveTo(link.source.x, link.source.y);
              ctx.lineTo(link.target.x, link.target.y);
              
              if (isActive && !isPassiveMode) {
                // Enhanced glow effect for active links
                ctx.shadowColor = theme.palette.mode === 'dark' ? '#FF4081' : '#D500F9';
                ctx.shadowBlur = 20;
                ctx.strokeStyle = theme.palette.mode === 'dark' ? '#FF4081' : '#D500F9';
                ctx.lineWidth = 4;
                ctx.stroke();
                
                // Additional glow layer
                ctx.shadowBlur = 30;
                ctx.strokeStyle = theme.palette.mode === 'dark' 
                  ? 'rgba(255, 64, 129, 0.3)' 
                  : 'rgba(213, 0, 249, 0.3)';
                ctx.lineWidth = 6;
                ctx.stroke();
              } else {
                ctx.shadowBlur = 0;
                ctx.strokeStyle = getLinkColor(link);
                ctx.lineWidth = getLinkWidth(link);
                ctx.stroke();
              }
            }}
          />
        ) : (
          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
            <Typography color="textSecondary" sx={{ color: getTextColor() }}>
              No graph data available
            </Typography>
          </Box>
        )}
      </GraphWrapper>
    </GraphContainer>
  );
}

export default GraphPanel; 