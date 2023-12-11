import { createBrowserRouter } from 'react-router-dom';
import About from './pages/About';
import Blogs from './pages/Blogs';
import Music from './pages/Music';
import Layout from './components/Layout';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <About />,
      },
      {
        path: 'blogs',
        element: <Blogs />,
      },
      {
        path: 'music',
        element: <Music />,
      },
    ],
  },
]);

export default router;
