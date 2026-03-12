import Head from "next/head";
import { useState } from "react";
import s from "@/styles/Chat.module.css";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

let msgId = 0;

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: msgId++,
      role: "assistant",
      content:
        "안녕하세요! WHYDLAB BIZ AI 비서입니다. 사업자 정보, 계약, 자금, 고객 관리 등 업무에 관해 무엇이든 물어보세요.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: msgId++,
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // TODO: 실제 AI API 연동 시 교체
    setTimeout(() => {
      const botMsg: Message = {
        id: msgId++,
        role: "assistant",
        content:
          "현재 AI 비서 기능을 준비 중입니다. 곧 시스템의 모든 데이터를 기반으로 업무를 도와드릴 수 있게 됩니다.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
      setLoading(false);
    }, 800);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      <Head>
        <title>AI 비서 - WHYDLAB BIZ</title>
      </Head>
      <div className={s.container}>
        <div className={s.chatArea}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`${s.message} ${
                msg.role === "user" ? s.messageUser : s.messageBot
              }`}
            >
              {msg.role === "assistant" && (
                <div className={s.avatar}>🤖</div>
              )}
              <div className={s.bubble}>
                <p>{msg.content}</p>
                <span className={s.time}>
                  {msg.timestamp.toLocaleTimeString("ko-KR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          ))}
          {loading && (
            <div className={`${s.message} ${s.messageBot}`}>
              <div className={s.avatar}>🤖</div>
              <div className={s.bubble}>
                <div className={s.typing}>
                  <span /><span /><span />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={s.inputArea}>
          <textarea
            className={s.input}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메시지를 입력하세요..."
            rows={1}
          />
          <button
            className={s.sendBtn}
            onClick={sendMessage}
            disabled={!input.trim() || loading}
          >
            전송
          </button>
        </div>
      </div>
    </>
  );
}
