import { Outlet, Link } from "react-router";

function HomeLayout() {
  return (
    <>
      <header>
        <nav>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/auth/login">Log in</Link>
            </li>
            <li>
              <Link to="/auth/signup">Sign up</Link>
            </li>
          </ul>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
      <footer>@2026 Rights reserved</footer>
    </>
  );
}

export default HomeLayout;
