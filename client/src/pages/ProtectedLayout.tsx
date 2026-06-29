import { Outlet, Link, useNavigate } from "react-router";
import { useLoaderData } from "react-router";
import type { LoaderData } from "@/routes";
import { Button } from "@/components/ui/button";

const apiUrl = import.meta.env.VITE_API_URL;

function ProtectedLayout() {
  const user = useLoaderData<LoaderData>();
  let navigate = useNavigate();

  const handleLogOut = async () => {
    try {
      await fetch(`${apiUrl}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      navigate("/", { replace: true });
    }
  };

  return (
    <>
      <header>
        <nav className="px-4 py-4">
          <ul className="flex justify-center items-center gap-4">
            <li>
              <Link to="/workspaces">Workspaces</Link>
            </li>
            <li>
              <button onClick={handleLogOut} className="hover:cursor-pointer">
                Log out
              </button>
            </li>
          </ul>
        </nav>
      </header>
      <main className="grow flex justify-center py-16">
        <Outlet context={user} />
      </main>
      <footer className="flex justify-center">
        <div className="px-4 py-4">@2026 Rights reserved</div>
      </footer>
    </>
  );
}

export default ProtectedLayout;
