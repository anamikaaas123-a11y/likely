"use client";

import { useEffect, useRef, useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type Chat = {
  id: string;
  title: string;
  messages: Message[];
};

export default function Home() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentId, setCurrentId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [ready, setReady] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("likely-chats");

    if (saved) {
      try {
        const parsed: Chat[] = JSON.parse(saved);
        setChats(parsed);
      } catch {
        setChats([]);
      }
    }

    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) {
      localStorage.setItem("likely-chats", JSON.stringify(chats));
    }
  }, [chats, ready]);

  function createNewChat() {
    setCurrentId("");
    setMessages([]);
    setQuestion("");
    setEditingIndex(null);
    inputRef.current?.focus();
  }

  function openChat(chat: Chat) {
  console.log("Opening chat:", chat);

  setCurrentId(chat.id);
  setMessages(chat.messages);
  setQuestion("");
  setEditingIndex(null);
}

  function deleteChat(id: string) {
    const updated = chats.filter((chat) => chat.id !== id);
    setChats(updated);

    if (currentId === id) {
      createNewChat();
    }
  }

  function editMessage(index: number) {
    setQuestion(messages[index].content);
    setEditingIndex(index);
    inputRef.current?.focus();
  }

  async function handleSend() {
    const text = question.trim();

    if (!text || loading) return;

    const previousMessages =
      editingIndex !== null
        ? messages.slice(0, editingIndex)
        : messages;

    const updatedMessages: Message[] = [
      ...previousMessages,
      { role: "user", content: text },
    ];

    const chatId = currentId || crypto.randomUUID();

    setCurrentId(chatId);
    setMessages(updatedMessages);
    setQuestion("");
    setEditingIndex(null);
    setLoading(true);

    const newChat: Chat = {
      id: chatId,
      title: text.slice(0, 45),
      messages: updatedMessages,
    };

    setChats((previous) => [
      newChat,
      ...previous.filter((chat) => chat.id !== chatId),
    ]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      const finalMessages: Message[] = [
        ...updatedMessages,
        {
          role: "assistant",
          content: data.answer || "I couldn't generate an answer.",
        },
      ];

      setMessages(finalMessages);

      setChats((previous) =>
        previous.map((chat) =>
          chat.id === chatId
            ? { ...chat, messages: finalMessages }
            : chat
        )
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Please try again.";

      const finalMessages: Message[] = [
        ...updatedMessages,
        {
          role: "assistant",
          content: `Error: ${errorMessage}`,
        },
      ];

      setMessages(finalMessages);

      setChats((previous) =>
        previous.map((chat) =>
          chat.id === chatId
            ? { ...chat, messages: finalMessages }
            : chat
        )
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="likely-layout">

      {/* SIDEBAR */}

      <aside className={`history-sidebar ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>

        <div className="sidebar-top">
          <span className="brand">likely.</span>

          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(false)}
            title="Close sidebar"
          >
            ✕
          </button>
        </div>

        <button className="new-chat-button" onClick={createNewChat}>
          + New Chat
        </button>

        <div className="history-heading">CHAT HISTORY</div>

        <div className="history-list">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`history-item ${currentId === chat.id ? "active" : ""}`}
            >
              <button
                className="history-title"
                onClick={() => openChat(chat)}
              >
                {chat.title}
              </button>

              <button
                className="delete-chat"
                onClick={() => deleteChat(chat.id)}
                title="Delete chat"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <div className="sidebar-bottom">
          Your AI research partner
        </div>

      </aside>

      {/* MAIN CHAT */}

      <main className="chat-main">

        <header className="chat-header">

          {!sidebarOpen && (
            <button
              className="sidebar-toggle"
              onClick={() => setSidebarOpen(true)}
            >
              ☰
            </button>
          )}

          <span className="header-brand">likely.</span>

          <span className="header-subtitle">
            AI Research Partner
          </span>

        </header>

        <section className="conversation">

          {messages.length === 0 ? (

            <div className="welcome">

              <h1>What would you like to explore?</h1>

              <p>
                Research, learn, create and discover with Likely.
              </p>

            </div>

          ) : (

            <div className="messages">

              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`message-row ${message.role}`}
                >

                  {message.role === "assistant" && (
                    <div className="assistant-avatar">L</div>
                  )}

                  <div className="message-content">

                    {message.role === "assistant" && (
                       <div className="message-label">Likely</div>
                    )}

                    <div className="message-text">
                      {message.content}
                    </div>

                    {message.role === "user" && (
                     <button
                      className="edit-message"
                      onClick={() => editMessage(index)}
                      title="Edit message"
                      aria-label="Edit message"
                     >
                      ✎
                     </button>
                    )}

                  </div>

                </div>

              ))}

              {loading && (
                <div className="thinking-dog">
                  <div className="dog-animation">
                    <span className="running-dog">🐕</span>
                    <span className="dog-bone">🦴</span>
                  </div>

                  <p>Likely is thinking...</p>
                </div>
              )}

            </div>

          )}

        </section>

        {/* MESSAGE BAR AND CREATION OPTIONS */}

        <div className="composer-area">

          {editingIndex !== null && (
            <div className="editing-notice">
              Editing previous message

              <button
                onClick={() => {
                  setEditingIndex(null);
                  setQuestion("");
                }}
              >
                Cancel
              </button>
            </div>
          )}

          <div className="composer">

            <textarea
              ref={inputRef}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask Likely anything..."
              rows={2}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />

            <div className="composer-tools">

              <div className="creation-options">

                <a href="/create" className="tool-option">
                  📄 <span>PDF</span>
                </a>

                <a href="/image" className="tool-option">
                  🖼️ <span>Image</span>
                </a>

                <a href="/video" className="tool-option">
                  🎬 <span>Video</span>
                </a>

              </div>

              <button
                className="send-button"
                onClick={handleSend}
                disabled={loading || !question.trim()}
                title="Send message"
              >
                ↑
              </button>

            </div>

          </div>

          <p className="composer-footer">
            Likely can make mistakes. Verify important information.
          </p>

        </div>

      </main>

    </div>
  );
}