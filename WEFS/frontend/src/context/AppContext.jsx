/* eslint-disable react-hooks/exhaustive-deps */
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
const STORAGE_KEY = "selected_application_id";

// localStorage code
const getStoredApplicationId = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored;
  } catch (error) {
    console.warn("localStorage not available:", error);
    return null;
  }
};

const setStoredApplicationId = (appId) => {
  try {
    if (appId) {
      localStorage.setItem(STORAGE_KEY, appId);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (error) {
    console.warn("Failed to store application ID:", error);
  }
};

const clearStoredApplicationId = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn("Failed to clear stored application ID:", error);
  }
};

export const AppProvider = ({ children }) => {
  const [products, setProducts] = useState({ items: [], page: {} });
  const [allProducts, setAllProducts] = useState({ items: [], page: {} });
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [productError, setProductError] = useState(null);

  const [companyId, setCompanyId] = useState(null);
  const [applicationId, setApplicationId] = useState(null);

  const [bundles, setBundles] = useState([]);
  const [isLoadingBundles, setIsLoadingBundles] = useState(false);
  const [bundleError, setBundleError] = useState(null);
  const [isUpdatingBundle, setIsUpdatingBundle] = useState(false);

  const [salesChannels, setSalesChannels] = useState([]);
  const [isLoadingSalesChannels, setIsLoadingSalesChannels] = useState(false);
  const [salesChannelsError, setSalesChannelsError] = useState(null);

  const [isGeneratingAiContent, setIsGeneratingAiContent] = useState(false);
  const [aiContentError, setAiContentError] = useState(null);

  const [companyInfo, setCompanyInfo] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [analyticsError, setAnalyticsError] = useState(null);

  const [bundleOpportunities, setBundleOpportunities] = useState([]);
  const [isLoadingOpportunities, setIsLoadingOpportunities] = useState(false);
  const [opportunityError, setOpportunityError] = useState(null);

  const params = useParams();

  const isApplicationMode = useCallback(() => !!applicationId, [applicationId]);

  const [productPagination, setProductPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
    hasMore: false,
  });

  const [bundlePagination, setBundlePagination] = useState({
    currentPage: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
    hasMore: false,
  });

  useEffect(() => {
    const currentCompanyId = params.company_id;

    if (currentCompanyId) {
      setCompanyId(currentCompanyId);
    } else {
      setCompanyId(null);
      setApplicationId(null);
      setProducts({ items: [], page: {} });
      setAllProducts({ items: [], page: {} });
      setBundles([]);
      setSalesChannels([]);
      setCompanyInfo(null);
      setProductPagination({
        currentPage: 1,
        pageSize: 10,
        totalItems: 0,
        totalPages: 0,
        hasMore: false,
      });
      setBundlePagination({
        currentPage: 1,
        pageSize: 10,
        totalItems: 0,
        totalPages: 0,
        hasMore: false,
      });
    }
  }, [params.company_id]);

  const fetchProducts = useCallback(
    async (page = 1, limit = 10, append = false, searchText = "") => {
      if (!companyId) {
        if (!append) setProducts({ items: [], page: {} });
        setProductPagination({
          currentPage: 1,
          pageSize: limit,
          totalItems: 0,
          totalPages: 0,
          hasMore: false,
        });
        return;
      }

      setIsLoadingProducts(true);
      setProductError(null);

      try {
        const apiUrl = urlJoin(EXAMPLE_MAIN_URL, "/api/product/products");
        const payload = {
          company_id: companyId,
          application_id: applicationId,
          pageNo: page,
          pageSize: limit,
        };

        if (searchText?.trim()) payload.searchText = searchText.trim();

        const { data } = await axios.post(apiUrl, payload, {
          headers: { "x-company-id": companyId },
          withCredentials: true,
        });

        const responseItems = data?.data?.items || [];
        const paginationData = data?.data?.page || {};

        setProducts((prevState) => ({
          items: append
            ? [...prevState.items, ...responseItems]
            : responseItems,
          page: paginationData,
        }));

        const totalItems = paginationData.item_total || 0;
        setProductPagination({
          currentPage: paginationData.current || page,
          pageSize: limit,
          totalItems: totalItems,
          totalPages:
            paginationData.page_total ||
            (totalItems > 0 ? Math.ceil(totalItems / limit) : 0),
          hasMore: paginationData.has_next || false,
        });
      } catch (e) {
        console.error("Error fetching products:", e);
        setProductError(e);
        if (!append) {
          setProducts({ items: [], page: {} });
          setProductPagination({
            currentPage: 1,
            pageSize: limit,
            totalItems: 0,
            totalPages: 0,
            hasMore: false,
          });
        }
      } finally {
        setIsLoadingProducts(false);
      }
    },
    [applicationId, companyId]
  );

  const fetchAllProducts = useCallback(
    async (page = 1, limit = 10, append = false, searchText = "") => {
      if (!companyId) {
        if (!append) setAllProducts({ items: [], page: {} });
        setProductPagination({
          currentPage: 1,
          pageSize: limit,
          totalItems: 0,
          totalPages: 0,
          hasMore: false,
        });
        return;
      }

      setIsLoadingProducts(true);
      setProductError(null);

      try {
        const apiUrl = urlJoin(EXAMPLE_MAIN_URL, "/api/product/products");
        const payload = {
          company_id: companyId,
          pageNo: page,
          pageSize: limit,
        };

        if (searchText?.trim()) payload.searchText = searchText.trim();

        const { data } = await axios.post(apiUrl, payload, {
          headers: { "x-company-id": companyId },
          withCredentials: true,
        });

        const responseItems = data?.data?.items || [];
        const paginationData = data?.data?.page || {};

        setAllProducts((prevState) => ({
          items: append
            ? [...prevState.items, ...responseItems]
            : responseItems,
          page: paginationData,
        }));

        const totalItems = paginationData.item_total || 0;
        setProductPagination({
          currentPage: paginationData.current || page,
          pageSize: limit,
          totalItems: totalItems,
          totalPages:
            paginationData.page_total ||
            (totalItems > 0 ? Math.ceil(totalItems / limit) : 0),
          hasMore: paginationData.has_next || false,
        });
      } catch (e) {
        console.error("Error fetching all products:", e);
        setProductError(e.response?.data || e.message);
        if (!append) {
          setAllProducts({ items: [], page: {} });
          setProductPagination({
            currentPage: 1,
            pageSize: limit,
            totalItems: 0,
            totalPages: 0,
            hasMore: false,
          });
        }
      } finally {
        setIsLoadingProducts(false);
      }
    },
    [companyId]
  );

  const fetchProductsWithContext = useCallback(
    (page = 1, limit = 10, append = false, searchText = "", category = "") => {
      if (applicationId) {
        return fetchProducts(page, limit, append, searchText, category);
      } else {
        return fetchAllProducts(page, limit, append, searchText, category);
      }
    },
    [applicationId, fetchProducts, fetchAllProducts]
  );

  const fetchSalesChannels = useCallback(async () => {
    if (!companyId) return;
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
      const salesChannelsData = data?.data || data || [];
      setSalesChannels(salesChannelsData);

      const storedAppId = getStoredApplicationId();
      const currentAppExists = salesChannelsData.some(
        (channel) => channel.id === applicationId
      );
      const storedAppExists = storedAppId
        ? salesChannelsData.some((channel) => channel.id === storedAppId)
        : false;

      if (applicationId && !currentAppExists) {
        if (storedAppExists) {
          setApplicationId(storedAppId);
        } else {
          setApplicationId(null);
          clearStoredApplicationId();
        }
      } else if (!applicationId && storedAppExists) {
        setApplicationId(storedAppId);
      }
    } catch (e) {
      console.error("Error fetching sales channels:", e);
      setSalesChannelsError(
        e.response?.data?.message ||
          e.message ||
          "Failed to fetch sales channels"
      );
      setSalesChannels([]);
    } finally {
      setIsLoadingSalesChannels(false);
    }
  }, [companyId, applicationId]);

  const getCompanyInfo = useCallback(async () => {
    if (!companyId) {
      console.warn("Company ID is not set, cannot fetch company info.");
      setCompanyInfo(null);
      return;
    }
    try {
      const apiUrl = urlJoin(EXAMPLE_MAIN_URL, `/api/company/info`);
      const response = await axios.post(
        apiUrl,
        { company_id: companyId },
        {
          headers: {
            "x-company-id": companyId,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );
      setCompanyInfo(response.data?.data || null);
    } catch (e) {
      console.error("Error fetching company info:", e);
      setCompanyInfo(null);
    }
  }, [companyId]);

  const fetchBundles = useCallback(
    async (page = 1, pageSize = 5, append = false, searchText = "") => {
      if (!companyId) {
        setBundles([]);
        setBundlePagination({
          currentPage: 1,
          pageSize: 10,
          totalItems: 0,
          totalPages: 0,
          hasMore: false,
        });
        return;
      }

      setIsLoadingBundles(true);
      setBundleError(null);

      try {
        const apiUrl = urlJoin(EXAMPLE_MAIN_URL, `/api/bundle/bundles`);
        const payload = {
          company_id: companyId,
          pageNo: page,
          pageSize: pageSize,
          searchText: searchText.trim(),
        };

        const { data } = await axios.post(apiUrl, payload, {
          headers: {
            "x-company-id": companyId,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        });

        const newBundles = data?.data?.items || [];
        const pagination = data?.data?.page || {};

        setBundles((prevBundles) =>
          append ? [...prevBundles, ...newBundles] : newBundles
        );

        setBundlePagination({
          currentPage: pagination.current || page,
          pageSize: pagination.size || pageSize,
          totalItems: pagination.item_total || 0,
          totalPages: pagination.page_total || 0,
          hasMore: pagination.has_next || false,
        });
      } catch (e) {
        console.error("Error fetching bundles:", e);
        setBundleError(
          e.response?.data?.message ||
            e.message ||
            "Failed to fetch platform bundles"
        );
        if (!append) setBundles([]);
      } finally {
        setIsLoadingBundles(false);
      }
    },
    [companyId]
  );

  useEffect(() => {
    if (companyId) {
      getCompanyInfo();
      fetchSalesChannels();
      fetchAnalytics();
    } else {
      setProducts({ items: [], page: {} });
      setAllProducts({ items: [], page: {} });
      setSalesChannels([]);
      setBundles([]);
      setCompanyInfo(null);
      setProductPagination({
        currentPage: 1,
        pageSize: 10,
        totalItems: 0,
        totalPages: 0,
        hasMore: false,
      });
      setBundlePagination({
        currentPage: 1,
        pageSize: 10,
        totalItems: 0,
        totalPages: 0,
        hasMore: false,
      });
      setApplicationId(null);
      clearStoredApplicationId();
    }
  }, [companyId, getCompanyInfo, fetchSalesChannels]);

  useEffect(() => {
    if (companyId) {
      fetchProductsWithContext(1, productPagination.pageSize, false, "", "");
    }
  }, [
    companyId,
    applicationId,
    fetchProductsWithContext,
    productPagination.pageSize,
  ]);

  const triggerAIBundleGeneration = useCallback(
    async (aiGenParams) => {
      if (!companyId) throw new Error("Company ID not available");
      const apiUrl = urlJoin(EXAMPLE_MAIN_URL, `/api/bundle/generate_bundles`);
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
        const response = await axios.post(apiUrl, payload, {
          headers: {
            "x-company-id": companyId,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        });
        const resultProductSet = response.data.data;
        if (!resultProductSet || Object.keys(resultProductSet).length === 0) {
          // setBundleError(
          //   "AI could not generate bundles with the selected products."
          // );
          return [];
        }
        const newAiBundles = Object.entries(resultProductSet)
          .map(([index, productsInBundle]) => {
            if (!Array.isArray(productsInBundle) || productsInBundle.length < 2)
              return null;
            const totalPrice = productsInBundle.reduce(
              (sum, p) =>
                sum + (p.price?.effective?.max || p.price?.effective?.min || 0),
              0
            );
            const validProducts = productsInBundle.filter((p) => p && p.uid);
            if (
              validProducts.length !== productsInBundle.length &&
              validProducts.length < 2
            )
              return null;
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
        if (newAiBundles.length === 0)
          setBundleError(
            "AI suggestions found but did not meet minimum criteria or contained invalid products."
          );
        return newAiBundles;
      } catch (e) {
        setBundleError(
          e.response?.data?.message ||
            e.message ||
            "Failed to generate AI bundle"
        );
        throw e;
      } finally {
        setIsLoadingBundles(false);
      }
    },
    [companyId]
  );

  const saveAIGeneratedBundles = useCallback(
    async (payload) => {
      if (!companyId)
        throw new Error("Company ID is missing for saving bundles.");
      setBundleError(null);
      try {
        const apiUrl = urlJoin(EXAMPLE_MAIN_URL, `/api/bundle/create_bundles`);
        const response = await axios.post(apiUrl, payload, {
          headers: {
            "x-company-id": companyId,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        });
        fetchBundles(1, bundlePagination.pageSize, false);
        return response.data;
      } catch (e) {
        setBundleError(
          e.response?.data?.message ||
            e.message ||
            "Failed to save AI-generated bundles"
        );
        throw e;
      }
    },
    [companyId, fetchBundles, bundlePagination.pageSize]
  );

  const generateBundleTitleAndImage = useCallback(
    async (bundleId, imagePrompt = "") => {
      if (!companyId || !bundleId) {
        setAiContentError("Company ID or Bundle ID is missing.");
        return null;
      }
      setIsGeneratingAiContent(true);
      setAiContentError(null);
      try {
        const config = {
          headers: {
            "x-company-id": companyId,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        };
        const [titleResponse, imageResponse] = await Promise.all([
          axios.post(
            urlJoin(EXAMPLE_MAIN_URL, "/api/bundle/generate_name"),
            { company_id: companyId, bundleId },
            config
          ),
          axios.post(
            urlJoin(EXAMPLE_MAIN_URL, "/api/bundle/generate_image"),
            { company_id: companyId, bundleId, additionalPrompt: imagePrompt },
            config
          ),
        ]);
        if (titleResponse.data.success && imageResponse.data.success) {
          return {
            logoUrl: `data:image/png;base64,${imageResponse.data.data}`,
            titleText: titleResponse.data.data,
          };
        } else {
          setAiContentError(
            (titleResponse.data && titleResponse.data.message) ||
              (imageResponse.data && imageResponse.data.message) ||
              "Failed to generate content."
          );
          return null;
        }
      } catch (error) {
        setAiContentError(
          error.response?.data?.message ||
            error.message ||
            "Failed to generate AI content. Please try again."
        );
        return null;
      } finally {
        setIsGeneratingAiContent(false);
      }
    },
    [companyId]
  );

  const updateBundleDetails = useCallback(
    async (bundleId, { name, imageBase64 }) => {
      if (!companyId || !bundleId) {
        const msg = "Company ID or Bundle ID is missing for update.";
        setBundleError(msg);
        throw new Error(msg);
      }
      if (!name && !imageBase64) {
        const msg = "Bundle name or image is missing for update.";
        setBundleError(msg);
        throw new Error(msg);
      }
      setIsUpdatingBundle(true);
      setBundleError(null);
      try {
        const apiUrl = urlJoin(EXAMPLE_MAIN_URL, "/api/bundle/update_bundle");
        const payload = {
          company_id: companyId,
          bundleId: bundleId,
        };
        if (name) payload.name = name;
        if (imageBase64) payload.imageBase64 = imageBase64;

        const response = await axios.put(apiUrl, payload, {
          headers: {
            "x-company-id": companyId,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        });
        if (response.data && response.data.success) {
          fetchBundles(1, bundlePagination.pageSize, false);
          return response.data;
        } else {
          const msg =
            response.data?.message || "Failed to update bundle details.";
          setBundleError(msg);
          throw new Error(msg);
        }
      } catch (error) {
        setBundleError(
          error.response?.data?.message ||
            error.message ||
            "An error occurred while updating the bundle."
        );
        throw error;
      } finally {
        setIsUpdatingBundle(false);
      }
    },
    [companyId, fetchBundles, bundlePagination.pageSize]
  );

  const getSelectedApplicationName = useCallback(() => {
    if (!applicationId) return "Company";
    const channel = salesChannels.find(
      (channel) => channel.id === applicationId
    );
    return channel ? channel.name : "Application";
  }, [applicationId, salesChannels]);

  const changeApplication = useCallback(
    (appId) => {
      const newAppId = appId === applicationId ? null : appId;
      setApplicationId(newAppId);

      if (newAppId) {
        setStoredApplicationId(newAppId);
      } else {
        clearStoredApplicationId();
      }

      setProducts({ items: [], page: {} });
      setAllProducts({ items: [], page: {} });
      setProductPagination({
        currentPage: 1,
        pageSize: 10,
        totalItems: 0,
        totalPages: 0,
        hasMore: false,
      });

      if (!newAppId) {
        setBundles([]);
      }

      try {
        const newUrl = newAppId
          ? `/company/${companyId}/application/${newAppId}`
          : `/company/${companyId}`;
        window.history.replaceState(null, "", newUrl);
      } catch (error) {
        console.warn("Failed to update URL:", error);
      }
    },
    [companyId, applicationId]
  );

  const loadMoreProducts = useCallback(() => {
    if (productPagination.hasMore && !isLoadingProducts) {
      const nextPage = productPagination.currentPage + 1;
      const currentSize = productPagination.pageSize;

      console.warn("AppContext.loadMoreProducts called.");
      if (applicationId) {
        fetchProducts(nextPage, currentSize, true);
      } else {
        fetchAllProducts(nextPage, currentSize, true);
      }
    }
  }, [
    productPagination,
    isLoadingProducts,
    applicationId,
    fetchProducts,
    fetchAllProducts,
  ]);

  const loadMoreBundles = useCallback(() => {
    if (bundlePagination.hasMore && !isLoadingBundles) {
      fetchBundles(
        bundlePagination.currentPage + 1,
        bundlePagination.pageSize,
        true
      );
    }
  }, [bundlePagination, isLoadingBundles, fetchBundles]);

  const resetProducts = useCallback(() => {
    setProductPagination({
      currentPage: 1,
      pageSize: 10,
      totalItems: 0,
      totalPages: 0,
      hasMore: false,
    });
    console.warn(
      "AppContext.resetProducts called. Ensure correct search/category filters are implied or passed from calling component."
    );
    if (applicationId) {
      fetchProducts(1, 10, false, "", "");
    } else {
      fetchAllProducts(1, 10, false, "", "");
    }
  }, [fetchProducts, fetchAllProducts, applicationId]);

  const resetBundles = useCallback(() => {
    setBundlePagination({
      currentPage: 1,
      pageSize: 10,
      totalItems: 0,
      totalPages: 0,
      hasMore: false,
    });
    fetchBundles(1, 10, false);
  }, [fetchBundles]);

  const fetchAllProductsRecursively = useCallback(
    async (appSpecific = true) => {
      const setProductState = appSpecific ? setProducts : setAllProducts;

      let currentPage = 1;
      let hasMore = true;
      let accumulatedProducts = [];

      setIsLoadingProducts(true);
      setProductError(null);

      while (hasMore) {
        try {
          const apiUrl = urlJoin(EXAMPLE_MAIN_URL, "/api/product/products");
          const payload =
            appSpecific && applicationId
              ? {
                  company_id: companyId,
                  application_id: applicationId,
                  pageNo: currentPage,
                  pageSize: 50,
                }
              : { company_id: companyId, pageNo: currentPage, pageSize: 50 };

          const { data } = await axios.post(apiUrl, payload, {
            headers: { "x-company-id": companyId },
            withCredentials: true,
          });

          const responseItems = data?.data?.items || data?.data || [];
          const paginationData = data?.data?.page || {};

          accumulatedProducts = [...accumulatedProducts, ...responseItems];
          hasMore = paginationData.has_next || false;
          currentPage++;
        } catch (e) {
          console.error(
            `Error fetching all products recursively (${
              appSpecific ? "application" : "company"
            }):`,
            e
          );
          setProductError(e);
          hasMore = false;
        }
      }

      setProductState({
        items: accumulatedProducts,
        page: {
          current: currentPage - 1,
          size: 50,
          item_total: accumulatedProducts.length,
          has_next: false,
        },
      });
      setIsLoadingProducts(false);
    },
    [
      applicationId,
      companyId,
      setProducts,
      setAllProducts,
      setIsLoadingProducts,
      setProductError,
    ]
  );

  const triggerAIPromptGeneration = useCallback(
    async (selectedProductsData) => {
      if (!companyId) throw new Error("Company ID not available");
      const apiUrl = urlJoin(
        EXAMPLE_MAIN_URL,
        `/api/bundle/prompt_suggestions`
      );

      const productIds = selectedProductsData.flatMap((cat) =>
        cat.products.map((p) => p.id)
      );
      if (productIds.length === 0) {
        console.warn("No products selected for prompt generation.");
        return [];
      }

      try {
        const payload = {
          productIds: productIds,
          company_id: companyId,
        };
        const response = await axios.post(apiUrl, payload, {
          headers: {
            "x-company-id": companyId,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        });
        return response.data.data;
      } catch (e) {
        console.error("Failed to fetch dynamic prompts:", e);
        return [];
      }
    },
    [companyId]
  );

  const fetchAnalytics = useCallback(async () => {
    if (!companyId) {
      setAnalyticsData(null);
      return;
    }
    setIsLoadingAnalytics(true);
    setAnalyticsError(null);
    try {
      const apiUrl = urlJoin(EXAMPLE_MAIN_URL, "/api/company/analytics");
      const { data } = await axios.post(
        apiUrl,
        { company_id: companyId },
        {
          headers: { "x-company-id": companyId },
          withCredentials: true,
        }
      );

      if (data.success) {
        setAnalyticsData(data.data);
      }
    } catch (e) {
      console.error("Error fetching analytics:", e);

      if (e.response && e.response.status === 404) {
        setAnalyticsData([]);
      } else {
        setAnalyticsError(e.response?.data?.message || e.message);
        setAnalyticsData(null);
      }
    } finally {
      setIsLoadingAnalytics(false);
    }
  }, [companyId]);

  const generateBundleOpportunities = useCallback(async () => {
    if (!companyId) {
      setOpportunityError("Company ID is missing.");
      return;
    }
    setIsLoadingOpportunities(true);
    setOpportunityError(null);
    try {
      const apiUrl = urlJoin(
        EXAMPLE_MAIN_URL,
        "/api/bundle/generate-opportunities"
      );
      const response = await axios.post(
        apiUrl,
        { company_id: companyId },
        {
          headers: { "x-company-id": companyId },
          withCredentials: true,
        }
      );
      if (response.data.success) {
        setBundleOpportunities(response.data.data);
      } else {
        throw new Error(response.data.message || "Failed to get suggestions.");
      }
    } catch (e) {
      console.error("Error generating opportunities:", e);
      setOpportunityError(
        e.response?.data?.message || e.message || "An error occurred."
      );
      setBundleOpportunities([]);
    } finally {
      setIsLoadingOpportunities(false);
    }
  }, [companyId]);

  const value = {
    products,
    allProducts,
    isLoadingProducts,
    productError,
    fetchProducts,
    fetchAllProducts,
    fetchProductsWithContext,
    companyId,
    applicationId,
    isApplicationMode,
    changeApplication,
    getSelectedApplicationName,

    bundles,
    isLoadingBundles,
    isUpdatingBundle,
    bundleError,
    fetchBundles,
    triggerAIBundleGeneration,
    saveAIGeneratedBundles,
    updateBundleDetails,
    triggerAIPromptGeneration,

    isGeneratingAiContent,
    aiContentError,
    generateBundleTitleAndImage,
    setAiContentError,
    setIsGeneratingAiContent,

    salesChannels,
    isLoadingSalesChannels,
    salesChannelsError,
    fetchSalesChannels,

    companyInfo,
    getCompanyInfo,
    productPagination,
    bundlePagination,
    loadMoreProducts,
    loadMoreBundles,
    resetProducts,
    resetBundles,

    fetchAllProductsRecursively,

    analyticsData,
    isLoadingAnalytics,
    analyticsError,
    fetchAnalytics,

    bundleOpportunities,
    isLoadingOpportunities,
    opportunityError,
    generateBundleOpportunities,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
