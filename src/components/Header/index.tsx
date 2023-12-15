import { Link, NavLink } from 'react-router-dom';
import DarkModeSwitch from './DarkModeSwitch';
import Logo from './Logo';

const navgations = [
  {
    name: 'Blog',
    to: 'blog',
  },
  {
    name: 'Music',
    to: 'music',
  },

];

function Nav() {
  return (
    <div className="flex-1 flex justify-between content-center items-center">
      <Link to="/">
        <Logo />
      </Link>
      <nav className="space-x-28">
        {navgations.map(({ to, name }) => (
          <NavLink
            className=""
            key={name}
            to={to}
          >
            {name}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

export default function Header() {
  return (
    <header className=" h-24 flex justify-between px-3 py-5  items-center">
      <Nav />
      <div className="ml-16 mr-3">
        <DarkModeSwitch />
      </div>
    </header>
  );
}
