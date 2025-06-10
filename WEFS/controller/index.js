const { freqCartModel } = require("../models/FreqCart");
const { cartWarehouseModel } = require("../models/CartWarehouse");
const {
  getKeywordsUsingAI,
  enrichProductsWithKeywords,
  generateImageUsingGemini,
  uploadBase64Image,
} = require("./utils");
const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");

async function getProducts(req, res, next) {
  try {
    const { platformClient } = req;
    const {
      company_id: companyId,
      application_id: applicationId,
      pageNo,
      pageSize,
      searchText,
      category,
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
      ...(category && { categoryIds: [category] }),
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

//TODO: Update and test this
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

    const productsData = [];

    for (const product of response.items) {
      productsData.push({
        name: product.name,
        description: product.description,
        id: product.uid,
      });
    }

    // Get processed data from mongodb
    const processedData = await freqCartModel
      .find()
      .sort({ createdAt: -1 })
      .limit(1)
      .lean();

    // const productsDataWithKeywords = await enrichProductsWithKeywords(
    //   productsData
    // );

    // Send the processed data and productsData to gemini with a prompt to take processed data as a pattern and use products to create a an array of arrays with each array being productId of the product

    const googleApi = process.env.GEMINI_API;
    const genAI = new GoogleGenerativeAI(googleApi);
    const schema = {
      type: SchemaType.ARRAY,
      description:
        "An array of arrays, where each inner array contains numeric product IDs",
      items: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.NUMBER,
          description: "A numeric product ID",
        },
      },
    };

    const prompt2 = `
          Products:
          ${JSON.stringify(productsData, null, 2)}

          User Prompt:
          "${userPrompt}"

          Follow these rules in sequence:

          1. **Identify correlation criteria →**
            a. Look at each product’s **name**, **description**, and any metadata (tags, category, price range).
            b. Two products “go together” if they share one or more strong signals:
                - Same category or complementary categories (e.g. “phone” + “phone case”)
                - Shared keywords in name/description (e.g. “leather” + “leather”)
                - Designed to be used together (e.g. “camera” + “tripod”)
                - From similar categories (e.g. "scarf" + "dress") clothes category

          2. **Build groups**
            a. Starting from the first product, find all other products that match at least one correlation criterion.
            b. Form a subarray of their **ids**.
            c. Make multiple bundles of size two and three. 
            d. **Only** include groups of size ≥ 2. Singletons should be omitted.

          3. **Respect the user’s intent**
            - If the userPrompt contains extra instructions (e.g. “only group by color” or “limit to size 3”), honor those constraints in your grouping logic.
            - If userPrompt is empty or general, use the default criteria in step 1.

            4. **Output format**
          - Return **only** a JSON array of arrays of IDs,
          - Do not send any text, conversations.
    `;

    // 5. **Output format**
    //   - Return **only** a JSON array of these ID‑arrays.
    //   - Do **not** include any extraneous text, code, or explanation.

    // const resp = await ai.models.generateContent({
    //   model: "gemini-1.5-flash",
    //   contents: prompt,
    //   config: {
    //     systemInstruction: "You are a data‐processing assistant.",
    //     temperature: 0,
    //   },
    // });

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: "You are a product categorization AI.",
      // generationConfig: {
      temperature: 0,
      responseMimeType: "application/json",
      responseSchema: schema,
      // },
    });
    const result = await model.generateContent(prompt2);
    const resp = result.response;
    const text = resp.text();
    // const cleanedProductIds = text
    //   .replace(/```json|```/g, "") // remove ```json blocks
    //   .replace(/\n/g, "") // remove newlines
    //   .trim();

    const cleanedProductIds = JSON.parse(
      text
        .replace(/```json|```/g, "") // remove ```json blocks
        .replace(/\n/g, "") // remove newlines
        .trim()
    );

    const frequentProductIds = cleanedProductIds.flatMap((prod) => prod);

    //TODO: If bundles already exists do not send it

    // Get the data of products and send it to frontend
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

    return res.json({ data: resultProductSet });
  } catch (err) {
    next(err);
  }
}

