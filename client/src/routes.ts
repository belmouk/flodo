import HomeLayout from "./pages/HomeLayout";

const routes = [
  {
    Component: HomeLayout,
    children: [
      { path: "/", Component: null },
      {
        path: "/auth/signup",
        Component: null,
      },
      { path: "/auth/login", Component: null },
    ],
  },
];

export default routes;
