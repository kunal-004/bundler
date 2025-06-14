import React, { useEffect, useMemo } from "react";
import {
  ChartBarIcon,
  ShoppingCartIcon,
  PuzzlePieceIcon,
  LightBulbIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  BuildingStorefrontIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  // BeakerIcon,
} from "@heroicons/react/24/outline";

import { useAppContext } from "../context/AppContext";
import LoadingSpinner from "../components/LoadingSpinner";

const StatCard = ({
  title,
  value,
  icon,
  change,
  changeType,
  loading = false,
}) => {
  const IconComponent = icon;
  const ChangeIcon = changeType === "increase" ? ArrowUpIcon : ArrowDownIcon;
  const changeColor =
    changeType === "increase"
      ? "text-green-600"
      : changeType === "decrease"
      ? "text-red-600"
      : "text-gray-500";

  if (loading) {
    return (
      <div className="bg-white p-5 rounded-xl shadow-lg border border-gray-200 animate-pulse">
        <div className="flex items-center justify-between mb-1">
          <div className="h-4 bg-gray-200 rounded w-20"></div>
          <div className="bg-gray-200 p-2 rounded-lg w-9 h-9"></div>
        </div>
        <div className="h-8 bg-gray-200 rounded w-24 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-32"></div>
      </div>
    );
  }

  return (
    <div className="bg-white p-5 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <div className="bg-indigo-100 text-indigo-600 p-2 rounded-lg">
          <IconComponent className="h-5 w-5" />
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
      {change && (
        <div className="flex items-center text-xs mt-1">
          <ChangeIcon className={`h-4 w-4 mr-1 ${changeColor}`} />
          <span className={`${changeColor} font-semibold`}>{change}</span>
        </div>
      )}
    </div>
  );
};

const BundleCard = ({ bundle, rank }) => {
  const { boughtCount } = bundle;
  const bundleData = bundle.bundle;

  return (
    <div className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors border border-slate-200">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          {rank && (
            <span className="text-sm font-bold text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full min-w-[24px] text-center">
              {rank}
            </span>
          )}
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-semibold text-slate-800 text-sm">
                {bundleData.name}
              </h3>
              {bundleData.logo && (
                <img
                  src={bundleData.logo}
                  alt={bundleData.name}
                  className="w-6 h-6 rounded object-cover"
                />
              )}
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                {bundleData.products?.length || 0} products
              </span>
              {bundleData.choice && (
                <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full capitalize">
                  {bundleData.choice}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="text-right ml-4">
          <p className="text-sm font-semibold text-slate-700">
            {boughtCount} sales
          </p>
        </div>
      </div>
    </div>
  );
};

const EmptyState = ({ icon: Icon, title, description }) => (
  <div className="text-center py-12">
    <Icon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
    <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-500 mb-6 max-w-sm mx-auto">{description}</p>
  </div>
);

// const UntappedOpportunities = () => {
//   const {
//     bundleOpportunities,
//     isLoadingOpportunities,
//     opportunityError,
//     generateBundleOpportunities,
//   } = useAppContext();

//   return (
//     <section>
//       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4">
//         <h2 className="text-xl font-semibold text-slate-700 flex items-center mb-3 sm:mb-0">
//           <BeakerIcon className="h-6 w-6 mr-2 text-blue-600" />
//           Untapped Bundle Opportunities
//         </h2>
//         <button
//           onClick={generateBundleOpportunities}
//           disabled={isLoadingOpportunities}
//           className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
//         >
//           {isLoadingOpportunities ? "Discovering..." : "Discover Now"}
//         </button>
//       </div>
//       <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 min-h-[150px] flex flex-col justify-center">
//         {isLoadingOpportunities && (
//           <LoadingSpinner message="Analyzing trends and your products..." />
//         )}
//         {opportunityError && (
//           <p className="text-red-600 text-center">{opportunityError}</p>
//         )}
//         {!isLoadingOpportunities &&
//           !opportunityError &&
//           bundleOpportunities.length === 0 && (
//             <div className="text-center text-slate-500">
//               <p>
//                 Click "Discover Now" to let AI find new, trending bundle ideas
//                 based on your product catalog.
//               </p>
//             </div>
//           )}
//         {bundleOpportunities.length > 0 && (
//           <div className="space-y-6">
//             {bundleOpportunities.map((opp, index) => (
//               <div
//                 key={index}
//                 className="p-4 bg-blue-50 border border-blue-200 rounded-lg"
//               >
//                 <h3 className="font-bold text-blue-800">{opp.bundleName}</h3>
//                 <p className="text-sm text-blue-700 my-2">{opp.rationale}</p>
//                 <div className="mt-3">
//                   <p className="text-xs font-semibold text-slate-600 mb-2">
//                     Suggested Products:
//                   </p>
//                   <div className="flex flex-wrap gap-2">
//                     {opp.products.map(
//                       (p) =>
//                         p && (
//                           <div
//                             key={p.uid}
//                             className="flex items-center space-x-2 bg-white px-2 py-1 rounded-full border"
//                           >
//                             <img
//                               src={p.images?.[0]?.url}
//                               alt={p.name}
//                               className="w-5 h-5 rounded-full object-cover"
//                             />
//                             <span className="text-xs font-medium text-slate-700">
//                               {p.name}
//                             </span>
//                           </div>
//                         )
//                     )}
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </section>
//   );
// };

