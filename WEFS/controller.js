const { freqCartModel } = require("./models/FreqCart");
const {
  generateImageUsingGemini,
  uploadBase64Image,
  runPipeline,
} = require("./utils");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { bundleWarehouseModel } = require("./models/bundleWarehouse");
const { default: axios } = require("axios");

async function getProducts(req, res, next) {
  try {
    const { platformClient } = req;
    const {
      company_id: companyId,
      application_id: applicationId,
      pageNo,
      pageSize,
      searchText,
    } = req.body;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "company_id is a required field",
      });
    }

    if (!pageNo || !pageSize) {
      return res.status(400).json({
        success: false,
        message: "pageNo and pageSize are required",
      });
    }

    const basePlatformOptions = {
      companyId: companyId,
    };

    if (searchText) {
      let itemsFromPlatform = [];
      let currentPage = 1;
      let hasMoreFromPlatform = true;
      const PLATFORM_FETCH_CHUNK_SIZE = 100;

      while (hasMoreFromPlatform) {
        const platformResponse = applicationId
          ? await platformClient
              .application(applicationId)
              .catalog.getAppProducts({
                ...basePlatformOptions,
                pageNo: currentPage,
                pageSize: PLATFORM_FETCH_CHUNK_SIZE,
              })
          : await platformClient.catalog.getProducts({
              ...basePlatformOptions,
              pageNo: currentPage,
              pageSize: PLATFORM_FETCH_CHUNK_SIZE,
            });

        if (
          platformResponse &&
          platformResponse.items &&
          platformResponse.items.length > 0
        ) {
          itemsFromPlatform.push(...platformResponse.items);
          hasMoreFromPlatform = platformResponse.page?.has_next || false;
          currentPage++;

          if (itemsFromPlatform.length >= 10000) {
            console.warn(
              "Safety break: Fetched over 10,000 items from platform client for search."
            );
            break;
          }
        } else {
          hasMoreFromPlatform = false;
        }
      }

      const lowerCaseSearchText = searchText.toLowerCase();
      const filteredProducts = itemsFromPlatform.filter(
        (product) =>
          product.name?.toLowerCase().includes(lowerCaseSearchText) ||
          product.description?.toLowerCase().includes(lowerCaseSearchText) ||
          product.short_description
            ?.toLowerCase()
            .includes(lowerCaseSearchText) ||
          product.category_name?.toLowerCase().includes(lowerCaseSearchText) ||
          product.category_slug?.toLowerCase().includes(lowerCaseSearchText)
      );

      const totalFilteredItems = filteredProducts.length;
      const totalPages = Math.ceil(totalFilteredItems / pageSize);

      const startIndex = (pageNo - 1) * pageSize;
      const paginatedItems = filteredProducts.slice(
        startIndex,
        startIndex + pageSize
      );

      return res.status(200).json({
        success: true,
        message: "Fetched and filtered products successfully",
        data: {
          items: paginatedItems,
          page: {
            current: pageNo,
            size: pageSize,
            item_total: totalFilteredItems,
            page_total: totalPages,
            has_next: pageNo < totalPages,
            has_previous: pageNo > 1,
          },
        },
      });
    } else {
      const platformResponse = applicationId
        ? await platformClient
            .application(applicationId)
            .catalog.getAppProducts({
              ...basePlatformOptions,
              pageNo: pageNo,
              pageSize: pageSize,
            })
        : await platformClient.catalog.getProducts({
            ...basePlatformOptions,
            pageNo: pageNo,
            pageSize: pageSize,
          });

      if (platformResponse && platformResponse.items) {
        return res.status(200).json({
          success: true,
          message: "Fetched products successfully",
          data: platformResponse,
        });
      } else {
        return res.status(200).json({
          success: true,
          message: "Fetched successfully but no products found",
          data: {
            items: [],
            page: {
              current: pageNo,
              size: pageSize,
              item_total: 0,
              page_total: 0,
              has_next: false,
              has_previous: false,
            },
          },
        });
      }
    }
  } catch (err) {
    console.error("Error in getProducts:", err);

    if (err.status_code === 204) {
      return res.status(200).json({
        success: true,
        message: "Fetched successfully but no products found",
        data: {
          items: [],
          page: {
            current: pageNo || 1,
            size: pageSize || 10,
            item_total: 0,
            page_total: 0,
            has_next: false,
            has_previous: false,
          },
        },
      });
    }

    return res.status(err.status_code || 500).json({
      success: false,
      message: err.message || "An error occurred while fetching products",
    });
  }
}

