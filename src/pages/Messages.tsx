import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, MessageSquare } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

const Messages = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

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

  if (loading) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold text-foreground mb-6 flex items-center gap-2">
          <MessageSquare className="w-7 h-7 text-primary" /> Messages
        </h1>

        {conversations.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No conversations yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((c: any) => (
              <Link
                key={c.userId}
                to={`/chat/${c.userId}`}
                className="flex items-center gap-4 p-4 bg-card border rounded-xl hover:border-primary/30 hover:shadow-md transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-sm font-bold text-accent-foreground shrink-0">
                  {c.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-card-foreground">{c.name}</p>
                  <p className="text-sm text-muted-foreground truncate">{c.lastMessage}</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {new Date(c.time).toLocaleDateString()}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Messages;
