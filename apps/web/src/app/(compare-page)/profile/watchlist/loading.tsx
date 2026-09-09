import { Skeleton } from "@ucmp/ui";

export default function ProfileWatchlistLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}
