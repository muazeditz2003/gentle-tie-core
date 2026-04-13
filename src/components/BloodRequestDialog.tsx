import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Droplet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

interface Props {
  trigger?: React.ReactNode;
}

const BloodRequestDialog = ({ trigger }: Props) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bloodGroup, setBloodGroup] = useState("");
  const [urgency, setUrgency] = useState("normal");
  const [city, setCity] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async () => {
    if (!user || !bloodGroup) {
      toast.error("Please select a blood group");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("blood_requests").insert({
      requester_id: user.id,
      blood_group: bloodGroup,
      urgency,
      city: city || null,
      message: message || null,
    });
    setLoading(false);
    if (error) {
      toast.error("Failed to submit request");
    } else {
      toast.success("Blood request submitted! Matching donors will be notified.");
      setOpen(false);
      setBloodGroup("");
      setUrgency("normal");
      setCity("");
      setMessage("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-red-500 hover:bg-red-600 text-white gap-2 rounded-xl">
            <Droplet className="w-4 h-4" /> Request Blood
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Droplet className="w-5 h-5" /> Request Blood Donation
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label>Blood Group Needed *</Label>
            <Select value={bloodGroup} onValueChange={setBloodGroup}>
              <SelectTrigger className="mt-1.5 rounded-xl">
                <SelectValue placeholder="Select blood group" />
              </SelectTrigger>
              <SelectContent>
                {BLOOD_GROUPS.map((bg) => (
                  <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Urgency Level</Label>
            <div className="flex gap-2 mt-1.5">
              {[
                { value: "normal", label: "Normal", color: "bg-green-100 text-green-700 border-green-200" },
                { value: "urgent", label: "Urgent", color: "bg-orange-100 text-orange-700 border-orange-200" },
                { value: "critical", label: "Critical", color: "bg-red-100 text-red-700 border-red-200" },
              ].map((u) => (
                <Badge
                  key={u.value}
                  variant="outline"
                  className={`cursor-pointer px-4 py-1.5 rounded-full text-sm transition-all ${urgency === u.value ? u.color + " font-semibold ring-2 ring-offset-1 ring-current" : "hover:bg-muted"}`}
                  onClick={() => setUrgency(u.value)}
                >
                  {u.value === "critical" && <AlertTriangle className="w-3 h-3 mr-1" />}
                  {u.label}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <Label>City / Location</Label>
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Lahore, Karachi"
              className="mt-1.5 rounded-xl"
            />
          </div>
          <div>
            <Label>Additional Details</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Any details about the patient or hospital..."
              className="mt-1.5 rounded-xl resize-none"
              rows={3}
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={loading || !bloodGroup}
            className="w-full bg-red-500 hover:bg-red-600 text-white rounded-xl h-11"
          >
            {loading ? "Submitting..." : "Submit Blood Request"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BloodRequestDialog;
