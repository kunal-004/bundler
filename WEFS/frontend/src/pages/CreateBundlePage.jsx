import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleIconSolid } from "@heroicons/react/24/solid";
import toast from "react-hot-toast";

import ProductSelectionStep from "../components/generateBundle/ProductSelectionStep";
import PromptStep from "../components/generateBundle/PromptStep";
import ReviewCreateStep from "../components/generateBundle/ReviewCreateStep";

const CreateBundlePage = () => {
  const navigate = useNavigate();
  const {
    products,
    allProducts,
    applicationId,
    isLoadingProducts,
    triggerAIBundleGeneration,
    isLoadingBundles,
    bundleError,
    companyId,
    saveAIGeneratedBundles,
    fetchProductsWithContext,
    productPagination,
    triggerAIPromptGeneration,
  } = useAppContext();

  const [currentSearchQuery, setCurrentSearchQuery] = useState("");
  const [currentCategoryFilter, setCurrentCategoryFilter] = useState("");

  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const searchTimeoutRef = useRef(null);

  const [selectedProducts, setSelectedProducts] = useState({});
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [categoryProductPages, setCategoryProductPages] = useState({});

  const [aiParams, setAiParams] = useState({ customPrompt: "" });
  const [aiSuggestedBundles, setAiSuggestedBundles] = useState([]);
  const [selectedAiBundleIndices, setSelectedAiBundleIndices] = useState([]);

  const [currentStep, setCurrentStep] = useState(1);
  const [isSavingAiBundles, setIsSavingAiBundles] = useState(false);

  const [promptSuggestions, setPromptSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  const productsToDisplay = useMemo(() => {
    return applicationId ? products : allProducts;
  }, [applicationId, products, allProducts]);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchQuery(currentSearchQuery);
    }, 300);
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [currentSearchQuery]);

  useEffect(() => {
    if (companyId) {
      const page = 1;
      const pageSize = productPagination.pageSize;

      fetchProductsWithContext(
        page,
        pageSize,
        false,
        debouncedSearchQuery,
        currentCategoryFilter
      );
    }
  }, [
    companyId,
    applicationId,
    debouncedSearchQuery,
    currentCategoryFilter,
    fetchProductsWithContext,
    productPagination.pageSize,
  ]);

  useEffect(() => {
    if (currentStep === 2) {
      const fetchSuggestions = async () => {
        setIsLoadingSuggestions(true);
        try {
          const selectedProductsPayload = Object.entries(selectedProducts)
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

          const totalProducts = selectedProductsPayload.flatMap(
            (cat) => cat.products
          ).length;
          if (totalProducts === 0) {
            setPromptSuggestions([]);
            return;
          }

          const suggestions = await triggerAIPromptGeneration(
            selectedProductsPayload
          );
          setPromptSuggestions(suggestions);
        } catch (error) {
          console.error("Error fetching prompt suggestions:", error);

          setPromptSuggestions([]);
        } finally {
          setIsLoadingSuggestions(false);
        }
      };

      fetchSuggestions();
    }
  }, [currentStep, selectedProducts, triggerAIPromptGeneration]);

  const productsByCategory = useMemo(() => {
    if (!productsToDisplay?.items) return {};

    return productsToDisplay.items.reduce((acc, product) => {
      const category =
        product.category_name || product.category_slug || "Uncategorized";
      if (!acc[category]) acc[category] = [];
      acc[category].push(product);
      return acc;
    }, {});
  }, [productsToDisplay]);

  const categories = useMemo(
    () => Object.keys(productsByCategory).sort(),
    [productsByCategory]
  );

  const getProductImage = useCallback((product) => {
    if (!product) return null;
    if (
      Array.isArray(product.images) &&
      product.images.length > 0 &&
      typeof product.images[0] === "string"
    )
      return { url: product.images[0], secure_url: product.images[0] };
    if (
      Array.isArray(product.images) &&
      product.images.length > 0 &&
      typeof product.images[0] === "object"
    )
      if (product.images[0].url || product.images[0].secure_url)
        return product.images[0];
    if (Array.isArray(product.media) && product.media.length > 0) {
      const imageMedia = product.media.find((item) => item.type === "image");
      if (imageMedia && (imageMedia.url || imageMedia.secure_url))
        return imageMedia;
    }
    return null;
  }, []);

  const handleCategoryExpansionToggle = (category) => {
    setExpandedCategory((prevExpanded) =>
      prevExpanded === category ? null : category
    );
    if (!categoryProductPages[category])
      setCategoryProductPages((prev) => ({ ...prev, [category]: 1 }));
  };

  const handleCategoryPageChange = (category, newPage) => {
    setCategoryProductPages((prev) => ({ ...prev, [category]: newPage }));
  };

  const getSelectedProductsCountForCategory = useCallback(
    (category) => Object.keys(selectedProducts[category] || {}).length,
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
            [product.uid]: {
              product,
              selectedImage: getProductImage(product),
            },
          };
        }
        if (!prev[category] && Object.keys(newCategoryProducts).length > 0)
          return { ...prev, [category]: newCategoryProducts };
        return { ...prev, [category]: newCategoryProducts };
      });
    },
    [getProductImage]
  );

  const getTotalSelectedProducts = () =>
    Object.values(selectedProducts).reduce(
      (total, categoryProds) =>
        total + (categoryProds ? Object.keys(categoryProds).length : 0),
      0
    );

  const handleAIGenerate = async (e) => {
    if (e) e.preventDefault();
    setAiSuggestedBundles([]);
    setSelectedAiBundleIndices([]);

    const totalSelected = getTotalSelectedProducts();
    if (totalSelected < 2) {
      toast.error("Please select at least 2 products for proceeding.");
      return;
    }
    if (!aiParams.customPrompt || aiParams.customPrompt.trim() === "") {
      toast.error("Please provide a custom prompt.");
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
        toast.error("No products are effectively selected.");
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
        toast.success("Bundle suggestions generated successfully!");
      } else {
        toast.error(
          "The AI could not find any matching bundles. Please try a different prompt or select more products."
        );
      }
    } catch (error) {
      console.error("Error during AI bundle generation:", error);
      toast.error(
        error.response?.data?.message ||
          "An error occurred during AI bundle generation."
      );
    }
  };

  const handleToggleAiSuggestionSelect = (index) => {
    setSelectedAiBundleIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleSaveSelectedBundles = async () => {
    if (selectedAiBundleIndices.length === 0) {
      toast.error("Please select at least one AI-suggested bundle to save.");
      return;
    }
    if (!companyId) {
      toast.error("Company ID is missing. Cannot save bundles.");
      return;
    }

    setIsSavingAiBundles(true);
    try {
      const bundlesToSave = selectedAiBundleIndices.map((index) => {
        const suggestion = aiSuggestedBundles[index];
        if (!suggestion || !Array.isArray(suggestion.products)) {
          throw new Error(
            `Suggestion ${index + 1} is malformed or missing products.`
          );
        }
        return suggestion.products.map((p) => {
          if (!p || !p.uid)
            throw new Error(
              `A product in suggestion ${
                index + 1
              } is invalid or missing a UID.`
            );
          return p.uid;
        });
      });

      const validBundlesToSave = bundlesToSave.filter(
        (bundle) => bundle.length > 0
      );
      if (validBundlesToSave.length === 0) {
        throw new Error(
          "No valid products found in the selected bundles to save."
        );
      }

      const payload = {
        bundlesData: validBundlesToSave,
        company_id: companyId,
      };
      const result = await saveAIGeneratedBundles(payload);
      if (!result || !result.success) {
        throw new Error(result?.message || "Failed to save AI bundles.");
      }

      toast.success(
        `Successfully saved ${validBundlesToSave.length} AI-generated bundle(s)!`
      );
      setAiSuggestedBundles([]);
      setSelectedAiBundleIndices([]);
      setCurrentStep(1);
      setIsSavingAiBundles(false);
      navigate(getNavigatePath());
    } catch (error) {
      console.error("Error saving AI bundles:", error);
      toast.error(`Failed to save AI bundles: ${error.message}`);
      setIsSavingAiBundles(false);
    }
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

  const handleLoadMoreProducts = useCallback(() => {
    if (productPagination.hasMore && !isLoadingProducts) {
      const nextPage = productPagination.currentPage + 1;
      const pageSize = productPagination.pageSize;

      fetchProductsWithContext(
        nextPage,
        pageSize,
        true,
        currentSearchQuery,
        currentCategoryFilter
      );
    }
  }, [
    productPagination.hasMore,
    isLoadingProducts,
    productPagination.currentPage,
    productPagination.pageSize,
    fetchProductsWithContext,
    currentSearchQuery,
    currentCategoryFilter,
  ]);

  const renderContent = () => {
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
            <div className="w-14 h-14 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
          <div className="mt-6 text-center">
            <h3 className="text-lg font-semibold text-slate-800 mb-1">
              Saving Selected Bundles...
            </h3>
            <p className="text-sm text-slate-500">Please wait.</p>
          </div>
        </div>
      );
    }

    switch (currentStep) {
      case 1:
        return (
          <ProductSelectionStep
            productsToDisplay={productsToDisplay}
            productsByCategory={productsByCategory}
            categories={categories}
            selectedProducts={selectedProducts}
            handleProductToggle={handleProductToggle}
            handleCategorySelectToggle={handleCategorySelectToggle}
            expandedCategory={expandedCategory}
            handleCategoryExpansionToggle={handleCategoryExpansionToggle}
            categoryProductPages={categoryProductPages}
            handleCategoryPageChange={handleCategoryPageChange}
            getProductImage={getProductImage}
            getSelectedProductsCountForCategory={
              getSelectedProductsCountForCategory
            }
            isLoadingProducts={isLoadingProducts}
            onContinue={() => setCurrentStep(2)}
            getTotalSelectedProducts={getTotalSelectedProducts}
            searchQuery={currentSearchQuery}
            onSearchQueryChange={setCurrentSearchQuery}
            categoryFilter={currentCategoryFilter}
            onCategoryFilterChange={setCurrentCategoryFilter}
            productPagination={productPagination}
            loadMoreProducts={handleLoadMoreProducts}
          />
        );
      case 2:
        return (
          <PromptStep
            aiParams={aiParams}
            setAiParams={setAiParams}
            onBack={() => setCurrentStep(1)}
            onGenerate={handleAIGenerate}
            onCancel={() => navigate(getNavigatePath())}
            isLoadingBundles={isLoadingBundles}
            promptSuggestions={promptSuggestions}
            isLoadingSuggestions={isLoadingSuggestions}
          />
        );
      case 3:
        return (
          <ReviewCreateStep
            aiSuggestedBundles={aiSuggestedBundles}
            selectedAiBundleIndices={selectedAiBundleIndices}
            handleToggleAiSuggestionSelect={handleToggleAiSuggestionSelect}
            onBack={() => setCurrentStep(2)}
            onSave={handleSaveSelectedBundles}
            onCancel={() => navigate(getNavigatePath())}
            isSavingAiBundles={isSavingAiBundles}
            isLoadingBundles={isLoadingBundles}
            getProductImage={getProductImage}
            promptUsed={aiParams.customPrompt}
          />
        );
      default:
        return <div>Error: Unknown step.</div>;
    }
  };

  const getNavigatePath = () => {
    if (companyId) return `/company/${companyId}/bundles`;
    return "/";
  };

  useEffect(() => {
    if (bundleError) {
      toast.error(bundleError);
    }
  }, [bundleError]);

  return (
    <div className="bg-slate-50 min-h-screen">
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
            Create New Bundles
          </h1>
          <p className="text-slate-600 mt-1 text-sm">
            Select products, provide a prompt, and get bundle suggestions.
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-4 sm:p-6 md:p-8 flexibilty">
          {renderStepIndicator()}
          {renderContent()}
        </div>
        {/* {bundleError && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm shadow">
            <strong>Error:</strong> {bundleError}
          </div>
        )} */}
      </div>
    </div>
  );
};

export default CreateBundlePage;