async function saveOrderToDb(
  event_name,
  request_body,
  company_id,
  application_id
) {
  try {
    // Clean the data(Get keywords) using data/ai and then save it to mongodb

    // request_body.payload.order.shipments[].bags[].item.name
    // request_body.payload.order.shipments[].bags[].item.id
    // request_body.payload.order.shipments[].bags[].item.images[]

    //Using just name of product for extracting keywords later will use images also

    let keywords = [];
    const cart = [];

    for (const shipment of request_body.payload.order.shipments) {
      for (const bag of shipment.bags) {
        const result = await getKeywordsUsingAI([bag.item.name]);

        if (result.length !== 0) {
          keywords.push(result);
          cart.push({
            name: bag.item.name,
            imageUrls: bag.item.images,
            itemId: bag.item.id,
          });
        }
      }
    }
    keywords = keywords.flatMap((keyword) => keyword);

    keywords = [...new Set(keywords)];

    if (keywords.length > 1) {
      const savedCart = await cartWarehouseModel.create({
        cart,
        keywords,
        companyId: company_id,
        applicationId: application_id,
      });
    }
  } catch (err) {
    console.log(err);
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
      let imageUrls = [];
      let imagesContext = "";
      let prevImgNo = 1;
      for (const product of response.items || []) {
        const images = product.images || [];
        const imagesToUse = images.slice(0, 3).map((ele) => ele.url);

        if (imagesToUse.length > 0) {
          const start = prevImgNo;
          const end = prevImgNo + imagesToUse.length - 1;

          if (start === end) {
            imagesContext += `Image ${start}: ${product.name}\n`;
          } else {
            imagesContext += `Images ${start}–${end}: ${product.name}\n`;
          }
          prevImgNo = end + 1;
        }

        imageUrls.push(...imagesToUse);
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

      const bundleSlug = bundleName
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

      const imageResp = await generateImageUsingGemini(
        imageUrls,
        imagesContext,
        additionalPrompt
      );

      if (!imageResp.success) {
        return res.status(400).json(imageResp);
      }

      for (let i = 0; i < bundle.length; i++) {
        productsForBundle.push({
          max_quantity: 1,
          min_quantity: 1,
          product_uid: bundle[i],
        });
      }

      const logo = await uploadBase64Image(
        `data:image/png;base64,${imageResp.data.toString("base64")}`
      );

      const dataForBundle = {
        companyId: company_id,
        body: {
          choice: "single",
          is_active: false,
          name: bundleName,
          products: productsForBundle,
          slug: bundleSlug,
          logo: logo,
        },
      };

      let isBundleCreated;
      let reason;

      try {
        isBundleCreated = await platformClient.catalog.createProductBundle(
          dataForBundle
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
        message: `Bundles created successfully except : ${failedNames} /n Reason : ${reason}`,
      };

      return res.status(200).json(response);
    }
  } catch (error) {
    const response = {
      success: false,
      message: err.message,
    };

    return res.status(err.status_code).json(response);
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
      category: p.category_slug,
      description: p.short_description || "",
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
      Based on the following list of selected products:
      ${JSON.stringify(products, null, 2)}

      Please generate 4 diverse and creative prompt suggestions for a user who wants to create a product bundle.
      The prompts should be short, easy to understand, and ready for a user to click on.

      Your entire output must be a single, valid JSON array of strings.
      Do not add any text before or after the JSON array.

      Example output: ["Create a complete summer look.", "Suggest accessories for these items.", "Build a professional office outfit."]
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const suggestions = JSON.parse(responseText);

    res.status(200).json({
      success: true,
      message: "Successfully generated prompt suggestions.",
      data: suggestions,
    });
  } catch (err) {
    console.error("Error generating prompt suggestions:", err);
    res.status(200).json({
      success: false,
      message: "Failed to generate dynamic prompts, using static fallback.",
      data: [],
    });
  }
}

// async function getAnalytics(req, res, next) {
//   try {
//     const { platformClient } = req;
//     const { company_id: companyId } = req.body;

//     if (!companyId) {
//       return res.status(400).json({
//         success: false,
//         message: "company_id is a required field",
//       });
//     }

//     const [ordersResponse, bundlesResponse] = await Promise.all([
//       platformClient.order.getOrders({ companyId: companyId, pageSize: 1000 }),
//    // Fetch recent orders
//       platformClient.catalog.getProductBundle({
//         companyId: companyId,
//         pageSize: 1000,
//       }), // Fetch all  bundles
//     ]);

//     const orders = ordersResponse.items || [];
//     const definedBundles = bundlesResponse.items || [];

//     const bundleIds = new Set(definedBundles.map((b) => b.id));
//     const bundleDataMap = new Map(definedBundles.map((b) => [b.id, b]));

//     let summaryStats = {
//       revenueFromBundles: 0,
//       bundlesSoldCount: 0,
//       profitLift: 0,
//       totalRevenue: 0,
//       ordersWithBundlesCount: 0,
//       ordersWithoutBundlesCount: 1,
//       totalValueOrdersWithBundles: 0,
//       totalValueOrdersWithoutBundles: 0,
//       itemsInOrdersWithBundles: 0,
//       itemsInOrdersWithoutBundles: 0,
//       avgOrderValueWithBundles: 0,
//       avgOrderValueWithoutBundles: 0,
//       itemsPerOrderWithBundles: 0,
//     };
//     let topPerformingBundles = {};
//     const coPurchaseMap = new Map();

//     for (const order of orders) {
//       let orderContainsBundle = false;

//
//       let orderValue = order.amount || 0;
//       summaryStats.totalRevenue += orderValue;

//       const productItems = order.shipments.flatMap((s) =>
//         s.bags.map((b) => b.item)
//       );

//       for (const item of productItems) {
//         const itemId = item.article?.id || item.item_id;

//         if (itemId && bundleIds.has(itemId)) {
//           orderContainsBundle = true;
//           const bundleDefinition = bundleDataMap.get(itemId);

//           const itemPrice = item.price?.total || 0;
//           const itemQuantity = item.quantity || 1;
//           summaryStats.revenueFromBundles += itemPrice;
//           summaryStats.bundlesSoldCount += itemQuantity;

//           if (bundleDefinition && bundleDefinition.products) {
//             const individualPriceSum = bundleDefinition.products.reduce(
//               (sum, p) => {
//                 const price =
//                   p.product_details?.price?.effective?.max ||
//                   p.product_details?.price?.effective?.min ||
//                   0;
//                 return sum + price;
//               },
//               0
//             );

//             const lift = itemPrice - individualPriceSum;
//             summaryStats.profitLift += lift > 0 ? lift : 0; // Only count positive lift
//           }

//           if (!topPerformingBundles[itemId]) {
//             topPerformingBundles[itemId] = {
//               id: itemId,
//               name: item.name,
//               unitsSold: 0,
//               revenue: 0,
//             };
//           }
//           topPerformingBundles[itemId].unitsSold += itemQuantity;
//           topPerformingBundles[itemId].revenue += itemPrice;
//         }
//       }

//       if (orderContainsBundle) {
//         summaryStats.ordersWithBundlesCount++;
//         summaryStats.totalValueOrdersWithBundles += orderValue;
//         summaryStats.itemsInOrdersWithBundles += productItems.length;
//       } else {
//         summaryStats.ordersWithoutBundlesCount++;
//         summaryStats.totalValueOrdersWithoutBundles += orderValue;
//         summaryStats.itemsInOrdersWithoutBundles += productItems.length;

//         if (productItems.length >= 2) {
//           const sortedItems = productItems.sort(
//             (a, b) =>
//               (a.article?.id || a.item_id) - (b.article?.id || b.item_id)
//           );
//           for (let i = 0; i < sortedItems.length; i++) {
//             for (let j = i + 1; j < sortedItems.length; j++) {
//               const pairKey = `${sortedItems[i].article.id}--+--${sortedItems[j].article.id}`;
//               const currentPair = coPurchaseMap.get(pairKey) || {
//                 count: 0,
//                 names: [sortedItems[i].name, sortedItems[j].name],
//               };
//               coPurchaseMap.set(pairKey, {
//                 ...currentPair,
//                 count: currentPair.count + 1,
//               });
//             }
//           }
//         }
//       }
//     }

//     if (summaryStats.ordersWithBundlesCount > 0) {
//       summaryStats.avgOrderValueWithBundles =
//         summaryStats.totalValueOrdersWithBundles /
//         summaryStats.ordersWithBundlesCount;
//       summaryStats.itemsPerOrderWithBundles =
//         summaryStats.itemsInOrdersWithBundles /
//         summaryStats.ordersWithBundlesCount;
//     }
//     if (summaryStats.ordersWithoutBundlesCount > 0) {
//       summaryStats.avgOrderValueWithoutBundles =
//         summaryStats.totalValueOrdersWithoutBundles /
//         summaryStats.ordersWithoutBundlesCount;
//     }

//     const topBundlesList = Object.values(topPerformingBundles)
//       .sort((a, b) => b.revenue - a.revenue)
//       .slice(0, 5);

//     const untappedOpportunities = Array.from(coPurchaseMap.entries())
//       .filter(([, val]) => val.count > 1) // Only show pairs bought more than once
//       .sort(([, a], [, b]) => b.count - a.count)
//       .slice(0, 5)
//       .map(([, val]) => ({
//         pair: val.names.map((name) => ({ productName: name })),
//         coPurchaseFrequency: val.count,
//       }));

//     const analyticsResponse = {
//       summaryStats,
//       topPerformingBundles: topBundlesList,
//       untappedOpportunities,
//     };

//     return res.status(200).json({
//       success: true,
//       message: "Analytics data fetched successfully",
//       data: analyticsResponse,
//     });
//   } catch (err) {
//     console.error("Error in getAnalytics:", err);
//     return res.status(err.status_code || 500).json({
//       success: false,
//       message: err.message || "An error occurred while fetching analytics",
//     });
//   }
// }

module.exports = {
  getProducts,
  getBundles,
  getApplicationIds,
  generateBundles,
  saveOrderToDb,
  createBundles,
  generateName,
  generateImage,
  updateBundle,
  getCompanyInfo,
  generatePromptSuggestions,
  // getAnalytics,
};
