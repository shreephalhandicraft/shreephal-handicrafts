import { Button } from "@/components/ui/button";
import { Plus, Minus } from "lucide-react";

const QuantitySelector = ({
  quantity,
  minQuantity,
  maxQuantity,
  onQuantityChange,
  getCurrentPrice,
  formatPrice,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="font-medium text-gray-900">Quantity</label>
        {(minQuantity > 1 || maxQuantity < 50) && (
          <div className="text-xs text-gray-600">
            Min: {minQuantity}, Max: {maxQuantity}
          </div>
        )}
      </div>

      <div className="flex items-center space-x-4">
        <div className="flex items-center border border-gray-300 rounded-lg">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onQuantityChange(-1)}
            disabled={quantity <= minQuantity}
            className="h-10 w-10 p-0 hover:bg-gray-100"
          >
            <Minus className="h-4 w-4" />
          </Button>

          <div className="flex items-center justify-center w-16 h-10 text-center font-medium border-x border-gray-300">
            {quantity}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onQuantityChange(1)}
            disabled={quantity >= maxQuantity}
            className="h-10 w-10 p-0 hover:bg-gray-100"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {quantity > 1 && (
          <div className="text-sm text-gray-600">
            Total: ₹
            {(((getCurrentPrice() || 0) * quantity) / 100).toLocaleString(
              "en-IN"
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuantitySelector;
