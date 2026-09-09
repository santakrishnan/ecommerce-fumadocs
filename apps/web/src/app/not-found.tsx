import { ROUTES } from "@config/routes/constants";
import { Button } from "@ucmp/ui";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-full max-w-md space-y-4 text-center">
        <h1 className="h1">404</h1>
        <h2 className="h2">Page Not Found</h2>
        <p className="body-lg">The page you're looking for doesn't exist or has been moved.</p>
        <Button nativeButton={false} render={<Link href={ROUTES.HOME} />} size="lg">
          Return Home
        </Button>
      </div>
    </div>
  );
}
