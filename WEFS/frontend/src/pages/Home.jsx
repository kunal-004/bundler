import React, { useState, useMemo } from "react";
import { useAppContext } from "../context/AppContext";
import ProductCard from "../components/ProductCard";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  ArchiveBoxXMarkIcon,
  WifiIcon,
  BuildingStorefrontIcon,
  GlobeAltIcon,
  ChevronDownIcon,
  // ArrowPathIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  XMarkIcon,
  ChevronUpDownIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { useParams } from "react-router-dom";

const PRODUCTS_PER_PAGE_HOME = 6;
const PRODUCTS_PER_CHANNEL_PAGE = 6;

// const SalesChannelCard = ({ channel, onToggleExpand, isExpanded }) => {
//   const {
//     salesChannelProducts,
//     isLoadingSalesChannelProducts,
//     salesChannelProductsError,
//     fetchSalesChannelProducts,
//   } = useAppContext();

//   const [currentChannelProductPage, setCurrentChannelProductPage] = useState(1);

//   // eslint-disable-next-line react-hooks/exhaustive-deps
//   const productsForChannel = salesChannelProducts[channel.id] || [];
//   const isLoadingProducts = isLoadingSalesChannelProducts[channel.id];
//   const productsError = salesChannelProductsError[channel.id];

//   let IconComponent = WifiIcon;
//   if (channel.channel_type === "store") IconComponent = BuildingStorefrontIcon;
//   if (channel.channel_type === "web" || channel.domain)
//     IconComponent = GlobeAltIcon;

//   const handleExpand = () => {
//     onToggleExpand(channel.id);
//     if (
//       !isExpanded &&
//       !productsForChannel.length &&
//       !isLoadingProducts &&
//       !productsError
//     ) {
//       fetchSalesChannelProducts(channel.id);
//     }
//     setCurrentChannelProductPage(1);
//   };

//   const totalChannelProductPages = Math.ceil(
//     productsForChannel.length / PRODUCTS_PER_CHANNEL_PAGE
//   );
//   const paginatedChannelProducts = useMemo(() => {
//     const startIndex =
//       (currentChannelProductPage - 1) * PRODUCTS_PER_CHANNEL_PAGE;
//     const endIndex = startIndex + PRODUCTS_PER_CHANNEL_PAGE;
//     return productsForChannel.slice(startIndex, endIndex);
//   }, [productsForChannel, currentChannelProductPage]);

//   const handleChannelProductPageChange = (newPage) => {
//     if (newPage >= 1 && newPage <= totalChannelProductPages) {
//       setCurrentChannelProductPage(newPage);
//     }
//   };

//   const renderChannelProductPagination = () => {
//     if (totalChannelProductPages <= 1) return null;
//     return (
//       <div className="mt-4 flex items-center justify-between pt-3 border-t border-gray-100">
//         <button
//           onClick={() =>
//             handleChannelProductPageChange(currentChannelProductPage - 1)
//           }
//           disabled={currentChannelProductPage === 1}
//           className="px-2.5 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
//         >
//           Previous
//         </button>
//         <span className="text-xs text-gray-500">
//           Page {currentChannelProductPage} of {totalChannelProductPages}
//         </span>
//         <button
//           onClick={() =>
//             handleChannelProductPageChange(currentChannelProductPage + 1)
//           }
//           disabled={currentChannelProductPage === totalChannelProductPages}
//           className="px-2.5 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
//         >
//           Next
//         </button>
//       </div>
//     );
//   };

