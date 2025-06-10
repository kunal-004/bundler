import React from "react";
import { Link } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { SparklesIcon } from "@heroicons/react/24/outline";

const Header = () => {
  const { companyId, applicationId } = useAppContext();
  let basePath = "/";
  if (companyId && applicationId) {
    basePath = `/company/${companyId}/application/${applicationId}/`;
  } else if (companyId) {
    basePath = `/company/${companyId}/`;
  }

  return (
    <header className="bg-white border-b border-slate-200 fixed top-0 left-0 right-0 z-[60] h-16">
      <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <div className="flex items-center">
          <Link
            to={basePath}
            className="flex items-center space-x-2 text-xl font-semibold text-slate-800 hover:text-blue-600 transition-colors duration-200"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
              <SparklesIcon className="h-5 w-5 text-white" />
            </div>
            <span className="tracking-tight">AI Bundler</span>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
