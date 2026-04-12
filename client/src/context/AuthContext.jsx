import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      const parsedUser = JSON.parse(userInfo);
      setUser(parsedUser);
      axios.defaults.headers.common['Authorization'] = `Bearer ${parsedUser.token}`;
    } else {
      // Default admin user for preview/testing purposes
      const mockUser = { username: 'Admin Preview', role: 'admin', token: 'mock-token' };
      setUser(mockUser);
      axios.defaults.headers.common['Authorization'] = `Bearer ${mockUser.token}`;
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    const { data } = await axios.post('http://localhost:5000/api/auth/login', { username, password });
    localStorage.setItem('userInfo', JSON.stringify(data));
    setUser(data);
    axios.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    return data;
  };

  const logout = () => {
    localStorage.removeItem('userInfo');
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
