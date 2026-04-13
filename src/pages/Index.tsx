import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, Shield, Star, ArrowRight, MapPin, Zap, Users, CheckCircle, Phone, MessageCircle, Heart, Droplet } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ServiceCategoryCard from "@/components/ServiceCategoryCard";
import WorkerCard from "@/components/WorkerCard";
import { serviceCategories } from "@/data/mockData";
import { supabase } from "@/integrations/supabase/client";
import type { Worker } from "@/data/mockData";
import { useI18n } from "@/i18n";
import { useAuth } from "@/contexts/AuthContext";
import Home from "@/pages/Home";
import heroImg from "@/assets/hero-illustration.png";
import ctaWorkerImg from "@/assets/cta-worker.png";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const Index = () => {
  const navigate = useNavigate();
  const [topWorkers, setTopWorkers] = useState<Worker[]>([]);
  const { t } = useI18n();
  const { user, loading } = useAuth();

  useEffect(() => {
    const fetchWorkers = async () => {
      const { data } = await supabase
        .from("workers")
        .select("*, profiles!workers_user_id_fkey_profiles(full_name, phone, avatar_url)")
        .eq("available", true)
        .order("experience", { ascending: false })
        .limit(4);

      if (data) {
        const workerIds = data.map((w) => w.id);
        const { data: reviewData } = await supabase
          .from("reviews")
          .select("worker_id, rating")
          .in("worker_id", workerIds);

        const reviewMap: Record<string, { sum: number; count: number }> = {};
        reviewData?.forEach((r) => {
          if (!reviewMap[r.worker_id]) reviewMap[r.worker_id] = { sum: 0, count: 0 };
          reviewMap[r.worker_id].sum += r.rating;
          reviewMap[r.worker_id].count += 1;
        });

        setTopWorkers(
          data.map((w) => {
            const profile = w.profiles as any;
            const rev = reviewMap[w.id];
            return {
              id: w.id,
              name: profile?.full_name || "Worker",
              profession: w.profession,
              rating: rev ? Math.round((rev.sum / rev.count) * 10) / 10 : 0,
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
          })
        );
      }
    };
    fetchWorkers();
  }, []);

  // If logged in, show the personalized homepage
  if (!loading && user) {
    return <Home />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-[hsl(var(--gradient-end))]/5 blur-3xl" />

        <div className="container mx-auto px-4 py-20 md:py-28 relative">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-6 border border-primary/10">
                <Zap className="w-4 h-4 text-primary" />
                {t("hero.badge")}
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 leading-[1.1]">
                <span className="text-foreground">{t("hero.title1")} </span>
                <span className="text-gradient">{t("hero.title2")}</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-lg leading-relaxed">
                {t("hero.subtitle")}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button size="lg" onClick={() => navigate("/discover")} className="gap-2 bg-gradient-brand text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/25 text-base font-semibold h-12 px-8 rounded-xl">
                  <Search className="w-5 h-5" />
                  {t("hero.findWorkers")}
                </Button>
                <Button variant="outline" size="lg" onClick={() => navigate("/register?role=worker")} className="h-12 px-8 rounded-xl text-base">
                  {t("hero.joinAsWorker")}
                </Button>
              </div>
              <div className="flex items-center gap-6 mt-10 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-primary" /> Verified Pros</span>
                <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-primary" /> Free to Use</span>
                <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-primary" /> Instant Chat</span>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="hidden md:block"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-brand rounded-3xl opacity-10 blur-2xl scale-110" />
                <img src={heroImg} alt="Service professionals" width={1024} height={768} className="w-full max-w-lg mx-auto relative animate-float" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y bg-card/50">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "500+", label: "Workers Registered" },
              { value: "10K+", label: "Jobs Completed" },
              { value: "4.8", label: "Average Rating" },
              { value: "50+", label: "Service Categories" },
            ].map((stat, i) => (
              <motion.div key={i} initial="hidden" animate="visible" variants={fadeUp} custom={i} className="text-center">
                <p className="text-2xl md:text-3xl font-extrabold text-gradient">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="container mx-auto px-4 py-20 md:py-24">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Simple Process</p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">How It Works</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: "01", icon: Search, title: "Search", desc: "Find workers by category, name, or location near you", color: "from-primary/10 to-primary/5" },
            { step: "02", icon: MessageCircle, title: "Connect", desc: "View profiles, ratings, and directly chat or call workers", color: "from-[hsl(var(--gradient-end))]/10 to-[hsl(var(--gradient-end))]/5" },
            { step: "03", icon: CheckCircle, title: "Get it Done", desc: "Book a service, get the job done, and leave a review", color: "from-success/10 to-success/5" },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              custom={i + 1}
              className="relative p-8 rounded-2xl bg-card border text-center group hover:shadow-premium transition-all duration-300"
            >
              <span className="absolute top-4 right-4 text-6xl font-black text-muted/20 select-none">{item.step}</span>
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mx-auto mb-5`}>
                <item.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-bold text-lg text-card-foreground mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-accent/30 py-20 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Why Choose Us</p>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8">{t("feature.nearby.title")}</h2>
              <div className="space-y-6">
                {[
                  { icon: MapPin, title: t("feature.nearby.title"), desc: t("feature.nearby.desc") },
                  { icon: Shield, title: t("feature.verified.title"), desc: t("feature.verified.desc") },
                  { icon: Star, title: t("feature.ratings.title"), desc: t("feature.ratings.desc") },
                  { icon: Phone, title: "Direct Communication", desc: "Call or message workers directly through the platform" },
                ].map((f, i) => (
                  <motion.div key={i} initial="hidden" animate="visible" variants={fadeUp} custom={i} className="flex gap-4 items-start">
                    <div className="w-12 h-12 rounded-xl bg-gradient-brand flex items-center justify-center shrink-0 shadow-md">
                      <f.icon className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-card-foreground mb-1">{f.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
            <div className="hidden md:block">
              <div className="relative p-8">
                <div className="absolute inset-0 bg-gradient-brand rounded-3xl opacity-5" />
                <div className="glass rounded-2xl p-6 shadow-premium">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-brand flex items-center justify-center text-primary-foreground font-bold text-sm">AK</div>
                    <div>
                      <p className="font-semibold text-sm text-card-foreground">Ahmad Khan</p>
                      <p className="text-xs text-muted-foreground">Master Electrician • ⭐ 4.9</p>
                    </div>
                    <span className="ml-auto px-2 py-0.5 bg-success/10 text-success text-xs font-medium rounded-full">Available</span>
                  </div>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex justify-between p-2 bg-muted/50 rounded-lg"><span>Experience</span><span className="font-medium text-card-foreground">8 years</span></div>
                    <div className="flex justify-between p-2 bg-muted/50 rounded-lg"><span>Distance</span><span className="font-medium text-card-foreground">2.3 km</span></div>
                    <div className="flex justify-between p-2 bg-muted/50 rounded-lg"><span>Jobs Done</span><span className="font-medium text-card-foreground">340+</span></div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <div className="flex-1 py-2 bg-gradient-brand text-primary-foreground text-xs font-semibold rounded-lg text-center">Book Now</div>
                    <div className="py-2 px-3 border rounded-lg text-xs text-muted-foreground">💬 Chat</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container mx-auto px-4 py-20 md:py-24">
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Browse</p>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">{t("section.categories")}</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/discover")} className="gap-1 text-primary">
            {t("section.viewAll")} <ArrowRight className="w-4 h-4" />
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

      {/* Top Workers */}
      {topWorkers.length > 0 && (
        <section className="container mx-auto px-4 py-16 md:py-20">
          <div className="flex items-center justify-between mb-10">
            <div>
              <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Featured</p>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">{t("section.topWorkers")}</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/discover")} className="gap-1 text-primary">
              {t("section.seeAll")} <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {topWorkers.map((w, i) => (
              <WorkerCard key={w.id} worker={w} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Blood Donation Section */}
      <section className="bg-gradient-to-br from-red-50 via-rose-50/60 to-background dark:from-red-950/20 dark:via-rose-950/10 py-20 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-semibold text-red-500 uppercase tracking-wider">Save Lives</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
                Blood Donation<br />Network
              </h2>
              <p className="text-muted-foreground mb-6 max-w-md leading-relaxed">
                Join our community of blood donors. Find donors nearby in emergencies, 
                or register to help save lives in your neighborhood. Every drop counts.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button
                  size="lg"
                  onClick={() => navigate("/register")}
                  className="bg-red-500 hover:bg-red-600 text-white gap-2 rounded-xl h-12 px-8"
                >
                  <Droplet className="w-5 h-5" /> Register as Donor
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => navigate("/blood-donors")}
                  className="rounded-xl h-12 px-8 gap-2 border-red-200 text-red-600 hover:bg-red-50"
                >
                  <Users className="w-5 h-5" /> Find Donors
                </Button>
              </div>
            </motion.div>

            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1} className="grid grid-cols-2 gap-4">
              {[
                { icon: Droplet, value: "8 Groups", label: "All Blood Types", color: "text-red-500 bg-red-100 dark:bg-red-950/50" },
                { icon: Users, value: "500+", label: "Registered Donors", color: "text-blue-500 bg-blue-100 dark:bg-blue-950/50" },
                { icon: MapPin, value: "Nearby", label: "Location Based", color: "text-green-500 bg-green-100 dark:bg-green-950/50" },
                { icon: Zap, value: "Instant", label: "Real-time Alerts", color: "text-orange-500 bg-orange-100 dark:bg-orange-950/50" },
              ].map((item, i) => (
                <div key={i} className="bg-card/80 backdrop-blur-sm border rounded-2xl p-5 text-center">
                  <div className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center mx-auto mb-3`}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <p className="text-lg font-bold text-foreground">{item.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16 md:py-20">
        <div className="rounded-3xl bg-gradient-brand p-10 md:p-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary-foreground/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="grid md:grid-cols-2 gap-8 items-center relative">
            <div className="text-center md:text-left">
              <h2 className="text-2xl md:text-4xl font-bold text-primary-foreground mb-4 leading-tight">
                {t("cta.title")}
              </h2>
              <p className="text-primary-foreground/80 mb-8 max-w-md text-lg leading-relaxed">
                {t("cta.subtitle")}
              </p>
              <Button size="lg" onClick={() => navigate("/register?role=worker")} className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 h-12 px-8 rounded-xl text-base font-semibold shadow-lg">
                {t("cta.register")}
              </Button>
            </div>
            <div className="hidden md:flex justify-center">
              <img src={ctaWorkerImg} alt="Join as worker" width={640} height={640} loading="lazy" className="w-56 h-56 object-contain animate-float" />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;