import React, { useState, useEffect } from "react";
import {
  ChartBarIcon,
  CurrencyRupeeIcon,
  ShoppingCartIcon,
  PuzzlePieceIcon,
  LightBulbIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  BuildingStorefrontIcon,
} from "@heroicons/react/24/outline";
import { SparklesIcon as SparklesIconSolid } from "@heroicons/react/24/solid";

import { mockAnalyticsData } from "../utils/mockAnalyticsData";
import LoadingSpinner from "../components/LoadingSpinner";

const StatCard = ({ title, value, icon, change, changeType, subValue }) => {
  const IconComponent = icon;
  const ChangeIcon = changeType === "increase" ? ArrowUpIcon : ArrowDownIcon;
  const changeColor =
    changeType === "increase"
      ? "text-green-600"
      : changeType === "decrease"
      ? "text-red-600"
      : "text-gray-500";

  return (
    <div className="bg-white p-5 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-medium text-gray-600">{title}</p>{" "}
        <div className="bg-indigo-100 text-indigo-600 p-2 rounded-lg">
          <IconComponent className="h-5 w-5" />
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
      {change && (
        <div className="flex items-center text-xs mt-1">
          <ChangeIcon className={`h-4 w-4 mr-1 ${changeColor}`} />
          <span className={`${changeColor} font-semibold`}>{change}</span>
          <span className="text-gray-500 ml-1">{subValue}</span>
        </div>
      )}
    </div>
  );
};

