import { Outlet } from 'react-router-dom';
import Header from '../Header';
import Footer from '../Footer';

export default function Layout() {
  return (
    <div className="text-slate-50 bg-black container min-h-screen">
      <Header />
      <Outlet />
      <Footer />
    </div>
  );
}
