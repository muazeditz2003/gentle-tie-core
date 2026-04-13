import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  Map,
  MapPin,
  Navigation,
  Search,
  Sparkles,
  Star,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ServiceCategoryCard from "@/components/ServiceCategoryCard";
import WorkerCard from "@/components/WorkerCard";
import ActiveBloodRequests from "@/components/ActiveBloodRequests";
import { serviceCategories } from "@/data/mockData";
import { supabase } from "@/integrations/supabase/client";
import type { Worker } from "@/data/mockData";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4 },
  }),
};

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [topWorkers, setTopWorkers] = useState<Worker[]>([]);
  const [recentWorkers, setRecentWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMapView, setShowMapView] = useState(false);

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || "there";

  useEffect(() => {
    const fetchWorkers = async () => {
      setLoading(true);

      // Fetch all available workers
      const { data } = await supabase
        .from("workers")
        .select(
          "*, profiles!workers_user_id_fkey_profiles(full_name, phone, avatar_url)"
        )
        .eq("available", true)
        .order("experience", { ascending: false })
        .limit(20);

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

        // Top rated = sorted by rating desc
        const sorted = [...mapped].sort((a, b) => b.rating - a.rating);
        setTopWorkers(sorted.slice(0, 4));

        // Recent = sorted by newest (we use experience as proxy, or just take last entries)
        setRecentWorkers(mapped.slice(0, 6));
      }
      setLoading(false);
    };
    fetchWorkers();
  }, [user?.id]);

  const filteredRecent = useMemo(() => {
    if (!search.trim()) return recentWorkers;
    const q = search.toLowerCase().trim();
    const words = q.split(/\s+/);
    return recentWorkers.filter((w) => {
      const name = w.name.toLowerCase();
      const prof = w.profession.toLowerCase();
      const city = w.city.toLowerCase();
      // Every search word must match at least one field
      return words.every(
        (word) =>
          name.includes(word) ||
          prof.includes(word) ||
          city.includes(word)
      );
    });
  }, [search, recentWorkers]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const quickCategories = [
    { id: "electrician", name: "Electrician", icon: "⚡" },
    { id: "plumber", name: "Plumber", icon: "🔧" },
    { id: "tutor", name: "Tutor", icon: "📚" },
    { id: "delivery", name: "Delivery", icon: "🛵" },
    { id: "blood-donors", name: "Blood Donation", icon: "🩸", urgent: true },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="relative overflow-hidden border-b bg-gradient-to-b from-accent/50 to-background">
        <div className="absolute -top-32 -right-32 w-[400px] h-[400px] rounded-full bg-primary/5 blur-3xl" />
        <div className="container mx-auto px-4 pt-7 pb-6 md:pt-10 md:pb-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={0}
          >
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-primary">
                {greeting()}, {firstName}!
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-foreground mb-2 leading-tight">
              What do you need help with?
            </h1>
            <p className="text-sm md:text-base text-muted-foreground mb-6 max-w-lg">
              Search for services or browse categories to find the perfect
              professional near you.
            </p>
          </motion.div>

          <div className="sticky top-16 z-30 -mx-1 px-1 pb-3 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={1}
              className="flex gap-2"
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Find services near you..."
                  className="pl-10 h-12 text-base rounded-2xl border-border bg-card shadow-premium"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && search.trim()) {
                      navigate(`/discover?search=${encodeURIComponent(search)}`);
                    }
                  }}
                />
              </div>
              <Button
                size="icon"
                className="h-12 w-12 rounded-2xl bg-gradient-brand text-primary-foreground"
                onClick={() =>
                  navigate(
                    search.trim()
                      ? `/discover?search=${encodeURIComponent(search)}`
                      : "/discover"
                  )
                }
              >
                <Search className="w-5 h-5" />
              </Button>
            </motion.div>
          </div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={1}
            className="hidden md:flex gap-3 max-w-2xl"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search workers, services, or locations..."
                className="pl-10 h-12 text-base rounded-xl border-border bg-card shadow-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && search.trim()) {
                    navigate(`/discover?search=${encodeURIComponent(search)}`);
                  }
                }}
              />
            </div>
            <Button
              size="lg"
              onClick={() =>
                navigate(
                  search.trim()
                    ? `/discover?search=${encodeURIComponent(search)}`
                    : "/discover"
                )
              }
              className="h-12 px-6 rounded-xl bg-gradient-brand text-primary-foreground hover:opacity-90 shadow-md"
            >
              <Search className="w-5 h-5 mr-1" />
              Search
            </Button>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={2}
            className="mt-5"
          >
            <div className="flex gap-2 overflow-x-auto pb-1">
              {quickCategories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => navigate(c.id === "blood-donors" ? "/blood-donors" : `/discover?category=${c.id}`)}
                  className="tap-feedback shrink-0 inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-3.5 py-2 text-xs font-semibold text-card-foreground"
                >
                  <span>{c.icon}</span>
                  <span>{c.name}</span>
                  {c.urgent && (
                    <Badge variant="destructive" className="text-[10px] px-2 py-0 rounded-full">Urgent</Badge>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8 md:py-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-xl md:text-2xl font-bold text-foreground">
              Browse Categories
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/discover")}
            className="gap-1 text-primary"
          >
            View All <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {serviceCategories.map((cat) => (
            <ServiceCategoryCard
              key={cat.id}
              category={cat}
              onClick={(id) => navigate(`/discover?category=${id}`)}
            />
          ))}
        </div>
      </section>

      <section className="bg-accent/30 py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="text-xl md:text-2xl font-bold text-foreground">
                Top Rated Professionals
              </h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/discover")}
              className="gap-1 text-primary"
            >
              See All <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{filteredRecent.length} nearby workers</p>
            <Button variant="outline" size="sm" className="gap-1.5 rounded-full" onClick={() => setShowMapView((v) => !v)}>
              <Map className="w-3.5 h-3.5" /> {showMapView ? "List" : "Map"} View
            </Button>
          </div>

          {showMapView ? (
            <div className="rounded-2xl border bg-card p-8 text-center">
              <Navigation className="w-9 h-9 text-primary mx-auto mb-3" />
              <p className="font-semibold text-card-foreground mb-1">Map preview</p>
              <p className="text-sm text-muted-foreground">Toggle back to list to browse and hire quickly.</p>
            </div>
          ) : loading ? (
            <div className="grid md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-40 rounded-2xl bg-card border animate-pulse"
                />
              ))}
            </div>
          ) : topWorkers.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 md:gap-4">
              {topWorkers.map((w, i) => (
                <WorkerCard key={w.id} worker={w} index={i} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <MapPin className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No workers available yet</p>
              <p className="text-sm">Check back soon or try searching</p>
            </div>
          )}
        </div>
      </section>

      {filteredRecent.length > 0 && (
        <section className="container mx-auto px-4 py-8 md:py-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <h2 className="text-xl md:text-2xl font-bold text-foreground">
                {search.trim()
                  ? `Results for "${search}"`
                  : "Available Now"}
              </h2>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 md:gap-4">
            {filteredRecent.map((w, i) => (
              <WorkerCard key={w.id} worker={w} index={i} />
            ))}
          </div>
        </section>
      )}

      <section className="container mx-auto px-4 py-5 md:py-8">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-destructive" />
          <h2 className="text-lg md:text-xl font-bold text-foreground">Urgent help requests</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Respond fast to nearby blood donation emergencies.</p>
      </section>

      <ActiveBloodRequests />

      <section className="container mx-auto px-4 py-8 md:py-10">
        <div className="rounded-2xl bg-gradient-brand p-8 md:p-12 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-foreground/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <Star className="w-8 h-8 text-primary-foreground/80 mx-auto mb-3" />
            <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-3">
              Can't find what you need?
            </h2>
            <p className="text-primary-foreground/80 mb-6 max-w-md mx-auto">
              Use our AI assistant to describe your problem and get matched with
              the best professional for the job.
            </p>
             <p className="text-sm text-primary-foreground/70">
              Click the chat icon in the bottom-right corner to get started →
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
