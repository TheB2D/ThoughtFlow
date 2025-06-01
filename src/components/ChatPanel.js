import React, { useState, useRef, useEffect } from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import SendIcon from '@mui/icons-material/Send';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import PsychologyIcon from '@mui/icons-material/Psychology';
import Collapse from '@mui/material/Collapse';
import Button from '@mui/material/Button';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CloseIcon from '@mui/icons-material/Close';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { useTheme } from '@mui/material/styles';
import { keyframes } from '@mui/system';

const scrollbarStyles = {
  '&::-webkit-scrollbar': {
    width: '8px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    background: 'rgba(255, 255, 255, 0.2)',
    borderRadius: '4px',
    '&:hover': {
      background: 'rgba(255, 255, 255, 0.3)',
    },
  },
};

const ChatContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  padding: theme.spacing(2),
}));

const MessagesContainer = styled(Box)(({ theme }) => ({
  flex: 1,
  overflowY: 'auto',
  marginBottom: theme.spacing(2),
  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(10, 25, 41, 0.6)' : 'rgba(255, 255, 255, 0.6)',
  borderRadius: '12px',
  ...scrollbarStyles,
}));

const MessageBubble = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'isUser' && prop !== 'isThinking',
})(({ theme, isUser, isThinking }) => ({
  padding: theme.spacing(1.5),
  marginBottom: theme.spacing(1),
  maxWidth: '80%',
  width: isUser ? 'fit-content' : 'auto',
  background: isUser 
    ? theme.palette.mode === 'dark' 
      ? 'linear-gradient(135deg, #1A237E 0%, #000000 100%)'
      : theme.palette.primary.main // Use primary color for user bubbles in light mode
    : isThinking 
      ? theme.palette.mode === 'dark' 
        ? '#1E3A5A'
        : theme.palette.grey[300] // Use a light grey for thinking bubbles in light mode
      : theme.palette.mode === 'dark' 
        ? 'linear-gradient(135deg, #002171 0%, #5472D3 100%)'
        : theme.palette.background.paper, // Use paper background for assistant bubbles in light mode
  color:
    theme.palette.mode === 'dark'
    ? '#FFFFFF'
    : isUser
      ? theme.palette.primary.contrastText // Keep contrast text for user bubbles
      : theme.palette.text.primary, // Use primary text color for assistant bubbles
  borderRadius: '12px',
  marginLeft: isUser ? 'auto' : '0',
  marginRight: isUser ? '0' : 'auto',
  border: 'none',
  wordBreak: 'break-word',
  boxShadow: isUser 
    ? theme.palette.mode === 'dark' 
      ? '0 0 25px 5px rgba(26, 35, 126, 0.8)'
      : '0 0 10px rgba(0, 0, 0, 0.1)' // Softer shadow for user bubbles in light mode
    : 'none',
  elevation: isUser ? 1 : 0,
  transition: 'box-shadow 0.3s ease-in-out',
}));

const InputContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1),
  padding: theme.spacing(1),
  backgroundColor: theme.palette.background.paper,
  borderRadius: '12px',
}));

const Watermark = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  textAlign: 'center',
  color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
  pointerEvents: 'none',
  zIndex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
}));

const flyAnimation = keyframes`
  0% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
  20% {
    transform: scale(1.2) rotate(-10deg);
    opacity: 1;
  }
  40% {
    transform: scale(0.8) rotate(10deg);
    opacity: 1;
  }
  60% {
    transform: scale(1.1) rotate(-5deg);
    opacity: 1;
  }
  80% {
    transform: scale(0.9) rotate(5deg);
    opacity: 1;
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
`;

const FlyingSendButton = styled(IconButton)(({ theme, isFlying }) => ({
  backgroundColor: 'primary.main',
  color: 'primary.contrastText',
  '&:hover': {
    backgroundColor: 'primary.dark',
  },
  alignSelf: 'flex-end',
  animation: isFlying ? `${flyAnimation} 0.8s ease-in-out` : 'none',
  transformOrigin: 'center',
  '& .MuiSvgIcon-root': {
    transition: 'transform 0.3s ease',
  },
  '&:hover .MuiSvgIcon-root': {
    transform: 'rotate(45deg)',
  },
}));

