import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageSquare, Star, User, Search, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AvatarUpload from "@/components/AvatarUpload";
import UpgradeToWorker from "@/components/UpgradeToWorker";
import BloodDonationCard from "@/components/BloodDonationCard";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useUserRole } from "@/hooks/useUserRole";

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { role } = useUserRole();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["my_profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("user_id", user!.id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: async () => {
      const { data: sent } = await supabase.from("messages").select("receiver_id, created_at, message_text").eq("sender_id", user!.id).order("created_at", { ascending: false });
      const { data: received } = await supabase.from("messages").select("sender_id, created_at, message_text").eq("receiver_id", user!.id).order("created_at", { ascending: false });

      const userMap = new Map<string, { lastMessage: string; time: string }>();
      [...(sent || []), ...(received || [])].forEach((m: any) => {
        const otherId = m.receiver_id || m.sender_id;
        if (!userMap.has(otherId)) userMap.set(otherId, { lastMessage: m.message_text, time: m.created_at });
      });

      const ids = Array.from(userMap.keys());
      if (!ids.length) return [];
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", ids);

      return ids.map(id => {
        const p = profiles?.find((pr: any) => pr.user_id === id);
        const info = userMap.get(id)!;
        return { userId: id, name: p?.full_name || "Unknown", avatarUrl: p?.avatar_url, lastMessage: info.lastMessage, time: info.time };
      });
    },
    enabled: !!user,
  });

  const { data: myBookings = [] } = useQuery({
    queryKey: ["customer_bookings", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, workers!inner(id, profession, profiles:user_id(full_name))")
        .eq("customer_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: myReviews = [] } = useQuery({
    queryKey: ["my_given_reviews", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("reviews").select("*").eq("customer_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Realtime for bookings
  useEffect(() => {
    if (!user) return;
    const channelName = `cust-bookings-${user.id}-${Math.random().toString(36).slice(2)}`;
    const ch = supabase.channel(channelName);
    ch.on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => {
      queryClient.invalidateQueries({ queryKey: ["customer_bookings"] });
    });
    ch.subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, queryClient]);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.full_name || "");
      setPhone(profile.phone || "");
      setCity(profile.city || "");
      setBloodGroup((profile as any).blood_group || "");
    }
  }, [profile]);


  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [authLoading, user, navigate]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ full_name: name, phone, city, blood_group: bloodGroup } as any).eq("user_id", user.id);
    setSaving(false);
    if (error) toast.error("Failed to save");
    else { toast.success("Profile updated!"); queryClient.invalidateQueries({ queryKey: ["my_profile"] }); }
  };

  const handleAvatarUpload = async (url: string) => {
    await supabase.from("profiles").update({ avatar_url: url }).eq("user_id", user!.id);
    queryClient.invalidateQueries({ queryKey: ["my_profile"] });
  };

  const statusColor = (status: string) => {
    if (status === "confirmed") return "bg-success text-success-foreground";
    if (status === "completed") return "bg-primary text-primary-foreground";
    if (status === "rejected") return "bg-destructive text-destructive-foreground";
    return "bg-warning text-warning-foreground";
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-foreground">My Dashboard</h1>
          <Button variant="hero" className="gap-2" onClick={() => navigate("/discover")}>
            <Search className="w-4 h-4" /> Find Workers
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Messages", value: String(conversations.length), icon: MessageSquare },
            { label: "Bookings", value: String(myBookings.length), icon: Calendar },
            { label: "Reviews", value: String(myReviews.length), icon: Star },
            { label: "Profile", value: profile?.full_name ? "Complete" : "Incomplete", icon: User },
          ].map(s => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border rounded-xl p-4 text-center">
              <s.icon className="w-5 h-5 text-primary mx-auto mb-2" />
              <p className="text-xl font-bold text-card-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-muted">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="blood">Blood Donation</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <div className="bg-card border rounded-2xl p-6">
              <h2 className="font-semibold text-card-foreground mb-4">Edit Profile</h2>
              <div className="flex items-start gap-4 mb-6">
                <AvatarUpload currentUrl={profile?.avatar_url} onUpload={handleAvatarUpload} />
                <div className="flex-1 space-y-1">
                  <p className="font-semibold text-card-foreground">{profile?.full_name || user?.email}</p>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div><Label>Full Name</Label><Input value={name} onChange={e => setName(e.target.value)} className="mt-1.5" /></div>
                <div><Label>Phone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} className="mt-1.5" /></div>
                <div><Label>City</Label><Input value={city} onChange={e => setCity(e.target.value)} className="mt-1.5" /></div>
                <div>
                  <Label>Blood Group</Label>
                  <select value={bloodGroup} onChange={e => setBloodGroup(e.target.value)} className="mt-1.5 w-full h-10 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <option value="">Select blood group</option>
                    {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
                <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
              </div>

              {/* Upgrade to Worker */}
              {role !== "worker" && (
                <div className="mt-6">
                  <UpgradeToWorker />
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="blood">
            <BloodDonationCard />
          </TabsContent>

          <TabsContent value="bookings">
            <div className="space-y-3">
              {myBookings.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No bookings yet. Find a worker and book a service!</p>
                </div>
              ) : (
                myBookings.map((b: any) => (
                  <div key={b.id} className="bg-card border rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-card-foreground">{b.workers?.profiles?.full_name || "Worker"} · {b.workers?.profession}</p>
                        <p className="text-sm text-muted-foreground mt-1">{b.service_description}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(b.booking_date).toLocaleDateString()}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {b.booking_time}</span>
                        </div>
                      </div>
                      <Badge className={statusColor(b.status)}>{b.status}</Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="messages">
            <div className="bg-card border rounded-2xl p-6">
              <h2 className="font-semibold text-card-foreground mb-4">Recent Chats</h2>
              {conversations.length === 0 ? (
                <p className="text-sm text-muted-foreground">No conversations yet.</p>
              ) : (
                <div className="space-y-2">
                  {conversations.map((c: any) => (
                    <Link key={c.userId} to={`/chat/${c.userId}`} className="flex items-center gap-4 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors">
                      <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-sm font-bold text-accent-foreground shrink-0">
                        {c.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-card-foreground">{c.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{c.lastMessage}</p>
                      </div>
                      <span className="text-xs text-muted-foreground">{new Date(c.time).toLocaleDateString()}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
};

export default CustomerDashboard;
