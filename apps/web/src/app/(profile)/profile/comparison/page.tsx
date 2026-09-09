import { Suspense } from "react";
import { Skeleton } from "@/components";

export default function ProfileComparisonPage() {
  return (
    <div className="flex flex-col gap-8">
      <Suspense
        fallback={<Skeleton className="flex h-356.75 items-center justify-start rounded-lg px-6" />}
      >
        {/*TODO Update comparison body here*/}
        <Skeleton className="flex h-356.75 items-center justify-start rounded-lg px-6" />
      </Suspense>
    </div>
  );
}