async function getApplicationIds(req, res, next) {
  try {
    const { platformClient } = req;
    const applicationsData =
      await platformClient.configuration.getApplications();

    let activeSalesChannels = [];
    if (applicationsData && applicationsData.items) {
      activeSalesChannels = applicationsData.items
        .filter((app) => app.is_active === true)
        .map((app) => ({
          id: app._id,
          name: app.name,
          logo: app.image || app.logo?.secure_url || app.logo?.url || null,
          domain:
            app.domain?.name ||
            (app.domains && app.domains.length > 0
              ? app.domains.find((d) => d.is_primary)?.name
              : null),
          channel_type: app.channel_type || "N/A",
        }));
    }

    if (activeSalesChannels.length === 0) {
      const response = {
        success: true,
        message: "Fetched successfull but no application id found",
      };

      return res.status(204).json(response);
    }

    const response = {
      success: true,
      message: "Fetched application ids successfully",
      data: activeSalesChannels,
    };

    return res.status(200).json(response);
  } catch (err) {
    const response = {
      success: false,
      message: err.message,
    };

    return res.status(err.status_code).json(response);
  }
}

async function getBundles(req, res, next) {
  try {
    const { platformClient } = req;
    const { company_id: companyId, pageNo, pageSize, searchText } = req.body;

    if (!companyId || !pageNo || !pageSize) {
      return res.status(400).json({
        success: false,
        message: "company_id, pageNo, and pageSize are required fields",
      });
    }

    const platformOptions = {
      companyId: companyId,
      pageNo: pageNo,
      pageSize: pageSize,
    };

    if (searchText && searchText.trim() !== "") {
      platformOptions.q = searchText.trim();
    }
    const data = await platformClient.catalog.getProductBundle(platformOptions);

    if (!data || !data.items || data.items.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Fetched successfully but no bundles found",
        data: {
          items: [],
          page: {
            current: pageNo,
            size: pageSize,
            item_total: 0,
            page_total: 0,
            has_next: false,
            has_previous: false,
          },
        },
      });
    }

    const response = {
      success: true,
      message: "Fetched bundles successfully",
      data: data,
    };

    return res.status(200).json(response);
  } catch (err) {
    console.error("Error in getBundles:", err);
    return res.status(err.status || err.code || 500).json({
      success: false,
      message: err.message || "An error occurred while fetching bundles",
    });
  }
}

async function generateBundles(req, res, next) {
  try {
    const { platformClient } = req;
    const { productIds, company_id, prompt: userPrompt } = req.body;

    if (!Array.isArray(productIds) || productIds.length == 0) {
      return res.json({ message: "productIds should be an non empty array" });
    }

    const response = await platformClient.catalog.getProducts({
      companyId: company_id,
      pageType: "number",
      itemIds: productIds,
      pageSize: productIds.length,
    });

    const processedData = await freqCartModel
      .find()
      .sort({ createdAt: -1 })
      .limit(1)
      .lean();

    const cleanedProductIds = await runPipeline(
      userPrompt,
      response.items,
      processedData
    );

    const frequentProductIds = cleanedProductIds.flatMap((prod) => prod);

    if (frequentProductIds.length === 0) {
      return res.json({
        success: true,
        message:
          "No relevant products found to create bundles based on the prompt.",
        data: {},
      });
    }

    const dataOfFrequentProducts = await platformClient.catalog.getProducts({
      companyId: company_id,
      pageType: "number",
      itemIds: frequentProductIds,
      pageSize: frequentProductIds.length,
    });

    const resultProductSet = {};

    for (let i = 0; i < cleanedProductIds.length; i++) {
      const currentSet = cleanedProductIds[i];

      if (currentSet.length >= 2 && currentSet.length <= 9) {
        const tempCart = currentSet
          .map((uid) =>
            dataOfFrequentProducts.items.find((item) => item.uid === uid)
          )
          .filter(Boolean);

        resultProductSet[i] = tempCart;
      }
    }

    return res.json({ success: true, data: resultProductSet });
  } catch (err) {
    next(err);
  }
}

