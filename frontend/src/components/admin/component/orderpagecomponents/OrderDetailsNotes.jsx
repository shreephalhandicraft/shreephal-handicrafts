import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, FileText } from "lucide-react";

export function OrderDetailsNotes({ notes }) {
  // Handle empty/null notes
  if (!notes || notes === null || notes === undefined) {
    return (
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-500" />
            Order Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground italic">
            No notes available.
          </p>
        </CardContent>
      </Card>
    );
  }

  // ✅ FIX: Handle both string and object notes gracefully
  let displayNotes = '';
  let hasJsonError = false;

  if (typeof notes === 'string') {
    // Try to parse if it looks like JSON
    if (notes.trim().startsWith('{') || notes.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(notes);
        // Successfully parsed - convert back to readable format
        displayNotes = JSON.stringify(parsed, null, 2);
      } catch (e) {
        // JSON parsing failed - show as plain text with warning
        console.warn('Order notes contain invalid JSON:', e);
        displayNotes = notes;
        hasJsonError = true;
      }
    } else {
      // Not JSON - just plain text
      displayNotes = notes;
    }
  } else if (typeof notes === 'object') {
    // Already an object - stringify it nicely
    displayNotes = JSON.stringify(notes, null, 2);
  } else {
    // Other types - convert to string
    displayNotes = String(notes);
  }

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <FileText className="h-5 w-5 text-amber-600" />
          Order Notes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasJsonError && (
          <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2 text-xs text-yellow-800">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>Note: Order notes contain malformed data. Displaying as plain text.</span>
          </div>
        )}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <pre className="text-sm text-gray-800 whitespace-pre-wrap break-words font-mono">
            {displayNotes}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}
