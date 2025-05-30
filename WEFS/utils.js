const mongoose = require("mongoose");
const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");
const { PixelbinConfig, PixelbinClient } = require("@pixelbin/admin");

const connectToDb = async () => {
  try {
    const uri = `mongodb+srv://Asdf123:Asdf123@cluster0.nrgwdpk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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

async function generateImageUsingPixelBin(imageUrls) {
  // const config = new PixelbinConfig({
  //   domain: "https://api.pixelbin.io",
  //   apiSecret: "API_TOKEN",
  // });
  // const pixelbin = new PixelbinClient(config);
  // // list the assets stored on your organization's Pixelbin Storage
  // const explorer = pixelbin.assets.listFilesPaginator({
  //   onlyFiles: true,
  //   pageSize: 5,
  // });
  // while (explorer.hasNext()) {
  //   const { items, page } = await explorer.next();
  //   console.log(page.current); // 1
  //   console.log(page.hasNext); // false
  //   console.log(page.size); // 3
  //   console.log(items.length); // 3
  // }
}

module.exports = {
  connectToDb,
  disconnectDB,
  getKeywordsUsingAI,
  enrichProductsWithKeywords,
  generateImageUsingPixelBin,
};
