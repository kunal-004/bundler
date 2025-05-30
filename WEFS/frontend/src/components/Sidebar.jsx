import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  HomeIcon,
  ChartPieIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CubeIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

const Sidebar = ({ companyId, applicationId }) => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  let basePath = "";
  if (companyId && applicationId) {
    basePath = `/company/${companyId}/application/${applicationId}`;
  } else if (companyId) {
    basePath = `/company/${companyId}`;
  }

  const navItems = [
    { name: "Dashboard", to: "/", icon: HomeIcon, end: true },
    { name: "Bundles", to: "/bundles", icon: CubeIcon },
    { name: "Analytics", to: "/analytics", icon: ChartPieIcon },
  ];

  const navLinkClasses = (isActive) =>
    `flex items-center space-x-3 py-3 px-4 rounded-xl transition-all duration-200 ease-in-out text-sm font-medium group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${
      isActive
        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`;

  const iconBaseClass = "h-5 w-5 flex-shrink-0 transition-colors duration-200";
  const iconClass = `${iconBaseClass} text-slate-500 group-hover:text-slate-700`;
  const activeIconClass = `${iconBaseClass} text-white`;

  if (!companyId) {
    return (
      <aside className="w-0 md:w-20 bg-white border-r border-slate-200 h-screen fixed pt-16 top-0 left-0 transition-all duration-300 ease-in-out shadow-sm z-[50] flex flex-col items-center py-6 space-y-6 overflow-hidden group hover:w-64">
        <div className="text-slate-500 text-center px-2 hidden group-hover:block">
          Select a company to see navigation.
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={`bg-white border-r border-slate-200 h-screen fixed pt-16 top-0 left-0 transition-all duration-300 ease-in-out shadow-sm z-[50] flex flex-col ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Collapse Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-20 bg-white border border-slate-200 rounded-full p-1.5 shadow-sm hover:shadow-md transition-all duration-200 z-10"
      >
        {isCollapsed ? (
          <ChevronRightIcon className="h-4 w-4 text-slate-600" />
        ) : (
          <ChevronLeftIcon className="h-4 w-4 text-slate-600" />
        )}
      </button>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const itemFullPath = `${basePath}${
            item.to === "/" && basePath !== "" ? "" : item.to
          }`.replace(/\/+/g, "/");

          const isActive = item.end
            ? location.pathname === itemFullPath
            : location.pathname.startsWith(itemFullPath) &&
              itemFullPath !== basePath + "/";
          const isDashboardActive =
            item.name === "Dashboard" &&
            location.pathname === (basePath === "" ? "/" : basePath);

          return (
            <NavLink
              key={item.name}
              to={itemFullPath}
              end={item.end}
              className={navLinkClasses(
                item.name === "Dashboard" ? isDashboardActive : isActive
              )}
              title={isCollapsed ? item.name : undefined}
            >
              <item.icon
                className={
                  (item.name === "Dashboard" ? isDashboardActive : isActive)
                    ? activeIconClass
                    : iconClass
                }
                aria-hidden="true"
              />
              {!isCollapsed && <span className="truncate">{item.name}</span>}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
