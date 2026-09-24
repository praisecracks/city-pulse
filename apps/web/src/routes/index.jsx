import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import Home from "../Pages/Home";
import About from "../Pages/About";
// import AboutCompany from "../Pages/AboutCompany";
// import Builders from "../Pages/Builders";
import Contact from "../Pages/Contact";
// import Download from "../Pages/Download";

export const router = createBrowserRouter([
  {
    element: <App />, // renders NavBar + <Outlet /> + Footer
    children: [
      { path: "/", element: <Home /> },
      { path: "/about", element: <About /> },
      // { path: "/about/company", element: <AboutCompany /> },
      // { path: "/team", element: <Builders /> },
      { path: "/contact", element: <Contact /> },
      // { path: "/download", element: <Download /> },
    ],
  },
]);
