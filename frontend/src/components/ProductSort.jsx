import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUpDown } from "lucide-react";

const ProductSort = ({ sortBy, onSortChange, productCount }) => {
  return (
    <div className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm border border-gray-200">
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <span className="font-medium">{productCount}</span>
        <span>products found</span>
      </div>

      <div className="flex items-center space-x-2">
        <ArrowUpDown className="h-4 w-4 text-gray-500" />
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-48 border-gray-300">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="price-low">Price: Low to High</SelectItem>
            <SelectItem value="price-high">Price: High to Low</SelectItem>
            <SelectItem value="name-asc">Name: A to Z</SelectItem>
            <SelectItem value="name-desc">Name: Z to A</SelectItem>
            <SelectItem value="rating-high">Rating: High to Low</SelectItem>
            <SelectItem value="featured">Featured First</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default ProductSort;
