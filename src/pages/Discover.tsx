import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Search, MapPin, Navigation } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WorkerCard from "@/components/WorkerCard";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { serviceCategories as mockCategories } from "@/data/mockData";
import { getCurrentPosition, calculateDistance, type Coords } from "@/lib/geolocation";
import { useI18n } from "@/i18n";

type SortKey = "distance" | "rating" | "experience";

const Discover = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("distance");
  const selectedCategory = searchParams.get("category") || "";
  const [userCoords, setUserCoords] = useState<Coords | null>(null);
  const [detectingLocation, setDetectingLocation] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/login");
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (user) detectLocation();
  }, [user]);

  const detectLocation = async () => {
    setDetectingLocation(true);
    try {
      const coords = await getCurrentPosition();
      setUserCoords(coords);
    } catch {
      setUserCoords({ latitude: 31.5204, longitude: 74.3587 });
    }
    setDetectingLocation(false);
  };

  const { data: dbWorkers = [] } = useQuery({
    queryKey: ["workers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workers")
        .select("*, profiles(full_name, phone, avatar_url)")
        .eq("available", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    const channelName = `workers-rt-${Math.random().toString(36).slice(2)}`;
    const channel = supabase.channel(channelName);
    channel.on("postgres_changes", { event: "*", schema: "public", table: "workers" }, () => {
      queryClient.invalidateQueries({ queryKey: ["workers"] });
    });
    channel.on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
      queryClient.invalidateQueries({ queryKey: ["workers"] });
    });
    channel.on("postgres_changes", { event: "*", schema: "public", table: "reviews" }, () => {
      queryClient.invalidateQueries({ queryKey: ["review_stats"] });
    });
    channel.subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const { data: dbCategories } = useQuery({
    queryKey: ["service_categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("service_categories").select("*");
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: reviewStats } = useQuery({
    queryKey: ["review_stats"],
    queryFn: async () => {
      const { data, error } = await supabase.from("reviews").select("worker_id, rating");
      if (error) throw error;
      const stats: Record<string, { total: number; count: number }> = {};
      data.forEach((r: any) => {
        if (!stats[r.worker_id]) stats[r.worker_id] = { total: 0, count: 0 };
        stats[r.worker_id].total += r.rating;
        stats[r.worker_id].count += 1;
      });
      return stats;
    },
    enabled: !!user,
  });

  const workersList = useMemo(() => {
    return dbWorkers.map((w: any) => {
      const stats = reviewStats?.[w.id];
      const rating = stats ? parseFloat((stats.total / stats.count).toFixed(1)) : 0;
      let distance = 0;
      if (userCoords && w.latitude && w.longitude) {
        distance = parseFloat(calculateDistance(userCoords.latitude, userCoords.longitude, w.latitude, w.longitude).toFixed(1));
      }
      return {
        id: w.id,
        name: w.profiles?.full_name || "Unknown",
        profession: w.profession,
        rating,
        reviewCount: stats?.count || 0,
        experience: w.experience,
        distance,
        available: w.available,
        verified: w.verified,
        phone: w.profiles?.phone || "",
        description: w.description || "",
        serviceAreas: w.service_areas || [],
        profilePhoto: w.profiles?.avatar_url || "",
        city: w.city || "",
      };
    });
  }, [dbWorkers, userCoords, reviewStats]);

  const categories = dbCategories && dbCategories.length > 0
    ? dbCategories.map(c => ({ id: c.name.toLowerCase().replace(/\s+/g, "-"), name: c.name, icon: c.icon, count: 0 }))
    : mockCategories;

  const filtered = useMemo(() => {
    let list = [...workersList];
    // Exclude the current user's own worker profile from the list
    if (user) {
      list = list.filter(w => {
        const workerRecord = dbWorkers.find((dw: any) => dw.id === w.id);
        return workerRecord?.user_id !== user.id;
      });
    }
    if (selectedCategory) {
      list = list.filter(w => w.profession.toLowerCase().replace(/\s+/g, "-") === selectedCategory);
    }
    if (search) {
      const words = search.toLowerCase().trim().split(/\s+/);
      list = list.filter(w => {
        const name = w.name.toLowerCase();
        const prof = w.profession.toLowerCase();
        const city = w.city.toLowerCase();
        return words.every(
          word => name.includes(word) || prof.includes(word) || city.includes(word)
        );
      });
    }
    list.sort((a, b) => {
      if (sort === "distance") return a.distance - b.distance;
      if (sort === "rating") return b.rating - a.rating;
      return b.experience - a.experience;
    });
    return list;
  }, [workersList, selectedCategory, search, sort, user, dbWorkers]);

  const toggleCategory = (id: string) => {
    if (selectedCategory === id) searchParams.delete("category");
    else searchParams.set("category", id);
    setSearchParams(searchParams);
  };

  const sortLabels: Record<SortKey, string> = {
    distance: t("discover.distance"),
    rating: t("discover.rating"),
    experience: t("discover.experience"),
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

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">{t("discover.title")}</h1>
          <p className="text-sm text-muted-foreground mb-1">Workers can also browse and hire other professionals</p>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <MapPin className="w-4 h-4" />
            {userCoords ? (
              <span>{t("discover.usingLocation")} ({userCoords.latitude.toFixed(2)}, {userCoords.longitude.toFixed(2)})</span>
            ) : (
              <span>{t("discover.detecting")}</span>
            )}
            <Button variant="ghost" size="sm" onClick={detectLocation} disabled={detectingLocation} className="gap-1 h-7 text-xs">
              <Navigation className="w-3 h-3" /> {detectingLocation ? t("discover.detecting") : t("discover.refresh")}
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder={t("discover.searchPlaceholder")} value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-11 rounded-xl" />
          </div>
          <div className="flex gap-2">
            {(["distance", "rating", "experience"] as SortKey[]).map(s => (
              <Button
                key={s}
                variant={sort === s ? "default" : "outline"}
                size="sm"
                onClick={() => setSort(s)}
                className={sort === s ? "bg-gradient-brand text-primary-foreground" : ""}
              >
                {sortLabels[s]}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
          {categories.map(cat => (
            <Badge
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "outline"}
              className={`cursor-pointer whitespace-nowrap px-3.5 py-1.5 text-sm hover:bg-accent transition-colors shrink-0 rounded-full ${
                selectedCategory === cat.id ? "bg-gradient-brand text-primary-foreground border-transparent" : ""
              }`}
              onClick={() => toggleCategory(cat.id)}
            >
              {cat.icon} {cat.name}
            </Badge>
          ))}
        </div>

        <p className="text-sm text-muted-foreground mb-4">{filtered.length} {t("discover.workersFound")}</p>
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((w, i) => (
            <WorkerCard key={w.id} worker={w} index={i} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">{t("discover.noWorkers")}</p>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Discover;