async function createBundles(req, res, next) {
  try {
    // bundlesData should be array of product ids array
    const { platformClient } = req;
    const { bundlesData, company_id, additionalPrompt } = req.body;

    if (!company_id) {
      const response = {
        success: false,
        message: "Send company_id",
      };

      return res.status(400).json(response);
    }

    const isValidBundlesData =
      Array.isArray(bundlesData) &&
      bundlesData.length > 0 &&
      bundlesData.every(
        (bundle) =>
          Array.isArray(bundle) &&
          bundle.length > 0 &&
          bundle.every((item) => typeof item === "number")
      );

    if (!isValidBundlesData) {
      const response = {
        success: false,
        message: "bundlesData should be an array containing arrays of numbers",
      };

      return res.status(400).json(response);
    }

    const googleApi = process.env.GEMINI_API;
    const aiModelname = "gemini-1.5-flash";

    const notCreatedBundles = [];
    const genAI = new GoogleGenerativeAI(googleApi);

    const model = genAI.getGenerativeModel({
      model: aiModelname,
      systemInstruction:
        "You are an AI that names product bundles based on their components",
      // generationConfig: {
      temperature: 0.7,
      // responseMimeType: "application/json",
      // responseSchema: schema,
      // },
    });

    for (const bundle of bundlesData) {
      const productsForBundle = [];

      const response = await platformClient.catalog.getProducts({
        companyId: company_id,
        itemIds: bundle,
        pageSize: bundle.length,
      });

      let names = [];
      // let imageUrls = [];
      // let imagesContext = "";
      // let prevImgNo = 1;
      for (const product of response.items || []) {
        // const images = product.images || [];
        // const imagesToUse = images.slice(0, 3).map((ele) => ele.url);

        // if (imagesToUse.length > 0) {
        //   const start = prevImgNo;
        //   const end = prevImgNo + imagesToUse.length - 1;

        //   if (start === end) {
        //     imagesContext += `Image ${start}: ${product.name}\n`;
        //   } else {
        //     imagesContext += `Images ${start}–${end}: ${product.name}\n`;
        //   }
        //   prevImgNo = end + 1;
        // }

        // imageUrls.push(...imagesToUse);
        names.push({
          name: product.name,
          description: product.description,
        });
      }

      const prompt = `Given a list of individual product names, generate a short, concise, and descriptive **bundle name** that reflects the common purpose or category of the items.

      - Output **only the bundle name** as a single string.
      - Do **not** return explanations, extra text, or formatting.
      - Keep it relevant and marketable.

      Products: ${JSON.stringify(names)}`;

      const result = await model.generateContent(prompt);
      const resp = result.response;
      const text = resp.text();

      const bundleName = text
        .replace(/```json|```/g, "") // remove ```json blocks
        .replace(/\n/g, "") // remove newlines
        .trim();

      const bundleSlug =
        bundleName
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "") +
        "-" +
        Array.from({ length: 4 }, () =>
          String.fromCharCode(97 + Math.floor(Math.random() * 26))
        ).join("");

      // const imageResp = await generateImageUsingGemini(
      //   imageUrls,
      //   imagesContext,
      //   additionalPrompt
      // );

      // if (!imageResp.success) {
      //   return res.status(400).json(imageResp);
      // }

      for (let i = 0; i < bundle.length; i++) {
        productsForBundle.push({
          max_quantity: 1,
          min_quantity: 1,
          product_uid: bundle[i],
        });
      }

      // const logo = await uploadBase64Image(
      //   `data:image/png;base64,${imageResp.data.toString("base64")}`
      // );

      // TODO: Add more data by refering the docs page
      const dataForBundle = {
        companyId: company_id,
        body: {
          choice: "single",
          is_active: false,
          name: bundleName,
          products: productsForBundle,
          slug: bundleSlug,
          // logo: logo,
          page_visibility: ["pdp"],
        },
      };

      let isBundleCreated;
      let reason;

      try {
        isBundleCreated = await platformClient.catalog.createProductBundle(
          dataForBundle
        );

        await bundleWarehouseModel.updateOne(
          { companyId: company_id },
          {
            $push: {
              bundle: {
                bundleId: isBundleCreated._id,
                boughtCount: 0,
                aiGen: true,
              },
            },
          },
          { upsert: true }
        );
      } catch (error) {
        if (!isBundleCreated) {
          notCreatedBundles.push(dataForBundle);
          reason = error.message;
        }
      }
    }

    if (notCreatedBundles.length === 0) {
      const response = {
        success: true,
        message: "All bundles created successfully.",
      };

      return res.status(200).json(response);
    } else {
      const failedNames = notCreatedBundles.map((b) => b.name).join(", ");

      const response = {
        success: true,
        message: `Bundles created successfully except : ${failedNames}`,
      };

      return res.status(200).json(response);
    }
  } catch (error) {
    const response = {
      success: false,
      message: error.message || "An unexpected error occurred",
    };
    const statusCode = error.status_code || 500;
    return res.status(statusCode).json(response);
  }
}

