// src/Register.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const [message, setMessage] = useState({ text: '', type: '' }); 

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('http://127.0.0.1:8000/api/register/', { username, password });
 
      setMessage({ text: 'Compte créé avec succès ! Redirection...', type: 'success' });

      setTimeout(() => navigate('/login'), 2000); 
    } catch (err: any) {
      const errorMsg = err.response?.data?.username
        ? "Ce nom d'utilisateur est déjà pris."
        : "Erreur lors de la création du compte.";
      setMessage({ text: errorMsg, type: 'danger' });
    }
  };
  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card shadow-lg p-4 rounded" style={{ width: '400px' }}>
        <h2 className="text-center mb-4">Créer un compte</h2>

        {message.text && (
          <div className={`alert alert-${message.type} p-2 text-center`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleRegister}>
          <input className="form-control mb-3" onChange={(e) => setUsername(e.target.value)} placeholder="Utilisateur" />
          <input className="form-control mb-3" type="password" onChange={(e) => setPassword(e.target.value)} placeholder="Mot de passe" />

          <button className="btn btn-success w-100" type="submit">S'inscrire</button>
        </form>
      </div>
    </div>
  );
}