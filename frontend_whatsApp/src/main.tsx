import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App'; // Ton chat
import Login from './Login'; // Ton futur fichier Login
import Register from './Register'; 
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
// ... tes autres imports
import Profiles from './Profile'; // Assure-toi que le nom du fichier est correct

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/chat" element={<App />} />
        <Route
          path="/profile"
          element={<Profiles onAvatarChange={() => console.log("updated")} />}        />
        </Routes>
    </BrowserRouter>
  </React.StrictMode>
);     