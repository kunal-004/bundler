import React from "react";

const AnalyticsPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-semibold text-gray-800 mb-6">
        Analytics & Insights
      </h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-medium text-gray-700 mb-3">
            Product Trends
          </h2>
          <p className="text-gray-500">Trend charts will be displayed here.</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-medium text-gray-700 mb-3">
            Bundle Performance
          </h2>
          <p className="text-gray-500">
            Bundle performance metrics will appear here.
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow lg:col-span-2">
          <h2 className="text-xl font-medium text-gray-700 mb-3">
            Customer Demographics (for Bundles)
          </h2>
          <p className="text-gray-500">
            Insights into customer demographics related to bundles will be shown
            here.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
