import { useNavigate, Link } from "react-router-dom";
import { MessageSquare, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import AppLayout from "@/components/AppLayout";

const Messages = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [loading, user, navigate]);

  const { data: conversations = [] } = useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: async () => {
      const { data: sent } = await supabase
        .from("messages")
        .select("receiver_id, created_at, message_text")
        .eq("sender_id", user!.id)
        .order("created_at", { ascending: false });

      const { data: received } = await supabase
        .from("messages")
        .select("sender_id, created_at, message_text")
        .eq("receiver_id", user!.id)
        .order("created_at", { ascending: false });

      const userMap = new Map<string, { lastMessage: string; time: string }>();
      [...(sent || []), ...(received || [])].forEach((m: any) => {
        const otherId = m.receiver_id || m.sender_id;
        if (!userMap.has(otherId)) {
          userMap.set(otherId, { lastMessage: m.message_text, time: m.created_at });
        }
      });

      const ids = Array.from(userMap.keys());
      if (!ids.length) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", ids);

      return ids.map(id => {
        const p = profiles?.find((pr: any) => pr.user_id === id);
        const info = userMap.get(id)!;
        return { userId: id, name: p?.full_name || "Unknown", avatarUrl: p?.avatar_url, lastMessage: info.lastMessage, time: info.time };
      });
    },
    enabled: !!user,
  });

  const filteredConversations = useMemo(() => {
    if (!search.trim()) return conversations;
    const q = search.toLowerCase();
    return conversations.filter((c: any) => c.name.toLowerCase().includes(q) || c.lastMessage.toLowerCase().includes(q));
  }, [conversations, search]);

  if (loading) return null;

  return (
    <AppLayout title="Messages" subtitle="Chat with nearby helpers and confirm work quickly.">
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search conversations..." className="h-11 rounded-xl pl-10" />
        </div>

        {filteredConversations.length === 0 ? (
          <div className="rounded-2xl border bg-muted/30 py-16 text-center">
            <MessageSquare className="mx-auto mb-2 h-9 w-9 text-muted-foreground" />
            <p className="font-medium text-foreground">No conversations yet</p>
            <p className="text-sm text-muted-foreground">Start by messaging a worker from Explore.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredConversations.map((c: any) => (
              <Link
                key={c.userId}
                to={`/chat/${c.userId}`}
                className="tap-feedback flex items-center gap-4 rounded-2xl border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-md"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent text-sm font-bold text-accent-foreground">
                  {c.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-card-foreground">{c.name}</p>
                  <p className="truncate text-sm text-muted-foreground">{c.lastMessage}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{new Date(c.time).toLocaleDateString()}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Messages;
