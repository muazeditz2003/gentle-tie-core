import { motion } from "framer-motion";
import { Star, MapPin, CheckCircle, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import type { Worker } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/i18n";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Props {
  worker: Worker;
  index?: number;
}

const WorkerCard = ({ worker, index = 0 }: Props) => {
  const initials = worker.name.split(" ").map(n => n[0]).join("").slice(0, 2);
  const { t } = useI18n();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        to={`/worker/${worker.id}`}
        className="tap-feedback block p-4 md:p-5 rounded-2xl bg-card border hover:border-primary/30 hover:shadow-premium hover:-translate-y-0.5 transition-all duration-300 group"
      >
        <div className="flex gap-4">
          <Avatar className="w-14 h-14 rounded-xl border-2 border-border group-hover:border-primary/30 transition-colors">
            <AvatarImage src={worker.profilePhoto} alt={worker.name} className="object-cover" />
            <AvatarFallback className="rounded-xl bg-gradient-brand text-primary-foreground font-bold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-card-foreground truncate">{worker.name}</h3>
              {worker.verified && (
                <CheckCircle className="w-4 h-4 text-primary shrink-0" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">{worker.profession}</p>
            <p className="text-xs font-semibold text-primary mt-1">Starting from PKR 1,500</p>
            <div className="flex items-center gap-3 mt-2.5 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1 px-2 py-0.5 bg-star/10 rounded-full">
                <Star className="w-3 h-3 text-star fill-star" />
                <span className="font-semibold text-card-foreground">{worker.rating}</span>
                <span>({worker.reviewCount})</span>
              </span>
              {worker.distance > 0 && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {worker.distance} {t("worker.km")}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {worker.experience} {t("worker.yrs")}
              </span>
            </div>
          </div>
          <div className="shrink-0 self-start">
            <Badge
              variant={worker.available ? "default" : "secondary"}
              className={worker.available ? "bg-success/10 text-success border-success/20 font-medium" : ""}
            >
              {worker.available ? t("worker.available") : t("worker.busy")}
            </Badge>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default WorkerCard;