async function generateName(req, res, next) {
  try {
    const { platformClient } = req;
    const { company_id: companyId, bundleId, oldName } = req.body;

    if (!companyId || !bundleId) {
      const response = {
        success: false,
        message: "Send company_id and bundleId",
      };

      return res.status(400).json(response);
    }

    const data = await platformClient.catalog.getProductBundleDetail({
      companyId: companyId,
      id: bundleId,
    });

    if (!data) {
      const response = {
        success: true,
        message: "Fetched successfull but no bundles found",
      };

      return res.status(204).json(response);
    }

    let names = [];
    //data.products[].product_details.name
    for (const product of data?.products || []) {
      const productDetails = product.product_details || {};
      const name = productDetails.name || "Unnamed Product";
      const description =
        productDetails.short_description || product.description || "";
      names.push({
        name: name,
        description: description,
      });
    }

    const googleApi = process.env.GEMINI_API;
    const aiModelname = "gemini-2.0-flash";

    const notCreatedBundles = [];
    const genAI = new GoogleGenerativeAI(googleApi);

    const model = genAI.getGenerativeModel({
      model: aiModelname,
      systemInstruction:
        "You are an AI that names product bundles based on their components",
      temperature: 0.7,
    });

    const prompt = `Given a list of individual product names, generate a short, concise, and descriptive **bundle name** that reflects the common purpose or category of the items.

- Output **only the bundle name** as a single string.
- Do **not** return explanations, extra text, or formatting.
- Keep it relevant and marketable.
- Focus on the value or outcome for the customer. [1]

**Examples:**

*   **Products:** ["Shampoo", "Conditioner", "Hair Mask"]
    **Bundle Name:** "Ultimate Hair Care Kit"

*   **Products:** ["Gaming Mouse", "Mechanical Keyboard", "Headset"]
    **Bundle Name:** "Pro Gamer's Setup"

*   **Products:** ["Red Wine", "Gourmet Cheeses", "Artisanal Crackers"]
    **Bundle Name:** "Gourmet Wine & Cheese Pairing"

**Products to bundle:** ${JSON.stringify(names)}
`;

    let finalPrompt = prompt;

    if (oldName) {
      const additionalPrompt = `Rename "${oldName}" with a better name under 40 characters. Return only the new name.`;
      finalPrompt += additionalPrompt;
    }

    const result = await model.generateContent(finalPrompt);
    const resp = result.response;
    const text = resp.text();

    const bundleName = text
      .replace(/```json|```/g, "") // remove ```json blocks
      .replace(/\n/g, "") // remove newlines
      .trim();

    if (!bundleName) {
      const response = {
        success: false,
        message: "Could not generate bundle title",
      };

      return res.status(400).json(response);
    }

    const response = {
      success: true,
      message: "Generated title successfully",
      data: bundleName,
    };

    return res.status(200).json(response);
  } catch (err) {
    console.error("Error in generateImage:", err);
    const response = {
      success: false,
      message: err.message || "An unexpected error occurred",
    };
    const statusCode = err.status_code || 500;
    return res.status(statusCode).json(response);
  }
}