const TechnicalContent = styled(Box)(({ theme }) => ({
            mt: 1,
            p: 1.5,
  backgroundColor: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '8px',
  overflowX: 'auto',
  ...scrollbarStyles,
            '& pre': {
               margin: 0, 
               whiteSpace: 'pre-wrap',
               wordBreak: 'break-word',
               color: 'inherit',
               fontFamily: 'monospace',
               fontSize: '0.875rem',
            }
}));

const ExpandButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  right: theme.spacing(1),
  top: theme.spacing(1),
  color: 'rgba(255, 255, 255, 0.7)',
  '&:hover': {
    color: 'rgba(255, 255, 255, 0.9)',
    transform: 'scale(1.1)',
  },
  transition: 'all 0.2s ease-in-out',
}));

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    backgroundColor: theme.palette.mode === 'dark' 
      ? 'rgba(10, 25, 41, 0.95)'
      : 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    maxWidth: '80vw',
    maxHeight: '80vh',
  },
  '& .MuiDialogTitle-root': {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing(2),
    borderBottom: `1px solid ${theme.palette.mode === 'dark' 
      ? 'rgba(255, 255, 255, 0.1)'
      : 'rgba(0, 0, 0, 0.1)'}`,
  },
  '& .MuiDialogContent-root': {
    padding: theme.spacing(3),
    ...scrollbarStyles,
    '& pre': {
      margin: 0,
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
      color: 'inherit',
      fontFamily: 'monospace',
      fontSize: '1rem',
      lineHeight: 1.5,
    }
  }
}));

