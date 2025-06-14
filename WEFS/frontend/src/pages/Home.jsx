import React, { useState, useMemo, useEffect } from "react";
import { useAppContext } from "../context/AppContext";
import ProductCard from "../components/ProductCard";
import LoadingSpinner from "../components/LoadingSpinner";
import SalesChannelCard from "../components/SalesChannelCard";
import {
  ArchiveBoxXMarkIcon,
  BuildingStorefrontIcon,
  ChevronUpDownIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ListBulletIcon,
} from "@heroicons/react/24/outline";
import { Sparkles } from "lucide-react";

export const Home = () => {
  const {
    products,
    allProducts,
    isLoadingProducts,
    productError,
    salesChannels,
    isLoadingSalesChannels,
    salesChannelsError,
    applicationId,
    changeApplication,
    getSelectedApplicationName,
    companyInfo,
    productPagination,
    fetchProductsWithContext,
  } = useAppContext();

  const [filters, setFilters] = useState({ name: "", category: "" });
  const [debouncedName, setDebouncedName] = useState(filters.name);
  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "ascending",
  });

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedName(filters.name);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [filters.name]);

  useEffect(() => {
    setFilters((prevFilters) => ({ ...prevFilters, category: "" }));
  }, [applicationId]);

  useEffect(() => {
    fetchProductsWithContext(
      1,
      productPagination.pageSize,
      false,
      debouncedName
    );
  }, [
    debouncedName,
    applicationId,
    productPagination.pageSize,
    fetchProductsWithContext,
  ]);

  const productsToDisplay = useMemo(() => {
    return applicationId ? products : allProducts;
  }, [applicationId, products, allProducts]);

  const uniqueCategories = useMemo(() => {
    if (!productsToDisplay?.items?.length) return [];
    const categoriesSet = new Set(
      productsToDisplay.items
        .map((p) => p.category_name || p.category_slug)
        .filter(Boolean)
    );
    return Array.from(categoriesSet).sort();
  }, [productsToDisplay]);

  const getProductPrice = (product) => {
    return parseFloat(
      product.price?.effective?.min ||
        product.price?.min_price ||
        product.price?.price?.min ||
        0
    );
  };

  const sortedProducts = useMemo(() => {
    if (!productsToDisplay?.items) return [];

    let filteredProducts = [...productsToDisplay.items];

    if (filters.category) {
      filteredProducts = filteredProducts.filter(
        (product) =>
          product.category_name === filters.category ||
          product.category_slug === filters.category
      );
    }

    if (sortConfig.key) {
      filteredProducts.sort((a, b) => {
        let aValue =
          sortConfig.key === "price" ? getProductPrice(a) : a[sortConfig.key];
        let bValue =
          sortConfig.key === "price" ? getProductPrice(b) : b[sortConfig.key];
        if (typeof aValue === "string") {
          return sortConfig.direction === "ascending"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        return sortConfig.direction === "ascending"
          ? aValue - bValue
          : bValue - aValue;
      });
    }
    return filteredProducts;
  }, [productsToDisplay, sortConfig, filters.category]);

  const handleFilterChange = (filterName, value) =>
    setFilters((prev) => ({ ...prev, [filterName]: value }));

  const clearFilters = () => setFilters({ name: "", category: "" });

  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const SortIndicator = ({ sortKey }) => {
    if (sortConfig.key !== sortKey)
      return <ChevronUpDownIcon className="w-4 h-4 text-gray-400" />;
    return sortConfig.direction === "ascending" ? (
      <ArrowUpIcon className="w-4 h-4 text-blue-600" />
    ) : (
      <ArrowDownIcon className="w-4 h-4 text-blue-600" />
    );
  };

  const handlePageChange = (page) => {
    const { currentPage, totalPages, pageSize } = productPagination;
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      fetchProductsWithContext(page, pageSize, false, filters.name);
      document
        .getElementById("products-section")
        ?.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (isLoadingProducts && !productsToDisplay?.items?.length && !productError) {
    return <LoadingSpinner message="Loading..." />;
  }

  if (productError && !productsToDisplay?.items?.length) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-6 bg-gray-50">
        <ArchiveBoxXMarkIcon className="h-16 w-16 text-red-400 mb-4" />
        <h2 className="text-2xl font-semibold text-red-600 mb-2">
          Error Loading Product Data
        </h2>
        <p className="text-red-500 max-w-md mb-6">{productError.toString()}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto">
        <div className="flex flex-col lg:flex-row gap-8 py-8 px-4 sm:px-6 lg:px-8">
          <aside className="w-full lg:w-1/4 lg:max-w-xs flex-shrink-0">
            <div className="space-y-8 sticky top-8">
              {companyInfo && (
                <div className="p-5 bg-white rounded-2xl shadow-sm border border-slate-200">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 p-3 bg-slate-100 rounded-xl border border-slate-200">
                      <BuildingStorefrontIcon className="h-7 w-7 text-blue-600" />
                    </div>
                    <div>
                      <h2
                        className="text-base font-bold text-gray-800"
                        title={companyInfo.name}
                      >
                        {companyInfo.name}
                      </h2>
                      <p className="text-xs text-gray-500">
                        Company ID: {companyInfo.companyId}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg border border-white/50 p-6">
                <div className="space-y-4">
                  <button
                    onClick={() => changeApplication(null)}
                    className={`flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md ${
                      !applicationId
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg transform scale-[1.02]"
                        : "hover:bg-slate-50 text-slate-700 hover:shadow-lg"
                    }`}
                  >
                    <ListBulletIcon className="h-5 w-5 flex-shrink-0" />
                    <span className="text-sm">All Company Products</span>
                  </button>
                  <div className="pt-4 border-t border-slate-100">
                    <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 px-2">
                      Sales Channels
                    </h3>
                    <p className="text-sm text-slate-600 mb-4 px-2 leading-relaxed">
                      select a channel to use its products.
                    </p>
                    {isLoadingSalesChannels && (
                      <div className="py-8">
                        <LoadingSpinner message="Loading channels..." />
                      </div>
                    )}
                    {salesChannelsError && (
                      <div className="p-4 text-sm text-red-600 bg-red-50 rounded-2xl border border-red-100">
                        Unable to load sales channels
                      </div>
                    )}
                    <div className="space-y-2">
                      {salesChannels &&
                        salesChannels.map((channel) => (
                          <SalesChannelCard
                            key={channel.id}
                            channel={channel}
                          />
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <main id="products-section" className="flex-1 min-w-0">
            <div className="bg-gradient-to-r from-blue-600 via-indigo-700 to-purple-700 text-white shadow-lg rounded-2xl p-6 md:p-8 mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  {applicationId && getSelectedApplicationName()
                    ? `${getSelectedApplicationName()}`
                    : "All Products"}
                </h1>
                <p className="text-blue-100 text-sm sm:text-base mt-1.5">
                  {applicationId
                    ? `Products for this sales channel.`
                    : "An overview of all products."}
                </p>
              </div>

              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm border border-white/30">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => requestSort("name")}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md hover:text-blue-600"
                  >
                    Name <SortIndicator sortKey="name" />
                  </button>
                  <button
                    onClick={() => requestSort("price")}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow-md hover:text-blue-600"
                  >
                    Price <SortIndicator sortKey="price" />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={filters.name}
                    onChange={(e) => handleFilterChange("name", e.target.value)}
                    placeholder="Search products..."
                    className="w-full sm:w-48 p-2 border border-gray-300 rounded-lg shadow-sm text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                  {uniqueCategories.length > 0 && (
                    <select
                      onChange={(e) =>
                        handleFilterChange("category", e.target.value)
                      }
                      value={filters.category}
                      className="w-full sm:w-40 p-2 border border-gray-300 rounded-lg shadow-sm text-sm focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Categories</option>
                      {uniqueCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>

            {isLoadingProducts && !sortedProducts.length && (
              <LoadingSpinner message={`Loading products...`} />
            )}
            {!isLoadingProducts && !sortedProducts.length && (
              <div className="text-center py-16 px-6 bg-white rounded-2xl shadow-sm border border-slate-200 mt-6">
                <ArchiveBoxXMarkIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No Products Found
                </h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  {filters.name || filters.category
                    ? "Try adjusting your search or filter criteria."
                    : `There are no products available for the selected channel.`}
                </p>
                {(filters.name || filters.category) && (
                  <button
                    onClick={clearFilters}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {sortedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {productPagination && productPagination.totalPages > 1 && (
              <nav
                className="mt-8 flex items-center justify-center space-x-2"
                aria-label="Pagination"
              >
                <button
                  onClick={() =>
                    handlePageChange(productPagination.currentPage - 1)
                  }
                  disabled={productPagination.currentPage === 1}
                  className="p-2 rounded-md hover:bg-gray-200 disabled:opacity-50"
                >
                  <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
                </button>
                <span className="text-sm text-gray-600">
                  Page {productPagination.currentPage} of{" "}
                  {productPagination.totalPages}
                </span>
                <button
                  onClick={() =>
                    handlePageChange(productPagination.currentPage + 1)
                  }
                  disabled={
                    productPagination.currentPage ===
                    productPagination.totalPages
                  }
                  className="p-2 rounded-md hover:bg-gray-200 disabled:opacity-50"
                >
                  <ChevronRightIcon className="w-5 h-5 text-gray-600" />
                </button>
              </nav>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Home;

// import React, { useState, useMemo, useEffect } from "react";
// import { useAppContext } from "../context/AppContext";
// import ProductCard from "../components/ProductCard";
// import LoadingSpinner from "../components/LoadingSpinner";
// import SalesChannelCard from "../components/SalesChannelCard";
// import {
//   ArchiveBoxXMarkIcon,
//   BuildingStorefrontIcon,
//   ExclamationTriangleIcon,
//   FunnelIcon,
//   XMarkIcon,
//   ChevronUpDownIcon,
//   ArrowUpIcon,
//   ArrowDownIcon,
//   ChevronLeftIcon,
//   ChevronRightIcon,
//   ListBulletIcon,
//   CheckCircleIcon,
// } from "@heroicons/react/24/outline";
// import { Sparkles } from "lucide-react";

// export const Home = () => {
//   const {
//     products,
//     allProducts,
//     isLoadingProducts,
//     productError,
//     salesChannels,
//     isLoadingSalesChannels,
//     salesChannelsError,
//     applicationId,
//     changeApplication,
//     getSelectedApplicationName,
//     companyInfo,
//     // loadMoreProducts, // This will no longer be used by Home.js directly for product listing
//     productPagination,
//     fetchProducts,
//     fetchAllProducts, // Added: Ensure this is provided by AppContext
//   } = useAppContext();

//   const [filters, setFilters] = useState({
//     name: "",
//     category: "",
//   });
//   const [showFilters, setShowFilters] = useState(false);
//   const [sortConfig, setSortConfig] = useState({
//     key: "name",
//     direction: "ascending",
//   });

//   useEffect(() => {
//     setFilters({ name: "", category: "" });
//     setShowFilters(false);
//   }, [applicationId]);

//   // Removed useEffect for localStorage "application_id" as it's handled in AppContext by get/setStoredApplicationId

//   const productsToDisplay = useMemo(() => {
//     if (!applicationId) {
//       return allProducts;
//     }
//     return products;
//   }, [applicationId, products, allProducts]);

//   const uniqueCategories = useMemo(() => {
//     if (
//       !productsToDisplay ||
//       !productsToDisplay.items ||
//       productsToDisplay.items.length === 0
//     ) {
//       return [];
//     }
//     const categoriesSet = new Set();
//     productsToDisplay.items.forEach((product) => {
//       const category = product.category_name || product.category_slug;
//       if (category) categoriesSet.add(category);
//     });
//     return Array.from(categoriesSet).sort();
//   }, [productsToDisplay]);

//   const getProductPrice = (product) => {
//     return parseFloat(
//       product.price?.effective?.min ||
//         product.price?.min_price ||
//         product.price?.price?.min ||
//         0
//     );
//   };

//   const filteredAndSortedProducts = useMemo(() => {
//     if (!productsToDisplay?.items) return [];

//     let filtered = [...productsToDisplay.items];

//     if (filters.name) {
//       const searchTerm = filters.name.toLowerCase();
//       filtered = filtered.filter((product) =>
//         product.name.toLowerCase().includes(searchTerm)
//       );
//     }

//     if (filters.category) {
//       filtered = filtered.filter(
//         (product) =>
//           (product.category_name ||
//             product.category_slug ||
//             "Uncategorized") === filters.category
//       );
//     }

//     if (sortConfig.key) {
//       filtered.sort((a, b) => {
//         let aValue = a[sortConfig.key];
//         let bValue = b[sortConfig.key];

//         if (sortConfig.key === "price") {
//           aValue = getProductPrice(a);
//           bValue = getProductPrice(b);
//         }

//         if (typeof aValue === "string" && typeof bValue === "string") {
//           return sortConfig.direction === "ascending"
//             ? aValue.localeCompare(bValue)
//             : bValue.localeCompare(aValue);
//         }

//         return sortConfig.direction === "ascending"
//           ? aValue - bValue
//           : bValue - aValue;
//       });
//     }

//     return filtered;
//   }, [productsToDisplay, filters, sortConfig]);

//   const handleFilterChange = (filterName, value) => {
//     setFilters((prev) => ({ ...prev, [filterName]: value }));
//   };

//   const clearFilters = () => {
//     setFilters({ name: "", category: "" });
//   };

//   const requestSort = (key) => {
//     let direction = "ascending";
//     if (sortConfig.key === key && sortConfig.direction === "ascending") {
//       direction = "descending";
//     } else if (
//       sortConfig.key === key &&
//       sortConfig.direction === "descending"
//     ) {
//       direction = "ascending"; // Cycle back to ascending
//     }
//     setSortConfig({ key, direction });
//   };

//   const SortIndicator = ({ sortKey }) => {
//     if (sortConfig.key !== sortKey)
//       return <ChevronUpDownIcon className="w-4 h-4 text-gray-400" />;
//     if (sortConfig.direction === "ascending")
//       return <ArrowUpIcon className="w-4 h-4 text-blue-600" />;
//     return <ArrowDownIcon className="w-4 h-4 text-blue-600" />;
//   };

//   const renderCompanyInfo = () => {
//     if (!companyInfo) return null;
//     const getStageColor = (stage) => {
//       /* ... (keep existing implementation) ... */
//       switch (stage?.toLowerCase()) {
//         case "verified":
//           return "bg-green-50 text-green-700 border-green-200";
//         case "pending":
//           return "bg-yellow-50 text-yellow-700 border-yellow-200";
//         case "unverified":
//           return "bg-red-50 text-red-700 border-red-200";
//         default:
//           return "bg-gray-50 text-gray-700 border-gray-200";
//       }
//     };
//     const getStageIcon = (stage) => {
//       /* ... (keep existing implementation) ... */
//       switch (stage?.toLowerCase()) {
//         case "verified":
//           return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
//         case "pending":
//           return (
//             <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
//           );
//         case "unverified":
//           return <XMarkIcon className="h-5 w-5 text-red-500" />;
//         default:
//           return <BuildingStorefrontIcon className="h-5 w-5 text-gray-500" />;
//       }
//     };
//     return (
//       <div className="mb-8 p-4 sm:p-6 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl shadow-lg border border-slate-200">
//         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
//           <div className="flex items-center space-x-4">
//             <div className="flex-shrink-0 p-3 bg-white rounded-lg shadow-sm border border-slate-200">
//               <BuildingStorefrontIcon className="h-8 w-8 text-blue-600" />
//             </div>
//             <div>
//               <h2 className="text-xl font-bold text-gray-900 mb-1">
//                 {companyInfo.name}
//               </h2>
//               <div className="flex items-center space-x-2 text-sm text-gray-600">
//                 <span>Company ID:</span>
//                 <span className="font-mono bg-white px-2 py-1 rounded border text-gray-800 font-semibold">
//                   {companyInfo.companyId}
//                 </span>
//               </div>
//             </div>
//           </div>
//           <div className="flex items-center space-x-2">
//             <div
//               className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium border ${getStageColor(
//                 companyInfo.stage
//               )}`}
//             >
//               {getStageIcon(companyInfo.stage)}
//               <span className="ml-2 capitalize">
//                 {companyInfo.stage || "Unknown"}
//               </span>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   };

//   const renderApplicationSelectionInfo = () => {
//     /* ... (keep existing implementation) ... */
//     if (isLoadingSalesChannels && !salesChannels && !applicationId) {
//       return (
//         <div className="mb-8 p-4 sm:p-6 bg-white rounded-xl shadow-lg border border-gray-200">
//           <LoadingSpinner message="Loading application information..." />
//         </div>
//       );
//     }
//     if (salesChannelsError && !salesChannels && !applicationId) {
//       return (
//         <div className="mb-8 p-4 sm:p-6 bg-red-50 rounded-xl shadow-lg border border-red-200 text-center">
//           <ExclamationTriangleIcon className="h-8 w-8 text-red-400 mx-auto mb-2" />
//           <p className="text-sm font-medium text-red-700">
//             Could not load application information.
//           </p>
//           <p className="text-xs text-red-600">
//             {salesChannelsError.toString()}
//           </p>
//         </div>
//       );
//     }
//     return (
//       <div className="mb-8 p-4 sm:p-6 bg-white rounded-xl shadow-lg border border-gray-200">
//         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
//           <div>
//             <h2 className="block text-md font-semibold text-gray-700 mb-1">
//               Application Selection:
//             </h2>
//             {applicationId && getSelectedApplicationName() ? (
//               <div className="flex items-center space-x-2 text-sm text-green-700 bg-green-50 px-3.5 py-2 rounded-full shadow-sm">
//                 <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
//                 <span>
//                   Currently viewing:{" "}
//                   <span className="font-medium">
//                     {getSelectedApplicationName()}
//                   </span>
//                 </span>
//               </div>
//             ) : (
//               <div className="flex items-center space-x-2 text-sm text-blue-700 bg-blue-50 px-3.5 py-2 rounded-full shadow-sm">
//                 <ListBulletIcon className="h-5 w-5 text-blue-500 flex-shrink-0" />
//                 <span>
//                   Showing:{" "}
//                   <span className="font-medium">All Company Products</span>
//                 </span>
//               </div>
//             )}
//           </div>
//           {applicationId && (
//             <button
//               onClick={() => changeApplication(null)}
//               className="mt-2 sm:mt-0 px-3 py-2 text-xs font-medium text-blue-600 bg-blue-100 border border-blue-300 rounded-lg hover:bg-blue-200 hover:text-blue-700 transition-colors flex items-center space-x-1.5 shadow-sm"
//               title="Clear current application selection and view all products"
//             >
//               <XMarkIcon className="w-4 h-4" />
//               <span>Clear Selection</span>
//             </button>
//           )}
//         </div>
//       </div>
//     );
//   };

//   const renderFiltersAndSort = () => (
//     /* ... (keep existing implementation) ... */
//     <div className="bg-white p-4 sm:p-6 rounded-lg shadow border border-gray-200 mb-6 transition-all duration-300 ease-in-out">
//       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
//         <h3 className="text-lg font-semibold text-gray-700">
//           Filter & Sort Products
//         </h3>
//         {(filters.name || filters.category) && (
//           <button
//             onClick={clearFilters}
//             className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center self-start sm:self-center"
//           >
//             <XMarkIcon className="w-4 h-4 mr-1" /> Clear Filters
//           </button>
//         )}
//       </div>
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
//         <div>
//           <label
//             htmlFor="filter-name"
//             className="block text-sm font-medium text-gray-600 mb-1"
//           >
//             Product Name
//           </label>
//           <input
//             type="text"
//             id="filter-name"
//             value={filters.name}
//             onChange={(e) => handleFilterChange("name", e.target.value)}
//             placeholder="Search by name..."
//             className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-blue-500 focus:border-blue-500"
//           />
//         </div>
//         {uniqueCategories.length > 0 ? (
//           <div>
//             <label
//               htmlFor="filter-category"
//               className="block text-sm font-medium text-gray-600 mb-1"
//             >
//               Category
//             </label>
//             <select
//               id="filter-category"
//               value={filters.category}
//               onChange={(e) => handleFilterChange("category", e.target.value)}
//               className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-blue-500 focus:border-blue-500"
//             >
//               <option value="">All Categories</option>
//               {uniqueCategories.map((cat) => (
//                 <option key={cat} value={cat}>
//                   {cat}
//                 </option>
//               ))}
//             </select>
//           </div>
//         ) : (
//           productsToDisplay &&
//           productsToDisplay.items &&
//           productsToDisplay.items.length > 0 && (
//             <div className="text-sm text-gray-500 pt-7 sm:pt-0 sm:mt-[29px]">
//               No categories for current products.
//             </div>
//           )
//         )}
//       </div>
//       <div className="flex items-center space-x-3 border-t border-gray-100 pt-4">
//         <span className="text-sm font-medium text-gray-600">Sort by:</span>
//         <button
//           onClick={() => requestSort("name")}
//           className={`px-3 py-1.5 text-xs border rounded-md flex items-center space-x-1 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-300 ${
//             sortConfig.key === "name"
//               ? "bg-blue-50 border-blue-400 text-blue-700"
//               : "border-gray-300 text-gray-700"
//           }`}
//         >
//           <span>Name</span> <SortIndicator sortKey="name" />
//         </button>
//         <button
//           onClick={() => requestSort("price")}
//           className={`px-3 py-1.5 text-xs border rounded-md flex items-center space-x-1 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-300 ${
//             sortConfig.key === "price"
//               ? "bg-blue-50 border-blue-400 text-blue-700"
//               : "border-gray-300 text-gray-700"
//           }`}
//         >
//           <span>Price</span> <SortIndicator sortKey="price" />
//         </button>
//       </div>
//     </div>
//   );

//   const renderPaginationInfo = () => {
//     /* ... (keep existing implementation) ... */
//     if (!productPagination || productPagination.totalItems === 0) return null;
//     const startItem =
//       (productPagination.currentPage - 1) * productPagination.pageSize + 1;
//     const endItem = Math.min(
//       productPagination.currentPage * productPagination.pageSize,
//       productPagination.totalItems
//     );
//     return (
//       <div className="flex justify-between items-center text-sm text-gray-600 bg-gray-50 px-4 py-3 rounded-lg border">
//         <span>
//           Showing {startItem} to {endItem} of {productPagination.totalItems}{" "}
//           products
//         </span>
//         <span>
//           Page {productPagination.currentPage} of {productPagination.totalPages}
//         </span>
//       </div>
//     );
//   };

//   const renderServerPagination = () => {
//     if (!productPagination || productPagination.totalPages <= 1) return null;

//     const { currentPage, totalPages, pageSize } = productPagination; // Ensure pageSize is available
//     const pageNumbers = [];
//     const maxPagesToShow = 5;
//     let startPage, endPage;

//     if (totalPages <= maxPagesToShow) {
//       startPage = 1;
//       endPage = totalPages;
//     } else {
//       if (currentPage <= Math.ceil(maxPagesToShow / 2)) {
//         startPage = 1;
//         endPage = maxPagesToShow;
//       } else if (currentPage + Math.floor(maxPagesToShow / 2) >= totalPages) {
//         startPage = totalPages - maxPagesToShow + 1;
//         endPage = totalPages;
//       } else {
//         startPage = currentPage - Math.floor(maxPagesToShow / 2);
//         endPage = currentPage + Math.floor(maxPagesToShow / 2);
//       }
//     }

//     for (let i = startPage; i <= endPage; i++) {
//       pageNumbers.push(i);
//     }

//     const handlePageChange = (page) => {
//       if (page >= 1 && page <= totalPages && page !== currentPage) {
//         // UPDATED LOGIC: Call the correct fetch function
//         if (applicationId) {
//           fetchProducts(page, pageSize);
//         } else {
//           fetchAllProducts(page, pageSize, false); // 'false' for append, as we're fetching a new page
//         }
//         const section = document.getElementById("products-section");
//         if (section) {
//           section.scrollIntoView({ behavior: "smooth", block: "start" });
//         }
//       }
//     };

//     return (
//       <nav
//         className="mt-8 flex items-center justify-center space-x-1 sm:space-x-2"
//         aria-label="Product Pagination"
//       >
//         <button
//           onClick={() => handlePageChange(currentPage - 1)}
//           disabled={currentPage === 1}
//           className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
//           aria-label="Previous Page"
//         >
//           <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
//         </button>

//         {startPage > 1 && (
//           <>
//             <button
//               onClick={() => handlePageChange(1)}
//               className="px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
//             >
//               1
//             </button>
//             {startPage > 2 && (
//               <span className="px-1 py-1.5 text-xs sm:text-sm font-medium text-gray-500">
//                 ...
//               </span>
//             )}
//           </>
//         )}

//         {pageNumbers.map((num) => (
//           <button
//             key={num}
//             onClick={() => handlePageChange(num)}
//             aria-current={currentPage === num ? "page" : undefined}
//             className={`px-3 py-1.5 text-xs sm:text-sm font-medium border rounded-md ${
//               currentPage === num
//                 ? "bg-blue-600 text-white border-blue-600 z-10 ring-1 ring-blue-600"
//                 : "text-gray-700 bg-white border-gray-300 hover:bg-gray-50"
//             }`}
//           >
//             {num}
//           </button>
//         ))}

//         {endPage < totalPages && (
//           <>
//             {endPage < totalPages - 1 && (
//               <span className="px-1 py-1.5 text-xs sm:text-sm font-medium text-gray-500">
//                 ...
//               </span>
//             )}
//             <button
//               onClick={() => handlePageChange(totalPages)}
//               className="px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
//             >
//               {totalPages}
//             </button>
//           </>
//         )}

//         <button
//           onClick={() => handlePageChange(currentPage + 1)}
//           disabled={currentPage === totalPages}
//           className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
//           aria-label="Next Page"
//         >
//           <ChevronRightIcon className="w-5 h-5 text-gray-600" />
//         </button>
//       </nav>
//     );
//   };

//   const isInitiallyLoading =
//     (isLoadingProducts &&
//       (!productsToDisplay?.items || productsToDisplay.items.length === 0)) ||
//     (isLoadingSalesChannels && !salesChannels);

//   if (isInitiallyLoading && !productError && !salesChannelsError) {
//     return <LoadingSpinner message="Loading..." />;
//   }

//   if (
//     productError &&
//     (!productsToDisplay?.items || productsToDisplay.items.length === 0) &&
//     !isLoadingProducts
//   ) {
//     // ... (keep existing error rendering) ...
//     return (
//       <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-6">
//         <ArchiveBoxXMarkIcon className="h-16 w-16 text-red-400 mb-4" />
//         <h2 className="text-2xl font-semibold text-red-600 mb-2">
//           Error Loading Products Data
//         </h2>
//         <p className="text-red-500 max-w-md mb-6">
//           {productError.toString()} <br />
//           {applicationId && getSelectedApplicationName()
//             ? `Could not fetch products for ${getSelectedApplicationName()}.`
//             : "Please try again or select a different application."}
//         </p>
//         <button
//           onClick={() => window.location.reload()}
//           className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
//         >
//           Try Again
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
//       {/* Header Section */}
//       <div className="bg-gradient-to-r from-blue-600 via-indigo-700 to-purple-700 text-white shadow-xl rounded-xl p-6 md:p-8 relative overflow-hidden">
//         {/* ... (keep existing header content) ... */}
//         <div className="flex flex-col md:flex-row items-center">
//           <div className="flex-shrink-0 mb-4 md:mb-0 md:mr-6 p-3 bg-white/20 rounded-lg backdrop-blur-sm shadow-md">
//             <Sparkles className="w-10 h-10 text-white" />
//           </div>
//           <div className="text-center md:text-left">
//             <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
//               AI-Powered Bundler
//             </h1>
//             <p className="text-blue-100 text-sm sm:text-base mt-1">
//               Intelligent product bundling for your applications
//             </p>
//           </div>
//         </div>
//         <div className="absolute -top-5 -right-5 w-16 h-16 bg-white/10 rounded-full opacity-50 blur-lg animate-pulse"></div>
//         <div className="absolute -bottom-5 -left-5 w-20 h-20 bg-white/5 rounded-full opacity-50 blur-xl animate-pulse delay-1000"></div>
//       </div>

//       {/* Company Info Section */}
//       <div className="mt-8 mb-6 p-4 sm:p-6 bg-white rounded-xl shadow-lg border border-gray-200">
//         <h2 className="text-xl font-semibold text-gray-800 mb-2">
//           Current Company Information
//         </h2>
//         {renderCompanyInfo()}
//       </div>

//       {/* Sales Channels Section */}
//       <div className="my-10">
//         {/* ... (keep existing sales channels rendering) ... */}
//         <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
//           <div>
//             <h2 className="text-2xl font-semibold text-gray-800 mb-1">
//               Active Sales Channels
//             </h2>
//             <p className="text-sm text-gray-500">
//               Select a channel to view its products and generate bundles.
//             </p>
//           </div>
//         </div>
//         {isLoadingSalesChannels &&
//           (!salesChannels || salesChannels.length === 0) && (
//             <div className="flex justify-center py-10">
//               <LoadingSpinner message="Loading sales channels..." />
//             </div>
//           )}
//         {salesChannelsError &&
//           (!salesChannels || salesChannels.length === 0) && (
//             <div className="max-w-2xl mx-auto text-center py-8 px-4 bg-red-50 border border-red-200 rounded-xl">
//               <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-3" />
//               <p className="text-red-700 font-medium">
//                 Could not load sales channels.
//               </p>
//               <p className="text-red-600 text-sm">
//                 {salesChannelsError.toString()}
//               </p>
//               <button
//                 onClick={() => window.location.reload()}
//                 className="mt-4 px-4 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 text-xs"
//               >
//                 Retry
//               </button>
//             </div>
//           )}
//         {!isLoadingSalesChannels &&
//           !salesChannelsError &&
//           (!salesChannels || salesChannels.length === 0) && (
//             <div className="max-w-2xl mx-auto text-center py-10 px-4 bg-gray-50 border border-gray-200 rounded-xl">
//               <BuildingStorefrontIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
//               <p className="text-lg font-medium text-gray-700">
//                 No Sales Channels Found
//               </p>
//               <p className="text-sm text-gray-500 mt-1">
//                 Connect your sales channels to start managing them in one place
//               </p>
//               <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm">
//                 Add Sales Channel
//               </button>
//             </div>
//           )}
//         {salesChannels && salesChannels.length > 0 && (
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
//             {salesChannels.map((channel) => (
//               <SalesChannelCard key={channel.id} channel={channel} />
//             ))}
//           </div>
//         )}
//       </div>

//       <hr className="my-10 border-gray-200" />

//       {renderApplicationSelectionInfo()}

//       {/* Products Section */}
//       <div id="products-section">
//         <div className="flex flex-wrap justify-between items-center mb-4 sm:mb-6 gap-3">
//           <h2 className="text-2xl font-semibold text-gray-800">
//             {applicationId && getSelectedApplicationName()
//               ? `${getSelectedApplicationName()} Products`
//               : "All Platform Products"}
//           </h2>
//           <div className="flex items-center space-x-3">
//             <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
//               {filteredAndSortedProducts.length} item(s)
//               {productsToDisplay &&
//                 productsToDisplay.items &&
//                 productsToDisplay.items.length !==
//                   filteredAndSortedProducts.length &&
//                 ` of ${productsToDisplay.items.length}`}
//             </span>
//             {productsToDisplay &&
//               productsToDisplay.items &&
//               productsToDisplay.items.length > 0 && (
//                 <button
//                   onClick={() => setShowFilters((prev) => !prev)}
//                   className={`p-2 rounded-md text-sm font-medium flex items-center space-x-1.5 transition-colors shadow-sm border ${
//                     showFilters
//                       ? "bg-blue-50 text-blue-700 border-blue-300 ring-1 ring-blue-300"
//                       : "bg-white text-gray-600 hover:bg-gray-50 border-gray-300"
//                   }`}
//                   title={
//                     showFilters ? "Hide Filters & Sort" : "Show Filters & Sort"
//                   }
//                 >
//                   <FunnelIcon className="h-4 w-4" />
//                   <span>{showFilters ? "Hide" : "Show"} Filters</span>
//                 </button>
//               )}
//           </div>
//         </div>

//         {showFilters &&
//           productsToDisplay &&
//           productsToDisplay.items &&
//           productsToDisplay.items.length > 0 &&
//           renderFiltersAndSort()}

//         {productPagination && productPagination.totalItems > 0 && (
//           <div className="mb-6">{renderPaginationInfo()}</div>
//         )}

//         {isLoadingProducts &&
//           !productsToDisplay?.items?.length &&
//           !productError && (
//             <LoadingSpinner
//               message={`Loading ${
//                 applicationId && getSelectedApplicationName()
//                   ? getSelectedApplicationName()
//                   : "platform"
//               } products...`}
//             />
//           )}

//         {!isLoadingProducts &&
//           !productError &&
//           !productsToDisplay?.items?.length && (
//             /* ... (keep existing no products found message) ... */
//             <div className="flex flex-col items-center justify-center text-center py-16 bg-white rounded-xl shadow border border-gray-200 mt-6">
//               <ArchiveBoxXMarkIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
//               <h3 className="text-xl font-semibold text-gray-700 mb-2">
//                 No Products Found
//               </h3>
//               <p className="text-gray-500 max-w-md">
//                 {applicationId && getSelectedApplicationName()
//                   ? `No products available for ${getSelectedApplicationName()}.`
//                   : "No products available in your platform."}
//               </p>
//             </div>
//           )}

//         {!isLoadingProducts &&
//           !productError &&
//           productsToDisplay?.items?.length > 0 &&
//           filteredAndSortedProducts.length === 0 && (
//             /* ... (keep existing no products match filter message) ... */
//             <div className="flex flex-col items-center justify-center text-center py-16 bg-white rounded-xl shadow border border-gray-200 mt-6">
//               <FunnelIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
//               <h3 className="text-xl font-semibold text-gray-700 mb-2">
//                 No Products Match Your Filters
//               </h3>
//               <p className="text-gray-500 max-w-md mb-4">
//                 Try adjusting your search criteria or clearing the filters.
//               </p>
//               <button
//                 onClick={clearFilters}
//                 className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
//               >
//                 Clear All Filters
//               </button>
//             </div>
//           )}

//         {filteredAndSortedProducts.length > 0 && (
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
//             {filteredAndSortedProducts.map((product) => (
//               <ProductCard key={product.id} product={product} />
//             ))}
//           </div>
//         )}

//         {productPagination &&
//           productPagination.totalPages > 1 &&
//           renderServerPagination()}

//         {isLoadingProducts && productsToDisplay?.items?.length > 0 && (
//           <div className="mt-8 flex justify-center">
//             <LoadingSpinner message="Loading more products..." />
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Home;