async function generateImage(req, res, next) {
  try {
    const { platformClient } = req;
    const { company_id: companyId, bundleId, additionalPrompt } = req.body;

    if (!companyId || !bundleId) {
      const response = {
        success: false,
        message: "Send company_id and bundleId",
      };

      return res.status(400).json(response);
    }

    const data = await platformClient.catalog.getProductBundleDetail({
      companyId: companyId,
      id: bundleId,
    });

    if (!data) {
      const response = {
        success: true,
        message: "Fetched successfull but no bundles found",
      };

      return res.status(204).json(response);
    }
    let imageUrls = [];
    let imagesContext = "";
    let prevImgNo = 1;

    for (const product of data?.products || []) {
      const productDetails = product.product_details || {};
      const images = productDetails.images || [];
      const imagesToUse = images.slice(0, 3);

      if (imagesToUse.length > 0) {
        const start = prevImgNo;
        const end = prevImgNo + imagesToUse.length - 1;

        if (start === end) {
          imagesContext += `Image ${start}: ${productDetails.name}\n`;
        } else {
          imagesContext += `Images ${start}–${end}: ${productDetails.name}\n`;
        }
        prevImgNo = end + 1;
      }

      imageUrls.push(...imagesToUse);
    }
    const imageResp = await generateImageUsingGemini(
      imageUrls,
      imagesContext,
      additionalPrompt
    );

    if (!imageResp.success) {
      return res.status(400).json(imageResp);
    }

    const imageBase64 = imageResp.data.toString("base64");
    const response = {
      success: true,
      message: "Generated image successfully",
      data: imageBase64,
    };
    return res.status(200).json(response);
  } catch (err) {
    console.error("Error in generateImage:", err);
    const response = {
      success: false,
      message: err.message || "An unexpected error occurred",
    };
    const statusCode = err.status_code || 500;
    return res.status(statusCode).json(response);
  }
}

async function updateBundle(req, res, next) {
  try {
    const { platformClient } = req;
    const { company_id: companyId, bundleId, name, imageBase64 } = req.body;

    if (!companyId || !bundleId) {
      return res.status(400).json({
        success: false,
        message: "Send company_id and bundleId",
      });
    }

    if (!name && !imageBase64) {
      return res.status(400).json({
        success: false,
        message: "Send name or imageBase64 to update.",
      });
    }

    const existingBundle = await platformClient.catalog.getProductBundleDetail({
      companyId: companyId,
      id: bundleId,
    });

    if (!existingBundle) {
      return res.status(400).json({
        success: false,
        message: "Bundle does not exist",
      });
    }

    const productsForUpdate = existingBundle.products.map((p) => {
      const productItem = { ...p };
      delete productItem.product_details;
      return productItem;
    });

    const bodyForUpdate = {
      ...existingBundle,
      products: productsForUpdate,
    };

    if (name) {
      bodyForUpdate.name = name;
    }

    if (imageBase64) {
      const newLogoUrl = await uploadBase64Image(
        `data:image/png;base64,${imageBase64}`
      );
      bodyForUpdate.logo = newLogoUrl;
    }

    const data = await platformClient.catalog.updateProductBundle({
      companyId: companyId,
      id: bundleId,
      body: bodyForUpdate,
    });

    if (data) {
      return res.status(200).json({
        success: true,
        message: "Bundle updated successfully",
        data: data,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Could not update the bundle (no data returned)",
      });
    }
  } catch (err) {
    console.error("Error in updateBundle:", err);
    const response = {
      success: false,
      message: err.message || "An unexpected error occurred",
    };
    const statusCode = err.status_code || 500;
    return res.status(statusCode).json(response);
  }
}

async function getCompanyInfo(req, res, next) {
  try {
    const { platformClient } = req;
    const { company_id: companyId } = req.body;
    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "Send company_id",
      });
    }
    const response = await platformClient.companyProfile.cbsOnboardGet({
      companyId: companyId,
    });
    if (!response) {
      return res.status(404).json({
        success: false,
        message: "Company not found",
      });
    }

    const dataToSend = {
      companyId: response.uid || null,
      name: response.name || null,
      stage: response.stage || null,
    };

    return res.status(200).json({
      success: true,
      message: "Company info fetched successfully",
      data: dataToSend,
    });
  } catch (error) {
    console.error("Error in getCompanyInfo:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "An unexpected error occurred",
    });
  }
}

