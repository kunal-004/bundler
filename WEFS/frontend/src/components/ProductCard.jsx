import React, { useState } from "react";
import { CubeIcon, InformationCircleIcon } from "@heroicons/react/24/outline";

const DEFAULT_NO_IMAGE_URL =
  "https://via.placeholder.com/300x300.png?text=No+Image";
const GREEN_DOT_URL = "/assets/green-dot.svg";
const GRAY_DOT_URL = "/assets/gray-dot.svg";

const ProductCard = ({ product }) => {
  const [imageLoadError, setImageLoadError] = useState(false);

  if (!product) return null;

  let imageUrl = DEFAULT_NO_IMAGE_URL;
  if (!imageLoadError) {
    if (product.images && product.images.length > 0) {
      const firstImage = product.images[0];
      if (typeof firstImage === "string") {
        imageUrl = firstImage;
      } else if (firstImage && firstImage.secure_url) {
        imageUrl = firstImage.secure_url;
      }
    }
    if (
      (imageUrl === DEFAULT_NO_IMAGE_URL ||
        !product.images ||
        product.images.length === 0) &&
      product.media &&
      product.media.length > 0
    ) {
      const imageMedia = product.media.find((m) => m.type === "image" && m.url);
      if (imageMedia) {
        imageUrl = imageMedia.url;
      }
    }
  }

  const effectivePrice =
    product.price?.effective?.min ??
    product.all_sizes?.[0]?.price?.effective?.min;
  const markedPrice =
    product.price?.marked?.min ?? product.all_sizes?.[0]?.price?.marked?.min;

  const currency = product.currency || "INR";

  const isActive = product.is_active;
  const brandName = product.brand?.name || "Generic Brand";
  const categoryName =
    product.category_name || product.category_slug || "Uncategorized";

  const handleImageError = () => {
    setImageLoadError(true);
  };

  return (
    <div className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 ease-in-out flex flex-col overflow-hidden border border-gray-200 hover:border-blue-300">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          src={imageUrl}
          alt={product.name || "Product Image"}
          onError={handleImageError}
        />
        <img
          src={isActive ? GREEN_DOT_URL : GRAY_DOT_URL}
          alt={isActive ? "Active" : "Inactive"}
          className="absolute top-2.5 right-2.5 w-3 h-3 p-0.5 bg-white rounded-full shadow-md"
          title={isActive ? "Active" : "Inactive"}
        />
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <div className="flex items-center mb-1">
          {product.brand?.logo?.secure_url && (
            <img
              src={product.brand.logo.secure_url}
              alt={brandName}
              className="h-5 w-auto mr-2 object-contain"
            />
          )}
          <p
            className="text-xs text-gray-500 uppercase tracking-wider"
            title={brandName}
          >
            {brandName}
          </p>
        </div>

        <h3
          className="text-md font-semibold text-gray-800 mb-2 line-clamp-2 h-12 group-hover:text-blue-600"
          title={product.name}
        >
          {product.name || "Unnamed Product"}
        </h3>

        <div className="mt-auto mb-3">
          {effectivePrice !== undefined ? (
            <div className="flex items-center space-x-2">
              {" "}
              <p className="text-xl font-bold text-gray-900 group-hover:text-blue-700">
                {new Intl.NumberFormat("en-IN", {
                  style: "currency",
                  currency: currency,
                  minimumFractionDigits: 0,
                }).format(effectivePrice)}
              </p>
              {markedPrice !== undefined && markedPrice > effectivePrice && (
                <p className="text-sm text-gray-500 line-through">
                  {new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: currency,
                    minimumFractionDigits: 0,
                  }).format(markedPrice)}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Price not available</p>
          )}
        </div>

        <div className="border-t border-gray-100 pt-3 space-y-1.5 text-xs">
          <div className="flex items-center text-gray-600">
            <CubeIcon className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
            <span className="truncate" title={`Category: ${categoryName}`}>
              Category: {categoryName}
            </span>
          </div>
          {product.item_code && (
            <div className="flex items-center text-gray-600">
              <InformationCircleIcon className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
              <span className="truncate" title={`Code: ${product.item_code}`}>
                Code: {product.item_code}
              </span>
            </div>
          )}
        </div>

        {/* {product.tags && product.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {product.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-[10px] font-medium"
              >
                {tag}
              </span>
            ))}
          </div>
        )} */}
      </div>
    </div>
  );
};

export default ProductCard;
