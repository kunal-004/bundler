import React from "react";
import { useAppContext } from "../context/AppContext";
import ProductCard from "../components/ProductCard";
import LoadingSpinner from "../components/LoadingSpinner";

const ProductsPage = () => {
  const { products, isLoading, error } = useAppContext();

  if (isLoading) return <LoadingSpinner message="Loading products..." />;
  if (error)
    return (
      <div className="text-red-500 p-4">Error loading products: {error}</div>
    );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold text-gray-800">
          Manage Products
        </h1>
      </div>

      {products.length === 0 ? (
        <p className="text-gray-600">No products available to display.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id || product.uid} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