const AnalyticsPage = () => {
  const {
    analyticsData,
    isLoadingAnalytics,
    analyticsError,
    fetchAnalytics,
    companyId,
    getSelectedApplicationName,
  } = useAppContext();

  useEffect(() => {
    if (companyId) {
      fetchAnalytics();
    }
  }, [companyId, fetchAnalytics]);

  const processedAnalytics = useMemo(() => {
    if (!analyticsData || analyticsData.length === 0) return null;

    const totalBundles = analyticsData.length;
    const totalSales = analyticsData.reduce(
      (sum, item) => sum + (item.boughtCount || 0),
      0
    );
    const bundlesWithSales = analyticsData.filter(
      (item) => item.boughtCount > 0
    );
    const engagementRate =
      totalBundles > 0 ? (bundlesWithSales.length / totalBundles) * 100 : 0;
    const averageSalesPerBundle =
      totalBundles > 0 ? totalSales / totalBundles : 0;
    const sortedBundles = [...analyticsData].sort(
      (a, b) => b.boughtCount - a.boughtCount
    );

    const generateInsights = (data) => {
      const insights = [];
      if (data.filter((item) => item.boughtCount === 0).length > 0) {
        insights.push({
          type: "warning",
          title: "Underperforming Bundles",
          description: `${
            data.filter((item) => item.boughtCount === 0).length
          } AI bundle haven't made a sale yet.`,
        });
      }
      if (data.filter((item) => item.boughtCount > 5).length > 0) {
        insights.push({
          type: "success",
          title: "Strong Performers",
          description: `${
            data.filter((item) => item.boughtCount > 5).length
          } bundle(s) are selling well. Consider promoting them.`,
        });
      }
      return insights;
    };

    return {
      overview: {
        totalBundles,
        totalSales,
        engagementRate,
        averageSalesPerBundle,
      },
      topPerformingBundles: sortedBundles.slice(0, 5),
      insights: generateInsights(analyticsData),
    };
  }, [analyticsData]);

  if (isLoadingAnalytics && !processedAnalytics) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center">
        <LoadingSpinner message="Loading analytics data..." />
      </div>
    );
  }

  if (analyticsError) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400 mb-4" />
          <h3 className="text-lg font-medium text-red-800 mb-2">
            Error Loading Analytics
          </h3>
          <p className="text-red-600 mb-4">{analyticsError}</p>
          <button
            onClick={fetchAnalytics}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!processedAnalytics) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <EmptyState
          icon={ChartBarIcon}
          title="No AI Bundle Analytics"
          description="Performance data for your AI-generated bundles will appear here once they are created and have sales."
        />
        <div className="mt-8">{/* <UntappedOpportunities /> */}</div>
      </div>
    );
  }

  const { overview, topPerformingBundles, insights } = processedAnalytics;

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 bg-slate-50 min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-semibold text-slate-800">
          AI Bundle Analytics
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Performance insights for AI-generated bundles in{" "}
          {getSelectedApplicationName()}
        </p>
      </div>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-slate-700 mb-4 flex items-center">
          <BuildingStorefrontIcon className="h-6 w-6 mr-2 text-gray-600" />
          Performance Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard
            title="AI Bundles"
            value={overview.totalBundles}
            icon={PuzzlePieceIcon}
            loading={isLoadingAnalytics}
          />
          <StatCard
            title="Total AI Bundle Sales"
            value={overview.totalSales}
            icon={ShoppingCartIcon}
            // change={`${overview.averageSalesPerBundle.toFixed(
            //   1
            // )} avg per bundle`}
            changeType={overview.totalSales > 0 ? "increase" : "neutral"}
            loading={isLoadingAnalytics}
          />
          <StatCard
            title="Engagement Rate"
            value={`${overview.engagementRate.toFixed(1)}%`}
            icon={ArrowTrendingUpIcon}
            // change="Bundles with at least one sale"
            changeType={overview.engagementRate > 50 ? "increase" : "decrease"}
            loading={isLoadingAnalytics}
          />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-slate-700 mb-4 flex items-center">
              <ChartBarIcon className="h-6 w-6 mr-2 text-emerald-600" />
              Top Performing AI Bundles
            </h2>
            <div className="bg-white rounded-xl shadow-lg border border-slate-200">
              {topPerformingBundles.length > 0 ? (
                <div className="p-6 space-y-4">
                  {topPerformingBundles.map((bundleItem, index) => (
                    <BundleCard
                      key={bundleItem.bundle.id}
                      bundle={bundleItem}
                      rank={index + 1}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-slate-500">
                  <p>
                    No sales data for AI bundles yet. Performance will appear
                    here once customers start purchasing.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* <UntappedOpportunities /> */}
        </div>

        <div className="lg:col-span-1 space-y-8">
          {insights.length > 0 && (
            <section>
              <h2 className="text-xl font-semibold text-slate-700 mb-4 flex items-center">
                <LightBulbIcon className="h-6 w-6 mr-2 text-sky-600" />
                Insights
              </h2>
              <div className="space-y-4">
                {insights.map((insight, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      insight.type === "success"
                        ? "bg-green-50 border-green-200"
                        : "bg-yellow-50 border-yellow-200"
                    }`}
                  >
                    <h3
                      className={`font-semibold text-sm mb-2 ${
                        insight.type === "success"
                          ? "text-green-800"
                          : "text-yellow-800"
                      }`}
                    >
                      {insight.title}
                    </h3>
                    <p
                      className={`text-xs ${
                        insight.type === "success"
                          ? "text-green-700"
                          : "text-yellow-700"
                      }`}
                    >
                      {insight.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
