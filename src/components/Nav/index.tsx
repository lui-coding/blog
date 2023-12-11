import { NavLink } from 'react-router-dom';

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

export default function Nav() {
  return (
    <nav className="">
      {navgations.map(({ to, name }) => (
        <NavLink key={name} to={to}>
          {name}
        </NavLink>
      ))}
    </nav>
  );
}
