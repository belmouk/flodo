import HomeLayout from "./pages/HomeLayout";
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Login from "./pages/Login";

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
];

export default routes;
