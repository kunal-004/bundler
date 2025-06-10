import React from "react";
import { useAppContext } from "../context/AppContext";
import {
  WifiIcon,
  BuildingStorefrontIcon,
  GlobeAltIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

const SalesChannelCard = ({ channel }) => {
  const { applicationId, changeApplication } = useAppContext();

  const handleSelectApplication = () => {
    changeApplication(applicationId === channel.id ? null : channel.id);
  };

  const isCurrentlySelected = applicationId === channel.id;

  let IconComponent;
  switch (channel.channel_type) {
    case "store":
      IconComponent = BuildingStorefrontIcon;
      break;
    case "web":
      IconComponent = GlobeAltIcon;
      break;
    default:
      IconComponent = WifiIcon;
  }

  return (
    <button
      onClick={handleSelectApplication}
      className={`w-full flex items-center space-x-3 text-left p-3 rounded-lg transition-all duration-200 ease-in-out border
      ${
        isCurrentlySelected
          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg border-blue-500"
          : "bg-white text-slate-700 hover:bg-slate-100 hover:border-slate-300 border-slate-200"
      }`}
    >
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
          isCurrentlySelected ? "bg-slate-100" : "bg-slate-100"
        }`}
      >
        {channel.logo ? (
          <img
            src={channel.logo}
            alt={`${channel.name} logo`}
            className="w-5 h-5 object-contain"
          />
        ) : (
          <IconComponent
            className={`w-5 h-5 ${
              isCurrentlySelected ? "text-white" : "text-slate-500"
            }`}
          />
        )}
      </div>

      <div className="flex-grow min-w-0">
        <p
          className={`font-semibold text-sm truncate ${
            isCurrentlySelected ? "text-white" : "text-slate-800"
          }`}
          title={channel.name}
        >
          {channel.name}
        </p>
        {channel.domain && (
          <p
            className={`text-xs truncate ${
              isCurrentlySelected ? "text-blue-100" : "text-slate-500"
            }`}
          >
            {channel.domain}
          </p>
        )}
      </div>

      {isCurrentlySelected && (
        <CheckCircleIcon className="h-5 w-5 text-white flex-shrink-0" />
      )}
    </button>
  );
};

export default SalesChannelCard;

// import React from "react";
// import { useAppContext } from "../context/AppContext";
// import {
//   WifiIcon,
//   BuildingStorefrontIcon,
//   GlobeAltIcon,
//   CheckCircleIcon,
//   PlusCircleIcon,
// } from "@heroicons/react/24/outline";

// const SalesChannelCard = ({ channel }) => {
//   const { applicationId, changeApplication } = useAppContext();

//   let IconComponent = WifiIcon;
//   if (channel.channel_type === "store") IconComponent = BuildingStorefrontIcon;
//   if (channel.channel_type === "web" || channel.domain)
//     IconComponent = GlobeAltIcon;

//   const handleSelectApplication = (e) => {
//     e.stopPropagation();
//     if (applicationId === channel.id) {
//       changeApplication(null);
//     } else {
//       changeApplication(channel.id);
//     }
//   };

//   const isCurrentlySelected = applicationId === channel.id;

//   return (
//     <div
//       className={`relative bg-white rounded-2xl shadow-sm border flex flex-col h-full overflow-hidden transition-all duration-200 ease-in-out hover:shadow-md ${
//         isCurrentlySelected
//           ? "border-blue-500 ring-4 ring-blue-100"
//           : "border-gray-100"
//       }`}
//     >
//       {isCurrentlySelected && (
//         <div className="absolute top-2 right-2">
//           <CheckCircleIcon className="h-6 w-6 text-blue-500" />
//         </div>
//       )}

//       <div className="flex flex-col p-5 h-full">
//         <div className="mb-4 flex justify-center">
//           <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center overflow-hidden ring-2 ring-white">
//             {channel.logo ? (
//               <img
//                 src={channel.logo}
//                 alt={`${channel.name} logo`}
//                 className="w-full h-full object-contain"
//                 onError={(e) => {
//                   e.target.onerror = null;
//                   e.target.style.display = "none";
//                   const parent = e.target.parentNode;
//                   if (parent) {
//                     const iconPlaceholder = parent.querySelector(
//                       `.icon-placeholder-${channel.id}`
//                     );
//                     if (iconPlaceholder) iconPlaceholder.style.display = "flex";
//                   }
//                 }}
//               />
//             ) : null}
//             <div
//               className={`icon-placeholder-${
//                 channel.id
//               } items-center justify-center w-full h-full ${
//                 channel.logo ? "hidden" : "flex"
//               }`}
//             >
//               <IconComponent className="h-10 w-10 text-blue-500" />
//             </div>
//           </div>
//         </div>

//         <div className="flex-grow">
//           <h3
//             className="text-lg font-semibold text-gray-800 text-center mb-1 truncate"
//             title={channel.name}
//           >
//             {channel.name}
//           </h3>

//           {channel.domain ? (
//             <a
//               href={`https://${channel.domain}`}
//               target="_blank"
//               rel="noopener noreferrer"
//               onClick={(e) => e.stopPropagation()}
//               className="text-sm text-blue-600 hover:text-blue-700 hover:underline text-center block truncate mb-3"
//             >
//               {channel.domain}
//             </a>
//           ) : (
//             <p className="text-xs text-gray-400 text-center mb-3">
//               App Platform
//             </p>
//           )}

//           <div className="flex justify-center">
//             <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full capitalize">
//               {channel.channel_type
//                 ? channel.channel_type.replace("_", " ")
//                 : "Unknown Type"}
//             </span>
//           </div>
//         </div>

//         <div className="mt-4">
//           <button
//             onClick={handleSelectApplication}
//             className={`w-full py-2.5 rounded-lg text-sm font-medium flex items-center justify-center space-x-1.5 transition-colors ${
//               isCurrentlySelected
//                 ? "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
//                 : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
//             }`}
//           >
//             {isCurrentlySelected ? (
//               <>
//                 <CheckCircleIcon className="h-5 w-5" />
//                 <span>Selected</span>
//               </>
//             ) : (
//               <>
//                 <PlusCircleIcon className="h-5 w-5" />
//                 <span>Select Channel</span>
//               </>
//             )}
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default SalesChannelCard;
