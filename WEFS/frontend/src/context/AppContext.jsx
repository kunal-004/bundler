import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  useContext,
} from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import urlJoin from "url-join";

const AppContext = createContext();

export const useAppContext = () => useContext(AppContext);

const EXAMPLE_MAIN_URL = window.location.origin;

export const AppProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [productError, setProductError] = useState(null);

  const [companyId, setCompanyId] = useState(null);
  const [applicationId, setApplicationId] = useState(null);

  const [bundles, setBundles] = useState([]);
  const [isLoadingBundles, setIsLoadingBundles] = useState(false);
  const [bundleError, setBundleError] = useState(null);

  const [salesChannels, setSalesChannels] = useState([]);
  const [isLoadingSalesChannels, setIsLoadingSalesChannels] = useState(false);
  const [salesChannelsError, setSalesChannelsError] = useState(null);

  const [salesChannelProducts, setSalesChannelProducts] = useState({});
  const [isLoadingSalesChannelProducts, setIsLoadingSalesChannelProducts] =
    useState({});
  const [salesChannelProductsError, setSalesChannelProductsError] = useState(
    {}
  );

  const params = useParams();

  const isApplicationMode = useCallback(() => !!applicationId, [applicationId]);

  const fetchProducts = useCallback(async () => {
    if (!companyId) {
      setProducts([]);
      return;
    }

    setIsLoadingProducts(true);
    setProductError(null);
    try {
      const apiUrl = isApplicationMode()
        ? urlJoin(EXAMPLE_MAIN_URL, `/api/product/${companyId}/products`)
        : urlJoin(EXAMPLE_MAIN_URL, "/api/product");

      const { data } = await axios.get(apiUrl, {
        headers: { "x-company-id": companyId },
        withCredentials: true,
      });
      console.log("pro", data);
      setProducts(data.items || []);
    } catch (e) {
      console.error("Error fetching products:", e);
      const errorMessage =
        e.response?.data?.message || e.message || "Failed to fetch products";
      setProductError(errorMessage);
      setProducts([]);
    } finally {
      setIsLoadingProducts(false);
    }
  }, [companyId, isApplicationMode]);

  const fetchSalesChannels = useCallback(async () => {
    if (!companyId) {
      setSalesChannels([]);
      return;
    }
    setIsLoadingSalesChannels(true);
    setSalesChannelsError(null);
    try {
      const apiUrl = urlJoin(EXAMPLE_MAIN_URL, "/api/sales-channels/ids");
      const { data } = await axios.get(apiUrl, {
        headers: {
          "x-company-id": companyId,
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });
      setSalesChannels(data || []);
    } catch (e) {
      console.error("Error fetching sales channels:", e);
      const errorMessage =
        e.response?.data?.message ||
        e.message ||
        "Failed to fetch sales channels";
      setSalesChannelsError(errorMessage);
      setSalesChannels([]);
    } finally {
      setIsLoadingSalesChannels(false);
    }
  }, [companyId]);

  const fetchBundles = useCallback(async () => {
    if (!companyId) {
      setBundles([]);
      return;
    }

    setIsLoadingBundles(true);
    setBundleError(null);
    try {
      const bundleApiUrl = urlJoin(
        EXAMPLE_MAIN_URL,
        `/api/bundle/application/${companyId}`
      );

      const { data } = await axios.get(bundleApiUrl, {
        headers: {
          "x-company-id": companyId,
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });

      setBundles(data.items || []);
    } catch (e) {
      console.error("Error fetching platform bundles:", {
        message: e.message,
        response: e.response?.data,
        status: e.response?.status,
      });
      const errorMessage =
        e.response?.data?.message ||
        e.message ||
        "Failed to fetch platform bundles";
      setBundleError(errorMessage);
      setBundles([]);
    } finally {
      setIsLoadingBundles(false);
    }
  }, [companyId]);
  ////////////////////////////

  useEffect(() => {
    const currentCompanyId = params.company_id;

    const getFyndApplicationId = () => {
      if (window.FyndPlatform?.config?.applicationId) {
        return window.FyndPlatform.config.applicationId;
      }
      if (window.__FYND_CONFIG__?.applicationId) {
        return window.__FYND_CONFIG__.applicationId;
      }
      if (window.APPLICATION_ID) {
        return window.APPLICATION_ID;
      }
      return null;
    };

    const currentApplicationId =
      params.application_id || params.app_id || getFyndApplicationId() || "";

    if (currentCompanyId) setCompanyId(currentCompanyId);
    if (currentApplicationId) setApplicationId(currentApplicationId);

    if (!currentCompanyId) {
      setCompanyId(null);
      setProducts([]);
      setBundles([]);
      setSalesChannels([]);
      setSalesChannelProducts({});
    }
  }, [params.company_id, params.application_id, params.app_id]);

  //////////////////////////////////

  useEffect(() => {
    if (companyId) {
      fetchProducts();
      fetchSalesChannels();
      if (applicationId) {
        fetchBundles();
      } else {
        setBundles([]);
      }
    } else {
      setProducts([]);
      setSalesChannels([]);
      setSalesChannelProducts({});
      setBundles([]);
    }
  }, [
    companyId,
    applicationId,
    fetchProducts,
    fetchSalesChannels,
    fetchBundles,
  ]);

  const fetchSalesChannelProducts = useCallback(
    async (channelId) => {
      if (!companyId || !channelId) {
        return;
      }
      setIsLoadingSalesChannelProducts((prev) => ({
        ...prev,
        [channelId]: true,
      }));
      setSalesChannelProductsError((prev) => ({
        ...prev,
        [channelId]: null,
      }));
      try {
        const apiUrl = urlJoin(
          EXAMPLE_MAIN_URL,
          `/api/sales-channels/${channelId}/products`
        );
        const { data } = await axios.get(apiUrl, {
          headers: {
            "x-company-id": companyId,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        });
        setSalesChannelProducts((prev) => ({
          ...prev,
          [channelId]: data.items || [],
        }));
      } catch (e) {
        console.error(`Error fetching products for channel ${channelId}:`, e);
        const errorMessage =
          e.response?.data?.message ||
          e.message ||
          "Failed to fetch channel products";
        setSalesChannelProductsError((prev) => ({
          ...prev,
          [channelId]: errorMessage,
        }));
        setSalesChannelProducts((prev) => ({
          ...prev,
          [channelId]: [],
        }));
      } finally {
        setIsLoadingSalesChannelProducts((prev) => ({
          ...prev,
          [channelId]: false,
        }));
      }
    },
    [companyId]
  );

  const triggerAIBundleGeneration = useCallback(
    async (aiGenParams) => {
      if (!companyId) throw new Error("Company ID not available");

      const apiUrl = urlJoin(
        EXAMPLE_MAIN_URL,
        `/api/bundle/application/generate_bundles`
      );

      setIsLoadingBundles(true);
      setBundleError(null);
      try {
        const productIds =
          aiGenParams.selectedProductsData?.flatMap((cat) =>
            cat.products.map((p) => p.id)
          ) || [];

        if (productIds.length === 0) {
          setBundleError("No products selected for AI bundle generation.");
          setIsLoadingBundles(false);
          return [];
        }

        const payload = {
          productIds: productIds,
          company_id: companyId,
          prompt: aiGenParams.customPrompt,
        };

        console.log("Sending AI bundle generation request:", payload);

        const response = await axios.post(apiUrl, payload, {
          headers: {
            "x-company-id": companyId,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        });

        console.log("AI bundle generation response:", response.data);

        const resultProductSet = response.data.data;

        if (!resultProductSet || Object.keys(resultProductSet).length === 0) {
          console.log("AI Generation: No bundles returned from backend.");
          setBundleError(
            "AI could not generate bundles with the selected products."
          );
          return [];
        }

        const newAiBundles = Object.entries(resultProductSet)
          .map(([index, productsInBundle]) => {
            if (
              !Array.isArray(productsInBundle) ||
              productsInBundle.length < 2
            ) {
              return null;
            }

            const totalPrice = productsInBundle.reduce((sum, p) => {
              const price =
                p.price?.effective?.max || p.price?.effective?.min || 0;
              return sum + price;
            }, 0);

            const validProducts = productsInBundle.filter((p) => p && p.uid);
            if (validProducts.length !== productsInBundle.length) {
              console.warn(
                "Some products in AI suggestion are missing UID or are invalid",
                productsInBundle
              );
              if (validProducts.length < 2) return null;
            }

            return {
              id: `bundle_ai_${Date.now()}_${index}`,
              name: `AI Suggested Bundle ${parseInt(index) + 1}`,
              description: `AI generated bundle with ${validProducts.length} products.`,
              type: "AI_SUGGESTION",
              products: validProducts,
              bundle_price: parseFloat((totalPrice * 0.9).toFixed(2)),
              is_active: false,
              created_date: new Date().toISOString(),
              image_url:
                validProducts[0]?.images?.[0]?.secure_url ||
                validProducts[0]?.images?.[0]?.url ||
                validProducts[0]?.media?.find((m) => m.type === "image")?.url ||
                null,
            };
          })
          .filter(Boolean);

        if (newAiBundles.length > 0) {
          console.log(
            `Successfully generated ${newAiBundles.length} AI bundle suggestions.`
          );
        } else {
          setBundleError(
            "AI suggestions found but did not meet minimum criteria or contained invalid products."
          );
        }
        return newAiBundles;
      } catch (e) {
        console.error("Error triggering AI bundle generation:", e);
        const errorMessage =
          e.response?.data?.message ||
          e.message ||
          "Failed to generate AI bundle";
        setBundleError(errorMessage);
        throw e;
      } finally {
        setIsLoadingBundles(false);
      }
    },
    [companyId]
  );

  const saveAIGeneratedBundles = useCallback(
    async (payload) => {
      if (!companyId) {
        throw new Error(
          "Company ID or Application ID is missing for saving bundles."
        );
      }

      setBundleError(null);

      try {
        const apiUrl = urlJoin(
          EXAMPLE_MAIN_URL,
          `/api/bundle/application/create_bundles`
        );

        console.log(
          "AppContext: Sending request to save AI bundles with payload:",
          payload
        );

        const response = await axios.post(apiUrl, payload, {
          headers: {
            "x-company-id": companyId,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        });

        console.log("AppContext: Save AI bundles response:", response.data);

        return response.data;
      } catch (e) {
        console.error("AppContext: Error saving AI-generated bundles:", e);
        const errorMessage =
          e.response?.data?.message ||
          e.message ||
          "Failed to save AI-generated bundles";
        setBundleError(errorMessage);
        throw e;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [companyId, fetchBundles]
  );

  const value = {
    products,
    isLoadingProducts,
    productError,
    fetchProducts,
    companyId,
    applicationId,
    isApplicationMode,

    bundles,
    isLoadingBundles,
    bundleError,
    fetchBundles,
    triggerAIBundleGeneration,
    saveAIGeneratedBundles,

    salesChannels,
    isLoadingSalesChannels,
    salesChannelsError,
    fetchSalesChannels,

    salesChannelProducts,
    isLoadingSalesChannelProducts,
    salesChannelProductsError,
    fetchSalesChannelProducts,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
