import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import {
  ChevronDownIcon,
  CubeIcon,
  TagIcon,
  PhotoIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  BackspaceIcon,
  ChatBubbleLeftEllipsisIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleIconSolid } from "@heroicons/react/24/solid";

const CATEGORIES_PER_PAGE = 6;
const PRODUCTS_PER_PAGE = 12;

const CreateBundlePage = () => {
  const navigate = useNavigate();
  const {
    products,
    isLoadingProducts,
    triggerAIBundleGeneration,
    isLoadingBundles,
    bundleError,
    companyId,
    saveAIGeneratedBundles,
  } = useAppContext();

  const [selectedCategoriesState, setSelectedCategoriesState] = useState([]);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState({});
  const [aiParams, setAiParams] = useState({ customPrompt: "" });
  const [currentStep, setCurrentStep] = useState(1);
  const initialLoadDone = useRef(false);

  const [aiSuggestedBundles, setAiSuggestedBundles] = useState([]);
  const [selectedAiBundleIndices, setSelectedAiBundleIndices] = useState([]);
  const [isSavingAiBundles, setIsSavingAiBundles] = useState(false);

  const [currentCategoryPage, setCurrentCategoryPage] = useState(1);
  const [categoryProductPages, setCategoryProductPages] = useState({});

  const productsByCategory = useMemo(() => {
    return (products || []).reduce((acc, product) => {
      const category =
        product.category_name || product.category_slug || "Uncategorized";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(product);
      return acc;
    }, {});
  }, [products]);

  const categories = useMemo(
    () => Object.keys(productsByCategory).sort(),
    [productsByCategory]
  );

  const paginatedCategories = useMemo(() => {
    const startIndex = (currentCategoryPage - 1) * CATEGORIES_PER_PAGE;
    const endIndex = startIndex + CATEGORIES_PER_PAGE;
    return categories.slice(startIndex, endIndex);
  }, [categories, currentCategoryPage]);

  const totalCategoryPages = useMemo(
    () => Math.ceil(categories.length / CATEGORIES_PER_PAGE),
    [categories.length]
  );

  const getProductImage = useCallback((product) => {
    if (!product) return null;
    if (
      Array.isArray(product.images) &&
      product.images.length > 0 &&
      typeof product.images[0] === "string"
    ) {
      return { url: product.images[0], secure_url: product.images[0] };
    }
    if (
      Array.isArray(product.images) &&
      product.images.length > 0 &&
      typeof product.images[0] === "object"
    ) {
      if (product.images[0].url || product.images[0].secure_url) {
        return product.images[0];
      }
    }
    if (Array.isArray(product.media) && product.media.length > 0) {
      const imageMedia = product.media.find((item) => item.type === "image");
      if (imageMedia && (imageMedia.url || imageMedia.secure_url)) {
        return imageMedia;
      }
    }
    return null;
  }, []);

  const getPaginatedProducts = useCallback(
    (category) => {
      const categoryProducts = productsByCategory[category] || [];
      const currentPage = categoryProductPages[category] || 1;
      const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
      const endIndex = startIndex + PRODUCTS_PER_PAGE;
      return {
        products: categoryProducts.slice(startIndex, endIndex),
        totalProducts: categoryProducts.length,
        currentPage,
        totalPages: Math.ceil(categoryProducts.length / PRODUCTS_PER_PAGE),
      };
    },
    [productsByCategory, categoryProductPages]
  );

  useEffect(() => {
    if (
      products &&
      products.length > 0 &&
      !initialLoadDone.current &&
      categories.length > 0
    ) {
      const initialSelectedProdsState = {};
      categories.forEach((categoryName) => {
        initialSelectedProdsState[categoryName] = {};
        const categoryProductsList = productsByCategory[categoryName] || [];
        categoryProductsList.forEach((p) => {
          initialSelectedProdsState[categoryName][p.uid] = {
            product: p,
            selectedImage: getProductImage(p),
          };
        });
      });

      setSelectedProducts(initialSelectedProdsState);
      initialLoadDone.current = true;
    }
  }, [products, productsByCategory, categories, getProductImage]);

  useEffect(() => {
    const activeCategories = Object.keys(selectedProducts).filter(
      (catName) =>
        selectedProducts[catName] &&
        Object.keys(selectedProducts[catName]).length > 0
    );
    setSelectedCategoriesState(activeCategories);
  }, [selectedProducts]);

  const handleCategoryExpansionToggle = (category) => {
    setExpandedCategory((prevExpanded) =>
      prevExpanded === category ? null : category
    );
    if (!categoryProductPages[category]) {
      setCategoryProductPages((prev) => ({ ...prev, [category]: 1 }));
    }
  };

  const handleCategoryPageChange = (category, newPage) => {
    setCategoryProductPages((prev) => ({
      ...prev,
      [category]: newPage,
    }));
  };

  const getSelectedProductsCountForCategory = useCallback(
    (category) => {
      return Object.keys(selectedProducts[category] || {}).length;
    },
    [selectedProducts]
  );

  const handleCategorySelectToggle = useCallback(
    (categoryName) => {
      const categoryProductsList = productsByCategory[categoryName] || [];
      const selectedCount = getSelectedProductsCountForCategory(categoryName);
      const allSelectedInThisCategory =
        selectedCount === categoryProductsList.length &&
        categoryProductsList.length > 0;

      setSelectedProducts((prev) => {
        const newSelectedProds = { ...prev };
        if (allSelectedInThisCategory) {
          newSelectedProds[categoryName] = {};
        } else {
          const categoryProdsToSelect = {};
          categoryProductsList.forEach((p) => {
            categoryProdsToSelect[p.uid] = {
              product: p,
              selectedImage: getProductImage(p),
            };
          });
          newSelectedProds[categoryName] = categoryProdsToSelect;
        }
        return newSelectedProds;
      });
    },
    [productsByCategory, getProductImage, getSelectedProductsCountForCategory]
  );

  const handleProductToggle = useCallback(
    (category, product) => {
      setSelectedProducts((prev) => {
        const categoryProducts = { ...(prev[category] || {}) };
        const isSelected = !!categoryProducts[product.uid];
        let newCategoryProducts;

        if (isSelected) {
          const { [product.uid]: removed, ...rest } = categoryProducts;
          newCategoryProducts = rest;
        } else {
          newCategoryProducts = {
            ...categoryProducts,
            [product.uid]: { product, selectedImage: getProductImage(product) },
          };
        }
        if (!prev[category] && Object.keys(newCategoryProducts).length > 0) {
          return { ...prev, [category]: newCategoryProducts };
        }
        return { ...prev, [category]: newCategoryProducts };
      });
    },
    [getProductImage]
  );

  const handleAIGenerate = async (e) => {
    e.preventDefault();
    setAiSuggestedBundles([]);
    setSelectedAiBundleIndices([]);

    const totalSelected = getTotalSelectedProducts();
    if (totalSelected === 0) {
      alert("Please select at least one product for AI bundle generation.");
      return;
    }
    if (totalSelected < 2) {
      alert(
        "Please select at least 2 products for the AI to find meaningful patterns for bundle generation."
      );
      return;
    }

    if (!aiParams.customPrompt || aiParams.customPrompt.trim() === "") {
      alert("Please provide a custom prompt for the AI to generate bundles.");
      return;
    }

    try {
      const selectedProductsDataForBackend = Object.entries(selectedProducts)
        .filter(
          ([, productsMap]) =>
            productsMap && Object.keys(productsMap).length > 0
        )
        .map(([categoryName, productsMap]) => ({
          categoryName: categoryName,
          products: Object.values(productsMap).map(({ product: p }) => ({
            id: p.uid,
          })),
        }));

      if (
        selectedProductsDataForBackend.flatMap((cat) => cat.products).length ===
        0
      ) {
        alert("No products are effectively selected for generation.");
        return;
      }

      const paramsForAI = {
        customPrompt: aiParams.customPrompt,
        selectedProductsData: selectedProductsDataForBackend,
      };

      const generatedBundlesSuggestions = await triggerAIBundleGeneration(
        paramsForAI
      );

      if (
        generatedBundlesSuggestions &&
        generatedBundlesSuggestions.length > 0
      ) {
        setAiSuggestedBundles(generatedBundlesSuggestions);
        setCurrentStep(3);
      } else if (!bundleError) {
        alert(
          "AI could not generate any bundle suggestions with the selected products and prompt. Please try with different products or refine your prompt."
        );
      }
    } catch (error) {
      console.error("Error during AI bundle generation:", error);
    }
  };

  const handleToggleAiSuggestionSelect = (index) => {
    setSelectedAiBundleIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleSaveSelectedBundles = async () => {
    if (selectedAiBundleIndices.length === 0) {
      alert("Please select at least one AI-suggested bundle to save.");
      return;
    }
    if (!companyId) {
      alert("Company ID or Application ID is missing. Cannot save bundles.");
      return;
    }

    setIsSavingAiBundles(true);
    try {
      const bundlesToSave = selectedAiBundleIndices.map((index) => {
        return aiSuggestedBundles[index].products.map((p) => {
          if (!p || !p.uid) {
            console.error(
              "A product in the selected bundle is missing a UID:",
              p,
              aiSuggestedBundles[index]
            );
            throw new Error(
              `A product in suggestion ${
                index + 1
              } is invalid or missing a UID.`
            );
          }
          return p.uid;
        });
      });

      const payload = {
        bundlesData: bundlesToSave,
        company_id: companyId,
      };

      const result = await saveAIGeneratedBundles(payload);

      alert(
        `${
          selectedAiBundleIndices.length
        } bundle(s) request sent. Backend response: ${
          result?.message || "Processed."
        }`
      );

      setAiSuggestedBundles([]);
      setSelectedAiBundleIndices([]);
      setCurrentStep(1);
      setIsSavingAiBundles(false);
      navigate(getNavigatePath());
    } catch (error) {
      console.error("Error saving AI bundles from CreateBundlePage:", error);
      alert(`Failed to save AI bundles: ${error.message}`);
      setIsSavingAiBundles(false);
    }
  };

  const getTotalSelectedProducts = () => {
    return Object.values(selectedProducts).reduce((total, categoryProds) => {
      if (!categoryProds) return total;
      return total + Object.keys(categoryProds).length;
    }, 0);
  };

  const CategoryCheckbox = ({ categoryName }) => {
    const checkboxRef = useRef(null);
    const categoryProductsList = productsByCategory[categoryName] || [];
    const selectedCount = getSelectedProductsCountForCategory(categoryName);

    const isChecked =
      selectedCount === categoryProductsList.length &&
      categoryProductsList.length > 0;
    const isIndeterminate =
      selectedCount > 0 && selectedCount < categoryProductsList.length;

    useEffect(() => {
      if (checkboxRef.current) {
        checkboxRef.current.indeterminate = isIndeterminate;
      }
    }, [isIndeterminate]);

    if (categoryProductsList.length === 0) return null;

    return (
      <input
        ref={checkboxRef}
        type="checkbox"
        className="form-checkbox h-5 w-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500 transition disabled:opacity-50"
        checked={isChecked}
        onChange={() => handleCategorySelectToggle(categoryName)}
        onClick={(e) => e.stopPropagation()}
        aria-label={`Select all products in ${categoryName}`}
      />
    );
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-10">
      <div className="flex items-center space-x-2 sm:space-x-4">
        {[
          { num: 1, label: "Select Products" },
          { num: 2, label: "Give Prompt" },
          { num: 3, label: "Review & Create" },
        ].map((stepInfo, index, arr) => (
          <React.Fragment key={stepInfo.num}>
            <div className="flex items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                  currentStep >= stepInfo.num
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                {currentStep > stepInfo.num ? (
                  <CheckCircleIconSolid className="w-5 h-5" />
                ) : (
                  stepInfo.num
                )}
              </div>
              <span
                className={`ml-2 sm:ml-3 text-xs sm:text-sm font-medium ${
                  currentStep >= stepInfo.num
                    ? "text-slate-700"
                    : "text-slate-500"
                }`}
              >
                {stepInfo.label}
              </span>
            </div>
            {index < arr.length - 1 && (
              <div
                className={`w-6 sm:w-12 h-0.5 transition-all duration-300 ${
                  currentStep > stepInfo.num ? "bg-blue-600" : "bg-slate-200"
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  const renderCategoryPagination = () => {
    if (totalCategoryPages <= 1) return null;

    const pageNumbers = [];
    const maxPagesToShow = 5;
    let startPage, endPage;

    if (totalCategoryPages <= maxPagesToShow) {
      startPage = 1;
      endPage = totalCategoryPages;
    } else {
      if (currentCategoryPage <= Math.ceil(maxPagesToShow / 2)) {
        startPage = 1;
        endPage = maxPagesToShow;
      } else if (
        currentCategoryPage + Math.floor(maxPagesToShow / 2) >=
        totalCategoryPages
      ) {
        startPage = totalCategoryPages - maxPagesToShow + 1;
        endPage = totalCategoryPages;
      } else {
        startPage = currentCategoryPage - Math.floor(maxPagesToShow / 2);
        endPage = currentCategoryPage + Math.floor(maxPagesToShow / 2);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex items-center justify-center space-x-1 sm:space-x-2 mt-8 mb-4">
        <button
          onClick={() =>
            setCurrentCategoryPage((prev) => Math.max(1, prev - 1))
          }
          disabled={currentCategoryPage === 1}
          className="p-2 rounded-lg border border-slate-300 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous category page"
        >
          <ChevronLeftIcon className="w-4 h-4 text-slate-600" />
        </button>

        {startPage > 1 && (
          <>
            <button
              onClick={() => setCurrentCategoryPage(1)}
              className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${"text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-300"}`}
            >
              1
            </button>
            {startPage > 2 && (
              <span className="text-slate-500 text-sm">...</span>
            )}
          </>
        )}

        {pageNumbers.map((pageNum) => (
          <button
            key={pageNum}
            onClick={() => setCurrentCategoryPage(pageNum)}
            className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${
              currentCategoryPage === pageNum
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-300"
            } disabled:opacity-50`}
          >
            {pageNum}
          </button>
        ))}

        {endPage < totalCategoryPages && (
          <>
            {endPage < totalCategoryPages - 1 && (
              <span className="text-slate-500 text-sm">...</span>
            )}
            <button
              onClick={() => setCurrentCategoryPage(totalCategoryPages)}
              className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors ${"text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-300"}`}
            >
              {totalCategoryPages}
            </button>
          </>
        )}

        <button
          onClick={() =>
            setCurrentCategoryPage((prev) =>
              Math.min(totalCategoryPages, prev + 1)
            )
          }
          disabled={currentCategoryPage === totalCategoryPages}
          className="p-2 rounded-lg border border-slate-300 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Next category page"
        >
          <ChevronRightIcon className="w-4 h-4 text-slate-600" />
        </button>
      </div>
    );
  };

  const renderProductPagination = (category) => {
    const paginationData = getPaginatedProducts(category);
    if (paginationData.totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
        <span className="text-xs text-slate-500 hidden sm:inline">
          Page {paginationData.currentPage} of {paginationData.totalPages}
        </span>
        <span className="text-xs text-slate-500 sm:hidden">
          {(paginationData.currentPage - 1) * PRODUCTS_PER_PAGE + 1}-
          {Math.min(
            paginationData.currentPage * PRODUCTS_PER_PAGE,
            paginationData.totalProducts
          )}{" "}
          of {paginationData.totalProducts}
        </span>

        <div className="flex items-center space-x-1">
          <button
            onClick={() =>
              handleCategoryPageChange(
                category,
                Math.max(1, paginationData.currentPage - 1)
              )
            }
            disabled={paginationData.currentPage === 1}
            className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous product page"
          >
            <ChevronLeftIcon className="w-3.5 h-3.5 text-slate-500" />
          </button>

          <span className="text-xs text-slate-600 font-medium px-1">
            {paginationData.currentPage}
          </span>

          <button
            onClick={() =>
              handleCategoryPageChange(
                category,
                Math.min(
                  paginationData.totalPages,
                  paginationData.currentPage + 1
                )
              )
            }
            disabled={paginationData.currentPage === paginationData.totalPages}
            className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Next product page"
          >
            <ChevronRightIcon className="w-3.5 h-3.5 text-slate-500" />
          </button>
        </div>
      </div>
    );
  };

  const renderCategoryCard = (category) => {
    const selectedProductCount = getSelectedProductsCountForCategory(category);
    const categoryProductsList = productsByCategory[category] || [];
    const isVisuallySelected = selectedProductCount > 0;
    const isExpanded = expandedCategory === category;
    const {
      products: paginatedDisplayProducts,
      // totalPages: totalProductPages,
      // currentPage: currentProductPage,
    } = getPaginatedProducts(category);

    return (
      <div
        key={category}
        className={`bg-white rounded-xl border transition-all duration-300 ${""} ${
          isVisuallySelected
            ? "border-blue-400 shadow-lg"
            : "border-slate-200 shadow-md hover:shadow-lg"
        }`}
      >
        <div
          onClick={() => handleCategoryExpansionToggle(category)}
          className={`w-full p-4 flex items-center justify-between rounded-t-xl ${""} ${
            isVisuallySelected ? "bg-blue-50" : ""
          } ${!isExpanded ? "rounded-b-xl" : ""}`}
        >
          <div className="flex items-center space-x-3">
            <CategoryCheckbox categoryName={category} />
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 ${
                isVisuallySelected
                  ? "bg-blue-500 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              <CubeIcon className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h3
                className="font-semibold text-slate-800 truncate max-w-xs"
                title={category}
              >
                {category}
              </h3>
              <p className="text-xs text-slate-500">
                {categoryProductsList.length} products
                {selectedProductCount > 0 && (
                  <span className="font-medium text-blue-600">
                    {" "}
                    • {selectedProductCount} selected
                  </span>
                )}
              </p>
            </div>
          </div>
          {
            <ChevronDownIcon
              className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${
                isExpanded ? "transform rotate-180" : ""
              }`}
            />
          }
        </div>

        {isExpanded && (
          <div className="p-4 border-t border-slate-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedDisplayProducts.map((product) => {
                const isProductSelected =
                  !!selectedProducts[category]?.[product.uid];
                return (
                  <div
                    key={product.uid}
                    className={`group relative bg-white rounded-lg border transition-all duration-200 ${""} ${
                      isProductSelected
                        ? "border-blue-500 shadow-md ring-1 ring-blue-500"
                        : "border-slate-200 hover:border-blue-300 hover:shadow-md"
                    }`}
                    onClick={() => handleProductToggle(category, product)}
                  >
                    <div className="p-3">
                      <div className="aspect-square rounded-md overflow-hidden bg-slate-50 mb-3">
                        {getProductImage(product) ? (
                          <img
                            src={
                              getProductImage(product).secure_url ||
                              getProductImage(product).url
                            }
                            alt={product.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <PhotoIcon className="w-10 h-10 text-slate-300" />
                          </div>
                        )}
                      </div>
                      <h4 className="font-medium text-slate-800 text-sm line-clamp-2 leading-tight h-10">
                        {product.name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        ₹
                        {product.price?.effective?.max?.toFixed(2) ||
                          product.price?.effective?.min?.toFixed(2) ||
                          "N/A"}
                      </p>
                    </div>
                    {isProductSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center shadow">
                        <CheckCircleIconSolid className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {paginatedDisplayProducts.length === 0 &&
              categoryProductsList.length > 0 && (
                <p className="text-sm text-slate-500 text-center py-4">
                  No more products on this page.
                </p>
              )}
            {categoryProductsList.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-4">
                No products found in this category.
              </p>
            )}
            {renderProductPagination(category)}
          </div>
        )}
      </div>
    );
  };

  const renderSelectionSummary = () => {
    const totalSelected = getTotalSelectedProducts();
    if (totalSelected === 0 || currentStep !== 1) return null;

    return (
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-lg mt-8 sticky bottom-4 z-20">
        <div className="flex flex-col sm:flex-row items-center justify-between">
          <div className="flex items-center space-x-3 mb-4 sm:mb-0">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
              <CheckCircleIconSolid className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-800 text-md">
                Selection Summary
              </h4>
              <p className="text-xs text-slate-500">
                {totalSelected} products from {selectedCategoriesState.length}{" "}
                categories
              </p>
            </div>
          </div>
          <button
            onClick={() => setCurrentStep(2)}
            disabled={totalSelected < 2}
            className="w-full mt-4 sm:mt-0 sm:w-auto inline-flex items-center justify-center px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue <ArrowRightIcon className="w-4 h-4 ml-2" />
          </button>
        </div>
        {totalSelected < 2 && (
          <p className="text-xs text-amber-600 flex items-center mt-3">
            <ExclamationTriangleIcon className="w-4 h-4 mr-1.5 text-amber-500" />
            Please select at least 2 products to proceed.
          </p>
        )}
        {selectedCategoriesState.length > 0 && totalSelected >= 2 && (
          <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4 mt-4 max-h-24 overflow-y-auto">
            {selectedCategoriesState.map((categoryName) => {
              const count = getSelectedProductsCountForCategory(categoryName);
              if (count === 0) return null;
              return (
                <div
                  key={categoryName}
                  className="inline-flex items-center bg-slate-100 rounded-md px-3 py-1 border border-slate-200 shadow-sm"
                >
                  <TagIcon className="w-3.5 h-3.5 text-blue-600 mr-1.5" />
                  <span
                    className="text-xs font-medium text-slate-700 truncate max-w-xs"
                    title={categoryName}
                  >
                    {categoryName} ({count})
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderAIOptions = () => (
    <div className={`space-y-8 ${"opacity-60"}`}>
      <div className="text-center mb-8">
        <h3 className="text-xl font-semibold text-slate-800 mb-1">
          Write Your Custom Prompt
        </h3>
      </div>

      <div className="max-w-xl mx-auto bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
        <label
          htmlFor="customPrompt"
          className="block text-sm font-medium text-slate-700 mb-2"
        >
          <ChatBubbleLeftEllipsisIcon className="w-5 h-5 inline-block mr-1.5 text-blue-600 align-text-bottom" />
          Your Custom Prompt <span className="text-red-500">*</span>
        </label>
        <textarea
          id="customPrompt"
          name="customPrompt"
          rows="4"
          className="w-full p-3 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm placeholder-slate-400 disabled:opacity-70"
          placeholder="e.g., 'Create travel kits with these items', 'Find products often bought together with Product A'"
          value={aiParams.customPrompt}
          onChange={(e) =>
            setAiParams({ ...aiParams, customPrompt: e.target.value })
          }
          required
        />
      </div>
    </div>
  );

  const renderAISuggestions = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-slate-800 mb-1">
          Generated Bundle Suggestions
        </h3>
        <p className="text-sm text-slate-500">
          Select the bundles you'd like to Create.
        </p>
        {aiParams.customPrompt && (
          <p className="text-xs text-slate-500 mt-1 italic">
            Prompt used: "{aiParams.customPrompt}"
          </p>
        )}
      </div>

      {aiSuggestedBundles.length === 0 && !isLoadingBundles && (
        <div className="text-center p-6 bg-slate-50 border border-slate-200 rounded-lg">
          <CubeIcon className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600">
            No bundle suggestions were generated based on your selection and
            prompt.
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Try selecting a different set of products, more products, or
            refining your prompt.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {aiSuggestedBundles.map((suggestion, index) => (
          <div
            key={suggestion.id || `suggestion-${index}`}
            className={`bg-white rounded-xl border p-4 transition-all duration-200 ${
              selectedAiBundleIndices.includes(index)
                ? "border-blue-500 shadow-xl ring-2 ring-blue-200"
                : "border-slate-200 shadow-md hover:shadow-lg"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <h4
                className="font-semibold text-slate-700 truncate max-w-xs"
                title={suggestion.name || `Suggestion ${index + 1}`}
              >
                {suggestion.name || `Suggestion ${index + 1}`}
              </h4>
              <input
                type="checkbox"
                className="form-checkbox h-5 w-5 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                checked={selectedAiBundleIndices.includes(index)}
                onChange={() => handleToggleAiSuggestionSelect(index)}
                aria-label={`Select suggestion ${index + 1}`}
              />
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {(suggestion.products || []).map((product) => (
                <div
                  key={
                    product.uid || `suggested-product-${product.id}-${index}`
                  }
                  className="flex items-center space-x-3 bg-slate-50 p-2 rounded-md border border-slate-100"
                >
                  <div className="w-12 h-12 rounded overflow-hidden bg-slate-200 flex-shrink-0">
                    {getProductImage(product) ? (
                      <img
                        src={
                          getProductImage(product).secure_url ||
                          getProductImage(product).url
                        }
                        alt={product.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <PhotoIcon className="w-full h-full text-slate-400 p-2" />
                    )}
                  </div>
                  <div className="flex-grow min-w-0">
                    {" "}
                    {/* Added min-w-0 for truncation */}
                    <p className="text-xs font-medium text-slate-700 line-clamp-2">
                      {product.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      ₹
                      {product.price?.effective?.max?.toFixed(2) ||
                        product.price?.effective?.min?.toFixed(2) ||
                        "N/A"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {(suggestion.products || []).length === 0 && (
              <p className="text-xs text-slate-500 text-center py-2">
                No products in this suggestion.
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    // if (!isLoadingProducts && !isLoadingBundles && !isSavingAiBundles) {
    //   return (
    //     <div className="text-center p-10 bg-amber-50 border border-amber-200 rounded-lg shadow">
    //       <ExclamationTriangleIcon className="w-12 h-12 text-amber-500 mx-auto mb-4" />
    //       <h3 className="text-xl font-semibold text-amber-700 mb-2">
    //         Application Context Required
    //       </h3>
    //       <p className="text-amber-600 mb-6">
    //         An Application ID is necessary to create AI-powered bundles.
    //       </p>
    //       <button
    //         onClick={() => navigate(companyId ? `/company/${companyId}` : "/")}
    //         className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all"
    //       >
    //         Go to Company Dashboard
    //       </button>
    //     </div>
    //   );
    // }

    if (isLoadingBundles && currentStep === 2) {
      return (
        <div className="flex flex-col justify-center items-center p-10 min-h-[350px]">
          <div className="relative">
            <div className="w-14 h-14 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-14 h-14 border-4 border-transparent border-r-blue-500 rounded-full animate-spin animation-delay-75"></div>
          </div>
          <div className="mt-6 text-center">
            <h3 className="text-lg font-semibold text-slate-800 mb-1">
              Generating Your Bundle Suggestions
            </h3>
            <p className="text-sm text-slate-500">
              This may take a few moments...
            </p>
          </div>
        </div>
      );
    }
    if (isSavingAiBundles) {
      return (
        <div className="flex flex-col justify-center items-center p-10 min-h-[350px]">
          <div className="relative">
            <div className="w-14 h-14 border-4 border-green-100 border-t-green-500 rounded-full animate-spin"></div>
          </div>
          <div className="mt-6 text-center">
            <h3 className="text-lg font-semibold text-slate-800 mb-1">
              Saving Selected Bundles...
            </h3>
            <p className="text-sm text-slate-500"> Please wait. </p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {renderStepIndicator()}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-slate-800 mb-1">
                Select Products for Bundling
              </h3>
              <p className="text-sm text-slate-500">
                Choose at least two products. The AI will analyze these to
                suggest bundles.
              </p>
            </div>
            {isLoadingProducts && !products?.length ? (
              <div className="flex flex-col justify-center items-center p-10 min-h-[250px]">
                <div className="w-10 h-10 border-4 border-slate-100 border-t-slate-500 rounded-full animate-spin"></div>
                <p className="text-slate-500 mt-4">Loading products...</p>
              </div>
            ) : !categories.length && !isLoadingProducts ? (
              <p className="text-slate-500 col-span-full text-center py-10">
                No products found. Add products to create bundles.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5 items-start">
                  {paginatedCategories.map(renderCategoryCard)}
                </div>
                {renderCategoryPagination()}
              </>
            )}
            {renderSelectionSummary()}
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <button
              onClick={() => setCurrentStep(1)}
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors group disabled:opacity-50"
            >
              <BackspaceIcon className="w-4 h-4 mr-1.5" /> Back to Product
              Selection
            </button>
            {renderAIOptions()}
            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-6 border-t mt-8">
              <button
                type="button"
                onClick={() => navigate(getNavigatePath())}
                className="w-full sm:w-auto px-6 py-2.5 text-sm text-slate-700 bg-white border border-slate-300 rounded-lg font-semibold hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAIGenerate}
                // disabled={
                //   getTotalSelectedProducts() < 2 ||
                //   !aiParams.customPrompt ||
                //   aiParams.customPrompt.trim() === ""
                // }
                className="w-full sm:w-auto px-6 py-2.5 text-sm bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-all shadow-md"
              >
                {isLoadingBundles ? (
                  <span className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Generating...
                  </span>
                ) : (
                  `Generate Suggestions`
                )}
              </button>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <button
              onClick={() => setCurrentStep(2)}
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors group disabled:opacity-50"
            >
              <BackspaceIcon className="w-4 h-4 mr-1.5" /> Back to AI
              Configuration
            </button>
            {renderAISuggestions()}
            <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-6 border-t mt-8">
              <button
                type="button"
                onClick={() => navigate(getNavigatePath())}
                className="w-full sm:w-auto px-6 py-2.5 text-sm text-slate-700 bg-white border border-slate-300 rounded-lg font-semibold hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSelectedBundles}
                // disabled={
                //   isSavingAiBundles || selectedAiBundleIndices.length === 0
                // }
                className="w-full sm:w-auto px-6 py-2.5 text-sm bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-all shadow-md"
              >
                {isSavingAiBundles ? (
                  <span className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Saving...
                  </span>
                ) : (
                  `Create Selected Bundles (${selectedAiBundleIndices.length})`
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const getNavigatePath = () => {
    if (companyId) return `/company/${companyId}/application/bundles`;
    if (companyId) return `/company/${companyId}/bundles`;
    return "/";
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      {" "}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => navigate(getNavigatePath())}
            className="inline-flex items-center text-slate-600 hover:text-slate-900 font-medium text-sm transition-colors group mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-0.5" />
            Back to Bundles
          </button>
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-800">
            Create New AI-Powered Bundles
          </h1>
          <p className="text-slate-600 mt-1 text-sm">
            Select products, provide a prompt, and let our AI suggest compelling
            bundles.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-4 sm:p-6 md:p-8">
          {renderContent()}
        </div>

        {bundleError && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm shadow">
            <strong>Error:</strong> {bundleError}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateBundlePage;
