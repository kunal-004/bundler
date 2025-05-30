import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import {
  ArrowLeftIcon,
  CubeIcon,
  ShoppingBagIcon,
  CalendarIcon,
  TagIcon,
  UserIcon,
  ClockIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import LoadingSpinner from "../components/LoadingSpinner";

const ViewBundlePage = () => {
  const { bundle_id } = useParams();
  const navigate = useNavigate();
  const { companyId, applicationId, bundles, isLoadingBundles } =
    useAppContext();
  const [bundle, setBundle] = useState(null);

  useEffect(() => {
    if (bundles && bundle_id) {
      const foundBundle = bundles.find(
        (b) => b.id === bundle_id || b._id === bundle_id
      );
      setBundle(foundBundle || null);
    }
  }, [bundles, bundle_id]);

  const getNavigatePath = () => {
    if (companyId)
      return `/company/${companyId}/application/${applicationId}/bundles`;
    if (companyId) return `/company/${companyId}/bundles`;
    return "/";
  };

  const handleEditBundle = () => {
    // Use bundle._id (from platform) if available, otherwise fallback to bundle.id (e.g., for AI suggestions)
    const actualBundleId = bundle?._id || bundle?.id;

    if (companyId && actualBundleId) {
      const editUrl = `https://platform.fynd.com/company/${companyId}/bundle/${actualBundleId}/edit`;
      window.open(editUrl, "_blank", "noopener,noreferrer"); // Open in a new tab
    } else {
      alert(
        "Cannot determine the edit path. Company ID or Bundle ID is missing or invalid."
      );
    }
  };

  if (isLoadingBundles) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSpinner message="Loading bundle details..." />
      </div>
    );
  }

  if (!bundle) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <div className="max-w-lg mx-auto bg-red-50 border border-red-200 p-6 rounded-xl">
          <h2 className="text-2xl font-semibold text-red-700 mb-2">
            Bundle Not Found
          </h2>
          <p className="text-red-600 mb-4">
            This bundle does not exist or was removed.
          </p>
          <button
            onClick={() => navigate(getNavigatePath())}
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Bundles
          </button>
        </div>
      </div>
    );
  }

  // The button will be shown if a bundle exists and companyId is present.
  // The actualBundleId logic in handleEditBundle will determine which ID to use.
  const canAttemptEdit = companyId && (bundle?._id || bundle?.id);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex justify-between items-center">
        <button
          onClick={() => navigate(getNavigatePath())}
          className="flex items-center text-sm text-slate-600 hover:text-slate-800"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-1" />
          Back to Bundles
        </button>
        {canAttemptEdit && ( // Show button if we can attempt to build an edit link
          <button
            onClick={handleEditBundle}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            <PencilSquareIcon className="w-4 h-4 mr-2" />
            Edit Bundle on Platform
          </button>
        )}
      </div>

      <div className="bg-blue-100 rounded-2xl text-gray-500 p-6 mb-6 shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center">
            {bundle.logo && (
              <img
                src={bundle.logo}
                alt={bundle.name}
                className="h-16 w-16 mr-4 object-contain"
              />
            )}
            {bundle.image_url && !bundle.logo && (
              <img
                src={bundle.image_url}
                alt={bundle.name}
                className="h-16 w-16 mr-4 object-cover rounded-md bg-slate-200"
              />
            )}
            <h1 className="text-2xl font-bold text-slate-800">{bundle.name}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="flex items-center text-slate-700">
              <CubeIcon className="w-5 h-5 mr-1" />{" "}
              {bundle.products?.length || 0} Products
            </span>
            {bundle.choice && (
              <span className="flex items-center text-slate-700">
                <TagIcon className="w-5 h-5 mr-1" />{" "}
                {bundle.choice === "single"
                  ? "Single Choice"
                  : "Multiple Choice"}
              </span>
            )}
            <span
              className={`px-3 py-1 rounded-full font-medium ${
                bundle.is_active
                  ? "bg-green-200 text-green-800"
                  : "bg-gray-200 text-gray-800"
              }`}
            >
              {bundle.is_active ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-md p-6 mb-8 grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <InfoRow
            icon={UserIcon}
            label="Created By"
            value={
              bundle.created_by?.username ||
              (bundle.type === "AI_SUGGESTION" ? "AI Agent" : "Unknown")
            }
          />
          <InfoRow
            icon={CalendarIcon}
            label="Created On"
            value={new Date(
              bundle.created_on || bundle.created_date
            ).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          />
          {bundle.modified_on && (
            <InfoRow
              icon={ClockIcon}
              label="Last Modified"
              value={new Date(bundle.modified_on).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            />
          )}
          <InfoRow
            icon={TagIcon}
            label="Bundle Source / Type" // Clarified label
            value={
              bundle.type === "AI_SUGGESTION"
                ? "AI Suggested"
                : bundle.choice
                ? bundle.choice === "single"
                  ? "Platform - Single Choice"
                  : "Platform - Multiple Choice"
                : "Platform - Standard"
            }
          />
        </div>
        <div className="space-y-4">
          {bundle.hasOwnProperty("same_store_assignment") && (
            <InfoRow
              icon={ShoppingBagIcon}
              label="Store Assignment"
              value={
                bundle.same_store_assignment ? "Same Store Only" : "Any Store"
              }
            />
          )}
          {bundle.bundle_price && (
            <InfoRow
              icon={TagIcon}
              label="Suggested Bundle Price"
              value={`₹${bundle.bundle_price.toFixed(2)}`}
            />
          )}
          {bundle.description && (
            <InfoRow
              icon={CubeIcon}
              label="Description"
              value={bundle.description}
            />
          )}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-slate-800 mb-4">
          Products in Bundle
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {bundle.products?.map((product) => (
            <div
              key={product.product_uid || product.uid}
              className="bg-slate-50 rounded-xl p-4 shadow-sm border border-slate-200"
            >
              <h3 className="text-slate-800 font-semibold mb-2">
                {product.name ||
                  `Product #${product.product_uid || product.uid}`}
              </h3>

              {product.images?.[0]?.url && (
                <img
                  src={product.images[0].url}
                  alt={product.name || "Product Image"}
                  className="w-full h-32 object-cover rounded-md mb-2 bg-slate-200"
                />
              )}
              {product.media?.find((m) => m.type === "image")?.url &&
                !product.images && (
                  <img
                    src={product.media.find((m) => m.type === "image").url}
                    alt={product.name || "Product Image"}
                    className="w-full h-32 object-cover rounded-md mb-2 bg-slate-200"
                  />
                )}

              <div className="space-y-1 text-sm text-slate-600">
                {product.hasOwnProperty("min_quantity") && (
                  <ProductRow label="Min Qty" value={product.min_quantity} />
                )}
                {product.hasOwnProperty("max_quantity") && (
                  <ProductRow label="Max Qty" value={product.max_quantity} />
                )}
                {product.hasOwnProperty("auto_add_to_cart") && (
                  <ProductRow
                    label="Auto Add"
                    value={product.auto_add_to_cart ? "Yes" : "No"}
                  />
                )}
                {product.hasOwnProperty("auto_select") && (
                  <ProductRow
                    label="Auto Select"
                    value={product.auto_select ? "Yes" : "No"}
                  />
                )}
                {product.hasOwnProperty("allow_remove") && (
                  <ProductRow
                    label="Allow Remove"
                    value={product.allow_remove ? "Yes" : "No"}
                  />
                )}

                {product.price?.effective?.max && (
                  <ProductRow
                    label="Price"
                    value={`₹${product.price.effective.max.toFixed(2)}`}
                  />
                )}
                {!product.price?.effective?.max &&
                  product.price?.effective?.min && (
                    <ProductRow
                      label="Price"
                      value={`₹${product.price.effective.min.toFixed(2)}`}
                    />
                  )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const InfoRow = ({ icon: Icon, label, value }) => (
  <div>
    <h4 className="text-sm text-slate-500 mb-1">{label}</h4>
    <div className="flex items-center text-slate-700">
      <Icon className="w-5 h-5 mr-2 text-slate-400" />
      {value || "N/A"}
    </div>
  </div>
);

const ProductRow = ({ label, value }) => (
  <div className="flex justify-between">
    <span className="text-slate-500">{label}:</span>
    <span className="text-slate-700">{value}</span>
  </div>
);

export default ViewBundlePage;
