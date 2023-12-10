import { NavLink } from "react-router-dom";

export default function Nav() {
  return (
    <nav>
      <NavLink to="blogs">Blogs</NavLink>
      <NavLink to="music">Music</NavLink>
    </nav>
  );
}
