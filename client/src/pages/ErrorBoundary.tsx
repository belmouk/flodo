import { useRouteError } from "react-router";

function ErrorBoundary() {
  const error = useRouteError() as Response;
  switch (error.status) {
    case 404:
      return <h1>Page not found</h1>;
    case 500:
      return <h1>Internal server error</h1>;
    default:
      return <h1>Oops... Something went wrong</h1>;
  }
}
export default ErrorBoundary;
