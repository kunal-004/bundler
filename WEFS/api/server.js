const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const serveStatic = require("serve-static");
const { readFileSync } = require("fs");
const { setupFdk } = require("@gofynd/fdk-extension-javascript/express");
const {
  SQLiteStorage,
} = require("@gofynd/fdk-extension-javascript/express/storage");
const serverless = require("serverless-http");

const dotenv = require("dotenv");
dotenv.config();

const {
  getBundles,
  getProducts,
  generateBundles,
  saveOrderToDb,
  createBundles,
  getApplicationIds,
  generateImage,
  updateBundle,
  generateName,
  getCompanyInfo,
  generatePromptSuggestions,
} = require("../controller.js");

// Initialize SQLite instance
const sqliteInstance = new sqlite3.Database(":memory:"); // Use in-memory DB for serverless

const fdkExtension = setupFdk({
  api_key: process.env.EXTENSION_API_KEY,
  api_secret: process.env.EXTENSION_API_SECRET,
  base_url: process.env.EXTENSION_BASE_URL,
  cluster: process.env.FP_API_DOMAIN,
  callbacks: {
    auth: async (req) => {
      if (req.query.application_id) {
        return `${req.extension.base_url}/company/${req.query["company_id"]}/application/${req.query.application_id}`;
      } else {
        return `${req.extension.base_url}/company/${req.query["company_id"]}`;
      }
    },
    uninstall: async (req) => {
      // Cleanup code here
    },
  },
  storage: new SQLiteStorage(sqliteInstance, "fynd-platform-extension"),
  access_mode: "offline",
  webhook_config: {
    api_path: "/api/webhook-events",
    notification_email: "amaanshaikh786420@gmail.com",
    event_map: {
      "application/order/placed": {
        handler: saveOrderToDb,
        version: "1",
      },
    },
  },
});

// Determine static path based on environment
const STATIC_PATH =
  process.env.NODE_ENV === "production"
    ? path.join(__dirname, "../frontend/dist")
    : path.join(__dirname, "../frontend");

const app = express();

// Create routers
const bundleRouter = express.Router();
const productRouter = express.Router();
const salesChannelRouter = express.Router();
const companyRouter = express.Router();

const platformApiRoutes = fdkExtension.platformApiRoutes;

// Middleware
app.use(cookieParser("ext.session"));
app.use(bodyParser.json({ limit: "2mb" }));

// Serve static files
app.use(serveStatic(STATIC_PATH, { index: false }));

// FDK extension handler
app.use("/", fdkExtension.fdkHandler);

// Webhook route
app.post("/api/webhook-events", async function (req, res) {
  try {
    console.log(`Webhook Event: ${req.body.event} received`);
    await fdkExtension.webhookRegistry.processWebhook(req);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.log(`Error Processing ${req.body.event} Webhook`);
    return res.status(500).json({ success: false });
  }
});

// Product routes
productRouter.post("/products", async function (req, res, next) {
  await getProducts(req, res, next);
});

// Bundle routes
bundleRouter.post("/bundles", async function (req, res, next) {
  await getBundles(req, res, next);
});

bundleRouter.post("/generate_bundles", async function (req, res, next) {
  await generateBundles(req, res, next);
});

bundleRouter.post("/create_bundles", async function (req, res, next) {
  await createBundles(req, res, next);
});

bundleRouter.post("/generate_name", async function (req, res, next) {
  await generateName(req, res, next);
});

bundleRouter.post("/generate_image", async function (req, res, next) {
  await generateImage(req, res, next);
});

bundleRouter.put("/update_bundle", async function (req, res, next) {
  await updateBundle(req, res, next);
});

bundleRouter.post("/prompt_suggestions", async function (req, res, next) {
  await generatePromptSuggestions(req, res, next);
});

// Sales channel routes
salesChannelRouter.get("/ids", async function (req, res, next) {
  await getApplicationIds(req, res, next);
});

// Company routes
companyRouter.post("/info", async function (req, res, next) {
  await getCompanyInfo(req, res, next);
});

// Register routes
platformApiRoutes.use("/sales-channels", salesChannelRouter);
platformApiRoutes.use("/product", productRouter);
platformApiRoutes.use("/bundle", bundleRouter);
platformApiRoutes.use("/company", companyRouter);

app.use("/api", platformApiRoutes);

// Serve React app for all other routes
app.get("*", (req, res) => {
  try {
    const indexPath = path.join(STATIC_PATH, "index.html");
    return res
      .status(200)
      .set("Content-Type", "text/html")
      .send(readFileSync(indexPath));
  } catch (error) {
    console.error("Error serving index.html:", error);
    return res.status(404).send("Page not found");
  }
});

// Export for Vercel serverless
module.exports = app;
module.exports.handler = serverless(app);
