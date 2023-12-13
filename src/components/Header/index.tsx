import { Link, NavLink } from 'react-router-dom';
import useDarkSide from '../../hooks/useDarkSide';
import Logo from './Logo';

const navgations = [
  {
    name: 'Blogs',
    to: 'blogs',
  },
  {
    name: 'Music',
    to: 'music',
  },

];

function Nav() {
  return (
    <div className="flex-1 flex justify-between content-center">
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
  const [theme, switchSheme] = useDarkSide();

  return (
    <header className="border-2 h-24 flex justify-between px-3 py-5  items-center">
      <Nav />
      <div className="ml-16 mr-3">
        <button onClick={switchSheme} type="button">{theme}</button>
      </div>
    </header>
  );
}
