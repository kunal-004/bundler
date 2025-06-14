const mongoose = require("mongoose");
const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");
const sharp = require("sharp");
const cloudinary = require("cloudinary").v2;

const connectToDb = async () => {
  try {
    const uri = `mongodb+srv://Asdf123:Asdf123@cluster0.83ziukd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

    await mongoose
      .connect(uri)
      .then(() => {
        console.log("Connected to mongodb");
      })
      .catch((error) => {
        console.log(error);
      });
  } catch (error) {
    console.log(error);
  }
};

async function disconnectDB() {
  try {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  } catch (err) {
    console.error("Error disconnecting from MongoDB:", err);
  }
}

async function getKeywordsUsingAI(inputTextArray) {
  try {
    const googleApi = process.env.GEMINI_API;
    const genAI = new GoogleGenerativeAI(googleApi);
    // const schema = {
    //   description: "List of recipes",
    //   type: SchemaType.ARRAY,
    //   items: {
    //     type: SchemaType.OBJECT,
    //     properties: {
    //       recipeName: {
    //         type: SchemaType.STRING,
    //         description: "Name of the recipe",
    //         nullable: false,
    //       },
    //     },
    //     required: ["recipeName"],
    //   },
    // };
    const schema = {
      type: SchemaType.ARRAY,
      description: "An array of lowercase product category strings or null",
      items: {
        type: SchemaType.STRING,
        description:
          "A lowercase product category name (e.g. 'mobile', 'tv') or the literal string 'null'",
      },
    };
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      // systemInstruction: "You are a product categorization AI.",
      // generationConfig: {
      // temperature: 0,
      responseMimeType: "application/json",
      responseSchema: schema,
      // },
    });

    const allKeywords = [];

    for (const inputText of inputTextArray) {
      const prompt = `
      Your task is:
      1. Extract **generic product object names** from the given text.
      2. Always use **normalized, consistent categories**. For example:
        - "iPhone", "Samsung Galaxy", "smartphone" → "mobile"
        - "MacBook", "HP Laptop", "Notebook" → "laptop"
        - "AirPods", "Earbuds", "Headphones" → "earphones"
        - "Office Chair", "Gaming Chair" → "chair"
        - "Smartwatch", "Watch" → "watch"
        - "TV", "Television" → "tv"
        - "Saree", "Sari", "Lehenga", "Salwar Kameez" → "dress"
        - "Kurta", "Kurti", "Kameez" → "shirt"
        - "Dupatta", "Stole", "Chunni" → "scarf"
        - "Chappal", "Slipper", "Kolhapuri" → "slippers"
        - "Jutti", "Mojari", "Khussa" → "shoes"
        - "Bindi", "Sindoor", "Kajal" → "accessory"
        - "Sherwani", "Achkan", "Nehru Jacket" → "jacket"
        - "Dhoti", "Lungi", "Mundu" → "wrap"
        - "Puja Thali", "Aarti Plate", "Pooja Plate" → "plate"
        - "Pressure Cooker", "Handi", "Tawa" → "cooker"
        - "Chulha", "Tawa", "Tandoor" → "grill"

      3. If multiple items map to the same category, use **only one consistent label**.
      4. If the text does not include a clear product, **infer one likely product object** from context.
      5. If you cannot infer a product category with sufficient confidence, output the literal string "null" for that entry.
        Text: ${JSON.stringify(inputText)}`;

      //   6. Return only a raw JSON array of lowercase strings or "null", for example:
      //   ["mobile","earphones","null"]
      // 7. Do not return code blocks, markdown, explanations, or any extra text.

      // const resp = await ai.models.generateContent({
      //   model: "gemini-1.5-flash",
      //   contents: [{ type: "text", text: prompt }],
      //   config: {
      //     systemInstruction: "You are a product categorization AI.",
      //   },
      // });

      const result = await model.generateContent(prompt);
      const resp = result.response;
      const text = resp.text();
      const cleaned = text
        .replace(/```json|```/g, "") // remove ```json blocks
        .replace(/\n/g, "") // remove newlines
        .trim();
      allKeywords.push(cleaned);
    }

    // const parsedArrOfKeywords = allKeywords.flatMap((str) => {
    //   try {
    //     return JSON.parse(str);
    //   } catch (e) {
    //     return [];
    //   }
    // });

    const filtered = allKeywords.filter(
      (item) => item !== null && item !== "null"
    );

    const uniqueFiltered = [...new Set(filtered)];

    if (uniqueFiltered.length >= 1) {
      return uniqueFiltered;
    } else {
      return [];
    }
  } catch (err) {
    console.error(err);
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function enrichProductsWithKeywords(products, delayMs = 4000) {
  // Map over each product, kick off a keyword-extraction call,
  // then return an object with id and the extracted keywords.
  const enriched = [];

  for (const product of products) {
    const [keywords] = await getKeywordsUsingAI([product.name]);

    enriched.push({ id: product.id, keywords });

    await delay(delayMs);
  }

  return enriched;
}

async function isApplicationId(id) {
  const str = String(id);
  const isAlphanumeric = /[a-z]/i.test(str) && /[0-9]/.test(str);
  if (isAlphanumeric) {
    return true;
  } else {
    return false;
  }
}

// async function generateImageUsingPixelBin(imageUrls) {
//   // const config = new PixelbinConfig({
//   //   domain: "https://api.pixelbin.io",
//   //   apiSecret: "API_TOKEN",
//   // });
//   // const pixelbin = new PixelbinClient(config);
//   // // list the assets stored on your organization's Pixelbin Storage
//   // const explorer = pixelbin.assets.listFilesPaginator({
//   //   onlyFiles: true,
//   //   pageSize: 5,
//   // });
//   // while (explorer.hasNext()) {
//   //   const { items, page } = await explorer.next();
//   //   console.log(page.current); // 1
//   //   console.log(page.hasNext); // false
//   //   console.log(page.size); // 3
//   //   console.log(items.length); // 3
//   // }
// }

async function mergeBase64ImagesGrid(base64Images, options = {}) {
  const imageBuffers = base64Images.map((b64) =>
    Buffer.from(b64.replace(/^data:image\/\w+;base64,/, ""), "base64")
  );

  const loadedImages = await Promise.all(
    imageBuffers.map((buf) => sharp(buf).metadata())
  );
  const width = Math.max(...loadedImages.map((img) => img.width));
  const height = Math.max(...loadedImages.map((img) => img.height));

  const cols = options.columns || Math.ceil(Math.sqrt(base64Images.length));
  const rows = Math.ceil(base64Images.length / cols);

  const canvasWidth = cols * width;
  const canvasHeight = rows * height;

  const compositeOps = imageBuffers.map((buffer, i) => {
    const x = (i % cols) * width;
    const y = Math.floor(i / cols) * height;
    return { input: buffer, top: y, left: x };
  });

  const outputBuffer = await sharp({
    create: {
      width: canvasWidth,
      height: canvasHeight,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 }, // white background
    },
  })
    .composite(compositeOps)
    .png()
    .toBuffer();

  return options.base64
    ? outputBuffer.toString("base64")
    : sharp(outputBuffer).toFile("merged-output.png");
}

