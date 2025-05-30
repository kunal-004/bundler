const { freqCartModel } = require("./models/FreqCart");
const { cartWarehouseModel } = require("./models/CartWarehouse");
const { getKeywordsUsingAI, enrichProductsWithKeywords } = require("./utils");
const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");

async function getApplicationProducts(req, res, next) {
  try {
    const { platformClient } = req;
    const { company_id } = req.params;
    //TODO: Do not send all the data, send only the ones which are required
    const data = await platformClient.catalog.getProducts({
      companyId: company_id,
    });
    return res.json(data);
  } catch (err) {
    next(err);
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
    return res.json(activeSalesChannels);
  } catch (err) {
    console.error("Error fetching sales channels:", err.message);

    res
      .status(err.status_code || 500)
      .json({ message: err.message || "Failed to fetch sales channels" });
  }
}

// TODO: Currently returns all bundles of the COMPANY not APPLICATION
async function getApplicationBundles(req, res, next) {
  try {
    const { platformClient } = req;
    const { company_id } = req.params;
    const data = await platformClient.catalog.getProductBundle({ company_id });
    return res.json(data);
  } catch (err) {
    next(err);
  }
}

async function generateBundles(req, res, next) {
  try {
    const { platformClient } = req;
    const { productIds, company_id, prompt: userPrompt } = req.body;
    //TODO NOW: Take array of products clean it and only keep useful information and then send it to boltic -> copilot then just send the generated product bundles for displaying

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

    // TODO NOW: Perform tuning on the ai model and configure a schema on the model

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
      model: "gemini-1.5-flash",
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
          .filter(Boolean); // Removes null/undefined if no match found

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
      console.log("Cart added to mongodb");
    }
  } catch (err) {
    console.log(err);
  }
}

async function createBundles(req, res, next) {
  try {
    // bundlesData should be array of product ids array
    const { platformClient } = req;
    const { bundlesData, company_id } = req.body;

    const notCreatedBundles = [];
    const googleApi = process.env.GEMINI_API;
    const genAI = new GoogleGenerativeAI(googleApi);

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction:
        "You are an AI that names product bundles based on their components",
      // generationConfig: {
      temperature: 0.7,
      // responseMimeType: "application/json",
      // responseSchema: schema,
      // },
    });

    //TODO: Generate bundle name and slug using ai

    for (const bundle of bundlesData) {
      const productsForBundle = [];

      const response = await platformClient.catalog.getProducts({
        companyId: company_id,
        pageType: "number",
        itemIds: bundle,
        pageSize: bundle.length,
      });

      let names = [];
      for (const product of response.items) {
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

      for (let i = 0; i < bundle.length; i++) {
        productsForBundle.push({
          max_quantity: 1,
          min_quantity: 1,
          product_uid: bundle[i],
        });
      }

      const dataForBundle = {
        companyId: company_id,
        body: {
          choice: "single",
          is_active: false,
          name: bundleName,
          products: productsForBundle,
          slug: bundleSlug,
        },
      };

      let isBundleCreated;

      try {
        isBundleCreated = await platformClient.catalog.createProductBundle(
          dataForBundle
        );
      } catch (error) {
        if (!isBundleCreated) {
          notCreatedBundles.push(dataForBundle);
        }
      }
    }

    return res.json({
      message: `Bundles that were created except : ${notCreatedBundles}`,
    });
  } catch (error) {
    next(error);
  }
}

// async function deleteBundles(req, res, next) {
//   try {
//     // bundlesData should be array of product ids array
//     const { platformClient } = req;
//     const { bundleIds, company_id } = req.body;

//     const isBundleDeleted = await platformClient.catalog.deleteProductBundle({
//       companyId: company_id,
//       bundleId: bundleIds[0],
//     });

//     return res.json({
//       message: `Bundles were successfully deleted`,
//     });
//   } catch (error) {
//     next(error);
//   }
// }

module.exports = {
  getApplicationProducts,
  getApplicationBundles,
  getApplicationIds,
  generateBundles,
  saveOrderToDb,
  createBundles,
};
