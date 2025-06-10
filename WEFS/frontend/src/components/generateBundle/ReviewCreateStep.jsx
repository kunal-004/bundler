import React from "react";
import {
  BackspaceIcon,
  CubeIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";

const ReviewCreateStep = ({
  aiSuggestedBundles,
  selectedAiBundleIndices,
  handleToggleAiSuggestionSelect,
  onBack,
  onSave,
  onCancel,
  isSavingAiBundles,
  isLoadingBundles,
  getProductImage,
  promptUsed,
}) => {
  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors group disabled:opacity-50"
        disabled={isSavingAiBundles}
      >
        <BackspaceIcon className="w-4 h-4 mr-1.5" /> Back to AI Prompt
      </button>

      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-slate-800 mb-1">
            Generated Bundle Suggestions
          </h3>
          <p className="text-sm text-slate-500">
            Select the bundles you'd like to Create.
          </p>
          {promptUsed && (
            <p className="text-xs text-slate-500 mt-1 italic">
              Prompt used: "{promptUsed}"
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
                  disabled={isSavingAiBundles}
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

      <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-6 border-t mt-8">
        <button
          type="button"
          onClick={onCancel}
          className="w-full sm:w-auto px-6 py-2.5 text-sm text-slate-700 bg-white border border-slate-300 rounded-lg font-semibold hover:bg-slate-50 transition-all"
          disabled={isSavingAiBundles}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={isSavingAiBundles || selectedAiBundleIndices.length === 0}
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
  );
};

export default ReviewCreateStep;
