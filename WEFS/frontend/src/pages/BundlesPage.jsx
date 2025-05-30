import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import BundleList from "../components/bundles/BundleList";
import LoadingSpinner from "../components/LoadingSpinner";
import SearchFilter from "../components/SearchFilter";
import {
  PlusCircleIcon,
  ChartBarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  FunnelIcon,
  CubeTransparentIcon,
} from "@heroicons/react/24/outline";
import { Grid3X3, List, TrendingUp, Package } from "lucide-react";

const BundlesPage = () => {
  const navigate = useNavigate();
  const {
    bundles,
    isLoadingBundles,
    bundleError,
    fetchBundles,
    companyId,
    applicationId,
  } = useAppContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState({ field: "name", direction: "asc" });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (companyId) {
      fetchBundles();
    }
  }, [companyId, fetchBundles]);

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
    total: bundles.length,
    active: bundles.filter((b) => b.is_active).length,
    aiGenerated: bundles.filter((b) => b.type === "AI").length,
    totalProducts: bundles.reduce(
      (sum, b) => sum + (b.products?.length || 0),
      0
    ),
  };

  const filteredAndSortedBundles = bundles
    .filter(
      (bundle) =>
        bundle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bundle.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const direction = sortBy.direction === "asc" ? 1 : -1;
      if (sortBy.field === "name") {
        return direction * (a.name || "").localeCompare(b.name || "");
      }
      if (sortBy.field === "products") {
        return (
          direction * ((a.products?.length || 0) - (b.products?.length || 0))
        );
      }
      if (sortBy.field === "price") {
        return direction * ((a.bundle_price || 0) - (b.bundle_price || 0));
      }
      return 0;
    });

  const handleSort = (field) => {
    setSortBy((prev) => ({
      field,
      direction:
        prev.field === field && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const SortButton = ({ field, label }) => (
    <button
      onClick={() => handleSort(field)}
      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
        sortBy.field === field
          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-purple-500/25"
          : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-gray-300"
      }`}
      aria-label={`Sort by ${label} ${
        sortBy.field === field
          ? sortBy.direction === "asc"
            ? "ascending"
            : "descending"
          : ""
      }`}
    >
      <span>{label}</span>
      {sortBy.field === field &&
        (sortBy.direction === "asc" ? (
          <ArrowUpIcon className="h-4 w-4" />
        ) : (
          <ArrowDownIcon className="h-4 w-4" />
        ))}
    </button>
  );

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-purple-900 to-blue-900 bg-clip-text text-transparent">
                Product Bundles
              </h1>
              <p className="text-sm text-gray-600 max-w-xl">
                Create intelligent product bundles with AI to boost sales and
                enhance customer experience
              </p>
            </div>
            <button
              onClick={handleCreateBundle}
              className="inline-flex items-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl  transition-all duration-300 transform hover:scale-105"
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
                <SearchFilter
                  onSearch={setSearchTerm}
                  onFilter={() => setShowFilters(!showFilters)}
                />
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

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <FunnelIcon className="h-5 w-5 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">
                      Sort by:
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <SortButton field="name" label="Name" />
                    <SortButton field="products" label="Products" />
                    <SortButton field="price" label="Price" />
                  </div>
                </div>
              </div>
            </div>

            {searchTerm && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-600">
                  Showing{" "}
                  <span className="font-semibold text-gray-900">
                    {filteredAndSortedBundles.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-gray-900">
                    {bundles.length}
                  </span>{" "}
                  bundles
                  {searchTerm && (
                    <span>
                      {" "}
                      for "
                      <span className="font-semibold text-purple-600">
                        {searchTerm}
                      </span>
                      "
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>
        </div>

        {isLoadingBundles && !bundles.length && (
          <div className="flex items-center justify-center py-16">
            <LoadingSpinner message="Loading your bundles..." />
          </div>
        )}

        {/* Error State */}
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
            {filteredAndSortedBundles.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No bundles found
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm
                    ? "Try adjusting your search terms"
                    : "Get started by creating your first bundle"}
                </p>
                {!searchTerm && (
                  <button
                    onClick={handleCreateBundle}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-300"
                  >
                    <PlusCircleIcon className="h-5 w-5" />
                    Create Your First Bundle
                  </button>
                )}
              </div>
            ) : (
              <BundleList
                bundles={filteredAndSortedBundles}
                viewMode={viewMode}
                onView={handleViewBundle}
                onEdit={handleEditBundle}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BundlesPage;
