import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertTriangle, MapPin, MessageSquare, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";

const urgencyStyles: Record<string, string> = {
  normal: "bg-green-100 text-green-700 border-green-200",
  urgent: "bg-orange-100 text-orange-700 border-orange-200",
  critical: "bg-red-100 text-red-700 border-red-200 animate-pulse",
};

const ActiveBloodRequests = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: requests = [] } = useQuery({
    queryKey: ["blood_requests_active"],
    queryFn: async () => {
      const { data } = await supabase
        .from("blood_requests")
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(6);

      if (!data || data.length === 0) return [];

      const requesterIds = [...new Set(data.map((r) => r.requester_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, city")
        .in("user_id", requesterIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

      return data.map((r) => ({
        ...r,
        requester_name: profileMap.get(r.requester_id)?.full_name || "Someone",
        requester_city: r.city || profileMap.get(r.requester_id)?.city || null,
      }));
    },
    enabled: !!user,
  });

  // Realtime subscription
  useEffect(() => {
    const ch = supabase
      .channel(`blood-req-list-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "blood_requests" }, () => {
        queryClient.invalidateQueries({ queryKey: ["blood_requests_active"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [queryClient]);

  if (requests.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-5">
        <AlertTriangle className="w-5 h-5 text-red-500" />
        <h2 className="text-xl md:text-2xl font-bold text-foreground">Active Blood Requests</h2>
        <Badge className="bg-red-500 text-white rounded-full ml-2">{requests.length}</Badge>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {requests.map((req, i) => (
          <motion.div
            key={req.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card border rounded-2xl p-5 hover:shadow-lg transition-shadow relative overflow-hidden"
          >
            {req.urgency === "critical" && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-red-500" />
            )}
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-semibold text-card-foreground">{req.requester_name}</p>
                {req.requester_city && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" /> {req.requester_city}
                  </p>
                )}
              </div>
              <Badge className={`text-xs font-bold border rounded-full px-3 py-1 ${urgencyStyles[req.urgency] || urgencyStyles.normal}`}>
                {req.urgency === "critical" && <AlertTriangle className="w-3 h-3 mr-1" />}
                {req.urgency.charAt(0).toUpperCase() + req.urgency.slice(1)}
              </Badge>
            </div>

            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                <span className="text-lg font-extrabold text-red-600">{req.blood_group}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Needs {req.blood_group} blood</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>

            {req.message && (
              <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2 mb-3 line-clamp-2">
                {req.message}
              </p>
            )}

            {req.requester_id !== user?.id && (
              <Button
                size="sm"
                className="w-full gap-1.5 rounded-xl bg-red-500 hover:bg-red-600 text-white"
                onClick={() => navigate(`/chat/${req.requester_id}`)}
              >
                <MessageSquare className="w-3.5 h-3.5" /> Respond to Request
              </Button>
            )}
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default ActiveBloodRequests;
