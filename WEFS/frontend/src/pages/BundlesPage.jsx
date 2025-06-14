/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import BundleList from "../components/BundleList";
import LoadingSpinner from "../components/LoadingSpinner";
import SearchFilter from "../components/SearchFilter";
import {
  PlusCircleIcon,
  ChartBarIcon,
  CubeTransparentIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { Grid3X3, List, TrendingUp, Package } from "lucide-react";

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

const BundlesPage = () => {
  const navigate = useNavigate();
  const {
    bundles,
    isLoadingBundles,
    bundleError,
    fetchBundles,
    companyId,
    applicationId,
    bundlePagination,
  } = useAppContext();

  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid");

  const [currentPage, setCurrentPage] = useState(1);
  const bundlesPerPage = 12;

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    if (companyId) {
      fetchBundles(currentPage, bundlesPerPage, false, debouncedSearchTerm);
    }
  }, [companyId, currentPage, debouncedSearchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  const handleCreateBundle = () => {
    navigate(`/company/${companyId}/bundles/create`);
  };

  const handleViewBundle = (bundle) => {
    const basePath = applicationId
      ? `/company/${companyId}/application/${applicationId}/bundles`
      : `/company/${companyId}/bundles`;
    navigate(`${basePath}/${bundle.id}`);
  };

  const handleEditBundle = (bundle) => {
    console.log("Edit bundle:", bundle);
  };

  const bundleStats = {
    total: bundlePagination.totalItems || bundles.length,
    active: bundles.filter((b) => b.is_active).length,
    aiGenerated: bundles.filter((b) => b.type === "AI").length,
    totalProducts: (() => {
      const allProductUids = bundles.reduce((acc, bundle) => {
        if (bundle.products) {
          bundle.products.forEach((product) => {
            acc.add(product.product_uid);
          });
        }
        return acc;
      }, new Set());
      return allProductUids.size;
    })(),
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    // window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSearch = (searchValue) => {
    setSearchTerm(searchValue);
  };

  const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <div className="relative overflow-hidden bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg transition-all duration-300 group">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {trend && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                <TrendingUp className="h-3 w-3" />
                {trend}
              </span>
            )}
          </div>
        </div>
        <div
          className={`p-3 rounded-xl ${color} group-hover:scale-110 transition-transform duration-300`}
        >
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
      <div
        className={`absolute inset-x-0 bottom-0 h-1 ${color
          .replace("bg-", "bg-gradient-to-r from-")
          .replace("-500", "-400 to-")
          .replace("bg-gradient-to-r from-", "bg-gradient-to-r from-")
          .replace("-400 to-", "-600")}`}
      />
    </div>
  );

  const PaginationControls = () => {
    const totalPages = bundlePagination.totalItems
      ? Math.ceil(bundlePagination.totalItems / bundlesPerPage)
      : 1;

    const currentPageNum = bundlePagination.currentPage || currentPage;
    const totalItems = bundlePagination.totalItems || 0;

    const pageNumbers = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(
      1,
      currentPageNum - Math.floor(maxVisiblePages / 2)
    );
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    const startIndex = (currentPageNum - 1) * bundlesPerPage + 1;
    const endIndex = Math.min(currentPageNum * bundlesPerPage, totalItems);

    return (
      <div className="flex items-center justify-between mt-8">
        <div className="flex items-center text-sm text-gray-700">
          <span>
            Showing {startIndex} to {endIndex} of {totalItems} bundles
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => handlePageChange(currentPageNum - 1)}
            disabled={currentPageNum === 1}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeftIcon className="w-4 h-4 mr-1" />
            Previous
          </button>

          <div className="flex items-center space-x-1">
            {startPage > 1 && (
              <>
                <button
                  onClick={() => handlePageChange(1)}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  1
                </button>
                {startPage > 2 && (
                  <span className="px-2 py-2 text-sm text-gray-500">...</span>
                )}
              </>
            )}

            {pageNumbers.map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  currentPageNum === page
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
                    : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                }`}
              >
                {page}
              </button>
            ))}

            {endPage < totalPages && (
              <>
                {endPage < totalPages - 1 && (
                  <span className="px-2 py-2 text-sm text-gray-500">...</span>
                )}
                <button
                  onClick={() => handlePageChange(totalPages)}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {totalPages}
                </button>
              </>
            )}
          </div>

          <button
            onClick={() => handlePageChange(currentPageNum + 1)}
            disabled={currentPageNum === totalPages}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
            <ChevronRightIcon className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-purple-900 to-blue-900 bg-clip-text text-transparent">
                Product Bundles
              </h1>
              <p className="text-sm text-gray-600 max-w-xl">
                Create and manage product bundles to enhance your offerings.
              </p>
            </div>
            <button
              onClick={handleCreateBundle}
              className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              aria-label="Create new product bundle"
            >
              <PlusCircleIcon className="h-5 w-5" />
              <span>Generate New Bundle</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              title="Total Bundles"
              value={bundleStats.total}
              icon={Package}
              color="bg-blue-500"
            />
            <StatCard
              title="Active Bundles"
              value={bundleStats.active}
              icon={ChartBarIcon}
              color="bg-green-500"
            />
            <StatCard
              title="Total Products"
              value={bundleStats.totalProducts}
              icon={CubeTransparentIcon}
              color="bg-blue-500"
            />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
            <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-4">
              <div className="flex-1">
                <SearchFilter onSearch={handleSearch} />
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <div className="flex items-center bg-gray-100 rounded-xl p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`flex items-center justify-center p-2.5 rounded-lg transition-all duration-200 ${
                      viewMode === "grid"
                        ? "bg-white shadow-sm text-blue-600"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                    aria-label="Grid view"
                  >
                    <Grid3X3 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`flex items-center justify-center p-2.5 rounded-lg transition-all duration-200 ${
                      viewMode === "list"
                        ? "bg-white shadow-sm text-blue-600"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                    aria-label="List view"
                  >
                    <List className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {(searchTerm || debouncedSearchTerm) && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-600">
                  Showing{" "}
                  <span className="font-semibold text-gray-900">
                    {bundlePagination.totalItems || 0}
                  </span>{" "}
                  results
                  <span>
                    {" "}
                    for "
                    <span className="font-semibold text-purple-600">
                      {debouncedSearchTerm || searchTerm}
                    </span>
                    "
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>

        {isLoadingBundles && (
          <div className="flex items-center justify-center py-16">
            <LoadingSpinner message="Loading your bundles..." />
          </div>
        )}

        {!isLoadingBundles && bundleError && (
          <div
            className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8"
            role="alert"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-red-600"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-red-800">
                  Error Loading Bundles
                </h3>
                <p className="text-sm text-red-700 mt-1">{bundleError}</p>
              </div>
            </div>
          </div>
        )}

        {!isLoadingBundles && !bundleError && (
          <div className="space-y-6">
            {bundles.length === 0 && !debouncedSearchTerm ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No bundles found
                </h3>
                <p className="text-gray-600 mb-6">
                  Get started by creating your first bundle
                </p>
                <button
                  onClick={handleCreateBundle}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300"
                >
                  <PlusCircleIcon className="h-5 w-5" />
                  Create Your First Bundle
                </button>
              </div>
            ) : bundles.length === 0 && debouncedSearchTerm ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No bundles found for "{debouncedSearchTerm}"
                </h3>
              </div>
            ) : (
              <>
                <BundleList
                  bundles={bundles}
                  viewMode={viewMode}
                  onView={handleViewBundle}
                  onEdit={handleEditBundle}
                />
                <PaginationControls />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BundlesPage;
