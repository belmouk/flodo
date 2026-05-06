import HomeLayout from "./pages/HomeLayout";
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import InternalServerError from "./pages/InternalServerError";

const routes = [
  {
    Component: HomeLayout,
    children: [
      { path: "/", Component: Home },
      {
        path: "/auth/signup",
        Component: Signup,
      },
      { path: "/auth/login", Component: Login },
    ],
  },
  { path: "/500", Component: InternalServerError },
];

export default routes;
