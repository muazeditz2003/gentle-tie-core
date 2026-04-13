import { useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Star,
  ArrowRight,
  MapPin,
  TrendingUp,
  Clock,
  Sparkles,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ServiceCategoryCard from "@/components/ServiceCategoryCard";
import WorkerCard from "@/components/WorkerCard";
import WelcomeBanner from "@/components/WelcomeBanner";
import BloodDonationBanner from "@/components/BloodDonationBanner";
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Greeting + Search Hero */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-accent/60 to-background">
        <div className="absolute -top-32 -right-32 w-[400px] h-[400px] rounded-full bg-primary/5 blur-3xl" />
        <div className="container mx-auto px-4 pt-10 pb-12">
          <WelcomeBanner firstName={firstName} />
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
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground mb-2">
              What do you need help with?
            </h1>
            <p className="text-muted-foreground mb-8 max-w-lg">
              Search for services or browse categories to find the perfect
              professional near you.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={1}
            className="flex gap-3 max-w-2xl"
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

          {/* Quick action chips */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            custom={2}
            className="flex flex-wrap gap-2 mt-6"
          >
            {["Plumber", "Electrician", "Carpenter", "Cleaner", "Mechanic"].map(
              (s) => (
                <button
                  key={s}
                  onClick={() =>
                    navigate(
                      `/discover?search=${encodeURIComponent(s.toLowerCase())}`
                    )
                  }
                  className="px-4 py-1.5 rounded-full text-sm font-medium bg-card border border-border text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
                >
                  {s}
                </button>
              )
            )}
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary" />
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

      {/* Top Rated Workers */}
      <section className="bg-accent/30 py-12">
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
          {loading ? (
            <div className="grid md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-40 rounded-2xl bg-card border animate-pulse"
                />
              ))}
            </div>
          ) : topWorkers.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
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

      {/* Recently Available */}
      {filteredRecent.length > 0 && (
        <section className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              <h2 className="text-xl md:text-2xl font-bold text-foreground">
                {search.trim()
                  ? `Results for "${search}"`
                  : "Available Now"}
              </h2>
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRecent.map((w, i) => (
              <WorkerCard key={w.id} worker={w} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Blood Donation Banner */}
      <section className="container mx-auto px-4 py-10">
        <BloodDonationBanner />
      </section>

      {/* Active Blood Requests */}
      <ActiveBloodRequests />

      {/* Quick CTA */}
      <section className="container mx-auto px-4 py-10">
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
            <p className="text-sm text-primary-foreground/60">
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
