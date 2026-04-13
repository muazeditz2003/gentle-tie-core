import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Save, Star, MessageSquare, Eye, ToggleLeft, ToggleRight, Navigation, Calendar, Clock, CheckCircle, XCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AvatarUpload from "@/components/AvatarUpload";
import StarRating from "@/components/StarRating";
import BloodDonationCard from "@/components/BloodDonationCard";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkerProfile } from "@/hooks/useWorkerProfile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getCurrentPosition } from "@/lib/geolocation";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const WorkerDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: workerData, isLoading } = useWorkerProfile();
  const queryClient = useQueryClient();

  const [profession, setProfession] = useState("");
  const [experience, setExperience] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [serviceAreas, setServiceAreas] = useState("");
  const [available, setAvailable] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingLocation, setUpdatingLocation] = useState(false);

  useEffect(() => {
    if (workerData) {
      setProfession(workerData.profession || "");
      setExperience(String(workerData.experience || 0));
      setDescription(workerData.description || "");
      setCity((workerData as any).profiles?.city || workerData.city || "");
      setServiceAreas((workerData.service_areas || []).join(", "));
      setAvailable(workerData.available);
    }
  }, [workerData]);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [authLoading, user, navigate]);

  // Reviews
  const { data: reviews = [] } = useQuery({
    queryKey: ["my_reviews", workerData?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*, profiles:customer_id(full_name)")
        .eq("worker_id", workerData!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!workerData?.id,
  });

  // Bookings
  const { data: bookings = [] } = useQuery({
    queryKey: ["worker_bookings", workerData?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("*, profiles:customer_id(full_name, phone, avatar_url)")
        .eq("worker_id", workerData!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!workerData?.id,
  });

  // Conversations
  const { data: conversations = [] } = useQuery({
    queryKey: ["worker_conversations", user?.id],
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

  // Realtime for bookings and messages
  useEffect(() => {
    if (!user) return;
    const channelName = `worker-dash-${user.id}-${Math.random().toString(36).slice(2)}`;
    const ch = supabase.channel(channelName);
    ch.on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => {
        queryClient.invalidateQueries({ queryKey: ["worker_bookings"] });
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => {
        queryClient.invalidateQueries({ queryKey: ["worker_conversations"] });
      });
    ch.subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, queryClient]);

  const avgRating = reviews.length
    ? (reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "0";

  const pendingBookings = bookings.filter((b: any) => b.status === "pending");
  const confirmedBookings = bookings.filter((b: any) => b.status === "confirmed");

  const handleSave = async () => {
    if (!workerData) return;
    setSaving(true);
    const areas = serviceAreas.split(",").map(s => s.trim()).filter(Boolean);

    const { error: workerError } = await supabase
      .from("workers")
      .update({ profession, experience: parseInt(experience) || 0, description, city, service_areas: areas, available })
      .eq("id", workerData.id);

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ city })
      .eq("user_id", user!.id);

    setSaving(false);
    if (workerError || profileError) toast.error("Failed to save changes");
    else {
      toast.success("Profile updated!");
      queryClient.invalidateQueries({ queryKey: ["my_worker_profile"] });
    }
  };

  const handleUpdateLocation = async () => {
    if (!workerData) return;
    setUpdatingLocation(true);
    try {
      const coords = await getCurrentPosition();
      await supabase
        .from("workers")
        .update({ latitude: coords.latitude, longitude: coords.longitude })
        .eq("id", workerData.id);
      toast.success("Location updated!");
      queryClient.invalidateQueries({ queryKey: ["my_worker_profile"] });
    } catch {
      toast.error("Could not get location. Please enable location access.");
    }
    setUpdatingLocation(false);
  };

  const handleAvatarUpload = async (url: string) => {
    await supabase.from("profiles").update({ avatar_url: url }).eq("user_id", user!.id);
    queryClient.invalidateQueries({ queryKey: ["my_worker_profile"] });
  };

  const handleBookingAction = async (bookingId: string, action: "confirmed" | "rejected") => {
    const { error } = await supabase
      .from("bookings")
      .update({ status: action })
      .eq("id", bookingId);
    if (error) toast.error("Failed to update booking");
    else {
      toast.success(`Booking ${action}!`);
      queryClient.invalidateQueries({ queryKey: ["worker_bookings"] });
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  if (!workerData) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground mb-4">You don't have a worker profile.</p>
          <Button onClick={() => navigate("/register?role=worker")}>Register as Worker</Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-foreground">Worker Dashboard</h1>
          <Button variant="outline" className="gap-2" onClick={() => navigate("/discover")}>
            <Search className="w-4 h-4" /> Find Workers
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: "Rating", value: avgRating, icon: Star },
            { label: "Reviews", value: String(reviews.length), icon: Star },
            { label: "Bookings", value: String(bookings.length), icon: Calendar },
            { label: "Messages", value: String(conversations.length), icon: MessageSquare },
            { label: "Status", value: available ? "Available" : "Offline", icon: available ? ToggleRight : ToggleLeft },
          ].map(s => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border rounded-xl p-4 text-center">
              <s.icon className="w-5 h-5 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-card-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </motion.div>
          ))}
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-muted">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="blood">Blood Donation</TabsTrigger>
            <TabsTrigger value="bookings">
              Bookings {pendingBookings.length > 0 && <Badge className="ml-1.5 bg-destructive text-destructive-foreground h-5 min-w-5 text-xs">{pendingBookings.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <div className="bg-card border rounded-2xl p-6">
              <h2 className="font-semibold text-card-foreground mb-4">Edit Profile</h2>
              <div className="flex items-start gap-4 mb-6">
                <AvatarUpload currentUrl={(workerData as any).profiles?.avatar_url} onUpload={handleAvatarUpload} />
                <div className="flex-1 space-y-1">
                  <p className="font-semibold text-card-foreground">{(workerData as any).profiles?.full_name}</p>
                  <p className="text-sm text-muted-foreground">{(workerData as any).profiles?.phone}</p>
                  {workerData.verified && <Badge className="bg-success text-success-foreground">Verified</Badge>}
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Profession</Label>
                  <Input value={profession} onChange={e => setProfession(e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <Label>Years of Experience</Label>
                  <Input type="number" value={experience} onChange={e => setExperience(e.target.value)} className="mt-1.5" />
                </div>
                <div className="md:col-span-2">
                  <Label>About</Label>
                  <Textarea value={description} onChange={e => setDescription(e.target.value)} className="mt-1.5" rows={3} />
                </div>
                <div>
                  <Label>City</Label>
                  <Input value={city} onChange={e => setCity(e.target.value)} className="mt-1.5" />
                </div>
                <div>
                  <Label>Service Areas (comma-separated)</Label>
                  <Input value={serviceAreas} onChange={e => setServiceAreas(e.target.value)} placeholder="DHA, Gulberg, Model Town" className="mt-1.5" />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted rounded-lg mt-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Availability</p>
                  <p className="text-xs text-muted-foreground">{available ? "You're visible to customers" : "You're hidden from search"}</p>
                </div>
                <Switch checked={available} onCheckedChange={setAvailable} />
              </div>

              <div className="flex gap-3 mt-4">
                <Button onClick={handleSave} disabled={saving} className="gap-2">
                  <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Changes"}
                </Button>
                <Button variant="outline" onClick={handleUpdateLocation} disabled={updatingLocation} className="gap-2">
                  <Navigation className="w-4 h-4" /> {updatingLocation ? "Updating..." : "Update Location"}
                </Button>
              </div>

              {workerData.latitude && workerData.longitude && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-3">
                  <MapPin className="w-3 h-3" /> Location: {workerData.latitude.toFixed(4)}, {workerData.longitude.toFixed(4)}
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="blood">
            <BloodDonationCard />
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings">
            <div className="space-y-6">
              {pendingBookings.length > 0 && (
                <div>
                  <h3 className="font-semibold text-foreground mb-3">Pending Requests ({pendingBookings.length})</h3>
                  <div className="space-y-3">
                    {pendingBookings.map((b: any) => (
                      <div key={b.id} className="bg-card border border-warning/30 rounded-xl p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-card-foreground">{b.profiles?.full_name || "Customer"}</p>
                            <p className="text-sm text-muted-foreground mt-1">{b.service_description}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(b.booking_date).toLocaleDateString()}</span>
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {b.booking_time}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" className="gap-1" onClick={() => handleBookingAction(b.id, "confirmed")}>
                              <CheckCircle className="w-3 h-3" /> Accept
                            </Button>
                            <Button size="sm" variant="outline" className="gap-1" onClick={() => handleBookingAction(b.id, "rejected")}>
                              <XCircle className="w-3 h-3" /> Decline
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {confirmedBookings.length > 0 && (
                <div>
                  <h3 className="font-semibold text-foreground mb-3">Upcoming ({confirmedBookings.length})</h3>
                  <div className="space-y-3">
                    {confirmedBookings.map((b: any) => (
                      <div key={b.id} className="bg-card border rounded-xl p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-card-foreground">{b.profiles?.full_name || "Customer"}</p>
                            <p className="text-sm text-muted-foreground">{b.service_description}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(b.booking_date).toLocaleDateString()}</span>
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {b.booking_time}</span>
                            </div>
                          </div>
                          <Badge className="bg-success text-success-foreground">Confirmed</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {bookings.length === 0 && (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No bookings yet.</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages">
            <div className="bg-card border rounded-2xl p-6">
              <h2 className="font-semibold text-card-foreground mb-4">Messages</h2>
              {conversations.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No conversations yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {conversations.map((c: any) => (
                    <Link
                      key={c.userId}
                      to={`/chat/${c.userId}`}
                      className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-sm font-bold text-accent-foreground shrink-0">
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
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews">
            <div className="bg-card border rounded-2xl p-6">
              <h2 className="font-semibold text-card-foreground mb-4">Reviews ({reviews.length})</h2>
              {reviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">No reviews yet.</p>
              ) : (
                <div className="space-y-3">
                  {reviews.map((r: any) => (
                    <div key={r.id} className="p-4 rounded-xl bg-muted/50">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-card-foreground">{r.profiles?.full_name || "Anonymous"}</span>
                        <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                      </div>
                      <StarRating rating={r.rating} size={14} />
                      {r.review_text && <p className="text-sm text-muted-foreground mt-2">{r.review_text}</p>}
                    </div>
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

export default WorkerDashboard;
