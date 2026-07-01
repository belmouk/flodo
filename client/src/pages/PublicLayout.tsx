import { Outlet, Link } from "react-router";

function PublicLayout() {
  return (
    <>
      <header>
        <nav className="px-4 py-4">
          <ul className="flex justify-center gap-4">
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/login">Log in</Link>
            </li>
            <li>
              <Link to="/signup">Sign up</Link>
            </li>
          </ul>
        </nav>
      </header>
      <main className="grow flex justify-center py-16">
        <Outlet />
      </main>
      <footer className="flex justify-center">
        <div className="px-4 py-4">@2026 Rights reserved</div>
      </footer>
    </>
  );
}

export default PublicLayout;
