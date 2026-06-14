import React, { useState , useEffect} from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Signup from "./Components/Signup";
import Login from "./Components/Login";
import Home from "./Home";
import Memory from './Memory'; 
import CreateMemory from "./CreateMemory";
import ProfileImage from "./Components/ProfileEdit";
import ProtectedRoute from "./Components/ProtectedRoute";
import socket from "./socket/socket";
export default function App() {
  const [user, setUser] = useState(undefined); 
  
  const refreshUser = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/me`, {
        credentials: "include",
      });
      if (!res.ok) {
        setUser(null);
        return;
      }
      const data = await res.json();
      setUser(data);
    } catch {
      setUser(null);
    }
  };
  useEffect(() => {
    refreshUser(); 
  }, []);
  
  useEffect(() => {
    if (user) {
      socket.connect();
      socket.emit("join", user.id);
    } else if (user === null) {
      // Only disconnect when confirmed logged out, not while still loading
      socket.disconnect();
    }
  }, [user]);
 
  const handleLogout = async () => {
    await fetch(`${import.meta.env.VITE_API_URL}/api/logout`, {
      method: "POST",
      credentials: "include",
    });
 
    socket.disconnect();
    setUser(null);
  };
 
  return (
    <Router>
      <Routes>
        <Route
          path="/" element={<Home/>}/>
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/memory" element={ <ProtectedRoute user = {user}>
        <Memory user={user} refreshUser={refreshUser} onLogout={handleLogout} />
        </ProtectedRoute> }/>
 
        <Route path="/create-memory" element={<ProtectedRoute user={user}>
        <CreateMemory /> 
        </ProtectedRoute>} />
        <Route path="/editProfile"element={ <ProtectedRoute user={user}>
        <ProfileImage refreshUser={refreshUser} />
        </ProtectedRoute>}
          />
      </Routes>
    </Router>
  );
}