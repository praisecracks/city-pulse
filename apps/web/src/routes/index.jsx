import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import Home from "../Pages/Home";
import About from "../Pages/About";
import Contact from "../Pages/Contact";
import WaitlistSection from "../Pages/WaitlistSection";
import NotFound from "../Pages/NotFound";
import AdminLogin from "../Pages/AdminLogin";
import AdminLayout from "../Pages/AdminLayout";
import AdminDashboard from "../Pages/AdminDashboard";
import AdminWaitlist from "../Pages/AdminWaitlist";
import AdminContacts from "../Pages/AdminContacts";
import AdminUsers from "../Pages/AdminUsers";
import AdminAnalytics from "../Pages/AdminAnalytics";
import AdminRoute from "../components/AdminRoute";

export const router = createBrowserRouter([
  {
    element: <App />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/about", element: <About /> },
      { path: "/contact", element: <Contact /> },
      { path: "/waitlist", element: <WaitlistSection /> },
      { path: "*", element: <NotFound /> },
    ],
  },
  {
    element: <AdminLogin />,
    path: "/admin-pulse/login",
  },
  {
    element: <AdminRoute />,
    children: [
      { element: <AdminLayout />, children: [
        { path: "/admin-pulse", element: <AdminDashboard /> },
        { path: "/admin-pulse/waitlist", element: <AdminWaitlist /> },
        { path: "/admin-pulse/contacts", element: <AdminContacts /> },
        { path: "/admin-pulse/users", element: <AdminUsers /> },
        { path: "/admin-pulse/analytics", element: <AdminAnalytics /> },
      ]},
    ],
  },
]);