async function generatePromptSuggestions(req, res, next) {
  try {
    const { platformClient } = req;
    const { productIds, company_id } = req.body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "productIds must be a non-empty array",
      });
    }

    const productDetailsResponse = await platformClient.catalog.getProducts({
      companyId: company_id,
      itemIds: productIds,
      pageSize: productIds.length,
    });

    const products = productDetailsResponse.items.map((p) => ({
      name: p.name,
      category: p.category_slug || p.category || "Uncategorized",
    }));

    const googleApi = process.env.GEMINI_API;
    const genAI = new GoogleGenerativeAI(googleApi);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });
    const prompt = `
You are a creative marketing assistant for an e-commerce platform. Your goal is to generate short, catchy, and clickable prompts for creating product bundles.

Analyze the list of products provided below. Based on the products, generate 4 distinct and compelling bundle suggestions.

**CRITICAL RULES:**
1.  **Be Concise:** Each prompt must be short and punchy, ideally between 4 and 8 words.
2.  **Be Action-Oriented:** The prompts should inspire a user to create a bundle based on a theme, style, or occasion.
3.  **Focus on Themes:** Do not just list the product names. Find a common theme (e.g., "Morning Routine," "Workout Essentials," "Summer Style").
4.  **JSON Array Only:** Your entire output must be a single, valid JSON array containing exactly 4 strings. Do not add any introductory text, explanations, or markdown formatting like \`\`\`json.

**INPUT PRODUCTS:**
[
  { "name": "Men's Running Shorts", " },
  { "name": "Breathable Athletic T-Shirt", "category": "Apparel" },
  { "name": "Hydration Running Vest", "category": "Accessories" }
]

**YOUR OUTPUT:**
[
  "Create a 'Ready to Run' kit",
  "Build the ultimate marathon pack",
  "Design a high-performance running set",
  "Bundle your 'Workout Warrior' gear"
]

${JSON.stringify(products, null, 2)}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const suggestions = JSON.parse(responseText);

    res.status(200).json({
      success: true,
      message: "Successfully handled prompt suggestions.",
      data: suggestions,
    });
  } catch (err) {
    console.error("Error generating prompt suggestions:", err);
    res.status(500).json({
      success: false,
      message: "Failed to generate dynamic prompts due to an internal error.",
      data: [],
    });
  }
}

async function getAnalytics(req, res, next) {
  try {
    const { platformClient } = req;
    const { company_id: companyId } = req.body;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "company_id is a required field",
      });
    }

    const analysisData = await bundleWarehouseModel
      .find({ companyId, "bundle.aiGen": true })
      .lean();

    if (!analysisData || analysisData.length === 0) {
      return res.status(204).json({
        success: true,
        message: "No bundles found",
        data: [],
      });
    }

    const bundleIds = analysisData[0].bundle.map((bundleData) => {
      return bundleData.bundleId;
    });

    const bundles = await platformClient.catalog.getProductBundle({
      companyId,
      page_size: 100,
    });

    const usableBundles = bundles.items.filter((bundle) => {
      return bundleIds.includes(bundle.id) && bundle.is_active;
    });

    const dataToBeSent = usableBundles
      .map((bundle) => {
        const matchingBundleData = analysisData[0].bundle.find(
          (bundleData) => bundleData.bundleId === bundle.id
        );

        if (matchingBundleData) {
          return {
            bundle,
            boughtCount: matchingBundleData.boughtCount,
          };
        }

        return null;
      })
      .filter(Boolean);

    return res.status(200).json({
      success: true,
      message: "Bundles data",
      data: dataToBeSent,
    });
  } catch (err) {
    console.error("Error in getAnalytics:", err);
    return res.status(err.status_code || 500).json({
      success: false,
      message: err.message || "An error occurred while fetching analytics",
      data: [],
    });
  }
}

async function generateBundleOpportunities(req, res, next) {
  try {
    const { platformClient } = req;
    const { company_id, search_region = "IN", max_bundles = 3 } = req.body;

    const serperApiKey = process.env.SERPER_API_KEY;
    if (!serperApiKey) {
      return res.status(500).json({
        success: false,
        message: "Serper API key not configured",
      });
    }

    if (!company_id) {
      return res.status(400).json({
        success: false,
        message: "company_id is required",
      });
    }

    if (!process.env.GEMINI_API) {
      return res.status(500).json({
        success: false,
        message: "Gemini API key not configured",
      });
    }

    let allProducts = [];
    let currentPage = 1;
    let hasMore = true;
    let retryCount = 0;
    const maxRetries = 3;

    while (hasMore && retryCount < maxRetries) {
      try {
        const productResponse = await platformClient.catalog.getProducts({
          companyId: company_id,
          pageNo: currentPage,
          pageSize: 100,
        });

        if (productResponse?.items?.length > 0) {
          allProducts.push(...productResponse.items);
          hasMore = productResponse.page?.has_next || false;
          currentPage++;
          retryCount = 0;
        } else {
          hasMore = false;
        }
      } catch (productError) {
        retryCount++;
        console.warn(
          `Product fetch attempt ${retryCount} failed:`,
          productError.message
        );

        if (retryCount >= maxRetries) {
          throw new Error(
            `Failed to fetch products after ${maxRetries} attempts: ${productError.message}`
          );
        }

        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, retryCount) * 1000)
        );
      }
    }

    if (allProducts.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No products found for this company.",
      });
    }

    const productCategories = [
      ...new Set(
        allProducts
          .map((p) => p.category_slug || p.category)
          .filter(Boolean)
          .filter((cat) => typeof cat === "string" && cat.trim().length > 0)
      ),
    ];

    if (productCategories.length === 0) {
      console.warn("No valid categories found, using generic search");
    }

    let trendData = "";

    try {
      const currentYear = new Date().getFullYear();
      const searchQueries = [
        `e-commerce bundle trends ${currentYear}`,
        `product bundling strategies ${currentYear} retail`,
        productCategories.length > 0
          ? `${productCategories
              .slice(0, 2)
              .join(" ")} product bundles trending`
          : "retail bundle opportunities 2025",
      ];

      let allTrends = [];

      for (const query of searchQueries) {
        try {
          const searchConfig = {
            method: "post",
            url: "https://google.serper.dev/search",
            headers: {
              "X-API-KEY": serperApiKey,
              "Content-Type": "application/json",
            },
            data: JSON.stringify({
              q: query,
              num: 5,
              gl: search_region || "us",
            }),
            timeout: 8000,
          };

          const response = await axios.request(searchConfig);
          const searchData = response.data;

          if (searchData.organic && searchData.organic.length > 0) {
            const organicTrends = searchData.organic
              .slice(0, 3)
              .map((result) => result.snippet)
              .filter(Boolean)
              .join(" ");

            if (organicTrends) {
              allTrends.push(
                `Search insights for "${query}": ${organicTrends}`
              );
            }
          }

          if (searchData.peopleAlsoAsk && searchData.peopleAlsoAsk.length > 0) {
            const askTrends = searchData.peopleAlsoAsk
              .slice(0, 2)
              .map((ask) => `${ask.question}: ${ask.snippet}`)
              .filter(Boolean);

            allTrends.push(...askTrends);
          }

          if (
            searchData.relatedSearches &&
            searchData.relatedSearches.length > 0
          ) {
            const relatedTrends = searchData.relatedSearches
              .slice(0, 3)
              .map((related) => `Trending: ${related.query}`)
              .filter(Boolean);

            allTrends.push(...relatedTrends);
          }

          await new Promise((resolve) => setTimeout(resolve, 500));
        } catch (queryError) {
          console.warn(
            `Serper search query failed: ${query}`,
            queryError.message
          );
          continue;
        }
      }

      if (allTrends.length > 0) {
        trendData = allTrends
          .join("\n- ")
          .replace(/\s+/g, " ")
          .substring(0, 3000);
      } else {
        throw new Error("No search results found from Serper");
      }
    } catch (searchError) {
      console.warn(
        "Serper search failed, using fallback trends:",
        searchError.message
      );
      trendData = `
        - Sustainability Focus: Eco-friendly and sustainable product bundles are increasingly popular as consumers prioritize environmental responsibility.
        - Convenience Bundles: Ready-to-use product combinations that solve specific problems or complete tasks efficiently.
        - Personalization: Customizable bundles that allow customers to choose variations or add-ons based on their preferences.
        - Cross-Category Innovation: Unexpected product combinations that create new use cases and experiences.
        - Value Perception: Bundles that offer clear cost savings and perceived value compared to individual purchases.
        - Seasonal and Event-Based: Time-sensitive bundles tied to holidays, seasons, or trending events in ${new Date().getFullYear()}.
        - Health & Wellness: Self-care and wellness product combinations are driving higher engagement.
        - Work-from-Home: Remote work essentials bundled for productivity and comfort.
      `;
    }

    const validProducts = allProducts.filter(
      (p) =>
        p.uid &&
        p.name &&
        typeof p.name === "string" &&
        p.name.trim().length > 0
    );

    if (validProducts.length < 2) {
      return res.status(400).json({
        success: false,
        message:
          "Insufficient valid products to create bundles (minimum 2 required).",
      });
    }

    const productInfoForPrompt = validProducts.map((p) => ({
      uid: p.uid,
      name: (p.name || "").trim(),
      category: p.category_slug || p.category || "uncategorized",
      short_description: (p.short_description || "").trim(),
      price: p.price || null,
      availability: p.availability || "unknown",
    }));

    let suggestions = [];
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API);
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      });

      const prompt = `
        You are an expert e-commerce strategist analyzing product bundling opportunities.

        CURRENT MARKET TRENDS:
        ${trendData}

        AVAILABLE PRODUCTS:
        ${JSON.stringify(productInfoForPrompt, null, 2)}

        INSTRUCTIONS:
        1. Generate exactly ${Math.min(
          max_bundles,
          5
        )} unique bundle opportunities
        2. Each bundle must include 2-4 products from the available list
        3. Ensure product UIDs exist in the provided list
        4. Focus on complementary products that create value together
        5. Consider the market trends when creating rationales

        OUTPUT FORMAT (valid JSON only):
        [
          {
            "bundleName": "Descriptive bundle name (max 50 characters)",
            "rationale": "Clear explanation of why this bundle is valuable based on trends and product synergy (max 200 characters)",
            "product_uids": [array of 2-4 product UIDs from the list],
            "estimated_appeal": "high|medium|low",
            "target_demographic": "Brief description of target customer"
          }
        ]

        Respond with only the JSON array, no other text.
      `;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      const cleanedText = responseText.replace(/```json\n?|\n?```/g, "").trim();

      suggestions = JSON.parse(cleanedText);
    } catch (aiError) {
      if (aiError instanceof SyntaxError) {
        console.error("AI returned invalid JSON:", aiError.message);
        throw new Error("AI service returned invalid response format");
      }
      throw aiError;
    }

    if (!suggestions || suggestions.length === 0) {
      return res.status(200).json({
        success: true,
        message:
          "No suitable bundle opportunities found based on current trends.",
        data: [],
      });
    }

    const enrichedSuggestions = suggestions
      .map((suggestion) => {
        try {
          const products =
            suggestion.product_uids
              ?.map((uid) => {
                const product = validProducts.find((p) => p.uid === uid);
                if (!product) {
                  console.warn(`Product with UID ${uid} not found`);
                }
                return product;
              })
              .filter(Boolean) || [];

          return {
            bundleName: suggestion.bundleName || "Unnamed Bundle",
            rationale: suggestion.rationale || "No rationale provided",
            estimated_appeal: suggestion.estimated_appeal || "medium",
            target_demographic:
              suggestion.target_demographic || "General consumers",
            products,
            product_count: products.length,
            created_at: new Date().toISOString(),
          };
        } catch (error) {
          console.warn("Error enriching suggestion:", error);
          return null;
        }
      })
      .filter(Boolean);

    const validBundles = enrichedSuggestions.filter(
      (bundle) =>
        bundle.products &&
        bundle.products.length >= 2 &&
        bundle.bundleName &&
        bundle.rationale
    );

    res.status(200).json({
      success: true,
      message: `Successfully generated ${validBundles.length} bundle opportunities.`,
      data: validBundles,
      metadata: {
        total_products_analyzed: validProducts.length,
        categories_found: productCategories.length,
        search_region: search_region,
        trends_source: "serper_ai",
      },
    });
  } catch (error) {
    console.error("Error generating bundle opportunities:", error);
    if (error.message.includes("API key")) {
      return res.status(500).json({
        success: false,
        message: "AI service configuration error.",
      });
    } else if (error.message.includes("products")) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Failed to generate bundle opportunities. Please try again.",
      });
    }
  }
}

module.exports = {
  getProducts,
  getBundles,
  getApplicationIds,
  generateBundles,
  createBundles,
  generateName,
  generateImage,
  updateBundle,
  getCompanyInfo,
  generatePromptSuggestions,
  getAnalytics,
  generateBundleOpportunities,
};
