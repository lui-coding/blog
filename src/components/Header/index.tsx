import { Link } from 'react-router-dom';
import Nav from '../Nav';

export default function Header() {
  return (
    <header className="bg-black text-white flex justify-around">
      <Link to="/">#LUI</Link>
      <Nav />
    </header>
  );
}
