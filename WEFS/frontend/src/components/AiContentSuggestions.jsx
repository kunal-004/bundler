import { useState, useCallback } from "react";
import toast from "react-hot-toast";
import {
  Sparkles,
  X,
  RefreshCw,
  Check,
  Edit3,
  ImageIcon,
  Wand2,
  Save,
  AlertCircle,
  Loader2,
  Lightbulb,
  ArrowRight,
  Maximize2,
  Download,
} from "lucide-react";
import { useAppContext } from "../context/AppContext";

const AiContentSuggestions = ({
  bundle = { id: "demo-bundle" },
  onApply,
  onClose,
}) => {
  const [aiGeneratedContent, setAiGeneratedContent] = useState(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [loadingState, setLoadingState] = useState({
    logo: false,
    name: false,
    all: false,
    update: false,
  });
  const [error, setError] = useState(null);
  const [updateError, setUpdateError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImageSrc, setModalImageSrc] = useState("");
  const [additionalPrompt, setAdditionalPrompt] = useState("");

  const {
    companyId,
    generateBundleTitleAndImage,
    setAiContentError,
    updateBundleDetails,
    isUpdatingBundle,
  } = useAppContext();

  const handleRegenerate = useCallback(
    async (type) => {
      if (!bundle || !companyId || !bundle.id) {
        const msg = "Missing required data to generate content.";
        setError(msg);
        toast.error(msg);
        return;
      }
      setError(null);
      setUpdateError(null);
      setLoadingState((prev) => ({ ...prev, [type]: true, update: false }));

      try {
        const promptForImage =
          type === "logo" || type === "all" ? additionalPrompt : "";
        const generatedData = await generateBundleTitleAndImage(
          bundle.id,
          promptForImage
        );

        if (generatedData && generatedData.logoUrl && generatedData.titleText) {
          setAiGeneratedContent((prevContent) => {
            const isInitialFullGeneration = type === "all" && !prevContent;
            if (type === "all" || isInitialFullGeneration) {
              return {
                logoUrl: generatedData.logoUrl,
                nameText: generatedData.titleText,
              };
            }
            const currentLogo = prevContent ? prevContent.logoUrl : null;
            const currentName = prevContent ? prevContent.nameText : null;
            return {
              logoUrl: type === "logo" ? generatedData.logoUrl : currentLogo,
              nameText: type === "name" ? generatedData.titleText : currentName,
            };
          });
        } else {
          const specificError = `Failed to generate ${type}. Please try again.`;
          setError(specificError);
          toast.error(specificError);
          if (setAiContentError) setAiContentError(specificError);
        }
      } catch (err) {
        const errorMessage =
          err.message || `An error occurred while generating ${type}.`;
        setError(errorMessage);
        toast.error(errorMessage);
        if (setAiContentError) setAiContentError(errorMessage);
      } finally {
        setLoadingState((prev) => ({ ...prev, [type]: false }));
      }
    },
    [
      bundle,
      companyId,
      generateBundleTitleAndImage,
      setAiContentError,
      additionalPrompt,
    ]
  );

  const handleApply = async (type = "all") => {
    if (!bundle || !bundle.id) {
      const msg = "Missing bundle information to apply changes.";
      setUpdateError(msg);
      toast.error(msg);
      return;
    }

    const { nameText, logoUrl } = aiGeneratedContent || {};
    let payload = {};
    let appliedContent = {};
    let successMessage = "";

    if (type === "all" || type === "name") {
      if (!nameText) {
        toast.error("Missing generated name to apply.");
        return;
      }
      payload.name = nameText;
      appliedContent.name = nameText;
    }

    if (type === "all" || type === "logo") {
      if (!logoUrl) {
        toast.error("Missing generated logo to apply.");
        return;
      }
      const base64Prefix = "data:image/png;base64,";
      let imageBase64 = "";
      if (logoUrl.startsWith(base64Prefix)) {
        imageBase64 = logoUrl.substring(base64Prefix.length);
      } else {
        const parts = logoUrl.split(",");
        if (parts.length === 2 && parts[0].includes("base64")) {
          imageBase64 = parts[1];
        } else {
          toast.error("Invalid image format. Cannot extract base64 data.");
          return;
        }
      }
      payload.imageBase64 = imageBase64;
      appliedContent.logo = logoUrl;
    }

    if (Object.keys(payload).length === 0) {
      toast.error("No content to apply.");
      return;
    }

    setLoadingState((prev) => ({ ...prev, update: true }));
    setError(null);
    setUpdateError(null);

    try {
      await updateBundleDetails(bundle.id, payload);

      if (type === "logo") successMessage = "Logo applied successfully!";
      else if (type === "name") successMessage = "Name updated successfully!";
      else successMessage = "All changes have been saved!";
      toast.success(successMessage);

      if (onApply) {
        onApply(appliedContent);
      }

      if (type === "name") setIsEditingName(false);

      if (type === "all") {
        setAiGeneratedContent(null);
        setAdditionalPrompt("");
        if (isModalOpen) closeImageModal();
        if (onClose) onClose();
      }
    } catch (err) {
      const errorMessage =
        err.message || "An error occurred while saving changes.";
      setUpdateError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoadingState((prev) => ({ ...prev, update: false }));
    }
  };

  const handleDiscard = () => {
    setAiGeneratedContent(null);
    setAdditionalPrompt("");
    setError(null);
    setUpdateError(null);
    if (onClose) onClose();
    if (isModalOpen) closeImageModal();
  };

  const updateName = (newName) => {
    setAiGeneratedContent((prev) =>
      prev ? { ...prev, nameText: newName } : null
    );
  };

  const openImageModal = (src) => {
    setModalImageSrc(src);
    setIsModalOpen(true);
  };

  const closeImageModal = () => {
    setIsModalOpen(false);
    setModalImageSrc("");
  };

  const isAnyLoading =
    Object.values(loadingState).some(Boolean) || isUpdatingBundle;

  const handleDownload = () => {
    if (modalImageSrc) {
      const link = document.createElement("a");
      link.href = modalImageSrc;
      link.download = "generated-logo.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (
    !loadingState.all &&
    !loadingState.logo &&
    !loadingState.name &&
    !loadingState.update &&
    !error &&
    !updateError &&
    !aiGeneratedContent
  ) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 text-center overflow-hidden">
        <div className="p-10">
          <div className="w-15 h-15 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-200">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-3">
            Craft Your Bundle
          </h2>
          <p className="text-slate-600 mb-8 max-w-md mx-auto text-lg">
            Generate a unique logo and a compelling name for your bundle in
            seconds.
          </p>
          <button
            onClick={() => handleRegenerate("all")}
            disabled={isAnyLoading}
            className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 font-semibold rounded-xl hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100 cursor-pointer text-white shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300"
          >
            <Sparkles className="w-6 h-6 group-hover:animate-pulse" />
            <span className="text-lg">Generate with AI</span>
            <ArrowRight className="w-5 h-5 opacity-70 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
        <div className="bg-slate-50 px-10 py-6 border-t border-slate-100">
          <div className="grid grid-cols-2 gap-8 max-w-sm mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-blue-600" />
              </div>
              <span className="font-medium text-slate-800">
                AI-Powered Logo
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Wand2 className="w-5 h-5 text-blue-600" />
              </div>
              <span className="font-medium text-slate-800">Creative Name</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                AI Content Generator
              </h3>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          {/* Loading state for initial generation */}
          {loadingState.all &&
            !aiGeneratedContent &&
            !error &&
            !updateError && (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
                <h4 className="text-xl font-semibold text-slate-900 mb-3">
                  Creating Your Bundle Identity
                </h4>
                <p className="text-slate-600 mb-6">
                  Crafting the perfect logo and name for your bundle...
                </p>
                <div className="w-64 h-2 bg-slate-200 rounded-full mx-auto">
                  <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full animate-pulse w-3/4"></div>
                </div>
              </div>
            )}

          {/* Error state */}
          {(error || updateError) &&
            !loadingState.all &&
            !loadingState.logo &&
            !loadingState.name &&
            !loadingState.update && (
              <div className="text-center py-12 px-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h4 className="text-xl font-semibold text-slate-900 mb-3">
                  {updateError ? "Update Failed" : "Generation Failed"}
                </h4>
                <p className="text-slate-600 mb-6 max-w-md mx-auto">
                  {updateError || error}
                </p>
                <button
                  onClick={() => {
                    setUpdateError(null);
                    setError(null);
                    handleRegenerate("all");
                  }}
                  disabled={isAnyLoading}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 shadow-md shadow-blue-100"
                >
                  <RefreshCw className="w-5 h-5" />
                  Try Again
                </button>
              </div>
            )}

          {aiGeneratedContent && (
            <div className="space-y-8">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Logo Section */}
                <div className="space-y-5">
                  <h4 className="font-semibold text-slate-900 flex items-center gap-2 text-lg">
                    <ImageIcon className="w-5 h-5 text-blue-600" />
                    Generated Logo
                  </h4>
                  <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl p-8 min-h-[220px] flex items-center justify-center border border-slate-100 shadow-sm">
                    {loadingState.logo ? (
                      <div className="text-center">
                        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-3" />
                        <p className="text-slate-600">Creating your logo...</p>
                      </div>
                    ) : (
                      <div
                        className="cursor-pointer group relative"
                        onClick={() =>
                          openImageModal(aiGeneratedContent.logoUrl)
                        }
                      >
                        <div className="p-4 bg-white rounded-xl shadow-sm border border-slate-100 group-hover:shadow-md transition-all">
                          <img
                            src={
                              aiGeneratedContent.logoUrl || "/placeholder.svg"
                            }
                            alt="Generated Logo"
                            className="max-w-40 max-h-40 object-contain"
                          />
                        </div>
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                          <div className="bg-white/90 p-2 rounded-lg shadow-md">
                            <Maximize2 className="w-5 h-5 text-blue-600" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {!loadingState.logo && aiGeneratedContent.logoUrl && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-slate-700">
                        Refine your logo with specific instructions{" "}
                        <span className="text-slate-500">(optional)</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={additionalPrompt}
                          onChange={(e) => setAdditionalPrompt(e.target.value)}
                          placeholder="e.g., make it more modern, use blue colors"
                          className="w-full px-4 py-3 pl-10 border border-slate-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm shadow-sm"
                          disabled={isAnyLoading}
                        />
                        <Lightbulb className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleRegenerate("logo")}
                      disabled={isAnyLoading}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-black-700 bg-blue-50 hover:bg-blue-100 rounded-lg font-medium transition-colors disabled:opacity-50 cursor-pointer border border-blue-100"
                    >
                      {loadingState.logo ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <RefreshCw className="w-5 h-5" />
                      )}
                      {loadingState.logo ? "Generating..." : "Regenerate"}
                    </button>
                    <button
                      onClick={() => handleApply("logo")}
                      disabled={isAnyLoading || !aiGeneratedContent.logoUrl}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:to-indigo-700 hover:from-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                    >
                      <Check className="w-5 h-5" />
                      Apply Logo
                    </button>
                  </div>
                </div>

                {/* Name Section */}
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-slate-900 flex items-center gap-2 text-lg">
                      <Wand2 className="w-5 h-5 text-blue-600" />
                      Generated Name
                    </h4>
                    <button
                      onClick={() => setIsEditingName(!isEditingName)}
                      disabled={isAnyLoading || loadingState.update}
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50 cursor-pointer border border-slate-200"
                    >
                      {isEditingName ? (
                        <Save className="w-4 h-4" />
                      ) : (
                        <Edit3 className="w-4 h-4" />
                      )}
                      {isEditingName ? "Done" : "Edit"}
                    </button>
                  </div>

                  <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl p-8 min-h-[220px] flex items-center border border-slate-100 shadow-sm">
                    {loadingState.name ? (
                      <div className="text-center w-full">
                        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-3" />
                        <p className="text-slate-600">Creating your name...</p>
                      </div>
                    ) : (
                      <div className="w-full">
                        {isEditingName ? (
                          <textarea
                            value={aiGeneratedContent.nameText}
                            onChange={(e) => updateName(e.target.value)}
                            className="w-full p-4 border border-slate-200 rounded-lg text-lg font-medium resize-none focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                            rows={4}
                            disabled={isAnyLoading}
                          />
                        ) : (
                          <div className="text-center w-full">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                              <h5 className="text-2xl font-semibold text-slate-900 leading-relaxed">
                                {aiGeneratedContent.nameText}
                              </h5>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleRegenerate("name")}
                      disabled={isAnyLoading || isEditingName}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-black-700 bg-blue-50 hover:bg-blue-100 rounded-lg font-medium transition-colors disabled:opacity-50 cursor-pointer border border-blue-100"
                    >
                      {loadingState.name ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <RefreshCw className="w-5 h-5" />
                      )}
                      {loadingState.name ? "Generating..." : "Regenerate"}
                    </button>
                    <button
                      onClick={() => handleApply("name")}
                      disabled={isAnyLoading || !aiGeneratedContent.nameText}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:to-indigo-700 hover:from-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                    >
                      <Check className="w-5 h-5" />
                      Apply Name
                    </button>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-200">
                <button
                  onClick={handleDiscard}
                  className="px-5 py-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg font-medium transition-colors disabled:opacity-50 cursor-pointer"
                  disabled={isAnyLoading}
                >
                  Discard All
                </button>
                <button
                  onClick={() => handleApply("all")}
                  disabled={
                    isAnyLoading ||
                    isEditingName ||
                    !aiGeneratedContent?.logoUrl ||
                    !aiGeneratedContent?.nameText
                  }
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:to-indigo-700 hover:from-blue-700 text-white font-medium rounded-lg transition-all cursor-pointer disabled:opacity-50 shadow-md shadow-blue-100"
                >
                  {loadingState.update &&
                  !loadingState.logo &&
                  !loadingState.name ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Check className="w-5 h-5" />
                  )}
                  {loadingState.update ? "Saving..." : "Apply All & Close"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {isModalOpen && modalImageSrc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={closeImageModal}
        >
          <div
            className="relative max-w-2xl w-full bg-white rounded-2xl p-2 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-2 px-2 pt-2">
              <h4 className="text-lg font-semibold text-slate-900">
                Logo Preview
              </h4>
              <div className="flex gap-2">
                <button
                  onClick={handleDownload}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
                  aria-label="Download"
                >
                  <Download className="w-5 h-5" />
                </button>
                <button
                  onClick={closeImageModal}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-6 flex items-center justify-center">
              <img
                src={modalImageSrc || "/placeholder.svg"}
                alt="Enlarged logo"
                className="max-w-full max-h-[60vh] object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AiContentSuggestions;
