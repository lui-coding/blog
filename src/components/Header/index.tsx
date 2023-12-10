import { Link } from "react-router-dom";
import Nav from "../Nav";

export default function Header() {
  return (
    <header>
      <Link to="/">#LUI</Link>
      <Nav></Nav>
    </header>
  );
}
