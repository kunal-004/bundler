import React from "react";
import { Outlet, useParams } from "react-router-dom";
import Header from "./src/components/Header";
import Sidebar from "./src/components/Sidebar";
import { AppProvider } from "./src/context/AppContext";
import { Toaster } from "react-hot-toast";

function AppContent() {
  const { company_id } = useParams();

  const sidebarPresent = !!company_id;

  return (
    <div className="flex flex-col min-h-screen bg-slate-100">
      {" "}
      <Header />
      <div className="flex flex-1 pt-16">
        {" "}
        <Sidebar companyId={company_id} />
        <main
          className={`flex-1 p-4 sm:p-6 lg:p-8 transition-all duration-300 ease-in-out bg-slate-50 overflow-y-auto
                      ${sidebarPresent ? "md:ml-64" : "ml-0 md:ml-20"} `}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <Toaster position="top-center" reverseOrder={true} />
      <AppContent />
    </AppProvider>
  );
}

export default App;