async function generateImageUsingGemini(
  imageUrls,
  imageContext,
  additionalPrompt
) {
  try {
    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      const response = {
        success: false,
        message: "Send imageUrls as an array",
      };
      return response;
    }

    const googleApi = process.env.GEMINI_API;
    const genAI = new GoogleGenerativeAI(googleApi);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash-exp-image-generation",
      generationConfig: {
        responseModalities: ["Text", "Image"],
        temperature: 0.1,
      },
    });

    const prompt = `CRITICAL INSTRUCTION: Create a professional product photography composition using ONLY the exact objects shown in the input image.

STRICT REQUIREMENTS:
1. PRESERVE EXACTLY: Keep every object's original color, shape, size, text, logos, and markings unchanged
2. MAINTAIN QUANTITIES: Use the exact same number of each item shown (no adding, removing, or duplicating)
3. NO MODIFICATIONS: Do not alter, resize, recolor, or transform any object in any way
4. ARRANGEMENT ONLY: Simply arrange the existing objects in an aesthetically pleasing layout
5. BACKGROUND: Place objects on a clean, neutral background suitable for product photography
6. LIGHTING: Apply professional studio lighting that enhances but doesn't change the objects
7. VISIBILITY: Ensure all objects are clearly visible and properly positioned

FORBIDDEN ACTIONS:
- Do not change colors of any object
- Do not duplicate or multiply objects
- Do not merge objects together
- Do not add new elements not present in the original
- Do not modify text, logos, or patterns on objects
- Do not make objects float or appear unnatural

GOAL: Create a clean, professional product photo layout using the exact objects provided, maintaining their original appearance while improving the overall composition and lighting.`;

    const imageContextFinal = imageContext
      ? `
OBJECT IDENTIFICATION:
${imageContext}

Use this information to correctly identify and preserve each object as specified above.
`
      : "";

    const additionalPromptFinal = additionalPrompt
      ? `
ADDITIONAL REQUIREMENTS:
${additionalPrompt}

Remember: These additional requirements must not override the core preservation rules above.
`
      : "";

    const base64Images = [];
    const partsForSingleOutput = [
      {
        text: prompt + imageContextFinal + additionalPromptFinal,
      },
    ];

    for (const url of imageUrls) {
      try {
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Image = buffer.toString("base64");
        base64Images.push(base64Image);
      } catch (fetchError) {
        console.error(`Error processing image ${url}:`, fetchError);
        throw new Error(`Failed to process image: ${url}`);
      }
    }

    try {
      const mergedImageBase64 = await mergeBase64ImagesGrid(base64Images, {
        base64: true,
      });
      partsForSingleOutput.push({
        inlineData: {
          mimeType: "image/png",
          data: mergedImageBase64,
        },
      });
    } catch (mergeError) {
      console.error("Error merging images:", mergeError);
      throw new Error("Failed to merge input images");
    }

    let generationResponse;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        generationResponse = await model.generateContent(partsForSingleOutput);
        break;
      } catch (genError) {
        attempts++;
        if (attempts >= maxAttempts) {
          throw new Error(
            `Failed to generate content after ${maxAttempts} attempts: ${genError.message}`
          );
        }
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempts));
      }
    }

    const apiResponse = generationResponse.response;
    const combinedResult = {
      text: null,
      image: null,
      originalFilenames: imageUrls.slice(),
    };

    if (apiResponse?.candidates?.length > 0) {
      const candidate = apiResponse.candidates[0];
      if (candidate.content?.parts) {
        for (const part of candidate.content.parts) {
          if (part.text) {
            combinedResult.text = (combinedResult.text || "") + part.text;
          } else if (part.inlineData?.data) {
            combinedResult.image = part.inlineData.data;
          }
        }
      }
    }

    if (combinedResult.image) {
      const outputBuffer = Buffer.from(combinedResult.image, "base64");

      return {
        success: true,
        message: "Image generated successfully",
        data: outputBuffer,
        textResponse: combinedResult.text || null,
      };
    } else {
      return {
        success: false,
        message: "Could not generate image - no image data in response",
        textResponse: combinedResult.text || null,
      };
    }
  } catch (err) {
    console.error("Image generation error:", err);
    return {
      success: false,
      message: `Image generation failed: ${err.message}`,
      error: err.name || "Unknown Error",
    };
  }
}

