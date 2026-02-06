"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import ConversationList from "./ConversationList";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import { uid, loadConversations, saveConversations } from "./chatStore";
import { sendToApi } from "./api";
import { useRouter, usePathname } from "next/navigation";

// default input height in px — used to pad messages so they don't get hidden
const INPUT_HEIGHT = 96;

export default function ChatLayout({ mode = "full" }) {
  // mode: 'full' -> full page (input fixed to viewport)
  // mode: 'panel' -> compact popup (input positioned inside the panel)
  const router = useRouter();
  const bottomRef = useRef(null);
  const thispath = usePathname();

  const [conversations, setConversations] = useState([]);
  const [currentId, setCurrentId] = useState(null);

  useEffect(() => {
    const data = loadConversations();
    setConversations(data);
    if (data.length) setCurrentId(data[0].id);
  }, []);

  useEffect(() => {
    saveConversations(conversations);
  }, [conversations]);

  // auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversations, currentId]);

  function startConversation() {
    const c = {
      id: uid("c_"),
      title: "New Chat",
      messages: [],
      updatedAt: new Date().toISOString(),
    };
    setConversations((s) => [c, ...s]);
    setCurrentId(c.id);
    return c.id;
  }

  async function sendMessage(text) {
    const id = currentId || startConversation();

    // append user message
    setConversations((cs) =>
      cs.map((c) =>
        c.id === id
          ? {
              ...c,
              messages: [...c.messages, { id: uid("m_"), role: "user", text }],
              updatedAt: new Date().toISOString(),
            }
          : c
      )
    );

    // call API
    const res = await sendToApi({ conversationId: id, message: text });

    // append assistant response
    setConversations((cs) =>
      cs.map((c) =>
        c.id === id
          ? {
              ...c,
              messages: [
                ...c.messages,
                {
                  id: uid("m_"),
                  role: "assistant",
                  text: res.reply,
                  data: res.data,
                  chart: res.chart,
                  actions: res.actions,
                },
              ],
              updatedAt: new Date().toISOString(),
            }
          : c
      )
    );
  }

  function handleNavigate(path) {
    // minimize popup if present
    window.dispatchEvent(new Event("minimize-chat"));
    // navigate
    router.push(path);
  }

  const current = conversations.find((c) => c.id === currentId);

  // PANEL mode: the input will be absolutely positioned inside the panel container (not fixed)
  // FULL mode: the input will be fixed to viewport bottom
  const isFull = mode === "full";

  return (
    <div
      className={`w-full relative flex ${
        isFull ? "h-[calc(100vh-72px)] flex-row" : "h-full flex-col"
      } bg-white`}
    >
      {/* Sidebar only in full mode */}
      {isFull && (
        <ConversationList
          conversations={conversations}
          currentId={currentId}
          onSelect={setCurrentId}
        />
      )}

      {/* CHAT COLUMN */}
      <div className="relative flex-1 flex flex-col min-h-0">
        {/* MESSAGES */}
        <div
          className="flex-1 px-3 overflow-y-auto pt-6
          [&::-webkit-scrollbar]:w-2
       [&::-webkit-scrollbar-track]:bg-[--color-bg]
      [&::-webkit-scrollbar-thumb]:bg-neutral-500
        [&::-webkit-scrollbar-thumb]:rounded-full"
          style={{
            paddingBottom: isFull ? INPUT_HEIGHT + 24 : INPUT_HEIGHT + 16,
          }}
        >
          <MessageList
            messages={current?.messages || []}
            onNavigate={handleNavigate}
          />
          <div ref={bottomRef} />
        </div>

        {/* INPUT */}
        {isFull ? (
          /* FULL PAGE: fixed to viewport */
          <div
            className="w-full sticky right-0 bottom-0 z-10 border-t bg-[--color-bg]"
            style={{ height: INPUT_HEIGHT }}
          >
            <div className="max-w-[1200px] mx-auto">
              <MessageInput onSend={sendMessage} />
            </div>
          </div>
        ) : (
          /* COMPACT PANEL: stays inside panel */
          <>
            <div
              className="shrink-0 border-t bg-[--color-bg]"
              style={{ height: INPUT_HEIGHT }}
            >
              <MessageInput onSend={sendMessage} />
            </div>
            <div className="flex justify-center items-center text-[--color-primary] text-sm py-2">
              <Link href={`/${thispath.split("/")[1]}/chat`}>
                Full Page View
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
