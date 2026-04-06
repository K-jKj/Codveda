import { createBrowserRouter, RouterProvider } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import Dashboard from "./pages/Dashboard";
import CoursesPage from "./pages/CoursePage";
import Profile from "./pages/Profile";
import Settings from "./pages/SettingsPage";
import ProtectedRoute from "./components/ProtectedRoute";
import ChannelPage from "./pages/ChannelPage";
import ChannelView from "./pages/ChannelView";
import CreateCourse from "./pages/CreateCourse";
import EditCourse from "./pages/EditCoursePage";

const router = createBrowserRouter([
  { path: "/", element: <HomePage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/signup", element: <SignUpPage /> },

  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <MainLayout />,
        children: [
          { path: "dashboard", element: <Dashboard /> },
          { path: "courses", element: <CoursesPage /> },
          { path: "settings", element: <Settings /> },
          { path: "profile", element: <Profile /> },
          { path: "courses/create", element: <CreateCourse /> },
          { path: "courses/:courseId/edit", element: <EditCourse /> },
          { path: "courses/:courseId", element: <ChannelPage /> },
          {
            path: "courses/:courseId/channels/:slug",
            element: <ChannelView />,
          },
        ],
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
