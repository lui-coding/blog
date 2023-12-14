import { createBrowserRouter } from 'react-router-dom';
import About from './pages/About';
import Blog from './pages/Blog';
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
        path: 'blog',
        element: <Blog />,
      },
      {
        path: 'music',
        element: <Music />,
      },
    ],
  },
]);

export default router;
