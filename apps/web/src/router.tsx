import { lazy } from "react";
import { createBrowserRouter } from "react-router";
import { App } from "./App";

const HomePage = lazy(() =>
  import("./routes/home").then((m) => ({ default: m.HomePage })),
);
const CompaniesPage = lazy(() =>
  import("./routes/companies").then((m) => ({ default: m.CompaniesPage })),
);
const CompanyDetailPage = lazy(() =>
  import("./routes/company-detail").then((m) => ({
    default: m.CompanyDetailPage,
  })),
);
const SubmitPage = lazy(() =>
  import("./routes/submit").then((m) => ({ default: m.SubmitPage })),
);
const SearchPage = lazy(() =>
  import("./routes/search").then((m) => ({ default: m.SearchPage })),
);
const LegalPage = lazy(() =>
  import("./routes/legal").then((m) => ({ default: m.LegalPage })),
);
const ReviewPage = lazy(() =>
  import("./routes/review").then((m) => ({ default: m.ReviewPage })),
);
const NotFoundPage = lazy(() =>
  import("./routes/not-found").then((m) => ({ default: m.NotFoundPage })),
);

export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "companies", element: <CompaniesPage /> },
      { path: "companies/:slug", element: <CompanyDetailPage /> },
      { path: "submit", element: <SubmitPage /> },
      { path: "search", element: <SearchPage /> },
      { path: "privacy", element: <LegalPage kind="privacy" /> },
      { path: "terms", element: <LegalPage kind="terms" /> },
      { path: "takedown", element: <LegalPage kind="takedown" /> },
      { path: "review", element: <ReviewPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
