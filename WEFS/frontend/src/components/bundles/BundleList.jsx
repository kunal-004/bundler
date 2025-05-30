import React from "react";
import BundleCard from "../BundleCard";
import {
  CubeTransparentIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/outline";
import { SparklesIcon as SparklesSolid } from "@heroicons/react/24/solid";

const BundleList = ({
  bundles,
  viewMode = "grid",
  onView,
  onEdit,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden animate-pulse"
              >
                <div className="aspect-[4/3] bg-gray-200" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex items-center p-5 border-b border-gray-100 last:border-b-0 animate-pulse"
              >
                <div className="w-24 h-24 bg-gray-200 rounded-xl" />
                <div className="ml-6 flex-grow space-y-2">
                  <div className="h-5 bg-gray-200 rounded w-1/2" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (!bundles || bundles.length === 0) {
    return (
      <div className="text-center py-20 bg-gradient-to-br from-gray-50 via-white to-blue-50 rounded-2xl shadow-sm border border-gray-200">
        <div className="max-w-md mx-auto">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
            <CubeTransparentIcon className="h-10 w-10 text-blue-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            No Bundles Yet
          </h3>
          <p className="text-gray-600 leading-relaxed mb-6">
            Get started by creating your first bundle. Use AI to generate smart
            bundles to boost your sales.
          </p>
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <SparklesSolid className="h-4 w-4 text-purple-500" />
              <span>AI-powered creation</span>
            </div>
            <div className="flex items-center space-x-2">
              <ShoppingBagIcon className="h-4 w-4 text-blue-500" />
              <span>Smart bundling</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-100">
          {bundles.map((bundle) => (
            <BundleCard
              key={bundle.id}
              bundle={bundle}
              viewMode="list"
              onView={onView}
              onEdit={onEdit}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {bundles.map((bundle) => (
        <BundleCard
          key={bundle.id}
          bundle={bundle}
          viewMode="grid"
          onView={onView}
          onEdit={onEdit}
        />
      ))}
    </div>
  );
};

export default BundleList;
