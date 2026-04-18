import { MapPin } from "lucide-react";

interface GoogleMapEmbedProps {
  latitude?: number | null;
  longitude?: number | null;
  title?: string;
  className?: string;
  zoom?: number;
}

const GoogleMapEmbed = ({
  latitude,
  longitude,
  title = "Service location map",
  className = "h-64",
  zoom = 14,
}: GoogleMapEmbedProps) => {
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return (
      <div className={`flex items-center justify-center rounded-2xl border bg-muted/40 ${className}`}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>Location pin will appear here</span>
        </div>
      </div>
    );
  }

  const src = `https://maps.google.com/maps?q=${latitude},${longitude}&z=${zoom}&output=embed`;

  return (
    <div className={`overflow-hidden rounded-2xl border bg-card ${className}`}>
      <iframe
        title={title}
        src={src}
        className="h-full w-full"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
};

export default GoogleMapEmbed;