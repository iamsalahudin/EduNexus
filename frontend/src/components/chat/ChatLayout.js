"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import ConversationList from "./ConversationList";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import { uid } from "./chatStore";
import { sendToApi, fetchSessions, fetchMessages } from "./api";
import { useRouter, usePathname } from "next/navigation";
import { invalidateApiCache } from "@/services/api";

const WRITE_OPS = new Set(['insertOne', 'updateOne', 'updateMany', 'deleteOne', 'deleteMany', 'writeBatch']);
const COLLECTION_TO_PATH = {
  attendances: '/attendance',
  attendanceassignments: '/attendance',
  attendanceleaverequests: '/attendance',
  students: '/students',
  teachers: '/teachers',
  exams: '/exams',
  examconfigs: '/exams',
  exammarks: '/marksheets',
  marksheets: '/marksheets',
  reportcards: '/reportcards',
  fees: '/fees',
  feevouchertemplates: '/fees',
  homeworks: '/homeworks',
  complaints: '/complaints',
  complaintcategories: '/complaints',
  classes: '/classes',
  schoolclasses: '/classes',
  subjects: '/subjects',
  users: '/users',
  parents: '/parents',
  staffattendances: '/staff-attendance',
  salarystaffs: '/salary',
  timetables: '/timetables',
  dailydiaries: '/daily-diary',
  notifications: '/notifications',
  transportroutes: '/transport',
  hostels: '/hostel',
  libraryissues: '/library',
  syllabi: '/syllabus',
  gradescales: '/grade-scales',
  departments: '/departments',
};

function notifyAgentWrote(meta) {
  if (typeof window === 'undefined') return;
  const op = meta?.operation;
  if (!op || !WRITE_OPS.has(op)) return;
  const cols = new Set();
  if (meta.collection) cols.add(String(meta.collection).toLowerCase());
  if (Array.isArray(meta.subCollections)) meta.subCollections.forEach((c) => c && cols.add(String(c).toLowerCase()));
  for (const c of cols) {
    const path = COLLECTION_TO_PATH[c];
    if (path) invalidateApiCache(path);
  }
  window.dispatchEvent(new CustomEvent('edunexus:data-changed', { detail: { operation: op, collections: Array.from(cols) } }));
}

// default input height in px — used to pad messages so they don't get hidden
const INPUT_HEIGHT = 96;

