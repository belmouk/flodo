import { useParams, Link } from "react-router";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { fetchApi } from "@/lib/utils";
import type { Project } from "../../../server/generated/prisma/client";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldLabel,
  FieldGroup,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const apiUrl = import.meta.env.VITE_API_URL;

function Workspace() {
  const { workspaceId } = useParams();
  const { isPending, isError, error, data } = useQuery({
    queryKey: ["workspace"],
    queryFn: async () => {
      const res = await fetchApi<Project[]>(
        `${apiUrl}/workspaces/${workspaceId}/projects`,
        "GET",
      );
      if (!res.success) throw res.error;
      return res.data;
    },
  });
  if (isPending) return <p>Loading...</p>;
  if (isError) return <p>{error.message}</p>;
  return (
    <>
      <div className="flex justify-end">
        <Dialog>
          <DialogTrigger asChild>
            <Button>Add Project</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Project</DialogTitle>
            </DialogHeader>
            <form method="POST">
              <FieldSet>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="name">Name: </FieldLabel>
                    <Input type="text" id="name" name="name"></Input>
                  </Field>
                </FieldGroup>
              </FieldSet>
              <DialogFooter>
                <Button type="submit">Confirm</Button>
                <DialogClose asChild>
                  <Button type="button">Close</Button>
                </DialogClose>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {data.length === 0 ? (
        <p>This workspace has no projects. Create one to proceed.</p>
      ) : (
        <ul>
          {data.map((project) => {
            return (
              <li>
                <Link to={`/workspaces/${workspaceId}/projects/${project.id}`}>
                  {project.name}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

export default Workspace;
