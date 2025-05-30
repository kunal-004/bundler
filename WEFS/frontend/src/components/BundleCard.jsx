import React, { useState } from "react";
import {
  CubeTransparentIcon,
  ShoppingBagIcon,
  CalendarIcon,
  ChevronRightIcon,
  PhotoIcon,
  TagIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";

const DEFAULT_BUNDLE_IMAGE_URL = "/assets/default_icon_listing.png";

const BundleCard = ({ bundle, viewMode = "grid", onView, onEdit }) => {
  const [imageError, setImageError] = useState(false);

  if (!bundle) return null;

  const imageUrl = bundle.logo || DEFAULT_BUNDLE_IMAGE_URL;
  const isActive = bundle.is_active;
  const productCount = bundle.products?.length || 0;
  const bundlePrice = bundle.bundle_price || 0;

  const handleImageError = () => {
    setImageError(true);
  };

  const handleCardClick = (e) => {
    if (e.target.closest("button")) return;
    onView?.(bundle);
  };

  const StatusBadge = ({ className = "" }) => (
    <div className={`flex items-center space-x-2 ${className}`}>
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
          isActive
            ? "bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-200"
            : "bg-gradient-to-r from-gray-50 to-slate-50 text-gray-600 border-gray-200"
        }`}
      >
        <div
          className={`w-2 h-2 rounded-full mr-1.5 ${
            isActive ? "bg-green-500" : "bg-gray-400"
          }`}
        />
        {isActive ? "Active" : "Inactive"}
      </span>
    </div>
  );

  const ProductPreview = ({ products, className = "" }) => {
    if (!products || products.length === 0) return null;

    const displayProducts = products.slice(0, 3);
    const remainingCount = Math.max(0, products.length - 3);

    return (
      <div className={`flex items-center space-x-1 ${className}`}>
        <div className="flex -space-x-2">
          {displayProducts.map((product, index) => (
            <div
              key={product.id || index}
              className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 border-2 border-white flex items-center justify-center overflow-hidden"
            >
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <PhotoIcon className="h-3 w-3 text-indigo-400" />
              )}
            </div>
          ))}
          {remainingCount > 0 && (
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-white flex items-center justify-center">
              <span className="text-xs font-medium text-gray-600">
                +{remainingCount}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (viewMode === "list") {
    return (
      <div
        className="group flex items-center p-5 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 transition-all duration-200 border-b border-gray-100 last:border-b-0 cursor-pointer"
        onClick={handleCardClick}
      >
        <div className="flex-shrink-0 relative">
          <div className="w-24 h-24 rounded-xl overflow-hidden shadow-sm ring-1 ring-gray-200 group-hover:ring-blue-300 transition-all duration-200">
            {!imageError ? (
              <img
                src={imageUrl}
                alt={bundle.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                onError={handleImageError}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <CubeTransparentIcon className="h-8 w-8 text-gray-400" />
              </div>
            )}
          </div>
        </div>

        <div className="ml-6 flex-grow min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-grow min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-900 transition-colors truncate">
                {bundle.name}
              </h3>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2 leading-relaxed">
                {bundle.description || "No description available."}
              </p>
            </div>
            <StatusBadge className="ml-4 flex-shrink-0" />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <ShoppingBagIcon className="h-4 w-4 text-gray-400" />
                <span className="font-medium">{productCount}</span>
                <span className="text-gray-500">products</span>
              </div>

              <ProductPreview products={bundle.products} />

              {bundlePrice > 0 && (
                <div className="flex items-center space-x-2">
                  <TagIcon className="h-4 w-4 text-green-500" />
                  <span className="text-lg font-semibold text-green-600">
                    ${bundlePrice.toFixed(2)}
                  </span>
                </div>
              )}

              {bundle.created_date && (
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <CalendarIcon className="h-3 w-3" />
                  <span>
                    {new Date(bundle.created_date).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <ChevronRightIcon className="h-5 w-5 text-gray-300 group-hover:text-blue-400 group-hover:translate-x-1 transition-all duration-200 ml-4" />
      </div>
    );
  }

  return (
    <div
      className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:border-blue-200 transition-all duration-300 hover:-translate-y-0.5 cursor-pointer flex flex-col h-full"
      onClick={handleCardClick}
    >
      <div className="relative bg-gradient-to-br from-blue-50 to-indigo-50 p-5 flex items-center justify-center">
        <div className="w-25 h-25 rounded-xl overflow-hidden shadow-sm ring-1 ring-gray-200 group-hover:ring-blue-300 transition-all duration-200 bg-white flex items-center justify-center">
          {!imageError ? (
            <img
              src={imageUrl}
              alt={bundle.name}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200 p-2"
              onError={handleImageError}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
              <CubeTransparentIcon className="h-10 w-10 text-indigo-300" />
            </div>
          )}
        </div>

        <div className="absolute top-3 right-3">
          <StatusBadge />
        </div>
      </div>

      <div className="p-5 flex-grow flex flex-col">
        <div className="mb-4">
          <div className="flex justify-between items-start">
            <h3
              className="text-lg font-bold text-gray-900 line-clamp-1 group-hover:text-blue-700 transition-colors pr-2"
              title={bundle.name}
            >
              {bundle.name}
            </h3>
            {bundle.rating && (
              <div className="flex items-center bg-yellow-50 px-2 py-1 rounded-full">
                <StarSolid className="h-4 w-4 text-yellow-400" />
                <span className="text-xs font-semibold text-yellow-700 ml-1">
                  {bundle.rating.toFixed(1)}
                </span>
              </div>
            )}
          </div>

          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed mt-2 min-h-[40px]">
            {bundle.description || "No description available."}
          </p>
        </div>

        <div className="mt-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 text-sm text-gray-600">
                <ShoppingBagIcon className="h-4 w-4 text-indigo-400" />
                <span className="font-medium">{productCount}</span>
                <span className="text-gray-500">products</span>
              </div>
              <ProductPreview products={bundle.products} />
            </div>

            {bundlePrice > 0 && (
              <div className="flex items-center space-x-1">
                <TagIcon className="h-4 w-4 text-green-500" />
                <span className="text-lg font-bold text-green-600">
                  ${bundlePrice.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 pt-3">
            {bundle.created_date && (
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <CalendarIcon className="h-3.5 w-3.5" />
                <span>
                  {new Date(bundle.created_date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}

            <button
              onClick={() => onView?.(bundle)}
              className="text-sm hover: font-medium text-blue-600 hover:text-blue-800 transition-colors flex items-center"
            >
              View details
              <ChevronRightIcon className="h-4 w-4 ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BundleCard;
