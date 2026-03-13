import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App'; // Ton chat
import Login from './Login'; // Ton futur fichier Login
import 'bootstrap/dist/css/bootstrap.min.css';
import Register from './Register'; 
import 'bootstrap-icons/font/bootstrap-icons.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />      
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/chat" element={<App />} />    
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);