async function uploadBase64Image(base64String) {
  try {
    const cloudAPIKey = 624931393489174;
    const cloudAPISecret = "OaI-KjOa9ZRYr1NeQBlLARPmX_A";

    cloudinary.config({
      cloud_name: "dqclkm2xe",
      api_key: cloudAPIKey,
      api_secret: cloudAPISecret,
      secure: true,
    });

    const options = {
      use_filename: true,
      unique_filename: false,
      overwrite: true,
      format: "png",
    };

    const result = await cloudinary.uploader.upload(base64String, options);
    return result.secure_url;
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    throw err;
  }
}

async function runPipeline(userPrompt, products, relevantKeywords) {
  const googleApi = process.env.GEMINI_API;
  const genAI = new GoogleGenerativeAI(googleApi);

  const schemaForKeys = {
    type: SchemaType.ARRAY,
    description: "An array of strings",
    items: {
      type: SchemaType.STRING,
    },
  };

  const keys = [
    "category_slug",
    "country_of_origin",
    "tags",
    "name",
    "gender",
    "description",
    "short_description",
    "brand",
    "marketer-name",
    "uid",
  ];

  const mandatoryKeys = ["name", "description", "short_description", "uid"];

  //TODO: refine all prompts

  const getRelatedKeysPrompt = `You are a smart assistant. You will be given a user request and a list of data-field names. Your only task is to return a pure JSON array (no commentary, no excuses) containing strictly the field names needed to fulfill the request—and nothing else. Failure to comply or any extra output will be treated as a critical error; if no fields apply, return an all keys in the array and nothing more.
    
    User Request: ${userPrompt}

    Data-fields: ${keys.join(", ")}

    `;

  const keyModel = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: "You are smart assistant.",
    temperature: 1,
    responseMimeType: "application/json",
    responseSchema: schemaForKeys,
  });

  const resultForKeys = await keyModel.generateContent(getRelatedKeysPrompt);
  const respForKeys = resultForKeys.response;
  const keysInText = respForKeys.text();

  const cleanedKeys = JSON.parse(
    keysInText
      .replace(/```json|```/g, "") // remove ```json blocks
      .replace(/\n/g, "") // remove newlines
      .trim()
  );

  const cleanedKeysSet = new Set([...cleanedKeys, ...mandatoryKeys]);

  const cleanedProducts = products.map((product) => {
    const filteredEntries = Object.entries(product)
      .filter(([key]) => cleanedKeysSet.has(key))
      .map(([key, value]) => {
        if (
          key === "brand" &&
          value &&
          typeof value === "object" &&
          value.name
        ) {
          return [key, value.name];
        } else {
          return [key, value];
        }
      })
      .filter(([_, value]) => value !== undefined);

    return Object.fromEntries(filteredEntries);
  });

  const getRelatedProductsPrompt = `
  You are a ruthless filter. You will receive a user request and a list of product objects. Your sole mission is to return a pure JSON array of UIDs (numbers only) of only those products relevant to the userPrompt—nothing else. Any deviation, extra output, or inclusion of irrelevant products is unacceptable and treated as a failure. If no products match, return an empty array.

  User Request: ${userPrompt}

  Products: ${JSON.stringify(cleanedProducts, null, 2)}
  `;

  const schemaForProducts = {
    type: SchemaType.ARRAY,
    description: "An array of numbers",
    items: {
      type: SchemaType.NUMBER,
      description: "A numeric product ID",
    },
  };

  const productModel = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: "You are smart assistant.",
    temperature: 1,
    responseMimeType: "application/json",
    responseSchema: schemaForProducts,
  });

  const resultForProducts = await productModel.generateContent(
    getRelatedProductsPrompt
  );
  const respForProducts = resultForProducts.response;
  const productIdsInText = respForProducts.text();

  const cleanedFilteredProductIds = JSON.parse(
    productIdsInText
      .replace(/```json|```/g, "") // remove ```json blocks
      .replace(/\n/g, "") // remove newlines
      .trim()
  );

  const usableProducts = products.filter((product) => {
    if (cleanedFilteredProductIds.includes(product.uid)) {
      return product;
    }
  });

  const schemaForBundleCreation = {
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

  // const relevantKeywords = [
  //   ["keyboard", "mouse"],
  //   ["laptop", "mobile phone"],
  // ];

  const createBundlePrompt = `
      You will receive exactly two inputs:

        Products and their data (JSON array):
        ${JSON.stringify(usableProducts, null, 2)}

        User Prompt (string):
        "${userPrompt}"

        Any deviation from the rules below is intolerable. You must produce only a JSON array of arrays of UIDs. No commentary. No errors. No excuses.

        Read all the given products

        1. Correlation Criteria — No Shortcuts
        a. Analyze every product’s data — no skipping.
        b. Use the following signals as **reference indicators** to decide if products are related or go well together. These are **guidance signals**, not hard requirements:

        Products share identical or complementary category_slug (e.g., “phone” + “phone case”).

        Products are clearly designed to function together (e.g., “camera” + “tripod”).

        Products target the same gender audience (e.g., “Men’s shirt” + “Men’s shoes”).

        Products share overlapping tags, marketing labels, or branding signals.

        Products exhibit documented co‑purchase behavior (“people also buy X with Y”).

        Hard Constraint:
        Do not create a bundle based only on keyword overlap, category match, or product similarity. This includes products that share generic terms like “watch,” “shirt,” “bag,” etc.
        Bundles must only include products that are explicitly and strongly relevant to the user's prompt.
        If the user prompt does not logically suggest that certain similar products should be grouped, you must skip them—even if their data looks related.

        Relevance > Similarity. Matching keywords ≠ matching user intent.

        Do not bundle unrelated products. Do not create bundles just to maximize count—maximize only valid bundles. All bundles must make practical, useful sense from a real user's perspective. If a product does not belong in any meaningful bundle, exclude it entirely. Follow all format and filtering rules without exception.

        If you bundle similar products that do not clearly align with the user’s specific prompt, it is considered a failure.

        2. Group‑Building — Absolute Rules
        a. Begin with the first product and exhaustively test all others for valid pairing.
        b. Construct each bundle as an array of UIDs.
        c. Maximum bundle size: 5 items.
        d. If two bundles can merge into a larger valid set (e.g., [ID1,ID2] + [ID2,ID3] → [ID1,ID2,ID3]), discard the smaller ones. Only the largest, most complete bundle stands.
        e. No single‑item bundles. Omit them.
        f. No duplicate bundles. Skip any bundle whose UID set exactly matches one already created.
        g. No repeated UIDs within any bundle (e.g., [keyboard,keyboard] is forbidden).
        h. Maximize the number of valid bundles without breaking any rule above.
        i. Keyword multiplicity combinations: If a bundle’s defining keywords match multiple distinct products (e.g., two different “wireless mouse” items), generate all possible unique combinations of those products within the bundle constraints.

        3. User Intent — Non‑Negotiable Overrides
        If the user prompt specifies additional constraints (e.g., “group by color,” “limit to 3 items”), obey them exactly—no exceptions.

        If the prompt is empty or vague, revert to steps 1–2 only. Do not invent extra logic.

        4. Keyword Bundles — Mandatory Secondary Task
        You will also receive an array of keyword groups, for example:

        Keywords : ${JSON.stringify(relevantKeywords, null, 2)}

        [["keyboard","mouse"], ["laptop","mobile phone"]]
        For each keyword group relevant to the user prompt, form new, separate bundles from matching products.

        Do not merge these keyword‑driven bundles into existing ones.

        No duplicates: if a bundle’s UID set already exists (from any source), skip it.

        5. Output — Enforce to the Letter
        Return nothing but a pure JSON array of UID‑arrays.

        Zero extra text.

        Zero explanation.

        Zero error messages.
    `;

  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: "You are a product categorization AI.",
    temperature: 0.5,
    responseMimeType: "application/json",
    responseSchema: schemaForBundleCreation,
  });

  const resultForBundleCreation = await model.generateContent(
    createBundlePrompt
  );
  const respForBundleCreation = resultForBundleCreation.response;
  const textForBundleCreation = respForBundleCreation.text();

  const cleanedProductIds = JSON.parse(
    textForBundleCreation
      .replace(/```json|```/g, "") // remove ```json blocks
      .replace(/\n/g, "") // remove newlines
      .trim()
  );

  return cleanedProductIds;
}

module.exports = {
  connectToDb,
  disconnectDB,
  getKeywordsUsingAI,
  enrichProductsWithKeywords,
  // generateImageUsingPixelBin,
  generateImageUsingGemini,
  isApplicationId,
  uploadBase64Image,
  runPipeline,
};
