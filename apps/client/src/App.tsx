import "./App.css";
import { RouterProvider, createBrowserRouter } from "react-router";
import routes from "./routes.js";

const router = createBrowserRouter(routes);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
