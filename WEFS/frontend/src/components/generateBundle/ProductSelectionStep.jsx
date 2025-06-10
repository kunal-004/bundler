import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import {
  ChevronDownIcon,
  PhotoIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ArchiveBoxXMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/solid";

const CATEGORIES_PER_PAGE = 6;

const LoadingSpinner = ({ text }) => (
  <div className="flex flex-col justify-center items-center p-12 min-h-[300px] text-center">
    <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
    {text && <p className="text-slate-500 mt-4 font-medium">{text}</p>}
  </div>
);

const NoResults = ({ query, onClear }) => (
  <div className="text-center py-16 bg-slate-50 rounded-lg">
    <div className="w-16 h-16 bg-white border border-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
      <MagnifyingGlassIcon className="w-8 h-8 text-slate-400" />
    </div>
    <h3 className="text-lg font-semibold text-slate-800 mb-2">
      No Products Found
    </h3>
    <p className="text-slate-500 mb-6 max-w-md mx-auto">
      {query
        ? `Your search for "${query}" did not return any results. Try a different keyword.`
        : "There are no products available to create a bundle from."}
    </p>
    {query && (
      <button
        onClick={onClear}
        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all shadow-sm"
      >
        Clear Search
      </button>
    )}
  </div>
);

const ProductSelectionStep = ({
  productsToDisplay,
  productsByCategory,
  categories,
  selectedProducts,
  handleProductToggle,
  handleCategorySelectToggle,
  expandedCategory,
  handleCategoryExpansionToggle,
  onContinue,
  getProductImage,
  isLoadingProducts,
  loadMoreProducts,
  productPagination,
  searchQuery,
  onSearchQueryChange,
  categoryFilter,
}) => {
  const [viewMode, setViewMode] = useState("list");
  const [currentCategoryPage, setCurrentCategoryPage] = useState(1);
  const searchInputRef = useRef(null);
  const [isSelectAllActive, setIsSelectAllActive] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showSummary, setShowSummary] = useState(false);

  const [explicitExclusions, setExplicitExclusions] = useState(new Set());

  useEffect(() => {
    setCurrentCategoryPage(1);
  }, [categories.length]);

  useEffect(() => {
    setIsSelectAllActive(false);
    setExplicitExclusions(new Set());
  }, [searchQuery, categoryFilter]);

  useEffect(() => {
    if (isSelectAllActive && productsToDisplay?.items) {
      productsToDisplay.items.forEach((product) => {
        const category =
          product.category_name || product.category_slug || "Uncategorized";
        if (
          !selectedProducts[category]?.[product.uid] &&
          !explicitExclusions.has(product.uid)
        ) {
          handleProductToggle(category, product);
        }
      });
    }
  }, [
    productsToDisplay?.items,
    isSelectAllActive,
    selectedProducts,
    handleProductToggle,
    explicitExclusions,
  ]);

  const totalCategoryPages = Math.ceil(categories.length / CATEGORIES_PER_PAGE);

  useEffect(() => {
    if (currentCategoryPage > totalCategoryPages && totalCategoryPages > 0) {
      setCurrentCategoryPage(totalCategoryPages);
    } else if (totalCategoryPages === 0 && currentCategoryPage !== 1) {
      setCurrentCategoryPage(1);
    }
  }, [categories, currentCategoryPage, totalCategoryPages]);

  const paginatedCategories = useMemo(() => {
    const startIndex = (currentCategoryPage - 1) * CATEGORIES_PER_PAGE;
    return categories.slice(startIndex, startIndex + CATEGORIES_PER_PAGE);
  }, [categories, currentCategoryPage]);

  const selectedProductsOnCurrentPage = useMemo(() => {
    let count = 0;
    productsToDisplay?.items?.forEach((product) => {
      const category =
        product.category_name || product.category_slug || "Uncategorized";
      if (selectedProducts[category]?.[product.uid]) {
        count++;
      }
    });
    return count;
  }, [productsToDisplay, selectedProducts]);

  const handleProductToggleWithExclusion = useCallback(
    (category, product) => {
      if (isSelectAllActive && selectedProducts[category]?.[product.uid]) {
        setExplicitExclusions((prevExclusions) =>
          new Set(prevExclusions).add(product.uid)
        );
      }
      handleProductToggle(category, product);
    },
    [isSelectAllActive, selectedProducts, handleProductToggle]
  );

  const handleCategorySelectToggleWithExclusion = useCallback(
    (categoryName) => {
      if (isSelectAllActive) {
        const categoryProducts = productsByCategory[categoryName] || [];
        const selectedCount = categoryProducts.filter(
          (p) => selectedProducts[categoryName]?.[p.uid]
        ).length;
        if (
          categoryProducts.length > 0 &&
          selectedCount === categoryProducts.length
        ) {
          setExplicitExclusions((prevExclusions) => {
            const newExclusions = new Set(prevExclusions);
            categoryProducts.forEach((p) => newExclusions.add(p.uid));
            return newExclusions;
          });
        }
      }
      handleCategorySelectToggle(categoryName);
    },
    [
      isSelectAllActive,
      productsByCategory,
      selectedProducts,
      handleCategorySelectToggle,
    ]
  );

  const handleSelectAllCurrentPage = useCallback(() => {
    setIsSelectAllActive(true);
    setExplicitExclusions(new Set());
    productsToDisplay?.items?.forEach((prod) => {
      const category =
        prod.category_name || prod.category_slug || "Uncategorized";
      if (!selectedProducts[category]?.[prod.uid]) {
        handleProductToggle(category, prod);
      }
    });
  }, [productsToDisplay, selectedProducts, handleProductToggle]);

  const handleUnselectAllCurrentPage = useCallback(() => {
    setIsSelectAllActive(false);
    setExplicitExclusions(new Set());
    productsToDisplay?.items?.forEach((prod) => {
      const category =
        prod.category_name || prod.category_slug || "Uncategorized";
      if (selectedProducts[category]?.[prod.uid]) {
        handleProductToggle(category, prod);
      }
    });
  }, [productsToDisplay, selectedProducts, handleProductToggle]);

  const clearSearch = useCallback(() => {
    onSearchQueryChange("");
    searchInputRef.current?.focus();
  }, [onSearchQueryChange]);

  const shouldShowLoadMore = useMemo(() => {
    return productPagination.hasMore;
  }, [productPagination.hasMore]);

  const getTotalSelected = useCallback(() => {
    let total = 0;
    Object.values(selectedProducts).forEach((categoryProducts) => {
      total += Object.keys(categoryProducts).length;
    });
    return total;
  }, [selectedProducts]);

  const renderHeader = () => (
    <div className="sticky top-0 bg-white/80 backdrop-blur-lg z-10 py-4 border-b border-slate-200">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-xs lg:max-w-sm">
          <MagnifyingGlassIcon className="h-5 w-5 text-slate-400 absolute top-1/2 left-3 -translate-y-1/2" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search products or categories..."
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm placeholder-slate-400 transition"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute top-1/2 right-3 -translate-y-1/2"
            >
              <XMarkIcon className="h-5 w-5 text-slate-400 hover:text-slate-600" />
            </button>
          )}
        </div>
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <div className="flex items-center bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md transition-colors ${
                viewMode === "grid"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
              title="Grid view"
            >
              <Squares2X2Icon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-md transition-colors ${
                viewMode === "list"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
              title="List view"
            >
              <ListBulletIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectAllCurrentPage}
              disabled={
                isSelectAllActive ||
                (selectedProductsOnCurrentPage ===
                  productsToDisplay?.items?.length &&
                  productsToDisplay?.items?.length > 0)
              }
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSelectAllActive ? "Auto-Select On" : "Select All"}
            </button>
            <button
              onClick={handleUnselectAllCurrentPage}
              disabled={selectedProductsOnCurrentPage === 0}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Unselect All
            </button>
          </div>
        </div>
      </div>
      {isSelectAllActive && (
        <div className="text-sm text-slate-600 mt-3 font-medium flex items-center">
          <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
            Auto-selecting new products
          </span>
        </div>
      )}
    </div>
  );

  const renderSelectionSummary = () => {
    const totalSelected = getTotalSelected();
    const selectedCategories = Object.keys(selectedProducts).filter(
      (cat) => Object.keys(selectedProducts[cat] || {}).length > 0
    );

    if (totalSelected === 0) return null;

    if (!showSummary) {
      return (
        <div className="fixed bottom-4 right-14 z-30">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSummary(true)}
              className="w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center"
              title="Show selection summary"
            >
              <span className="text-sm font-semibold">{totalSelected}</span>
            </button>
            <button
              onClick={onContinue}
              disabled={totalSelected < 2}
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-500"
            >
              Continue
              <ArrowRightIcon className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="fixed bottom-4 right-4 left-4 sm:left-auto max-w-lg z-30">
        <div className="bg-white rounded-xl p-5 shadow-2xl ring-1 ring-black ring-opacity-5 w-full">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircleIcon className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-800">
                  {totalSelected} Product{totalSelected > 1 ? "s" : ""} Selected
                </h4>
                <p className="text-sm text-slate-500">
                  from {selectedCategories.length} categor
                  {selectedCategories.length > 1 ? "ies" : "y"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowSummary(false)}
              className="text-slate-400 hover:text-slate-600 transition-colors"
              title="Minimize summary"
            >
              <ChevronDownIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative group w-full sm:w-auto">
              <button
                onClick={onContinue}
                disabled={totalSelected < 2}
                className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-500"
              >
                Continue <ArrowRightIcon className="w-4 h-4 ml-2" />
              </button>
              {totalSelected < 2 && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-800 text-white text-xs rounded-md w-max opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  Select at least 2 products
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
                </div>
              )}
            </div>
          </div>

          {selectedCategories.length > 0 && totalSelected >= 2 && (
            <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4 mt-4 max-h-24 overflow-y-auto">
              {selectedCategories.map((categoryName) => (
                <div
                  key={categoryName}
                  className="inline-flex items-center bg-slate-100 rounded-full px-3 py-1 text-xs font-medium text-slate-700"
                >
                  {categoryName} (
                  {Object.keys(selectedProducts[categoryName] || {}).length})
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCategoryPagination = () => {
    if (totalCategoryPages <= 1) return null;

    return (
      <div className="flex items-center justify-center gap-2 mt-6">
        <button
          onClick={() =>
            setCurrentCategoryPage((prev) => Math.max(1, prev - 1))
          }
          disabled={currentCategoryPage === 1}
          className="p-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </button>
        <span className="px-3 py-2 text-sm font-medium text-slate-700">
          Page {currentCategoryPage} of {totalCategoryPages}
        </span>
        <button
          onClick={() =>
            setCurrentCategoryPage((prev) =>
              Math.min(totalCategoryPages, prev + 1)
            )
          }
          disabled={currentCategoryPage === totalCategoryPages}
          className="p-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>
    );
  };

  const showInitialLoading =
    isLoadingProducts &&
    (!productsToDisplay?.items || productsToDisplay.items.length === 0);

  if (showInitialLoading) {
    return <LoadingSpinner text="Loading products..." />;
  }

  const noProductsFoundGlobally =
    !isLoadingProducts &&
    productsToDisplay?.items?.length === 0 &&
    !searchQuery &&
    !categoryFilter;

  if (noProductsFoundGlobally) {
    return (
      <div className="text-center py-16 bg-slate-50 rounded-lg">
        <div className="w-16 h-16 bg-white border border-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <ArchiveBoxXMarkIcon className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 mb-2">
          No Products Found
        </h3>
        <p className="text-slate-500 mb-6 max-w-md mx-auto">
          There are no products available to create a bundle from.
        </p>
      </div>
    );
  }

  const noFilteredResults =
    !isLoadingProducts &&
    categories.length === 0 &&
    (searchQuery || categoryFilter);

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div
        className={`bg-white rounded-xl border border-slate-200 p-4 shadow-sm self-start ${
          selectedCategory ? "hidden lg:block lg:w-64" : "w-full lg:w-64"
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg text-slate-800">Categories</h3>
          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Show All
            </button>
          )}
        </div>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {categories.map((category) => (
            <div
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`p-3 rounded-lg cursor-pointer transition-all ${
                selectedCategory === category
                  ? "bg-blue-50 text-blue-600 border border-blue-200"
                  : "hover:bg-slate-50 text-slate-700 border border-transparent"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{category}</span>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                  {(productsByCategory[category] || []).length}
                </span>
              </div>
              {Object.keys(selectedProducts[category] || {}).length > 0 && (
                <div className="text-xs text-blue-600 mt-1">
                  {Object.keys(selectedProducts[category] || {}).length}{" "}
                  selected
                </div>
              )}
            </div>
          ))}
        </div>
        {shouldShowLoadMore && (
          <div className="flex justify-center mt-4">
            <button
              onClick={loadMoreProducts}
              disabled={isLoadingProducts}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium shadow-md hover:shadow-lg"
            >
              {isLoadingProducts ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Loading more...
                </>
              ) : (
                <>
                  Load More Categories
                  <ChevronDownIcon className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <div className={`space-y-6 flex-1`}>
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-slate-900">
            {selectedCategory
              ? `${selectedCategory} Products`
              : "Select Products for Your Bundle"}
          </h3>
          <p className="text-slate-600 mt-1 max-w-xl mx-auto">
            {selectedCategory
              ? `Choose products from the ${selectedCategory} category to add to your bundle.`
              : "Choose products from the categories below to create your bundle. You can search for specific products or filter by category."}
          </p>
        </div>

        {renderHeader()}

        {noFilteredResults ? (
          <NoResults query={searchQuery} onClear={clearSearch} />
        ) : (
          <>
            <div
              className={`grid gap-4 items-start ${
                selectedCategory ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"
              }`}
            >
              {selectedCategory ? (
                <CategoryCard
                  key={selectedCategory}
                  categoryName={selectedCategory}
                  productsByCategory={productsByCategory}
                  selectedProducts={selectedProducts}
                  isExpanded={true}
                  onToggleExpand={() => {}}
                  onCategorySelectToggle={() =>
                    handleCategorySelectToggleWithExclusion(selectedCategory)
                  }
                  onProductToggle={handleProductToggleWithExclusion}
                  getProductImage={getProductImage}
                  viewMode={viewMode}
                  isFullWidth={true}
                />
              ) : (
                paginatedCategories.map((category) => (
                  <CategoryCard
                    key={category}
                    categoryName={category}
                    productsByCategory={productsByCategory}
                    selectedProducts={selectedProducts}
                    isExpanded={expandedCategory === category}
                    onToggleExpand={() =>
                      handleCategoryExpansionToggle(category)
                    }
                    onCategorySelectToggle={() =>
                      handleCategorySelectToggleWithExclusion(category)
                    }
                    onProductToggle={handleProductToggleWithExclusion}
                    getProductImage={getProductImage}
                    viewMode={viewMode}
                  />
                ))
              )}
            </div>
            {!selectedCategory && renderCategoryPagination()}
          </>
        )}

        {renderSelectionSummary()}
      </div>
    </div>
  );
};

const CategoryCard = ({
  categoryName,
  productsByCategory,
  selectedProducts,
  isExpanded,
  onToggleExpand,
  onCategorySelectToggle,
  onProductToggle,
  getProductImage,
  viewMode,
  isFullWidth = false,
}) => {
  const allCategoryProducts = productsByCategory[categoryName] || [];
  const selectedCount = allCategoryProducts.filter(
    (p) => selectedProducts[categoryName]?.[p.uid]
  ).length;
  const selectionPercent =
    allCategoryProducts.length > 0
      ? (selectedCount / allCategoryProducts.length) * 100
      : 0;

  return (
    <div
      className={`bg-white rounded-xl border transition-all duration-300 ${
        selectedCount > 0
          ? "border-blue-400 shadow-md"
          : "border-slate-200 shadow-sm hover:shadow-lg"
      }`}
      role="region"
      aria-label={`Category ${categoryName}`}
    >
      <div
        onClick={onToggleExpand}
        className={`p-4 flex items-center justify-between cursor-pointer rounded-t-xl transition-colors ${
          selectedCount > 0 ? "bg-blue-50/50" : "hover:bg-slate-50"
        }`}
      >
        <div className="flex items-center gap-4 min-w-0">
          <CategoryCheckbox
            categoryName={categoryName}
            productsByCategory={productsByCategory}
            selectedProducts={selectedProducts}
            onToggle={onCategorySelectToggle}
          />
          <div className="min-w-0">
            <h3
              className="font-semibold text-slate-800 truncate"
              title={categoryName}
            >
              {categoryName}
            </h3>
            <p className="text-xs text-slate-500">
              {allCategoryProducts.length} products
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {selectedCount > 0 && (
            <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
              {selectedCount} selected
            </span>
          )}
          <ChevronDownIcon
            className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </div>
      </div>
      <div className="px-4 pb-2">
        <div className="w-full bg-slate-200 rounded-full h-1.5">
          <div
            className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${selectionPercent}%` }}
          ></div>
        </div>
      </div>
      {isExpanded && (
        <div className="p-4 border-t border-slate-200">
          {allCategoryProducts.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">
              No products found in this category.
            </p>
          ) : (
            <>
              {viewMode === "grid" ? (
                <div
                  className={`grid gap-3 ${
                    isFullWidth
                      ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                      : "grid-cols-2 sm:grid-cols-3"
                  }`}
                >
                  {allCategoryProducts.map((p) => (
                    <ProductCard
                      key={p.uid}
                      product={p}
                      category={categoryName}
                      onToggle={onProductToggle}
                      isSelected={!!selectedProducts[categoryName]?.[p.uid]}
                      getProductImage={getProductImage}
                      viewMode={viewMode}
                    />
                  ))}
                </div>
              ) : (
                <div
                  className={`space-y-2 ${
                    isFullWidth ? "columns-1 lg:columns-2 xl:columns-3" : ""
                  }`}
                >
                  {allCategoryProducts.map((p) => (
                    <ProductCard
                      key={p.uid}
                      product={p}
                      category={categoryName}
                      onToggle={onProductToggle}
                      isSelected={!!selectedProducts[categoryName]?.[p.uid]}
                      getProductImage={getProductImage}
                      viewMode={viewMode}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

const CategoryCheckbox = ({
  categoryName,
  productsByCategory,
  selectedProducts,
  onToggle,
}) => {
  const checkboxRef = useRef(null);
  const categoryProducts = productsByCategory[categoryName] || [];
  const selectedCount = categoryProducts.filter(
    (p) => selectedProducts[categoryName]?.[p.uid]
  ).length;

  const isChecked =
    selectedCount === categoryProducts.length && categoryProducts.length > 0;
  const isIndeterminate = selectedCount > 0 && !isChecked;

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);

  if (categoryProducts.length === 0) return <div className="w-5 h-5" />;

  return (
    <input
      ref={checkboxRef}
      type="checkbox"
      className="form-checkbox h-5 w-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500 focus:ring-2 transition disabled:opacity-50 flex-shrink-0"
      checked={isChecked}
      onChange={onToggle}
      onClick={(e) => e.stopPropagation()}
      aria-label={`Select all products in ${categoryName}`}
    />
  );
};

const ProductCard = ({
  product,
  category,
  onToggle,
  isSelected,
  getProductImage,
  viewMode,
}) => {
  const productImage = getProductImage(product);

  const handleToggle = () => {
    onToggle(category, product);
  };

  const commonClasses = `group relative rounded-lg border transition-all duration-200 cursor-pointer ${
    isSelected
      ? "border-blue-400 bg-blue-50"
      : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
  }`;

  if (viewMode === "grid") {
    return (
      <div onClick={handleToggle} className={`${commonClasses} p-2`}>
        <div className="aspect-square bg-slate-100 rounded-md mb-2 overflow-hidden">
          {productImage ? (
            <img
              src={productImage.secure_url || productImage.url}
              alt={product.name || "Product"}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <PhotoIcon className="w-8 h-8 text-slate-400" />
            </div>
          )}
        </div>
        <div className="p-1">
          <h4
            className="text-sm font-medium text-slate-800 line-clamp-2"
            title={product.name}
          >
            {product.name || "Unnamed Product"}
          </h4>
          <p className="text-xs text-slate-500 font-medium">
            ₹{product.price?.effective?.max?.toFixed(2) || "N/A"}
          </p>
        </div>
        <div
          className={`absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center transition-all ${
            isSelected
              ? "bg-blue-500 border-2 border-white"
              : "bg-white border-2 border-slate-300 group-hover:border-blue-400"
          }`}
        >
          {isSelected && <CheckCircleIcon className="w-4 h-4 text-white" />}
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={handleToggle}
      className={`${commonClasses} flex items-center gap-3 p-3 break-inside-avoid`}
    >
      <div className="w-12 h-12 bg-slate-100 rounded-md overflow-hidden flex-shrink-0">
        {productImage ? (
          <img
            src={productImage.secure_url || productImage.url}
            alt={product.name || "Product"}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <PhotoIcon className="w-4 h-4 text-slate-400" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h4
          className="text-sm font-medium text-slate-800 truncate"
          title={product.name}
        >
          {product.name || "Unnamed Product"}
        </h4>
        <p className="text-xs text-slate-500 font-medium">
          ₹{product.price?.effective?.max?.toFixed(2) || "N/A"}
        </p>
      </div>
      <div
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
          isSelected
            ? "border-blue-500 bg-blue-500"
            : "border-slate-300 bg-white"
        }`}
      >
        {isSelected && <CheckCircleIcon className="w-4 h-4 text-white" />}
      </div>
    </div>
  );
};

export default ProductSelectionStep;