export default function ChatLayout({ mode = "full" }) {
  // mode: 'full' -> full page (input fixed to viewport)
  // mode: 'panel' -> compact popup (input positioned inside the panel)
  const router = useRouter();
  const bottomRef = useRef(null);
  const thispath = usePathname();

  const [sessions, setSessions] = useState([]);
  const [currentId, setCurrentId] = useState(null);
  const [messagesBySession, setMessagesBySession] = useState({});
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)

  useEffect(() => {
    let mounted = true;
    async function loadSessions() {
      try {
        setLoadingSessions(true);
        const list = await fetchSessions();
        if (!mounted) return;
        setSessions(list);
        if (list.length) {
          setCurrentId(list[0].sessionKey);
          await ensureMessages(list[0].sessionKey);
        }
      } finally {
        setLoadingSessions(false);
      }
    }
    loadSessions();
    function handleNewChat() {
      startConversation();
    }
    window.addEventListener('chat-new', handleNewChat);
    return () => {
      mounted = false;
      window.removeEventListener('chat-new', handleNewChat);
    };
  }, []);

  // mobile drawer toggle for conversations list
  useEffect(() => {
    if (mode !== 'full') return

    function onToggle() {
      setMobileDrawerOpen((v) => !v)
    }
    function onClose() {
      setMobileDrawerOpen(false)
    }

    window.addEventListener('chat-toggle-conversations', onToggle)
    window.addEventListener('chat-close-conversations', onClose)
    return () => {
      window.removeEventListener('chat-toggle-conversations', onToggle)
      window.removeEventListener('chat-close-conversations', onClose)
    }
  }, [mode])

  // auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesBySession, currentId]);

  function mapServerMessages(msgs = []) {
    return msgs.map((m) => ({
      id: m._id || uid("m_"),
      role: m.senderType === "user" ? "user" : "assistant",
      text: m.text || "",
      data: m.data,
      actions: m.actions,
      chart: m.data?.type === "chart" ? m.data : null,
      attachments: m.attachments || [],
      createdAt: m.createdAt,
    }));
  }

  async function ensureMessages(sessionKey) {
    if (!sessionKey) return;
    if (Object.prototype.hasOwnProperty.call(messagesBySession, sessionKey)) return;
    try {
      setLoadingMessages(true);
      const { messages } = await fetchMessages(sessionKey);
      const mapped = mapServerMessages(messages || []);
      setMessagesBySession((prev) => ({ ...prev, [sessionKey]: mapped }));
    } finally {
      setLoadingMessages(false);
    }
  }

  function startConversation() {
    const sessionKey = uid("s_");
    const now = new Date().toISOString();
    const s = {
      sessionKey,
      title: "New Chat",
      status: "open",
      lastMessageAt: now,
      lastMessagePreview: "",
      createdAt: now,
      updatedAt: now,
    };
    setSessions((prev) => [s, ...prev]);
    setMessagesBySession((prev) => ({ ...prev, [sessionKey]: [] }));
    setCurrentId(sessionKey);
    return sessionKey;
  }

  async function sendMessage(text) {
    const id = currentId || startConversation();

    // append user message
    setMessagesBySession((prev) => {
      const list = prev[id] || [];
      return {
        ...prev,
        [id]: [...list, { id: uid("m_"), role: "user", text }],
      };
    });

    // optimistic assistant placeholder
    const placeholderId = uid("m_");
    setMessagesBySession((prev) => {
      const list = prev[id] || [];
      return {
        ...prev,
        [id]: [...list, { id: placeholderId, role: "assistant", text: "", loading: true }],
      };
    });

    // call API with retries handled inside
    const res = await sendToApi({ conversationId: id, message: text });

    // If the agent performed a write, bust the matching api cache + notify pages so the UI refreshes.
    try {
      const meta = res?.data || {};
      const subCols = Array.isArray(res?.data?.subResults)
        ? res.data.subResults.map((s) => s?.collection || s?.result?.collection).filter(Boolean)
        : [];
      notifyAgentWrote({ operation: meta.operation, collection: meta.collection, subCollections: subCols });
    } catch (_) {}

    // update placeholder with real response
    setMessagesBySession((prev) => {
      const list = prev[id] || [];
      return {
        ...prev,
        [id]: list.map((m) =>
          m.id === placeholderId
            ? {
                ...m,
                loading: false,
                text: res.reply,
                data: res.data,
                chart: res.chart,
                actions: res.actions,
                attachments: res.attachments || [],
              }
            : m
        ),
      };
    });

    // update session metadata (preview + timestamp)
    const now = new Date().toISOString();
    setSessions((prev) => {
      const exists = prev.find((s) => s.sessionKey === id);
      const updated = exists
        ? prev.map((s) =>
            s.sessionKey === id
              ? {
                  ...s,
                  lastMessageAt: now,
                  lastMessagePreview: res.reply,
                  status: 'open',
                }
              : s
          )
        : [
            {
              sessionKey: id,
              title: 'Chat',
              status: 'open',
              lastMessageAt: now,
              lastMessagePreview: res.reply,
            },
            ...prev,
          ];
      return updated;
    });
  }

  function handleNavigate(path) {
    // minimize popup if present
    window.dispatchEvent(new Event("minimize-chat"));
    // navigate
    router.push(path);
  }

  const currentMessages = messagesBySession[currentId] || [];

  // PANEL mode: the input will be absolutely positioned inside the panel container (not fixed)
  // FULL mode: the input will be fixed to viewport bottom
  const isFull = mode === "full";

  return (
    <div
      className={`w-full relative flex ${
        isFull ? "h-[calc(100dvh-104px)] flex-row" : "h-full flex-col"
      } bg-white overflow-x-hidden`}
    >
      {/* Mobile conversations drawer (slides in) */}
      {isFull ? (
        <>
          <div
            className={`fixed left-0 right-0 bottom-0 top-[104px] z-30 bg-black/40 transition-opacity duration-300 md:hidden ${
              mobileDrawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            onClick={() => setMobileDrawerOpen(false)}
            aria-hidden
          />
          <div
            className={`fixed left-0 top-[104px] bottom-0 z-40 md:hidden transform transition-transform duration-300 ${
              mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <ConversationList
              variant="drawer"
              widthClass="w-72"
              className="h-full"
              conversations={sessions}
              currentId={currentId}
              onSelect={(id) => {
                setCurrentId(id)
                ensureMessages(id)
                setMobileDrawerOpen(false)
              }}
            />
          </div>
        </>
      ) : null}

      {/* Sidebar only in full mode */}
      {isFull && (
        <ConversationList
          conversations={sessions}
          currentId={currentId}
          onSelect={(id) => {
            setCurrentId(id);
            ensureMessages(id);
          }}
        />
      )}

      {/* CHAT COLUMN */}
      <div className="relative flex-1 flex flex-col min-h-0 min-w-0">
        {/* MESSAGES */}
        <div
          className="flex-1 px-3 overflow-y-auto overflow-x-hidden pt-6
          [&::-webkit-scrollbar]:w-2
       [&::-webkit-scrollbar-track]:bg-[var(--color-bg)]
      [&::-webkit-scrollbar-thumb]:bg-neutral-500
        [&::-webkit-scrollbar-thumb]:rounded-full"
          style={{
            paddingBottom: isFull ? INPUT_HEIGHT + 24 : INPUT_HEIGHT + 16,
          }}
        >
          {loadingSessions || (loadingMessages && !currentMessages.length) ? (
            <div className="text-sm text-gray-500">Loading chat...</div>
          ) : (
            <MessageList
              messages={currentMessages}
              onNavigate={handleNavigate}
            />
          )}
          <div ref={bottomRef} />
        </div>

        {/* INPUT */}
        {isFull ? (
          /* FULL PAGE: fixed to viewport */
          <div
            className="w-full sticky right-0 bottom-0 z-10 border-t bg-[var(--color-bg)]"
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
              className="shrink-0 border-t bg-[var(--color-bg)]"
              style={{ height: INPUT_HEIGHT }}
            >
              <MessageInput onSend={sendMessage} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
