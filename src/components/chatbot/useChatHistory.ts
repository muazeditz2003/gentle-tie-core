import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Msg, Conversation } from "./types";

const LOCAL_KEY = "chatbot_history";

function getLocalHistory(): { messages: Msg[]; conversations: Conversation[] } {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { messages: [], conversations: [] };
}

function setLocalHistory(messages: Msg[]) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify({ messages, conversations: [] }));
  } catch {}
}

export function useChatHistory() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  // Load conversations for logged-in users
  useEffect(() => {
    if (!user) {
      const local = getLocalHistory();
      setMessages(local.messages);
      setHistoryLoaded(true);
      return;
    }

    const loadConversations = async () => {
      const { data } = await supabase
        .from("chatbot_conversations")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(20);

      if (data && data.length > 0) {
        setConversations(data as Conversation[]);
        // Load most recent conversation
        const latest = data[0];
        setActiveConversationId(latest.id);
        const { data: msgs } = await supabase
          .from("chatbot_messages")
          .select("*")
          .eq("conversation_id", latest.id)
          .order("created_at", { ascending: true });
        if (msgs) {
          setMessages(msgs.map((m: any) => ({ role: m.role as "user" | "assistant", content: m.content })));
        }
      }
      setHistoryLoaded(true);
    };

    loadConversations();
  }, [user]);

  const saveMessage = useCallback(async (msg: Msg, conversationId: string | null) => {
    if (!user) {
      // Save to localStorage for anonymous users
      setLocalHistory([...messages, msg]);
      return conversationId;
    }

    let convId = conversationId;
    if (!convId) {
      // Create new conversation
      const title = msg.role === "user" ? msg.content.slice(0, 50) : "New conversation";
      const { data } = await supabase
        .from("chatbot_conversations")
        .insert({ user_id: user.id, title })
        .select()
        .single();
      if (data) {
        convId = data.id;
        setActiveConversationId(convId);
        setConversations(prev => [data as Conversation, ...prev]);
      }
    } else {
      // Update conversation timestamp
      await supabase
        .from("chatbot_conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", convId);
    }

    if (convId) {
      await supabase.from("chatbot_messages").insert({
        conversation_id: convId,
        role: msg.role,
        content: msg.content,
      });
    }

    return convId;
  }, [user, messages]);

  const loadConversation = useCallback(async (convId: string) => {
    setActiveConversationId(convId);
    const { data: msgs } = await supabase
      .from("chatbot_messages")
      .select("*")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });
    if (msgs) {
      setMessages(msgs.map((m: any) => ({ role: m.role as "user" | "assistant", content: m.content })));
    }
  }, []);

  const startNewConversation = useCallback(() => {
    setActiveConversationId(null);
    setMessages([]);
  }, []);

  const deleteConversation = useCallback(async (convId: string) => {
    if (!user) return;
    await supabase.from("chatbot_conversations").delete().eq("id", convId);
    setConversations(prev => prev.filter(c => c.id !== convId));
    if (activeConversationId === convId) {
      setActiveConversationId(null);
      setMessages([]);
    }
  }, [user, activeConversationId]);

  return {
    conversations,
    activeConversationId,
    messages,
    setMessages,
    saveMessage,
    loadConversation,
    startNewConversation,
    deleteConversation,
    historyLoaded,
  };
}
