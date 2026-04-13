import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Navbar from "@/components/Navbar";
import ChatWindow from "@/components/ChatWindow";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";

const Chat = () => {
  const { userId } = useParams();
  const { user } = useAuth();
  const { role } = useUserRole();

  const { data: otherProfile } = useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  if (!user || !userId) return null;

  const backLink = role === "worker" ? "/worker-dashboard" : "/dashboard";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="container mx-auto px-4 py-4 flex-1 flex flex-col max-w-2xl">
        <Link to={backLink} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-2">
          <ArrowLeft className="w-4 h-4" /> Back to dashboard
        </Link>
        <div className="flex-1 bg-card border rounded-2xl overflow-hidden flex flex-col" style={{ minHeight: "60vh" }}>
          <ChatWindow otherUserId={userId} otherUserName={otherProfile?.full_name || "User"} />
        </div>
      </div>
    </div>
  );
};

export default Chat;
