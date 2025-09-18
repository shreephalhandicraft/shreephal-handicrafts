import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function OrderDetailsNotes({ notes }) {
  if (!notes) {
    return (
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Order Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground italic">
            No notes available.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">Order Notes</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm bg-muted p-3 rounded break-words">
          {String(notes)}
        </p>
      </CardContent>
    </Card>
  );
}
