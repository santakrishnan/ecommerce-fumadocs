import { Card, CardContent } from "@ucmp/ui";

/**
 * Member ID card placeholder in the profile sidebar.
 *
 * Renders a white card with "Member ID" label,
 * matching the wireframe. Data fetching and real content are out of scope.
 *
 * Typography: Desktop/Body - XXL
 * - font-size: 28px
 * - font-weight: 400
 * - line-height: 36px
 * - letter-spacing: -0.56px
 *
 * Padding: 32px horizontal, 40px vertical.
 * Height: 223px (13.9375rem).
 */
export function MemberIdCard() {
  return (
    <Card className="shadow-none ring-0">
      <CardContent className="flex h-[13.9375rem] items-center px-8 py-10">
        <p className="font-normal text-[1.75rem] text-text-primary leading-9 tracking-tighter">
          Member ID
        </p>
      </CardContent>
    </Card>
  );
}
