import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api from './api';

interface DecodedToken {
  username: string;
  user_id: number;
}

interface Message {
  id?: number;
  sender: number;
  receiver?: number;
  content: string;
  is_read?: boolean;
}

function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState('');
  const [username, setUsername] = useState('');
  const [typingUsers, setTypingUsers] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [selectedReceiver, setSelectedReceiver] = useState<number | null>(null);
  const [users, setUsers] = useState<any[]>([]);

  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const selectedReceiverRef = useRef<number | null>(null);
  const navigate = useNavigate();

  // 1. Initialisation : Auth, Users et WebSocket
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
      return;
    }

    const decoded = jwtDecode<DecodedToken>(token);
    const userId = decoded.user_id;
    setUsername(decoded.username);
    setCurrentUserId(decoded.user_id);

    api.get('users/')
      .then(res => setUsers(res.data))
      .catch(console.error);

    if (!socketRef.current) {
      const socket = new WebSocket(`ws://127.0.0.1:8000/ws/chat/?token=${token}`);
      socketRef.current = socket;

      socket.onopen = () => console.log("✅ WebSocket connecté");
      socket.onerror = (error) => console.log("❌ Erreur WebSocket", error);
      socket.onclose = () => console.log("⚠️ WebSocket fermé");

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("État actuel de messages :", messages);
        console.log("Message reçu :", data);

        if (data.type === "typing_event") {
          console.log("Mise à jour des traits : lecture détectée");
          setTypingUsers(data.sender);
          setTimeout(() => setTypingUsers(null), 20000);
        }
        
        else if (data.type === "message_read") {
          console.log(`Mise à jour : lecture détectée par ${data.reader}`);
          setMessages((prev) =>
            prev.map((msg) =>
              Number(msg.sender) === Number(userId) ? { ...msg, is_read: true } : msg
            )
          );
        } else if (data.type === "message") {
          const newMessage ={
            ...data ,
            sender: data.sender,
            receiver: data.receiver,
            content: data.message,
            is_read: false
          };
          if (newMessage.sender === selectedReceiverRef.current || newMessage.receiver === selectedReceiverRef.current) {
            setMessages((prev) => [...prev, newMessage]);
          }
        }
      };
    }

    // On ne ferme pas le socket au démontage pour éviter les coupures intempestives en dev
    // return () => socketRef.current?.close();
  }, [navigate]);

  // 2. Gestion du changement de contact
  useEffect(() => {
    if (selectedReceiver !== null) {
      selectedReceiverRef.current = selectedReceiver;

      // Charger l'historique
      api.get(`messages/?receiver=${selectedReceiver}`)
        .then(res => setMessages(res.data))
        .catch(err => console.error("Erreur chargement messages", err));

      // Marquer comme lu via WebSocket
      if (selectedReceiver && socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
          type: "read",
          sender: selectedReceiver
        }));
      }
    }
  }, [selectedReceiver]);

  // 3. Scroll automatique
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReceiver || !content.trim()) return;

    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      console.error("Le socket n'est pas prêt. État actuel :", socket?.readyState);
      return;
    }

    socket.send(JSON.stringify({
      type: "message",
      message: content,
      receiver: selectedReceiver
    }));

    setContent('');
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    if (socketRef.current) socketRef.current.close();
    navigate('/login');
  };

  return (
    <div className="container-fluid vh-100 bg-light p-0">
      <div className="row h-100 g-0">
        {/* SIDEBAR */}
        <div className="col-md-4 col-lg-3 d-flex flex-column border-end bg-white shadow-sm">
          <div className="p-3 bg-dark text-white d-flex align-items-center justify-content-between">
            <h5 className="m-0">WhatsApp Clone</h5>
            <small className="badge bg-success">{username}</small>
          </div>
          <div className="p-2 bg-light border-bottom text-muted small fw-bold">CONTACTS</div>
          <div className="list-group list-group-flush overflow-auto flex-grow-1">
            {users.map((user) => (
              <button
                key={user.id}
                className={`list-group-item list-group-item-action p-3 border-0 ${selectedReceiver === user.id ? 'bg-primary text-white' : ''}`}
                onClick={() => setSelectedReceiver(user.id)}
              >
                <div className="d-flex align-items-center">
                  <div className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center me-3" style={{ width: 40, height: 40 }}>
                    {user.username[0].toUpperCase()}
                  </div>
                  <strong>{user.username}</strong>
                </div>
              </button>
            ))}
          </div>
          <div className="p-3 border-top bg-white">
            <button className="btn btn-outline-danger btn-sm w-100" onClick={handleLogout}>Déconnexion</button>
          </div>
        </div>

        {/* CHAT AREA */}
        <div className="col-md-8 col-lg-9 d-flex flex-column" style={{ backgroundColor: '#e5ddd5' }}>
          {selectedReceiver ? (
            <>
              <div className="p-3 bg-white shadow-sm d-flex align-items-center justify-content-between">
                <div>
                  <h6 className="m-0">Discussion avec : <strong>{users.find(u => u.id === selectedReceiver)?.username}</strong></h6>
                  {typingUsers && <small className="text-success anim-fade">{typingUsers} est en train d'écrire...</small>}
                </div>
              </div>

              <div className="flex-grow-1 p-4 overflow-auto d-flex flex-column">
                {messages.map((msg, index) => {
                  const isMyMessage = Number(msg.sender) === Number(currentUserId);
                  return (
                    <div key={index} className={`d-flex mb-2 ${isMyMessage ? 'justify-content-end' : 'justify-content-start'}`}>
                      <div className={`p-2 px-3 rounded-3 shadow-sm ${isMyMessage ? 'bg-success text-white' : 'bg-white text-dark'}`} style={{ maxWidth: '70%' }}>
                        <div>{msg.content}</div>
                        <div className="text-end" style={{ fontSize: '10px', marginTop: '2px' }}>
                          {isMyMessage && (msg.is_read ? "✔✔" : "✔")}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={sendMessage} className="p-3 bg-white border-top d-flex gap-2">
                <input
                  className="form-control rounded-pill border-light bg-light px-4"
                  placeholder="Tapez un message..."
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    if (socketRef.current?.readyState === WebSocket.OPEN && selectedReceiver) {
                      socketRef.current.send(JSON.stringify({ type: "typing", receiver: selectedReceiver }));
                    }
                  }}
                />
                <button type="submit" className="btn btn-success rounded-circle shadow-sm" style={{ width: 45, height: 45 }}>
                  <i className="bi bi-send-fill"></i>
                </button>
              </form>
            </>
          ) : (
            <div className="h-100 d-flex align-items-center justify-content-center text-muted">
              Sélectionnez un contact pour commencer à discuter
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;