import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import {
  ArrowLeftIcon,
  CubeIcon,
  CalendarIcon,
  TagIcon,
  UserIcon,
  ClockIcon,
  PencilSquareIcon,
  CurrencyRupeeIcon,
  InformationCircleIcon,
  SparklesIcon,
  CheckCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import LoadingSpinner from "../components/LoadingSpinner";
import ProductCard from "../components/ProductCard";
import AiContentSuggestions from "../components/AiContentSuggestions";

const InfoItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-start space-x-3">
    <Icon className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
    <div className="min-w-0 flex-1">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="text-sm text-gray-900 mt-1">{value}</p>
    </div>
  </div>
);

const ViewBundlePage = () => {
  const { bundle_id } = useParams();
  const navigate = useNavigate();
  const {
    companyId,
    applicationId,
    bundles,
    isLoadingBundles,
    products,
    allProducts,
    fetchAllProductsRecursively,
    isLoadingProducts,
  } = useAppContext();

  const [bundle, setBundle] = useState(null);
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);
  const [hasInitiatedFullProductFetch, setHasInitiatedFullProductFetch] =
    useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const productsSource = useMemo(() => {
    return applicationId ? products.items : allProducts.items;
  }, [applicationId, products.items, allProducts.items]);

  useEffect(() => {
    if (bundles && bundle_id) {
      const foundBundle = bundles.find(
        (b) => b.id === bundle_id || b._id === bundle_id
      );
      setBundle(foundBundle || null);
    }
  }, [bundles, bundle_id]);

  useEffect(() => {
    if (bundle && productsSource && !hasInitiatedFullProductFetch) {
      const bundleProductUids = new Set(
        bundle.products?.map((bp) => bp.product_uid) || []
      );

      const missingProductUids = [...bundleProductUids].filter(
        (uid) => !productsSource.some((p) => p.uid === uid)
      );

      if (missingProductUids.length > 0) {
        console.log(
          `ViewBundlePage: Found ${missingProductUids.length} bundle products missing from current product list. Initiating full product fetch.`
        );
        fetchAllProductsRecursively(!!applicationId);
        setHasInitiatedFullProductFetch(true);
      }
    }
  }, [
    bundle,
    productsSource,
    hasInitiatedFullProductFetch,
    fetchAllProductsRecursively,
    applicationId,
  ]);

  const getBundleProductsWithDetails = useMemo(() => {
    if (!bundle || isLoadingProducts || !productsSource) {
      return [];
    }

    return bundle.products.map((bundleProduct) => {
      const fullProduct = productsSource.find(
        (product) => product.uid === bundleProduct.product_uid
      );

      if (!fullProduct) {
        return {
          ...bundleProduct,
          name: `Product #${bundleProduct.product_uid}`,
          notFound: true,
        };
      }

      return {
        ...fullProduct,
        ...bundleProduct,
        bundleProductId: bundleProduct.product_uid,
      };
    });
  }, [bundle, productsSource, isLoadingProducts]);

  const getNavigatePath = () => {
    if (companyId && applicationId)
      return `/company/${companyId}/application/${applicationId}/bundles`;
    if (companyId) return `/company/${companyId}/bundles`;
    return "/";
  };

  const handleEditBundle = () => {
    const actualBundleId = bundle?._id || bundle?.id;

    if (companyId && actualBundleId) {
      const editUrl = `https://platform.fynd.com/company/${companyId}/bundle/${actualBundleId}/edit`;
      window.open(editUrl, "_blank", "noopener,noreferrer");
    } else {
      alert(
        "Cannot determine the edit path. Company ID or Bundle ID is missing or invalid."
      );
    }
  };

  const handleShowAiSuggestions = () => {
    setShowAiSuggestions(true);
  };

  const handleApplyAiSuggestions = (aiContent) => {
    setBundle((prevBundle) => ({
      ...prevBundle,
      logo: aiContent.logo,
      description: aiContent.description,
    }));
    setShowAiSuggestions(false);
  };

  const handleCloseAiSuggestions = () => {
    setShowAiSuggestions(false);
  };

  if (isLoadingBundles || isLoadingProducts) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LoadingSpinner message="Loading bundle details and associated products..." />
        </div>
      </div>
    );
  }

  if (!bundle) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="w-12 h-12 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
                <XMarkIcon className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Bundle Not Found
              </h2>
              <p className="text-gray-600 mb-6">
                This bundle does not exist or has been removed.
              </p>
              <button
                onClick={() => navigate(getNavigatePath())}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
              >
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Back to Bundles
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const canAttemptEdit = companyId && (bundle?._id || bundle?.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(getNavigatePath())}
            className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Bundles
          </button>

          <div className="flex items-center space-x-3">
            {canAttemptEdit && (
              <button
                onClick={handleEditBundle}
                className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
              >
                <PencilSquareIcon className="w-4 h-4 mr-2" />
                Edit Bundle
              </button>
            )}
            <div className="relative group">
              <button
                onClick={handleShowAiSuggestions}
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg text-sm font-medium rounded-md hover:bg-indigo-900 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <SparklesIcon className="w-4 h-4 mr-2" />
                AI Agent
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                {bundle.logo ? (
                  <img
                    src={bundle.logo}
                    alt={bundle.name}
                    className="h-16 w-16 object-contain rounded-lg border border-gray-200 bg-gray-50"
                  />
                ) : bundle.image_url ? (
                  <img
                    src={bundle.image_url}
                    alt={bundle.name}
                    className="h-16 w-16 object-cover rounded-lg border border-gray-200"
                  />
                ) : (
                  <div className="h-16 w-16 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                    <CubeIcon className="h-8 w-8 text-gray-400" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-1">
                  {bundle.name}
                </h1>
                <p className="text-sm text-gray-500 mb-3">
                  Bundle ID: {bundle.id || bundle._id}
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <CubeIcon className="w-3 h-3 mr-1" />
                    {getBundleProductsWithDetails.length} Products
                  </span>

                  {bundle.choice && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      <TagIcon className="w-3 h-3 mr-1" />
                      {bundle.choice === "single"
                        ? "Single Choice"
                        : "Multiple Choice"}
                    </span>
                  )}

                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      bundle.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {bundle.is_active ? (
                      <CheckCircleIcon className="w-3 h-3 mr-1" />
                    ) : (
                      <XMarkIcon className="w-3 h-3 mr-1" />
                    )}
                    {bundle.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showAiSuggestions && (
          <div className="mb-6">
            <AiContentSuggestions
              bundle={bundle}
              products={getBundleProductsWithDetails}
              onApply={handleApplyAiSuggestions}
              onClose={handleCloseAiSuggestions}
            />
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Bundle Details
              </h3>

              <div className="space-y-4">
                <InfoItem
                  icon={UserIcon}
                  label="Created By"
                  value={
                    bundle.created_by?.username ||
                    (bundle.type === "AI_SUGGESTION" ? "AI Agent" : "Unknown")
                  }
                />

                <InfoItem
                  icon={CalendarIcon}
                  label="Created On"
                  value={new Date(
                    bundle.created_on || bundle.created_date
                  ).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                />

                {bundle.modified_on && (
                  <InfoItem
                    icon={ClockIcon}
                    label="Last Modified"
                    value={new Date(bundle.modified_on).toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      }
                    )}
                  />
                )}

                <InfoItem
                  icon={TagIcon}
                  label="Bundle Type"
                  value={
                    bundle.type === "AI_SUGGESTION"
                      ? "AI Generated"
                      : bundle.choice
                      ? `${
                          bundle.choice === "single" ? "Single" : "Multiple"
                        } Choice`
                      : "Standard Bundle"
                  }
                />

                {bundle.bundle_price && (
                  <InfoItem
                    icon={CurrencyRupeeIcon}
                    label="Bundle Price"
                    value={`₹${bundle.bundle_price.toFixed(2)}`}
                  />
                )}
              </div>
            </div>

            {bundle.description && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center">
                  <InformationCircleIcon className="w-5 h-5 mr-2 text-gray-400" />
                  Description
                </h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {bundle.description}
                </p>
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    Bundle Products
                  </h3>
                  <span className="text-sm text-gray-500">
                    {getBundleProductsWithDetails.length} item
                    {getBundleProductsWithDetails.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              <div className="p-6">
                {/* Condition 1: Bundle has products, but none could be resolved after all attempts */}
                {getBundleProductsWithDetails.length === 0 &&
                bundle.products?.length > 0 ? (
                  <div className="text-center py-12">
                    <CubeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Products Not Found
                    </h3>
                    <p className="text-gray-600">
                      This bundle contains products that could not be loaded.
                      They might be inactive or removed from the catalog.
                    </p>
                  </div>
                ) : getBundleProductsWithDetails.length === 0 &&
                  bundle.products?.length === 0 ? (
                  <div className="text-center py-12">
                    <CubeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No Products in Bundle
                    </h3>
                    <p className="text-gray-600">
                      This bundle does not contain any products.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
                    {getBundleProductsWithDetails.map((product, index) => (
                      <div
                        key={product.bundleProductId || product.id || index}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <ProductCard
                          product={product}
                          showBundleInfo={true}
                          bundleQuantity={product.quantity}
                          bundlePrice={product.price}
                        />
                        {product.notFound && (
                          <div className="mt-2 px-3 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full inline-flex items-center">
                            <XMarkIcon className="w-3 h-3 mr-1" />
                            Product not found (Missing from catalog)
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewBundlePage;
