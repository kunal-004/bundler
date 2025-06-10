const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
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

// In a stateless serverless environment, an in-memory database is reset on every request.
// This is not suitable for production use where data needs to persist.
// For simplicity in deployment, we re-initialize it here.
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
  storage: new SQLiteStorage(
    new (require("sqlite3").verbose().Database)(":memory:"),
    "fynd-platform-extension"
  ),
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

const app = express();

// Middleware
app.use(cookieParser("ext.session"));
app.use(bodyParser.json({ limit: "2mb" }));

// FDK extension handler for authentication, etc.
app.use("/fp", fdkExtension.fdkHandler);

// Create routers
const bundleRouter = express.Router();
const productRouter = express.Router();
const salesChannelRouter = express.Router();
const companyRouter = express.Router();
const platformApiRoutes = fdkExtension.platformApiRoutes;

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
productRouter.post("/products", getProducts);

// Bundle routes
bundleRouter.post("/bundles", getBundles);
bundleRouter.post("/generate_bundles", generateBundles);
bundleRouter.post("/create_bundles", createBundles);
bundleRouter.post("/generate_name", generateName);
bundleRouter.post("/generate_image", generateImage);
bundleRouter.put("/update_bundle", updateBundle);
bundleRouter.post("/prompt_suggestions", generatePromptSuggestions);

// Sales channel routes
salesChannelRouter.get("/ids", getApplicationIds);

// Company routes
companyRouter.post("/info", getCompanyInfo);

// Register API routes
platformApiRoutes.use("/sales-channels", salesChannelRouter);
platformApiRoutes.use("/product", productRouter);
platformApiRoutes.use("/bundle", bundleRouter);
platformApiRoutes.use("/company", companyRouter);

app.use("/api", platformApiRoutes);

// DO NOT SERVE STATIC FILES OR HAVE A CATCH-ALL ROUTE HERE
// Vercel handles this with the routes in vercel.json

// Export for Vercel serverless
module.exports = app;
module.exports.handler = serverless(app);
