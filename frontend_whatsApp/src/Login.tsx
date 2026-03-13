import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://127.0.0.1:8000/api/token/', { username, password });
      localStorage.setItem('access_token', res.data.access);

      // Ici, on envoie vers /chat
      navigate('/chat');
    } catch (err) {
      alert('Erreur de connexion');
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card shadow-lg p-4 rounded" style={{ width: '400px' }}>
        <h2 className="text-center mb-4">Connexion</h2>
        <form onSubmit={handleLogin}>
          <div className="input-group mb-3">
            <span className="input-group-text"><i className="bi bi-person"></i></span>
            <input
              className="form-control"
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Utilisateur"
            />
          </div>
          <div className="input-group mb-3">
            <span className="input-group-text"><i className="bi bi-lock"></i></span>
            <input
              className="form-control"
              type="password"
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe"
            />
          </div>
          <button className="btn btn-success w-100 mb-3" type="submit">Se connecter</button>
          <p className="text-center">
            Pas de compte ? <a href="/register" className="text-decoration-none">Inscris-toi ici</a>
          </p>
        </form>
      </div>
    </div>
  );
}
