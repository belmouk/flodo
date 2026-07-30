import { useDraggable } from "@dnd-kit/react";

function Draggable({ id, content }: { id: string; content: string }) {
  const { ref } = useDraggable({ id });
  return (
    <button ref={ref} className="border p-2">
      {content}
    </button>
  );
}

export default Draggable;
