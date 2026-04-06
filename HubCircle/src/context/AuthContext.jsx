import { useState } from 'react';
import { AuthContext } from './AuthContext';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedName  = localStorage.getItem("hubcircle_user_name");
    const savedEmail = localStorage.getItem("hubcircle_user_email");
    const savedId    = localStorage.getItem("hubcircle_user_id");
    const savedRole  = localStorage.getItem("hubcircle_user_role");

    if (savedName && savedEmail && savedId) {
      return { name: savedName, email: savedEmail, _id: savedId, role: savedRole };
    }
    return null;
  });

  const isLoggedIn = !!user;

  const login = (userData) => {
    localStorage.setItem("hubcircle_user_name", userData.name);
    localStorage.setItem("hubcircle_user_email", userData.email);
    localStorage.setItem("hubcircle_user_id", userData._id || userData.id);
    localStorage.setItem("hubcircle_user_role", userData.role);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("hubcircle_user_name");
    localStorage.removeItem("hubcircle_user_email");
    localStorage.removeItem("hubcircle_user_id");
    localStorage.removeItem("hubcircle_user_role");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};