import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function BackofficeHomePage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Backoffice</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted">
        Go to <Link className="font-medium text-primary" href="/backoffice/courses">Courses</Link> to start.
      </CardContent>
    </Card>
  );
}
