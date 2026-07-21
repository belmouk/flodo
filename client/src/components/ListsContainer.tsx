function ListsContainer({ children, className }: React.ComponentProps<"ul">) {
  return <div className={className}>{children}</div>;
}

export default ListsContainer;
