import { useState, useEffect, useRef } from "react";
import { Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface Props {
  otherUserId: string;
  otherUserName: string;
}

const ChatWindow = ({ otherUserId, otherUserName }: Props) => {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery({
    queryKey: ["messages", user?.id, otherUserId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${user!.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user!.id})`
        )
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user && !!otherUserId,
    refetchInterval: false,
  });

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channelName = `chat-${user.id}-${otherUserId}-${Math.random().toString(36).slice(2)}`;
    const channel = supabase.channel(channelName);
    channel.on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new as any;
          if (
            (msg.sender_id === user.id && msg.receiver_id === otherUserId) ||
            (msg.sender_id === otherUserId && msg.receiver_id === user.id)
          ) {
            queryClient.invalidateQueries({ queryKey: ["messages", user.id, otherUserId] });
            queryClient.invalidateQueries({ queryKey: ["conversations"] });
          }
        }
      );
    channel.subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, otherUserId, queryClient]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Mark received messages as seen
  useEffect(() => {
    if (!user || !messages.length) return;
    const unseen = messages.filter(
      (m: any) => m.receiver_id === user.id && m.status !== "seen"
    );
    if (unseen.length > 0) {
      supabase
        .from("messages")
        .update({ status: "seen" })
        .in("id", unseen.map((m: any) => m.id))
        .then();
    }
  }, [messages, user]);

  const handleSend = async () => {
    if (!text.trim() || !user || sending) return;
    setSending(true);
    await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id: otherUserId,
      message_text: text.trim(),
    });
    setText("");
    setSending(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b bg-card">
        <h3 className="font-semibold text-card-foreground">{otherUserName}</h3>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg: any) => {
          const isMine = msg.sender_id === user?.id;
          return (
            <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
                  isMine
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-muted text-foreground rounded-bl-md"
                }`}
              >
                <p>{msg.message_text}</p>
                <p className={`text-[10px] mt-1 ${isMine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  {isMine && <span className="ml-1">· {msg.status}</span>}
                </p>
              </div>
            </div>
          );
        })}
        {messages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">No messages yet. Say hello!</p>
        )}
      </div>

      <div className="p-4 border-t bg-card">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex gap-2"
        >
          <Input
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={!text.trim() || sending}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
