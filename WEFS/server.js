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
const sqliteInstance = new sqlite3.Database("session_storage.db");
const generalRouter = express.Router();
const dotenv = require("dotenv");
dotenv.config();

const {
  getApplicationBundles,
  getApplicationProducts,
  generateBundles,
  saveOrderToDb,
  createBundles,
  getApplicationIds,
  // deleteBundles,
} = require("./controller");

const fdkExtension = setupFdk({
  api_key: process.env.EXTENSION_API_KEY,
  api_secret: process.env.EXTENSION_API_SECRET,
  base_url: process.env.EXTENSION_BASE_URL,
  cluster: process.env.FP_API_DOMAIN,
  callbacks: {
    auth: async (req) => {
      // Write you code here to return initial launch url after auth process complete
      if (req.query.application_id) {
        return `${req.extension.base_url}/company/${req.query["company_id"]}/application/${req.query.application_id}`;
      } else {
        return `${req.extension.base_url}/company/${req.query["company_id"]}`;
      }
    },

    uninstall: async (req) => {
      // Write your code here to cleanup data related to extension
      // If task is time taking then process it async on other process.
    },
  },
  storage: new SQLiteStorage(
    sqliteInstance,
    "exapmple-fynd-platform-extension"
  ), // add your prefix
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

const STATIC_PATH =
  process.env.NODE_ENV === "production"
    ? path.join(process.cwd(), "frontend", "public", "dist")
    : path.join(process.cwd(), "frontend");

const app = express();
const platformApiRoutes = fdkExtension.platformApiRoutes;

// Middleware to parse cookies with a secret key
app.use(cookieParser("ext.session"));

// Middleware to parse JSON bodies with a size limit of 2mb
app.use(
  bodyParser.json({
    limit: "2mb",
  })
);

// Serve static files from the React dist directory
app.use(serveStatic(STATIC_PATH, { index: false }));

// FDK extension handler and API routes (extension launch routes)
app.use("/", fdkExtension.fdkHandler);

// Route to handle webhook events and process it.
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

//TODO: Comment this later
generalRouter.get("/", async function view(req, res, next) {
  try {
    const { platformClient } = req;
    const data = await platformClient.catalog.getProducts();
    return res.json(data);
  } catch (err) {
    next(err);
  }
});

// Get products list for application
generalRouter.get("/:company_id/products", async function view(req, res, next) {
  await getApplicationProducts(req, res, next);
});

//Get applications bundles
generalRouter.get(
  "/application/:company_id",
  async function view(req, res, next) {
    await getApplicationBundles(req, res, next);
  }
);

// Generate bundles
generalRouter.post(
  "/application/generate_bundles",
  async function view(req, res, next) {
    await generateBundles(req, res, next);
  }
);

//Create bundles user wants
generalRouter.post(
  "/application/create_bundles",
  async function view(req, res, next) {
    await createBundles(req, res, next);
  }
);

//Create bundles user wants
// generalRouter.post(
//   "/application/create_bundles",
//   async function view(req, res, next) {
//     await createBundles(req, res, next);
//   }
// );

//Sales channel route
generalRouter.get("/ids", async function view(req, res, next) {
  await getApplicationIds(req, res, next);
});

// //Delete the bundles that user wants
// generalRouter.post(
//   "/application/:application_id/delete_bundles",
//   async function view(req, res, next) {
//     await deleteBundles(req, res, next);
//   }
// );

// FDK extension api route which has auth middleware and FDK client instance attached to it.
platformApiRoutes.use("/sales-channels", generalRouter);
platformApiRoutes.use("/product", generalRouter);
platformApiRoutes.use("/bundle", generalRouter);

// If you are adding routes outside of the /api path,
// remember to also add a proxy rule for them in /frontend/vite.config.js
app.use("/api", platformApiRoutes);

// Serve the React app for all other routes
app.get("*", (req, res) => {
  return res
    .status(200)
    .set("Content-Type", "text/html")
    .send(readFileSync(path.join(STATIC_PATH, "index.html")));
});

module.exports = app;