const AnalyticsPage = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setAnalyticsData(mockAnalyticsData);
      setIsLoading(false);
    }, 1000);
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <LoadingSpinner message="Loading Bundle Analytics..." />
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <p className="text-xl text-red-600">Could not load analytics data.</p>
      </div>
    );
  }

  const {
    summaryStats,
    topPerformingBundles,
    productSynergy,
    untappedOpportunities,
  } = analyticsData;

  const revenueFromBundlesPercent =
    summaryStats.totalRevenue > 0
      ? (
          (summaryStats.revenueFromBundles / summaryStats.totalRevenue) *
          100
        ).toFixed(1)
      : "0";

  const aovLift =
    summaryStats.avgOrderValueWithoutBundles > 0
      ? summaryStats.avgOrderValueWithBundles -
        summaryStats.avgOrderValueWithoutBundles
      : summaryStats.avgOrderValueWithBundles;

  const aovLiftPercent =
    summaryStats.avgOrderValueWithoutBundles > 0
      ? ((aovLift / summaryStats.avgOrderValueWithoutBundles) * 100).toFixed(1)
      : aovLift > 0
      ? "100.0"
      : "0";

  const itemsPerOrderLift =
    summaryStats.itemsPerOrderWithoutBundles > 0
      ? summaryStats.itemsPerOrderWithBundles -
        summaryStats.itemsPerOrderWithoutBundles
      : summaryStats.itemsPerOrderWithBundles - 1;

  const itemsPerOrderLiftPercent =
    summaryStats.itemsPerOrderWithoutBundles > 0 && itemsPerOrderLift !== 0
      ? (
          (itemsPerOrderLift / summaryStats.itemsPerOrderWithoutBundles) *
          100
        ).toFixed(1)
      : itemsPerOrderLift > 0
      ? "100.0"
      : "0";

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-slate-50 min-h-screen">
      {" "}
      {/* <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-semibold text-slate-800">
          {" "}
          Bundle Performance Insights
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          {" "}
          Analyze the impact and opportunities of your product bundles.
        </p>
      </div> */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-slate-700 mb-4 flex items-center">
          {" "}
          <BuildingStorefrontIcon className="h-6 w-6 mr-2 text-gray-600" />{" "}
          Bundle Impact Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            title="Revenue from Bundles"
            value={`₹${summaryStats.revenueFromBundles.toLocaleString(
              "en-IN"
            )}`}
            icon={CurrencyRupeeIcon}
            change={`${revenueFromBundlesPercent}%`}
            subValue="of Total Revenue"
            changeType={
              parseFloat(revenueFromBundlesPercent) > 0 ? "increase" : "neutral"
            }
          />
          <StatCard
            title="AOV (Orders with Bundles)"
            value={`₹${summaryStats.avgOrderValueWithBundles.toLocaleString(
              "en-IN",
              { minimumFractionDigits: 2, maximumFractionDigits: 2 }
            )}`}
            icon={ShoppingCartIcon}
            change={`+₹${aovLift.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })} (${aovLiftPercent}%)`}
            subValue="vs. Orders w/o Bundles"
            changeType={
              aovLift > 0 ? "increase" : aovLift < 0 ? "decrease" : "neutral"
            }
          />
          <StatCard
            title="Items per Order (with Bundles)"
            value={`${summaryStats.itemsPerOrderWithBundles.toFixed(1)}`}
            icon={PuzzlePieceIcon}
            change={`+${itemsPerOrderLift.toFixed(
              1
            )} (${itemsPerOrderLiftPercent}%)`}
            subValue="vs. Orders w/o Bundles"
            changeType={
              itemsPerOrderLift > 0
                ? "increase"
                : itemsPerOrderLift < 0
                ? "decrease"
                : "neutral"
            }
          />
        </div>
      </section>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-slate-700 mb-4 flex items-center">
              <ChartBarIcon className="h-6 w-6 mr-2 text-emerald-600" /> Top
              Performing Bundles
            </h2>
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-slate-200">
              {" "}
              {topPerformingBundles.length > 0 ? (
                <ul className="space-y-4">
                  {topPerformingBundles.slice(0, 5).map((bundle, index) => (
                    <li
                      key={bundle.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-semibold text-indigo-600 w-6 text-center">
                          {" "}
                          {index + 1}.
                        </span>
                        <div>
                          <span className="font-medium text-slate-800 text-sm">
                            {bundle.name}
                          </span>
                          {bundle.type === "AI" && (
                            <SparklesIconSolid
                              className="h-4 w-4 text-amber-500 inline-block ml-1.5"
                              title="AI Generated"
                            />
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-700">
                          ₹{bundle.revenue.toLocaleString("en-IN")}
                        </p>
                        <p className="text-xs text-slate-500">
                          {bundle.unitsSold} units sold
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500 text-center py-4">
                  No bundle performance data available.
                </p>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-700 mb-4 flex items-center">
              <PuzzlePieceIcon className="h-6 w-6 mr-2 text-purple-600" />
              Key Products in Successful Bundles
            </h2>
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-slate-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-4 py-3  text-xs font-medium text-slate-500 uppercase tracking-wider text-center">
                        Times in Sold Bundles
                      </th>
                      <th className="px-4 py-3  text-xs font-medium text-slate-500 uppercase tracking-wider text-right">
                        Revenue Contribution
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {productSynergy.length > 0 ? (
                      productSynergy.map((p) => (
                        <tr key={p.productId} className="hover:bg-slate-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-800">
                            {p.productName}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 text-center">
                            {p.inBundlesSold}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600 text-right">
                            ₹
                            {p.contributionToBundleRevenue.toLocaleString(
                              "en-IN"
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="3"
                          className="text-center py-4 text-slate-500"
                        >
                          No product synergy data.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar / Second Column */}
        <div className="lg:col-span-1 space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-slate-700 mb-4 flex items-center">
              <LightBulbIcon className="h-6 w-6 mr-2 text-sky-600" /> Untapped
              Bundle Opportunities
            </h2>
            <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-slate-200">
              <p className="text-sm text-slate-600 mb-3">
                Products frequently co-purchased but not yet bundled:
              </p>
              {untappedOpportunities.length > 0 ? (
                <ul className="space-y-3">
                  {untappedOpportunities.slice(0, 3).map((opp, index) => (
                    <li
                      key={index}
                      className="p-3 bg-sky-50 border border-sky-200 rounded-lg"
                    >
                      <p className="font-semibold text-sky-700 text-sm">
                        {" "}
                        {opp.potentialBundleName || `Opportunity ${index + 1}`}
                      </p>
                      <p className="text-xs text-sky-600 mt-0.5">
                        {" "}
                        {opp.pair.map((p) => p.productName).join(" + ")}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Co-purchased: {opp.coPurchaseFrequency} times
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-500 text-sm text-center py-2">
                  No specific untapped opportunities identified.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
