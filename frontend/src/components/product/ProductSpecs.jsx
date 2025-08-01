import { Palette, Weight, Ruler, Shield, Sparkles } from "lucide-react";

// Helper function to format dimensions
const formatDimensions = (dimensions) => {
  if (!dimensions) return null;

  if (typeof dimensions === "string") {
    return dimensions;
  }

  if (typeof dimensions === "object") {
    const { length, width, height, unit = "cm" } = dimensions;

    if (length && width && height) {
      return `${length}×${width}×${height} ${unit}`;
    } else if (length && width) {
      return `${length}×${width} ${unit}`;
    }
  }

  return null;
};

const ProductSpecs = ({ product, selectedVariant }) => {
  const specs = [];

  if (product.material_type) {
    specs.push({
      icon: <Palette className="h-4 w-4 text-gray-600" />,
      label: "Material",
      value: product.material_type,
    });
  }

  if (selectedVariant?.weight_grams || product.weight_grams) {
    specs.push({
      icon: <Weight className="h-4 w-4 text-gray-600" />,
      label: "Weight",
      value: `${selectedVariant?.weight_grams || product.weight_grams}g`,
    });
  }

  const dimensions = formatDimensions(
    selectedVariant?.dimensions || product.dimensions
  );
  if (dimensions) {
    specs.push({
      icon: <Ruler className="h-4 w-4 text-gray-600" />,
      label: "Dimensions",
      value: dimensions,
    });
  }

  if (product.thickness) {
    specs.push({
      icon: <Ruler className="h-4 w-4 text-gray-600" />,
      label: "Thickness",
      value: product.thickness,
    });
  }

  if (product.base_type) {
    specs.push({
      icon: <Shield className="h-4 w-4 text-gray-600" />,
      label: "Base Type",
      value: product.base_type,
    });
  }

  if (product.foil_available) {
    specs.push({
      icon: <Sparkles className="h-4 w-4 text-gray-600" />,
      label: "Foil Option",
      value: "Available",
    });
  }

  if (specs.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {specs.map((spec, index) => (
        <div
          key={index}
          className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm"
        >
          <div className="flex items-center space-x-2 mb-2">
            {spec.icon}
            <span className="font-medium text-gray-900">{spec.label}</span>
          </div>
          <p className="text-gray-700">{spec.value}</p>
        </div>
      ))}
    </div>
  );
};

export default ProductSpecs;
