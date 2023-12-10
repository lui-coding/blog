import { RouterProvider } from "react-router-dom";
import "./App.css";
import router from "./route";

export default function App() {
  return <RouterProvider router={router} />;
}
