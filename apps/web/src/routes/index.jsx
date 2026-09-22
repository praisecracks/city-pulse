import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import Home from "../Pages/Home";
// import AboutProduct from "../Pages/AboutProduct";
// import AboutCompany from "../Pages/AboutCompany";
// import Builders from "../Pages/Builders";
// import Contact from "../Pages/Contact";
// import Download from "../Pages/Download";

export const router = createBrowserRouter([
  {
    element: <App />, // renders NavBar + <Outlet /> + Footer
    children: [
      { path: "/", element: <Home /> },
      // { path: "/about/product", element: <AboutProduct /> },
      // { path: "/about/company", element: <AboutCompany /> },
      // { path: "/team", element: <Builders /> },
      // { path: "/contact", element: <Contact /> },
      // { path: "/download", element: <Download /> },
    ],
  },
]);
