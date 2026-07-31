import { Outlet, Link, useNavigate } from "react-router";
import { useLoaderData } from "react-router";
import type { User } from "@repo/db";
import { useState } from "react";

const apiUrl = import.meta.env.VITE_API_URL;

function ProtectedLayout() {
  const user = useLoaderData<Omit<User, "password">>();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogOut = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await fetch(`${apiUrl}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error(`Logout failed: ${error as Error}`);
      setIsLoggingOut(false);
    } finally {
      await navigate("/", { replace: true });
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
              <button
                onClick={() => void handleLogOut()}
                className="hover:cursor-pointer"
                disabled={isLoggingOut}
              >
                {isLoggingOut ? "Logging out..." : "Log out"}
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
