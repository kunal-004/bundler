import React from "react";
import {
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  LightBulbIcon,
} from "@heroicons/react/24/solid";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

// --- Sub-component for the final loading state ---
const GeneratingState = () => (
  <div className="flex flex-col items-center justify-center text-center py-24 px-6 bg-white rounded-2xl shadow-lg">
    <div className="relative w-24 h-24 mx-auto">
      <div className="absolute inset-0 bg-blue-500 rounded-full animate-pulse opacity-60"></div>
      <SparklesIcon className="w-24 h-24 text-blue-600 relative animate-pulse" />
    </div>
    <h2 className="text-3xl font-bold text-slate-800 mt-8">
      Crafting Your Bundles...
    </h2>
    <p className="text-lg text-slate-600 mt-3 max-w-md">
      Our AI is analyzing your products and prompt to generate the perfect
      combinations.
    </p>
  </div>
);

// --- Sub-component for the suggestion loading skeleton ---
const SuggestionSkeleton = () => (
  <div className="space-y-3 animate-pulse">
    <div className="h-8 bg-slate-200 rounded-full w-3/4"></div>
    <div className="h-8 bg-slate-200 rounded-full w-full"></div>
    <div className="h-8 bg-slate-200 rounded-full w-5/6"></div>
    <div className="h-8 bg-slate-200 rounded-full w-2/3"></div>
  </div>
);

// --- Main Revamped PromptStep Component ---
const PromptStep = ({
  aiParams,
  setAiParams,
  onBack,
  onGenerate,
  onCancel,
  isLoadingBundles,
  promptSuggestions,
  isLoadingSuggestions,
}) => {
  const handleSuggestionClick = (prompt) => {
    setAiParams({ ...aiParams, customPrompt: prompt });
  };

  if (isLoadingBundles) {
    return <GeneratingState />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <button
          onClick={onBack}
          className="inline-flex items-center text-slate-600 hover:text-blue-600 font-medium text-sm transition-colors group disabled:opacity-50"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2 transition-transform group-hover:-translate-x-1" />
          Back to Product Selection
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 bg-white p-8 rounded-2xl shadow-xl border border-slate-200 flex flex-col">
          <div className="flex-grow">
            <h2 className="text-3xl font-bold text-slate-900 flex items-center">
              <ChatBubbleLeftRightIcon className="w-8 h-8 text-blue-500 mr-3" />
              Custom AI Prompt
            </h2>
            <p className="text-slate-500 mt-2 mb-6">
              Provide a clear, descriptive prompt for the best results.
            </p>
            <textarea
              id="customPrompt"
              name="customPrompt"
              rows="8"
              className="w-full p-4 border border-slate-300 rounded-xl shadow-inner text-base bg-slate-50
                         placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
              placeholder="e.g., 'Create three distinct travel kits for a beach vacation using the selected sunscreen, t-shirts, and accessories...'"
              value={aiParams.customPrompt}
              onChange={(e) =>
                setAiParams({ ...aiParams, customPrompt: e.target.value })
              }
              required
            />
          </div>
        </div>

        <div className="lg:col-span-2 bg-slate-50/50 p-8 rounded-2xl border border-slate-200">
          <h3 className="text-xl font-semibold text-slate-800 flex items-center">
            <LightBulbIcon className="w-6 h-6 text-amber-500 mr-3" />
            Smart Suggestions
          </h3>
          <p className="text-slate-500 mt-1 mb-6">
            Based on products you selected.
          </p>

          <div className="space-y-3">
            {isLoadingSuggestions ? (
              <SuggestionSkeleton />
            ) : promptSuggestions && promptSuggestions.length > 0 ? (
              promptSuggestions.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleSuggestionClick(prompt)}
                  className="w-full text-left px-4 py-3 bg-white text-slate-700 text-sm font-medium rounded-lg
                                       border border-slate-200 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-800 
                                       transition-all duration-200 shadow-sm"
                >
                  {prompt}
                </button>
              ))
            ) : (
              <div className="text-center py-8 px-4 bg-white rounded-lg border border-dashed">
                <p className="text-sm text-slate-500">
                  {isLoadingSuggestions
                    ? "Loading..."
                    : "No suggestions available. Please write a custom prompt."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-end items-center gap-4 pt-6 mt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={onCancel}
          className="w-full sm:w-auto px-8 py-3 text-sm font-semibold text-slate-700 bg-transparent
                     rounded-lg hover:bg-slate-100 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onGenerate}
          disabled={!aiParams.customPrompt?.trim()}
          className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold text-white bg-blue-600 rounded-lg
                     hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl
                     disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:bg-slate-400"
        >
          Generate Suggestions
        </button>
      </div>
    </div>
  );
};

export default PromptStep;