function CollapsibleThinkingTrace({ content }) {
  const [open, setOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const theme = useTheme();

  const handleOpenDialog = (e) => {
    e.stopPropagation(); // Prevent the collapse from toggling
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  const formatContent = (content) => {
    try {
                let cleanedContent = content.trim();
                if (cleanedContent.startsWith('```json')) {
                  cleanedContent = cleanedContent.substring(7, cleanedContent.lastIndexOf('```')).trim();
                } else if (cleanedContent.startsWith('```')) {
                  cleanedContent = cleanedContent.substring(3, cleanedContent.lastIndexOf('```')).trim();
                }
                const parsed = JSON.parse(cleanedContent);
                return JSON.stringify(parsed, null, 2);
              } catch (e) {
                console.error('Failed to parse thinking trace JSON:', e);
                return content;
              }
  };

  return (
    <Box sx={{ mt: 1, width: '100%', position: 'relative' }}>
      <Button 
        onClick={() => setOpen(!open)}
        size="small"
        endIcon={open ? <ExpandMoreIcon /> : <ChevronRightIcon />}
        sx={{
          textTransform: 'none',
          color: theme.palette.mode === 'dark' 
            ? 'rgba(255, 255, 255, 0.7)' 
            : 'rgba(0, 0, 0, 0.5)', // Darker color for light mode
        }}
      >
        Lets get technical!
      </Button>
      <Collapse in={open}>
        <TechnicalContent>
          <ExpandButton onClick={handleOpenDialog} size="small">
            <OpenInFullIcon />
          </ExpandButton>
          <pre>{formatContent(content)}</pre>
        </TechnicalContent>
      </Collapse>

      <StyledDialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Technical Details
          <IconButton
            edge="end"
            color="inherit"
            onClick={handleCloseDialog}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <pre>{formatContent(content)}</pre>
        </DialogContent>
      </StyledDialog>
    </Box>
  );
}

function ChatPanel(props) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isFlying, setIsFlying] = useState(false);
  const messagesEndRef = useRef(null);
  const theme = useTheme();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    // Trigger flying animation
    setIsFlying(true);
    setTimeout(() => setIsFlying(false), 800); // Reset after animation completes

    // Add user message
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      // Send to backend
      const response = await fetch('http://localhost:6969/process_message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: input }),
      });

      const data = await response.json();
      
      console.log('Backend response data:', data);

      // Add assistant response and thinking trace
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: data.response },
        { role: 'thinking', content: data.thinking_trace }
      ]);
      
      // Trigger refresh in other panels
      if (props.onMessageProcessed) {
        props.onMessageProcessed();
      }

    } catch (error) {
      console.error('Error sending message:', error);
      console.log('Error details:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, there was an error processing your message.' 
      }]);
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <ChatContainer>
      <Typography variant="h6" gutterBottom>
        {'"Thought" interface'}
      </Typography>
      
      <MessagesContainer>
        {messages.reduce((acc, message, index) => {
          // Skip thinking trace messages, they are handled with the preceding assistant message
          if (message.role === 'thinking') {
            return acc; 
          }

          const isUser = message.role === 'user';
          const isAssistant = message.role === 'assistant';
          const nextMessage = messages[index + 1];
          const hasThinkingTrace = isAssistant && nextMessage && nextMessage.role === 'thinking';

          // If this message is an assistant message and has a thinking trace, group them
          if (isAssistant && hasThinkingTrace) {
            const groupKey = `${index}-${index + 1}`;
            const assistantAndThinkingGroup = (
              <Box key={groupKey} sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'flex-start', // Align the group to the LEFT
                width: '80%', // Match max width of bubbles
                marginLeft: '0', // Push the group to the LEFT
                marginRight: 'auto',
                marginBottom: theme.spacing(1),
              }}>
                {/* The assistant message bubble */}
                <MessageBubble
                  key={index}
                  isUser={isUser}
                  isThinking={false}
                  elevation={0}
                  sx={{ // Override margin/width to fit within the group Box
                    margin: '0',
                    width: '100%', // Take full width of the group Box
                    maxWidth: '100%', // Ensure it doesn't exceed group Box width
                    boxShadow: 'none', // Explicitly remove box shadow
                    elevation: 0, // Explicitly set elevation to 0 in sx
                  }}
                >
                   <Typography 
                    variant="body1"
                    sx={{
                      textAlign: isUser ? 'right' : 'left',
                      wordBreak: 'break-word',
                    }}
                  >
                    {message.content}
                  </Typography>
                </MessageBubble>
                {/* The collapsible thinking trace */}
                <Box sx={{
                  width: '100%', // Take full width of the group Box
                  // Adjust margin to connect to the message bubble above
                  marginTop: '-8px',
                  marginBottom: '0',
                  padding: '0 12px 12px 12px', // Add padding to match bubble internal padding on sides and bottom
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(0, 0, 0, 0.2)' // Darker background for the collapsible part
                    : 'rgba(255, 255, 255, 0.8)', // Lighter background for light mode
                  borderRadius: '0 0 12px 12px', // Rounded corners only at the bottom
                }}>
                   <CollapsibleThinkingTrace content={nextMessage.content} />
                </Box>
              </Box>
            );
            acc.push(assistantAndThinkingGroup);
          } else { // Render individual user messages or assistant messages WITHOUT thinking traces
             const messageBubble = (
              <MessageBubble
                key={index}
                isUser={isUser}
                isThinking={false}
                elevation={1} // Keep elevation for user messages, set to 0 for others if needed
                sx={{ // Ensure individual messages are also correctly aligned
                  marginLeft: isUser ? 'auto' : '0', // User messages right
                  marginRight: isUser ? '0' : 'auto', // AI messages left
                  width: isUser ? 'fit-content' : 'auto',
                  maxWidth: '80%',
                  // Explicitly remove box shadow for non-user messages
                  boxShadow: isUser ? undefined : 'none',
                  elevation: isUser ? undefined : 0, // Explicitly remove elevation for non-user messages
                }}
              >
                 <Typography 
                    variant="body1"
                    sx={{
                      textAlign: isUser ? 'right' : 'left',
                      wordBreak: 'break-word',
                    }}
                  >
                    {message.content}
                  </Typography>
              </MessageBubble>
            );
             acc.push(messageBubble);
          }

          return acc;
        }, [])}
        <div ref={messagesEndRef} />
      </MessagesContainer>

      {messages.length === 0 && (
        <Watermark>
          <PsychologyIcon sx={{ fontSize: 60, mb: 1 }} />
          <Typography variant="h5" sx={{ fontWeight: 300 }}>
            Ready to dissect the mind of an agent?
          </Typography>
        </Watermark>
      )}

      <InputContainer>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          multiline
          maxRows={4}
          sx={{
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: 'transparent',
              },
              '&:hover fieldset': {
                borderColor: 'transparent',
              },
              '&.Mui-focused fieldset': {
                borderColor: 'transparent',
              },
            },
          }}
        />
        <FlyingSendButton
          color="primary"
          onClick={handleSend}
          disabled={!input.trim()}
          isFlying={isFlying}
        >
          <SendIcon />
        </FlyingSendButton>
      </InputContainer>
    </ChatContainer>
  );
}

export default ChatPanel; 