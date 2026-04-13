import { useState } from "react";
import { motion } from "framer-motion";
import { Briefcase, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const UpgradeToWorker = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profession, setProfession] = useState("");
  const [experience, setExperience] = useState("");
  const [city, setCity] = useState("");
  const [serviceArea, setServiceArea] = useState("");

  const handleUpgrade = async () => {
    if (!user) return;
    if (!profession.trim() || !experience.trim()) {
      toast.error("Please fill in profession and experience.");
      return;
    }

    setLoading(true);
    try {
      // Insert worker record
      const { error: workerError } = await supabase.from("workers").insert({
        user_id: user.id,
        profession: profession.trim(),
        experience: parseInt(experience) || 0,
        city: city.trim() || null,
        service_areas: serviceArea.split(",").map(s => s.trim()).filter(Boolean),
        available: true,
      });

      if (workerError) {
        if (workerError.message.includes("duplicate") || workerError.message.includes("unique")) {
          toast.error("You already have a worker profile!");
        } else {
          throw workerError;
        }
        setLoading(false);
        return;
      }

      // Add worker role
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: user.id,
        role: "worker" as any,
      });

      // Role might already exist, that's fine
      if (roleError && !roleError.message.includes("duplicate") && !roleError.message.includes("unique")) {
        console.warn("Role insert warning:", roleError.message);
      }

      // Update profile city if provided
      if (city.trim()) {
        await supabase.from("profiles").update({ city: city.trim() }).eq("user_id", user.id);
      }

      toast.success("You're now registered as a worker! Your profile is live.");
      queryClient.invalidateQueries({ queryKey: ["user_role"] });
      queryClient.invalidateQueries({ queryKey: ["workers"] });
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to upgrade account.");
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-brand rounded-2xl p-5 cursor-pointer hover:opacity-95 transition-opacity"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <p className="font-semibold text-primary-foreground">Become a Worker</p>
                <p className="text-xs text-primary-foreground/70">Start offering your services on the platform</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-primary-foreground/80" />
          </div>
        </motion.div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Register as a Worker</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground mb-4">
          Fill in your professional details to start appearing in search results. Your existing account info will be kept.
        </p>
        <div className="space-y-4">
          <div>
            <Label>Profession *</Label>
            <Input placeholder="e.g. Plumber, Electrician" className="mt-1.5" value={profession} onChange={e => setProfession(e.target.value)} />
          </div>
          <div>
            <Label>Years of Experience *</Label>
            <Input type="number" placeholder="e.g. 5" className="mt-1.5" value={experience} onChange={e => setExperience(e.target.value)} />
          </div>
          <div>
            <Label>City</Label>
            <Input placeholder="e.g. Lahore" className="mt-1.5" value={city} onChange={e => setCity(e.target.value)} />
          </div>
          <div>
            <Label>Service Areas</Label>
            <Input placeholder="DHA, Gulberg, Model Town" className="mt-1.5" value={serviceArea} onChange={e => setServiceArea(e.target.value)} />
          </div>
          <Button onClick={handleUpgrade} disabled={loading} className="w-full bg-gradient-brand text-primary-foreground hover:opacity-90 rounded-xl">
            {loading ? "Setting up..." : "Activate Worker Profile"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeToWorker;
