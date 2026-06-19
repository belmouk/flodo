import type { LoaderData } from "@/routes";
import { useOutletContext } from "react-router";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";

function Workspaces() {
  const user = useOutletContext<LoaderData>();

  return (
    <div className="px-4 w-full max-w-2xl">
      <h2 className="font-bold text-2xl">Workspaces</h2>
      <div className="flex justify-end">
        <Button className="mr-0 hover:cursor-pointer">Add Workspace</Button>
      </div>
      <ul>
        <li>
          <button>workspace 1</button>
        </li>
        <li>
          <button>workspace 2</button>
        </li>
      </ul>
      <h2 className="font-bold text-2xl mt-8">Projects</h2>
      <ul>
        <li>Project1</li>
        <li>Project2</li>
      </ul>
    </div>
  );
}

export default Workspaces;
