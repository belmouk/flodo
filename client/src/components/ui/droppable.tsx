import { useDroppable } from "@dnd-kit/react";
import type React from "react";

function Droppable({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { ref } = useDroppable({ id });
  return (
    <div ref={ref} className="border w-2xl h-80">
      {children}
    </div>
  );
}

export default Droppable;
