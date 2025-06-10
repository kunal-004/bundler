import React, { useState } from "react";
import {
  CubeTransparentIcon,
  ShoppingBagIcon,
  CalendarDaysIcon,
  ChevronRightIcon,
  PhotoIcon,
  TagIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";

const DEFAULT_BUNDLE_IMAGE_URL = "/assets/default_icon_listing.png";

const timeAgo = (dateString) => {
  if (!dateString) return "";

  try {
    let cleanDateString = dateString;
    if (dateString.includes(".")) {
      const parts = dateString.split(".");
      if (parts.length === 2 && parts[1].length > 3) {
        cleanDateString = parts[0] + "." + parts[1].substring(0, 3);
      }
    }

    if (
      !cleanDateString.includes("Z") &&
      !cleanDateString.includes("+") &&
      !cleanDateString.includes("-", 10)
    ) {
      cleanDateString += "Z";
    }

    const date = new Date(cleanDateString);

    if (isNaN(date.getTime())) {
      console.warn("Invalid date:", dateString);
      return "";
    }

    const now = new Date();
    const diffInMilliseconds = now.getTime() - date.getTime();

    if (diffInMilliseconds < 0) {
      const absDiff = Math.abs(diffInMilliseconds);
      if (absDiff < 60000) return "just now";
      return "in future";
    }

    const seconds = Math.floor(diffInMilliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30.44);
    const years = Math.floor(days / 365.25);

    if (seconds < 10) return "just now";
    if (seconds < 60) return `${seconds} sec ago`;
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hr ago`;
    if (days < 7) return `${days} day${days !== 1 ? "s" : ""} ago`;
    if (weeks < 5) return `${weeks} wk${weeks !== 1 ? "s" : ""} ago`;
    if (months < 12) return `${months} mo${months !== 1 ? "s" : ""} ago`;
    return `${years} yr${years !== 1 ? "s" : ""} ago`;
  } catch (error) {
    console.warn("Date parsing error:", error, "for date:", dateString);
    return "";
  }
};

const parseDate = (dateString) => {
  if (!dateString) return null;

  try {
    let cleanDateString = dateString;

    if (dateString.includes(".") && dateString.includes("T")) {
      const parts = dateString.split(".");
      if (parts.length === 2) {
        const microsecondPart = parts[1];
        const timezoneMatch = microsecondPart.match(/([+-]\d{2}:?\d{2}|Z)$/);
        const timezone = timezoneMatch ? timezoneMatch[1] : "";
        const digits = microsecondPart.replace(/([+-]\d{2}:?\d{2}|Z)$/, "");

        if (digits.length > 3) {
          cleanDateString = parts[0] + "." + digits.substring(0, 3) + timezone;
        }
      }
    }

    let date = new Date(cleanDateString);

    if (isNaN(date.getTime())) {
      date = new Date(dateString);
    }

    if (isNaN(date.getTime())) {
      if (
        !dateString.includes("Z") &&
        !dateString.includes("+") &&
        !dateString.includes("-", 10)
      ) {
        date = new Date(dateString + "Z");
      }
    }

    return isNaN(date.getTime()) ? null : date;
  } catch (error) {
    console.warn("Date parsing error:", error, "for date:", dateString);
    return null;
  }
};

const getMostRecentDate = (createdDate, modifiedDate) => {
  if (!createdDate && !modifiedDate) return null;
  if (!createdDate) return modifiedDate;
  if (!modifiedDate) return createdDate;

  const created = parseDate(createdDate);
  const modified = parseDate(modifiedDate);

  if (!created && !modified) return null;
  if (!created) return modifiedDate;
  if (!modified) return createdDate;

  return modified > created ? modifiedDate : createdDate;
};

const wasModified = (createdDate, modifiedDate) => {
  if (!createdDate || !modifiedDate) return false;

  const created = parseDate(createdDate);
  const modified = parseDate(modifiedDate);

  if (!created || !modified) return false;

  return Math.abs(modified - created) > 5000;
};

const BundleCard = ({ bundle, viewMode = "grid", onView }) => {
  const [imageError, setImageError] = useState(false);

  if (!bundle) return null;

  const imageUrl = bundle.logo || DEFAULT_BUNDLE_IMAGE_URL;
  const isActive = bundle.is_active;
  const productCount = bundle.products?.length || 0;
  const bundlePrice = bundle.bundle_price || 0;
  const createdDate = bundle.created_on;
  const modifiedDate = bundle.modified_on || bundle.updated_on;

  const mostRecentDate = getMostRecentDate(createdDate, modifiedDate);
  const isModified = wasModified(createdDate, modifiedDate);
  const timeSinceLastAction = timeAgo(mostRecentDate);

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
              key={product.id || product.product_uid || index}
              className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 border-2 border-white flex items-center justify-center overflow-hidden"
            >
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name || `Product ${index + 1}`}
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
            </div>
          </div>
          {mostRecentDate && (
            <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <CalendarDaysIcon className="h-3.5 w-3.5" />
                <span>
                  {isModified ? "Modified " : "Created "}
                  {new Date(mostRecentDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              {timeSinceLastAction && (
                <div className="flex items-center space-x-1">
                  <ClockIcon className="h-3.5 w-3.5" />
                  <span>{timeSinceLastAction}</span>
                </div>
              )}
            </div>
          )}
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
        <div className="w-30 h-30 rounded-xl overflow-hidden shadow-sm ring-1 ring-gray-200 group-hover:ring-blue-300 transition-all duration-200 bg-white flex items-center justify-center">
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

          <div className="border-t border-gray-100 pt-3">
            {mostRecentDate && (
              <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                <div className="flex items-center space-x-1">
                  <span>
                    {isModified ? "Modified " : "Created "}
                    {new Date(mostRecentDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                {timeSinceLastAction && (
                  <div className="flex items-center space-x-1">
                    <ClockIcon className="h-3.5 w-3.5" />
                    <span>{timeSinceLastAction}</span>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                onView?.(bundle);
              }}
              className="w-full text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors flex items-center justify-center py-2 bg-blue-50 hover:bg-blue-100 rounded-md"
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