//   return (
//     <div className="bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col overflow-hidden transition-all duration-300 ease-in-out">
//       <div
//         className="p-4 group hover:bg-gray-50 cursor-pointer"
//         onClick={handleExpand}
//       >
//         <div className="flex items-start space-x-4">
//           <div className="w-16 h-16 mt-1 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center overflow-hidden ring-2 ring-white flex-shrink-0">
//             {channel.logo ? (
//               <img
//                 src={channel.logo}
//                 alt={`${channel.name} logo`}
//                 className="w-full h-full object-contain"
//                 onError={(e) => {
//                   e.target.onerror = null;
//                   e.target.style.display = "none";
//                   const parent = e.target.parentNode;
//                   if (parent) {
//                     const iconPlaceholder = parent.querySelector(
//                       `.icon-placeholder-${channel.id}`
//                     );
//                     if (iconPlaceholder) iconPlaceholder.style.display = "flex";
//                   }
//                 }}
//               />
//             ) : null}
//             <div
//               className={`icon-placeholder-${
//                 channel.id
//               } items-center justify-center w-full h-full ${
//                 channel.logo ? "hidden" : "flex"
//               }`}
//             >
//               <IconComponent className="h-8 w-8 text-blue-500 group-hover:text-indigo-600" />
//             </div>
//           </div>
//           <div className="flex-grow min-w-0">
//             <h3
//               className="text-md font-semibold text-gray-800 group-hover:text-blue-700 truncate"
//               title={channel.name}
//             >
//               {channel.name}
//             </h3>
//             {channel.domain && (
//               <a
//                 href={`https://${channel.domain}`}
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 onClick={(e) => e.stopPropagation()}
//                 className="text-xs text-blue-600 hover:text-blue-700 hover:underline truncate block"
//               >
//                 {channel.domain}
//               </a>
//             )}
//             {!channel.domain && (
//               <p className="text-xs text-gray-400 h-4 mt-0.5">App Platform</p>
//             )}
//             <span className="mt-1 text-[11px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full group-hover:bg-blue-100 group-hover:text-blue-700 capitalize inline-block">
//               {channel.channel_type
//                 ? channel.channel_type.replace("_", " ")
//                 : "Unknown Type"}
//             </span>
//           </div>
//           <ChevronDownIcon
//             className={`h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-transform duration-200 ${
//               isExpanded ? "rotate-180" : ""
//             }`}
//           />
//         </div>
//       </div>

//       {isExpanded && (
//         <div className="border-t border-gray-200 p-4 bg-gray-50/50">
//           {isLoadingProducts && (
//             <LoadingSpinner message="Loading channel products..." />
//           )}
//           {productsError && (
//             <div className="text-center py-4 text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
//               <ExclamationTriangleIcon className="h-6 w-6 mx-auto mb-1 text-red-500" />
//               <p className="text-sm font-medium">Error: {productsError}</p>
//             </div>
//           )}
//           {!isLoadingProducts &&
//             !productsError &&
//             productsForChannel.length === 0 && (
//               <p className="text-center text-sm text-gray-500 py-4">
//                 No products found for this sales channel.
//               </p>
//             )}
//           {!isLoadingProducts &&
//             !productsError &&
//             productsForChannel.length > 0 && (
//               <>
//                 <h4 className="text-sm font-semibold text-gray-700 mb-3">
//                   Products ({paginatedChannelProducts.length} of{" "}
//                   {productsForChannel.length})
//                 </h4>
//                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-1">
//                   {" "}
//                   {paginatedChannelProducts.map((product) => (
//                     <ProductCard
//                       key={product.uid || product.id}
//                       product={product}
//                     />
//                   ))}
//                 </div>
//                 {renderChannelProductPagination()}
//               </>
//             )}
//         </div>
//       )}
//     </div>
//   );
// };

