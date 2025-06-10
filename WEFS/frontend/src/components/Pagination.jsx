// import React from "react";

// const Pagination = ({
//   currentPage,
//   totalPages,
//   onPageChange,
//   isLoading,
//   hasMore,
//   onLoadMore,
// }) => {
//   const handlePageChange = (newPage) => {
//     if (newPage >= 1 && newPage <= totalPages && !isLoading) {
//       onPageChange(newPage);
//     }
//   };

//   const renderPageNumbers = () => {
//     const pages = [];
//     const maxVisiblePages = 5;
//     let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
//     let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

//     if (endPage - startPage + 1 < maxVisiblePages) {
//       startPage = Math.max(1, endPage - maxVisiblePages + 1);
//     }

//     for (let i = startPage; i <= endPage; i++) {
//       pages.push(
//         <button
//           key={i}
//           onClick={() => handlePageChange(i)}
//           className={`px-3 py-1 mx-1 rounded ${
//             currentPage === i
//               ? "bg-blue-600 text-white"
//               : "bg-gray-200 hover:bg-gray-300 text-gray-700"
//           } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
//           disabled={isLoading}
//         >
//           {i}
//         </button>
//       );
//     }
//     return pages;
//   };

//   return (
//     <div className="flex flex-col items-center space-y-4 my-4">
//       <div className="flex items-center space-x-2">
//         <button
//           onClick={() => handlePageChange(currentPage - 1)}
//           disabled={currentPage === 1 || isLoading}
//           className={`px-3 py-1 rounded ${
//             currentPage === 1 || isLoading
//               ? "bg-gray-200 text-gray-500 cursor-not-allowed"
//               : "bg-gray-200 hover:bg-gray-300 text-gray-700"
//           }`}
//         >
//           Previous
//         </button>

//         {renderPageNumbers()}

//         <button
//           onClick={() => handlePageChange(currentPage + 1)}
//           disabled={currentPage === totalPages || isLoading}
//           className={`px-3 py-1 rounded ${
//             currentPage === totalPages || isLoading
//               ? "bg-gray-200 text-gray-500 cursor-not-allowed"
//               : "bg-gray-200 hover:bg-gray-300 text-gray-700"
//           }`}
//         >
//           Next
//         </button>
//       </div>

//       {hasMore && (
//         <button
//           onClick={onLoadMore}
//           disabled={isLoading}
//           className={`px-4 py-2 rounded ${
//             isLoading
//               ? "bg-gray-200 text-gray-500 cursor-not-allowed"
//               : "bg-blue-600 hover:bg-blue-700 text-white"
//           }`}
//         >
//           {isLoading ? "Loading..." : "Load More"}
//         </button>
//       )}

//       <div className="text-sm text-gray-600">
//         Page {currentPage} of {totalPages}
//       </div>
//     </div>
//   );
// };

// export default Pagination;
