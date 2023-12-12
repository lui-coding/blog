import { Outlet } from 'react-router-dom';
import Footer from '../Footer';
import Header from '../Header';

export default function Layout() {
  return (
    <div className="h-screen leading-normal bg-charade-50 text-black dark:bg-charade-950 dark:text-gray ">
      <Header />
      <Outlet />
      <Footer />
    </div>
  );
}
