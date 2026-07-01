import type React from "react";

function ControlPanel({ children, ...props }: React.ComponentProps<"div">) {
  return (
    <div className="flex gap-0 items-center" {...props}>
      {children}
    </div>
  );
}

export default ControlPanel;
