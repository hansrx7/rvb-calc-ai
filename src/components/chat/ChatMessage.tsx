// src/components/chat/ChatMessage.tsx

import { useState, useEffect } from 'react';

interface ChatMessageProps {
    role: 'user' | 'assistant' | 'system';
    content: string;
    delay?: number;
  }
  
  export function ChatMessage({ role, content, delay = 0 }: ChatMessageProps) {
    const isUser = role === 'user';
    const [visibleWords, setVisibleWords] = useState<number[]>([]);
    const [isVisible, setIsVisible] = useState(false);
    
    // Message bubble fade-in with delay
    useEffect(() => {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, delay);
      
      return () => clearTimeout(timer);
    }, [delay]);
    
    // Word-by-word fade-in for assistant messages
    useEffect(() => {
      if (isUser || !isVisible) {
        return;
      }
      
      const words = content.split(' ');
      setVisibleWords([]);
      
      words.forEach((_, index) => {
        setTimeout(() => {
          setVisibleWords(prev => [...prev, index]);
        }, index * 50); // 50ms delay between each word
      });
    }, [content, isUser, isVisible]);
    
    // Handle "Pro tip:" styling with word fade-in
    const formatContent = (text: string) => {
      if (isUser) {
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
      }
      
      // For assistant messages, apply word-by-word fade-in
      return text.split('\n').map((line, lineIndex) => {
        if (line.includes('Pro tip:')) {
          const parts = line.split('Pro tip:');
          const words = parts[0].split(' ');
          const afterWords = parts[1].split(' ');
          
          return (
            <div key={lineIndex}>
              {words.map((word, wordIndex) => (
                <span 
                  key={wordIndex}
                  className={`fade-word ${visibleWords.includes(wordIndex) ? 'visible' : ''}`}
                >
                  {word}{wordIndex < words.length - 1 ? ' ' : ''}
                </span>
              ))}
              <span className="pro-tip">Pro tip:</span>
              {afterWords.map((word, wordIndex) => (
                <span 
                  key={`after-${wordIndex}`}
                  className={`fade-word ${visibleWords.includes(words.length + 1 + wordIndex) ? 'visible' : ''}`}
                >
                  {word}{wordIndex < afterWords.length - 1 ? ' ' : ''}
                </span>
              ))}
            </div>
          );
        }
        
        const words = line.split(' ');
        return (
          <div key={lineIndex}>
            {words.map((word, wordIndex) => (
              <span 
                key={wordIndex}
                className={`fade-word ${visibleWords.includes(wordIndex) ? 'visible' : ''}`}
              >
                {word}{wordIndex < words.length - 1 ? ' ' : ''}
              </span>
            ))}
          </div>
        );
      });
    };
    
    return (
      <div className={`message ${isUser ? 'user-message' : 'assistant-message'} ${isVisible ? 'visible' : ''}`}>
        <div className={`message-bubble ${isUser ? 'user-bubble' : 'assistant-bubble'}`}>
          {formatContent(content)}
        </div>
      </div>
    );
  }