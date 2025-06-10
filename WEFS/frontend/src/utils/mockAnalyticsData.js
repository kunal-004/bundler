export const mockAnalyticsData = {
  summaryStats: {
    totalRevenue: 1500,
    revenueFromBundles: 1000,
    totalOrders: 250,
    ordersWithBundles: 60,
    avgOrderValueOverall: 6.0,
    avgOrderValueWithBundles: 16.67,
    avgOrderValueWithoutBundles: 2.63,
    itemsPerOrderOverall: 2.5,
    itemsPerOrderWithBundles: 4.0,
    itemsPerOrderWithoutBundles: 1.8,
    aiBundlesContributionPercent: 66.67,
  },
  topPerformingBundles: [
    {
      id: "bundle001",
      name: "Summer Beach Kit",
      revenue: 400,
      unitsSold: 40,
      conversionRate: 0.18,
    },
    {
      id: "bundle002",
      name: "Work From Home Setup",
      revenue: 300,
      unitsSold: 30,
      conversionRate: 0.12,
    },
    {
      id: "bundle003",
      name: "Travel Essentials Pack",
      revenue: 150,
      unitsSold: 20,
      conversionRate: 0.2,
    },
    {
      id: "bundle004",
      name: "Fitness Starter Pack",
      revenue: 100,
      unitsSold: 15,
      conversionRate: 0.15,
    },
    {
      id: "bundle005",
      name: "Gourmet Coffee Lover Set",
      revenue: 50,
      unitsSold: 5,
      conversionRate: 0.1,
    },
  ],
  productSynergy: [
    {
      productId: "prod101",
      productName: "Beach Towel",
      inBundlesSold: 35,
      contributionToBundleRevenue: 150,
    },
    {
      productId: "prod102",
      productName: "Sunscreen SPF50",
      inBundlesSold: 30,
      contributionToBundleRevenue: 120,
    },
    {
      productId: "prod201",
      productName: "Ergonomic Mouse",
      inBundlesSold: 25,
      contributionToBundleRevenue: 90,
    },
    {
      productId: "prod301",
      productName: "Noise-Cancelling Headphones",
      inBundlesSold: 20,
      contributionToBundleRevenue: 130,
    },
  ],
  untappedOpportunities: [
    {
      pair: [
        { productId: "prod501", productName: "Yoga Mat" },
        { productId: "prod502", productName: "Water Bottle" },
      ],
      coPurchaseFrequency: 15,
      potentialBundleName: "Basic Yoga Set",
    },
    {
      pair: [
        { productId: "prod601", productName: "Gaming Keyboard" },
        { productId: "prod602", productName: "Gaming Mousepad XL" },
      ],
      coPurchaseFrequency: 12,
      potentialBundleName: "Pro Gamer Surface Kit",
    },
  ],
  salesChannelPerformance: [
    {
      channelId: "SC001",
      channelName: "Main Website",
      bundleRevenue: 800,
      bundlesSold: 100,
    },
    {
      channelId: "SC002",
      channelName: "Mobile App",
      bundleRevenue: 150,
      bundlesSold: 20,
    },
    {
      channelId: "SC003",
      channelName: "Partner Marketplace",
      bundleRevenue: 50,
      bundlesSold: 10,
    },
  ],
};
