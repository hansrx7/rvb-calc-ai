// src/components/chat/ChatMessage.tsx

import { useState, useEffect } from 'react';

interface ChatMessageProps {
    role: 'user' | 'assistant' | 'system';
    content: string;
  }
  
  export function ChatMessage({ role, content }: ChatMessageProps) {
    const isUser = role === 'user';
    const [displayedContent, setDisplayedContent] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    
    // Typewriter effect for assistant messages
    useEffect(() => {
      if (isUser) {
        setDisplayedContent(content);
        return;
      }
      
      setIsTyping(true);
      const words = content.split(' ');
      let currentIndex = 0;
      
      const typeNextWord = () => {
        if (currentIndex < words.length) {
          setDisplayedContent(prev => prev + (currentIndex === 0 ? '' : ' ') + words[currentIndex]);
          currentIndex++;
          setTimeout(typeNextWord, 100); // 100ms delay between words
        } else {
          setIsTyping(false);
        }
      };
      
      // Start typing after a short delay
      setTimeout(typeNextWord, 200);
    }, [content, isUser]);
    
    // Handle "Pro tip:" styling
    const formatContent = (text: string) => {
      return text.split('\n').map((line, index) => {
        if (line.includes('Pro tip:')) {
          const parts = line.split('Pro tip:');
          return (
            <div key={index}>
              {parts[0]}
              <span className="pro-tip">Pro tip:</span>
              {parts[1]}
            </div>
          );
        }
        return <div key={index}>{line}</div>;
      });
    };
    
    return (
      <div className={`message ${isUser ? 'user-message' : 'assistant-message'}`}>
        <div className={`message-bubble ${isUser ? 'user-bubble' : 'assistant-bubble'}`}>
          {formatContent(displayedContent)}
          {isTyping && <span className="typing-cursor">|</span>}
        </div>
      </div>
    );
  }