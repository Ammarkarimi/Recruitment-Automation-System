// import React from "react";
// import { useRoutes, Navigate } from "react-router-dom";
// import JobDescriptionModule from "../Pages/Job_description/JobDescriptionModule";
// import ResumeCollectorModule from "../Pages/ResumesCollector/ResumeCollectorModule";
// import EmailModule from "../Pages/Email/EmailModule";
// import TestModule from "../Pages/Test/TestModule";
// import InterviewModule from "../Pages/Interview/InterviewModule"; // Import the new Interview page

// export default function MainRoutes() {
//   let stored_token = localStorage.getItem("api_token");
//   var isAuthenticated = Boolean(stored_token);
//   let loggedInTime = localStorage.getItem("loginTime");

//   return useRoutes([
//     {
//       path: "/job_description",
//       element: <JobDescriptionModule />,
//     },
//     {
//       path: "/resume-collector", // Path for the resume collector
//       element: <ResumeCollectorModule />,
//     },
//     {
//       path: "/email",
//       element: <EmailModule />,
//     },
//     {
//       path: "/test",
//       element: <TestModule />,
//     },
//     {
//       path: "/interview",
//       element: <InterviewModule />, // This renders the Interview page
//     },    
//     {
//       path: "/",
//       element: <Navigate to={"/job_description"} />,
//     },
//   ]);
// }




// src/Routes/MainRoutes.js

import React from "react";
import { useRoutes, Navigate } from "react-router-dom";
import JobDescriptionModule from "../Pages/Job_description/JobDescriptionModule";
import ResumeCollectorModule from "../Pages/ResumesCollector/ResumeCollectorModule";
import EmailModule from "../Pages/Email/EmailModule";
import TestModule from "../Pages/Test/TestModule";
import InterviewModule from "../Pages/Interview/InterviewModule";
import InterviewOverModule from "../Pages/InterviewOver/InterviewOverModule";
import LandingPage from "../Pages/LandingPage/LandingPage"; // Import the Landing Page

export default function MainRoutes() {
  let stored_token = localStorage.getItem("api_token");
  var isAuthenticated = Boolean(stored_token);
  let loggedInTime = localStorage.getItem("loginTime");

  return useRoutes([
    {
      path: "/",
      element: <LandingPage />, // Set LandingPage as the default route
    },
    {
      path: "/job_description",
      element: <JobDescriptionModule />,
    },
    {
      path: "/resume-collector",
      element: <ResumeCollectorModule />,
    },
    {
      path: "/email",
      element: <EmailModule />,
    },
    {
      path: "/test",
      element: <TestModule />,
    },
    {
      path: "/interview",
      element: <InterviewModule />,
    },
    {
      path: "/interview-over",
      element: <InterviewOverModule />,
    },
    {
      path: "*",
      element: <Navigate to="/" />, // Redirect invalid paths to the landing page
    },
  ]);
}

