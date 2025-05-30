const LoadingSpinner = ({ message = "Loading..." }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-6">
      <p className="text-lg font-semibold text-gray-700">{message}</p>
    </div>
  );
};

export default LoadingSpinner;
