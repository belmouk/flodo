function ListsContainer({ children, className }: React.ComponentProps<"ul">) {
  return <ul className={className}>{children}</ul>;
}

export default ListsContainer;