export const Home = () => {
  const {
    products: platformProducts,
    isLoadingProducts: isLoadingPlatformProducts,
    productError: platformProductError,
    salesChannels,
    isLoadingSalesChannels,
    salesChannelsError,
  } = useAppContext();

  const [expandedChannels, setExpandedChannels] = useState({});
  const [currentPlatformPage, setCurrentPlatformPage] = useState(1);
  const [filters, setFilters] = useState({
    name: "",
    category: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: "name",
    direction: "ascending",
  });

  const handleToggleExpandChannel = (channelId) => {
    setExpandedChannels((prev) => ({ ...prev, [channelId]: !prev[channelId] }));
  };

  const uniqueCategories = useMemo(() => {
    if (!platformProducts || platformProducts.length === 0) return [];
    const categoriesSet = new Set();
    platformProducts.forEach((product) => {
      const category = product.category_name || product.category_slug;
      if (category) categoriesSet.add(category);
    });
    return Array.from(categoriesSet).sort();
  }, [platformProducts]);

  const getProductPrice = (product) => {
    return parseFloat(
      product.price?.effective?.min ||
        product.price?.min_price ||
        product.price?.price?.min ||
        0
    );
  };

  const filteredAndSortedPlatformProducts = useMemo(() => {
    if (!platformProducts) return [];
    let productsToProcess = [...platformProducts];

    if (filters.name) {
      productsToProcess = productsToProcess.filter((p) =>
        p.name.toLowerCase().includes(filters.name.toLowerCase())
      );
    }
    if (filters.category) {
      productsToProcess = productsToProcess.filter(
        (p) =>
          p.category_name === filters.category ||
          p.category_slug === filters.category
      );
    }

    if (sortConfig.key) {
      productsToProcess.sort((a, b) => {
        let valA, valB;
        if (sortConfig.key === "price") {
          valA = getProductPrice(a);
          valB = getProductPrice(b);
        } else {
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
        }

        if (valA < valB) return sortConfig.direction === "ascending" ? -1 : 1;
        if (valA > valB) return sortConfig.direction === "ascending" ? 1 : -1;
        return 0;
      });
    }
    return productsToProcess;
  }, [platformProducts, filters, sortConfig]);

  const totalPlatformProductPages = Math.ceil(
    filteredAndSortedPlatformProducts.length / PRODUCTS_PER_PAGE_HOME
  );
  const paginatedPlatformProducts = useMemo(() => {
    const startIndex = (currentPlatformPage - 1) * PRODUCTS_PER_PAGE_HOME;
    return filteredAndSortedPlatformProducts.slice(
      startIndex,
      startIndex + PRODUCTS_PER_PAGE_HOME
    );
  }, [filteredAndSortedPlatformProducts, currentPlatformPage]);

  const handlePlatformPageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPlatformProductPages) {
      setCurrentPlatformPage(newPage);
      const section = document.getElementById("platform-products-section");
      if (section)
        section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({ ...prev, [filterName]: value }));
    setCurrentPlatformPage(1);
  };

  const clearFilters = () => {
    setFilters({ name: "", category: "" });
    setCurrentPlatformPage(1);
  };

  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    } else if (
      sortConfig.key === key &&
      sortConfig.direction === "descending"
    ) {
      direction = "ascending";
    }
    setSortConfig({ key, direction });
    setCurrentPlatformPage(1);
  };

  const SortIndicator = ({ sortKey }) => {
    if (sortConfig.key !== sortKey)
      return <ChevronUpDownIcon className="w-4 h-4 text-gray-400" />;
    if (sortConfig.direction === "ascending")
      return <ArrowUpIcon className="w-4 h-4 text-blue-600" />;
    return <ArrowDownIcon className="w-4 h-4 text-blue-600" />;
  };

  const renderPlatformFiltersAndSort = () => (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow border border-gray-200 mb-6 transition-all duration-300 ease-in-out">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <h3 className="text-lg font-semibold text-gray-700">
          Filter & Sort Products
        </h3>
        <button
          onClick={clearFilters}
          className="text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center self-start sm:self-center"
        >
          <XMarkIcon className="w-4 h-4 mr-1" /> Clear Filters
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div>
          <label
            htmlFor="filter-name"
            className="block text-sm font-medium text-gray-600 mb-1"
          >
            Product Name
          </label>
          <input
            type="text"
            id="filter-name"
            value={filters.name}
            onChange={(e) => handleFilterChange("name", e.target.value)}
            placeholder="Search name..."
            className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        {uniqueCategories.length > 0 && (
          <div>
            <label
              htmlFor="filter-category"
              className="block text-sm font-medium text-gray-600 mb-1"
            >
              Category
            </label>
            <select
              id="filter-category"
              value={filters.category}
              onChange={(e) => handleFilterChange("category", e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Categories</option>
              {uniqueCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      <div className="flex items-center space-x-3 border-t border-gray-100 pt-4">
        <span className="text-sm font-medium text-gray-600">Sort by:</span>
        <button
          onClick={() => requestSort("name")}
          className="px-3 py-1.5 text-xs border rounded-md flex items-center space-x-1 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-300"
        >
          <span>Name</span> <SortIndicator sortKey="name" />
        </button>
        <button
          onClick={() => requestSort("price")}
          className="px-3 py-1.5 text-xs border rounded-md flex items-center space-x-1 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-300"
        >
          <span>Price</span> <SortIndicator sortKey="price" />
        </button>
      </div>
    </div>
  );

  const renderPlatformPagination = () => {
    if (totalPlatformProductPages <= 1) return null;
    const pageNumbers = [];
    const maxPagesToShow = 3;
    let startPage, endPage;

    if (totalPlatformProductPages <= maxPagesToShow + 2) {
      startPage = 1;
      endPage = totalPlatformProductPages;
    } else {
      if (currentPlatformPage <= maxPagesToShow) {
        startPage = 1;
        endPage = maxPagesToShow + 1;
      } else if (
        currentPlatformPage + (maxPagesToShow - 1) >=
        totalPlatformProductPages
      ) {
        startPage = totalPlatformProductPages - maxPagesToShow;
        endPage = totalPlatformProductPages;
      } else {
        startPage = currentPlatformPage - Math.floor(maxPagesToShow / 2);
        endPage = currentPlatformPage + Math.floor(maxPagesToShow / 2);
      }
    }
    for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);

    return (
      <nav
        className="mt-8 flex items-center justify-center space-x-1 sm:space-x-2"
        aria-label="Platform Product Pagination"
      >
        <button
          onClick={() => handlePlatformPageChange(currentPlatformPage - 1)}
          disabled={currentPlatformPage === 1}
          className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50"
        >
          <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
        </button>
        {startPage > 1 && (
          <>
            <button
              onClick={() => handlePlatformPageChange(1)}
              className="px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              1
            </button>
            {startPage > 2 && (
              <span className="px-1 py-1.5 text-xs sm:text-sm font-medium text-gray-500">
                ...
              </span>
            )}
          </>
        )}
        {pageNumbers.map((num) => (
          <button
            key={num}
            onClick={() => handlePlatformPageChange(num)}
            className={`px-3 py-1.5 text-xs sm:text-sm font-medium border rounded-md ${
              currentPlatformPage === num
                ? "bg-blue-600 text-white border-blue-600 z-10"
                : "text-gray-700 bg-white border-gray-300 hover:bg-gray-50"
            }`}
          >
            {num}
          </button>
        ))}
        {endPage < totalPlatformProductPages && (
          <>
            {endPage < totalPlatformProductPages - 1 && (
              <span className="px-1 py-1.5 text-xs sm:text-sm font-medium text-gray-500">
                ...
              </span>
            )}
            <button
              onClick={() =>
                handlePlatformPageChange(totalPlatformProductPages)
              }
              className="px-3 py-1.5 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              {totalPlatformProductPages}
            </button>
          </>
        )}
        <button
          onClick={() => handlePlatformPageChange(currentPlatformPage + 1)}
          disabled={currentPlatformPage === totalPlatformProductPages}
          className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50"
        >
          <ChevronRightIcon className="w-5 h-5 text-gray-600" />
        </button>
      </nav>
    );
  };

  const isInitiallyLoading =
    isLoadingPlatformProducts &&
    isLoadingSalesChannels &&
    !platformProducts.length &&
    !salesChannels.length;
  if (isInitiallyLoading)
    return <LoadingSpinner message="Loading dashboard data..." />;

  if (
    platformProductError &&
    !platformProducts.length &&
    !isLoadingPlatformProducts
  ) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] text-center p-6">
        <ArchiveBoxXMarkIcon className="h-16 w-16 text-red-400 mb-4" />
        <h2 className="text-2xl font-semibold text-red-600 mb-2">
          Error Loading Products
        </h2>
        <p className="text-red-500 max-w-md mb-6">
          {platformProductError.toString()}
        </p>
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
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-10 p-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-xl rounded-xl">
        <h1 className="text-3xl font-bold tracking-tight">
          AI-Powered Bundler
        </h1>
        <p className="mt-2 text-blue-100">
          Generate and manage your product bundles effortlessly.
        </p>
      </div>

      <hr className="my-12 border-gray-200" />

      <div id="platform-products-section">
        {" "}
        <div className="flex flex-wrap justify-between items-center mb-4 sm:mb-6 gap-3">
          <h2 className="text-2xl font-semibold text-gray-800">
            All Platform Products
          </h2>
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {filteredAndSortedPlatformProducts.length} item(s)
              {platformProducts.length !==
                filteredAndSortedPlatformProducts.length &&
                ` of ${platformProducts.length}`}
            </span>
            {platformProducts.length > 0 && (
              <button
                onClick={() => setShowFilters((prev) => !prev)}
                className={`p-2 rounded-md text-sm font-medium flex items-center space-x-1.5 transition-colors shadow-sm border ${
                  showFilters
                    ? "bg-blue-50 text-blue-700 border-blue-300"
                    : "bg-white text-gray-600 hover:bg-gray-50 border-gray-300"
                }`}
                title={showFilters ? "Hide Filters" : "Show Filters"}
              >
                <FunnelIcon className="h-4 w-4" />
                <span>{showFilters ? "Hide" : "Show"} Filters & Sort</span>
              </button>
            )}
          </div>
        </div>
        {showFilters &&
          platformProducts.length > 0 &&
          renderPlatformFiltersAndSort()}
        {isLoadingPlatformProducts && !platformProducts.length && (
          <LoadingSpinner message="Loading platform products..." />
        )}
        {!isLoadingPlatformProducts &&
          platformProductError &&
          !platformProducts.length && (
            <div className="text-center py-8 px-4 bg-red-50 border border-red-200 rounded-xl mt-6">
              <ArchiveBoxXMarkIcon className="h-12 w-12 text-red-400 mx-auto mb-3" />
              <p className="text-red-700 font-medium">
                Platform Products Unavailable
              </p>
              <p className="text-red-600 text-sm">
                {platformProductError.toString()}
              </p>
            </div>
          )}
        {!isLoadingPlatformProducts &&
          paginatedPlatformProducts.length === 0 &&
          platformProducts.length > 0 && (
            <div className="text-center py-10 px-4 bg-gray-50 border border-gray-200 rounded-xl mt-6">
              <ArchiveBoxXMarkIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700">
                No Products Match Your Criteria
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Try adjusting your filters or sort options.
              </p>
              <button
                onClick={clearFilters}
                className="mt-4 px-4 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
              >
                Clear Filters
              </button>
            </div>
          )}
        {!isLoadingPlatformProducts &&
          !platformProductError &&
          platformProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center text-center py-16 bg-white rounded-xl shadow border border-gray-200 mt-6">
              <ArchiveBoxXMarkIcon className="h-20 w-20 text-gray-300 mb-6" />
              <h2 className="text-2xl font-semibold text-gray-700 mb-3">
                No Platform Products Found
              </h2>
              <p className="text-gray-500 max-w-md">
                No products have been added to the platform yet.
              </p>
            </div>
          )}
        {paginatedPlatformProducts.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-5 sm:gap-6">
              {paginatedPlatformProducts.map((product) => (
                <ProductCard
                  key={product.uid || product.id || product.item_code}
                  product={product}
                />
              ))}
            </div>
            {renderPlatformPagination()}
          </>
        )}
      </div>
    </div>
  );
};

export default Home;
