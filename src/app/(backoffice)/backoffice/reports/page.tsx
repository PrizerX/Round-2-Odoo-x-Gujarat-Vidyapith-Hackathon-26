import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function BackofficeReportsPage() {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Reporting</h1>
        <p className="text-sm text-muted">
          Placeholder — overview cards + customizable columns table next.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Total Participants", 120],
          ["Yet to Start", 28],
          ["In Progress", 64],
          ["Completed", 28],
        ].map(([label, value]) => (
          <Card key={label}>
            <CardHeader>
              <CardTitle className="text-sm text-muted">{label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Participants Table</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted">
          Column picker sidebar + table rows (S.No, Course, Participant, Dates,
          Time Spent, Completion %, Status) will go here.
        </CardContent>
      </Card>
    </div>
  );
}
