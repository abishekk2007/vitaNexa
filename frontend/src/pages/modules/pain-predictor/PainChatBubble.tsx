import { ChatMessage } from './types';
import TypingDots from './TypingDots';

interface PainChatBubbleProps {
  message: ChatMessage;
  isTyping?: boolean;
}

export default function PainChatBubble({ message, isTyping }: PainChatBubbleProps) {
  const isUser = message.sender === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-slide-up`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-gradient-to-r from-sky-500 to-emerald-500 text-white rounded-br-md shadow-sm'
            : 'bg-slate-100 text-slate-800 rounded-bl-md'
        }`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
        <p className={`text-[10px] mt-1 ${isUser ? 'text-white/70' : 'text-slate-400'}`}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
      {isTyping && <TypingDots />}
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-slide-up { animation: fadeSlideUp 0.3s ease-out; }
      `}</style>
    </div>
  );
}
