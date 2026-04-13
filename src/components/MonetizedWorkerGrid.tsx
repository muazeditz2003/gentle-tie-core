import WorkerCard from "@/components/WorkerCard";
import NativeAdCard, { type NativeAd } from "@/components/NativeAdCard";
import type { Worker } from "@/data/mockData";

type FeedWorker = Worker & { isSponsored?: boolean };

interface MonetizedWorkerGridProps {
  workers: FeedWorker[];
  ads: NativeAd[];
  adFrequencyMin?: number;
  className?: string;
}

const MonetizedWorkerGrid = ({
  workers,
  ads,
  adFrequencyMin = 5,
  className = "grid gap-3 md:grid-cols-2 xl:grid-cols-3",
}: MonetizedWorkerGridProps) => {
  if (workers.length === 0) return null;

  const safeInterval = Math.max(4, adFrequencyMin || 5);
  const feed: Array<{ type: "worker"; worker: FeedWorker } | { type: "ad"; ad: NativeAd }> = [];
  let adIndex = 0;

  workers.forEach((worker, index) => {
    feed.push({ type: "worker", worker });
    if ((index + 1) % safeInterval === 0 && ads.length > 0) {
      feed.push({ type: "ad", ad: ads[adIndex % ads.length] });
      adIndex += 1;
    }
  });

  return (
    <div className={className}>
      {feed.map((item, index) =>
        item.type === "worker" ? (
          <WorkerCard key={`worker-${item.worker.id}-${index}`} worker={item.worker} index={index} sponsored={item.worker.isSponsored} />
        ) : (
          <NativeAdCard key={`ad-${item.ad.id}-${index}`} ad={item.ad} />
        ),
      )}
    </div>
  );
};

export default MonetizedWorkerGrid;