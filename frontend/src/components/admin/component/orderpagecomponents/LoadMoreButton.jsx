import { Button } from "@/components/ui/button";
import { RefreshCw, ChevronDown } from "lucide-react";

export function LoadMoreButton({ onLoadMore, loading }) {
  return (
    <div className="flex justify-center pt-4">
      <Button
        onClick={onLoadMore}
        disabled={loading}
        variant="outline"
        className="gap-2"
        aria-label="Load more orders"
      >
        {loading ? (
          <>
            <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
            Loading...
          </>
        ) : (
          <>
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
            Load More Orders
          </>
        )}
      </Button>
    </div>
  );
}
