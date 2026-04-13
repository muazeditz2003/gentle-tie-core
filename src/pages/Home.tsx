import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Compass, HeartPulse, Search, Sparkles, UserSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import WorkerCard from "@/components/WorkerCard";
import ActiveBloodRequests from "@/components/ActiveBloodRequests";
import { serviceCategories } from "@/data/mockData";
import { supabase } from "@/integrations/supabase/client";
import type { Worker } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.35 } }),
};

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "there";

  useEffect(() => {
    const fetchWorkers = async () => {
      setLoading(true);

      const { data } = await supabase
        .from("workers")
        .select(
          "*, profiles!workers_user_id_fkey_profiles(full_name, phone, avatar_url)"
        )
        .eq("available", true)
        .order("experience", { ascending: false })
        .limit(24);

      if (data) {
        const workerIds = data.map((w) => w.id);
        const { data: reviewData } = await supabase
          .from("reviews")
          .select("worker_id, rating")
          .in("worker_id", workerIds);

        const reviewMap: Record<string, { sum: number; count: number }> = {};
        reviewData?.forEach((r) => {
          if (!reviewMap[r.worker_id])
            reviewMap[r.worker_id] = { sum: 0, count: 0 };
          reviewMap[r.worker_id].sum += r.rating;
          reviewMap[r.worker_id].count += 1;
        });

        const mapped: Worker[] = data
          .filter((w) => w.user_id !== user?.id)
          .map((w) => {
            const profile = w.profiles as any;
            const rev = reviewMap[w.id];
            return {
              id: w.id,
              name: profile?.full_name || "Worker",
              profession: w.profession,
              rating: rev
                ? Math.round((rev.sum / rev.count) * 10) / 10
                : 0,
              reviewCount: rev?.count || 0,
              experience: w.experience,
              distance: 0,
              available: w.available,
              verified: w.verified,
              phone: profile?.phone || "",
              description: w.description || "",
              serviceAreas: w.service_areas || [],
              profilePhoto: profile?.avatar_url || "",
              city: w.city || "",
            };
          });

        setWorkers(mapped);
      }
      setLoading(false);
    };
    fetchWorkers();
  }, [user?.id]);

  const workerSuggestions = useMemo(() => {
    const cityList = [...new Set(workers.map((w) => w.city).filter(Boolean))].slice(0, 3);
    const professionList = [...new Set(workers.map((w) => w.profession).filter(Boolean))].slice(0, 4);
    return [...professionList, ...cityList];
  }, [workers]);

  const nearbyWorkers = useMemo(() => {
    if (!search.trim()) return workers.slice(0, 6);
    const q = search.toLowerCase().trim();
    const words = q.split(/\s+/);
    return workers.filter((w) => {
      const name = w.name.toLowerCase();
      const prof = w.profession.toLowerCase();
      const city = w.city.toLowerCase();
      return words.every(
        (word) =>
          name.includes(word) ||
          prof.includes(word) ||
          city.includes(word)
      );
    }).slice(0, 8);
  }, [search, workers]);

  const quickCategories = [
    { id: "electrician", name: "Electrician", icon: "⚡" },
    { id: "plumber", name: "Plumber", icon: "🔧" },
    { id: "tutor", name: "Tutor", icon: "📚" },
    { id: "delivery", name: "Delivery", icon: "🛵" },
    { id: "blood-donors", name: "Blood Donation", icon: "🩸", urgent: true },
  ];

  useEffect(() => {
    if (!search.trim()) {
      setSuggestions(workerSuggestions.slice(0, 4));
      return;
    }
    const q = search.toLowerCase();
    setSuggestions(workerSuggestions.filter((s) => s.toLowerCase().includes(q)).slice(0, 4));
  }, [search, workerSuggestions]);

  return (
    <AppLayout
      title={`Welcome back, ${firstName}`}
      subtitle="Find local help in seconds — services, urgent requests, and trusted nearby services."
      action={
        <Button className="h-10 rounded-xl" onClick={() => navigate("/blood-donors")}>
          Request Help
        </Button>
      }
    >
      <section className="space-y-6">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="rounded-3xl border bg-muted/40 p-4">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Find services near you..."
              className="h-12 rounded-2xl bg-card pl-10 text-base"
              onKeyDown={(e) => {
                if (e.key === "Enter") navigate(`/discover?search=${encodeURIComponent(search)}`);
              }}
            />
          </div>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => {
                  setSearch(suggestion);
                  navigate(`/discover?search=${encodeURIComponent(suggestion)}`);
                }}
                className="tap-feedback shrink-0 rounded-full bg-card px-3 py-1.5 text-xs font-medium text-foreground"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <button onClick={() => navigate("/discover")} className="tap-feedback rounded-2xl border bg-card p-4 text-left">
            <UserSearch className="mb-2 h-5 w-5 text-primary" />
            <p className="font-semibold text-foreground">Find a Service</p>
            <p className="text-xs text-muted-foreground">Trusted people near your location</p>
          </button>
          <button onClick={() => navigate("/blood-donors")} className="tap-feedback rounded-2xl border bg-card p-4 text-left">
            <HeartPulse className="mb-2 h-5 w-5 text-destructive" />
            <p className="font-semibold text-foreground">Request Urgent Help</p>
            <p className="text-xs text-muted-foreground">Blood and emergency support fast</p>
          </button>
          <button onClick={() => navigate("/discover")} className="tap-feedback rounded-2xl border bg-card p-4 text-left">
            <Compass className="mb-2 h-5 w-5 text-secondary" />
            <p className="font-semibold text-foreground">Browse Categories</p>
            <p className="text-xs text-muted-foreground">Explore services by type</p>
          </button>
        </motion.div>

        <motion.section initial="hidden" animate="visible" variants={fadeUp} custom={2}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Urgent Help Feed</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate("/blood-donors")} className="gap-1">
              View all <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          <ActiveBloodRequests compact hideTitle />
        </motion.section>

        <motion.section initial="hidden" animate="visible" variants={fadeUp} custom={3}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Nearby Services</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate("/discover")} className="gap-1">
              Explore <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
          {loading ? (
            <div className="grid gap-3 md:grid-cols-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-36 animate-pulse rounded-2xl border bg-muted" />
              ))}
            </div>
          ) : nearbyWorkers.length === 0 ? (
            <div className="rounded-2xl border bg-muted/30 p-8 text-center">
              <Sparkles className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
              <p className="font-semibold text-foreground">No matching services yet</p>
              <p className="text-sm text-muted-foreground">Try another search or browse categories.</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {nearbyWorkers.map((w, i) => (
                <WorkerCard key={w.id} worker={w} index={i} />
              ))}
            </div>
          )}
        </motion.section>

        <motion.section initial="hidden" animate="visible" variants={fadeUp} custom={4}>
          <h2 className="mb-3 text-lg font-bold text-foreground">Categories</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {quickCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => navigate(category.id === "blood-donors" ? "/blood-donors" : `/discover?category=${category.id}`)}
                className="tap-feedback rounded-2xl border bg-card p-3 text-left"
              >
                <div className="mb-1.5 text-xl">{category.icon}</div>
                <p className="text-sm font-semibold text-foreground">{category.name}</p>
                {category.urgent && (
                  <Badge variant="destructive" className="mt-2 rounded-full px-2 py-0 text-[10px]">
                    Urgent
                  </Badge>
                )}
              </button>
            ))}
            {serviceCategories.slice(0, 5).map((category) => (
              <button
                key={category.id}
                onClick={() => navigate(`/discover?category=${category.id}`)}
                className="tap-feedback rounded-2xl border bg-card p-3 text-left"
              >
                <div className="mb-1.5 text-xl">{category.icon}</div>
                <p className="text-sm font-semibold text-foreground">{category.name}</p>
              </button>
            ))}
          </div>
        </motion.section>
      </section>
    </AppLayout>
  );
};

export default Home;
