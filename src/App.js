import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { useAuth, AuthProvider } from './contexts/AuthContext';
import SignUp from './components/SignUp';
import Login from './components/Login';
import PrivateRoute from './components/PrivateRoute';
import Home from './components/Home';
import Profile from './components/Profile';
import Layout from './components/Layout';
import LandingPage from './components/LandingPage';
import SidebarNavigation from './components/common/SidebarNavigation';
import Bookmarks from './components/Bookmarks';
import Settings from './components/Settings';
import CreatePost from './components/CreatePost';
import { handleCreatePost } from './components/Home';
import { SettingsProvider } from './contexts/SettingsContext';

const CreatePostWrapper = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  return (
    <PrivateRoute>
      <Layout>
        <div className="max-w-2xl mx-auto p-4">
          <CreatePost 
            onCreatePost={async (postData, media, mediaType, setUploadProgress) => {
              try {
                await handleCreatePost(postData, media, mediaType, setUploadProgress, currentUser);
                navigate('/feed');
              } catch (error) {
                console.error('Error creating post:', error);
              }
            }} 
          />
        </div>
      </Layout>
    </PrivateRoute>
  );
};

function App() {
  const { currentUser } = useAuth();

  return (
    <AuthProvider>
      <SettingsProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 flex">
            {currentUser && <SidebarNavigation />}
            <div className="flex-grow">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/login" element={<Login />} />
                <Route
                  path="/feed"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <Home />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                <Route path="/create" element={<CreatePostWrapper />} />
                <Route
                  path="/profile/:userId?"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <Profile />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/bookmarks"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <Bookmarks />
                      </Layout>
                    </PrivateRoute>
                  }
                />
                {/* <Route
                  path="/settings"
                  element={
                    <PrivateRoute>
                      <Layout>
                        <Settings />
                      </Layout>
                    </PrivateRoute>
                  }
                /> */}
              </Routes>
            </div>
          </div>
        </Router>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;
