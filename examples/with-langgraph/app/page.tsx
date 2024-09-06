import { Thread } from "@assistant-ui/react";
import { PriceSnapshotTool } from "@/components/tools/price-snapshot/PriceSnapshotTool";

export default function Home() {
  return (
    <div className="flex h-full flex-col">
      <Thread />
      <PriceSnapshotTool />
    </div>
  );
}
