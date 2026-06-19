import { Link } from "react-router";

interface Item {
  text: string;
  link: string;
}

interface NavbarProps {
  items: Item[];
  className?: string;
}

function Navbar({ items, className }: NavbarProps) {
  return (
    <nav className={className}>
      <ul className="flex justify-center gap-4">
        {items.map((item) => {
          return (
            <li key={item.link}>
              <Link to={item.link}>{item.text}</Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default Navbar;
