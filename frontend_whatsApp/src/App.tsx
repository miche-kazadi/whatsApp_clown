import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api from './api';

interface Message {
  id?: number;
  sender: number;
  receiver?: number;
  content: string;
}

interface DecodedToken {
  username: string;
  user_id: number;
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

  // Mettre à jour la ref quand l'état change
  useEffect(() => {
    if (selectedReceiver !== null) {
      loadConversation(selectedReceiver);
    }
    selectedReceiverRef.current = selectedReceiver;
  }, [selectedReceiver]);

  const loadConversation = (receiverId: number) => {
    api.get(`messages/?receiver=${receiverId}`)
      .then(res => setMessages(res.data))
      .catch(err => console.error("Erreur chargement messages", err));
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
      return;
    }

    const decoded = jwtDecode<DecodedToken>(token);
    setUsername(decoded.username);
    setCurrentUserId(decoded.user_id);

    api.get('users/').then(res => setUsers(res.data)).catch(console.error);

    socketRef.current = new WebSocket(`ws://127.0.0.1:8000/ws/chat/?token=${token}`);
    socketRef.current.onmessage = (event) => {
      
      const data = JSON.parse(event.data);
      console.log("Message reçu du socket :", data); 

      if (data.type === "typing") {
        setTypingUsers(data.sender);
        setTimeout(() => setTypingUsers(null), 5000); 
      } else {
        const newMessage: Message = {
          sender: data.sender,
          receiver: data.receiver,
          content: data.message
        };

        if (newMessage.sender === selectedReceiverRef.current || newMessage.receiver === selectedReceiverRef.current) {
          setMessages((prev) => [...prev, newMessage]);
        }
      }
    };

    return () => socketRef.current?.close();
  }, [navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/login');
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim() || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      console.warn("Socket non disponible");
      return;
    }

    socketRef.current.send(JSON.stringify({
      type: "message",
      message: content,
      receiver: selectedReceiver
    }));

    socketRef.current.onopen = () => {
  console.log("WebSocket connecté");
};

socketRef.current.onerror = (error) => {
  console.log("Erreur WebSocket", error);
};

socketRef.current.onclose = () => {
  console.log("WebSocket fermé");
    }; socketRef.current.onopen = () => {
      console.log("WebSocket connecté");
    };

    socketRef.current.onerror = (error) => {
      console.log("Erreur WebSocket", error);
    };

    socketRef.current.onclose = () => {
      console.log("WebSocket fermé");
    };

    setContent('');
  };

  return (
    <div className="container-fluid vh-100 bg-light p-0">
      <div className="row h-100 g-0">
        {/* SIDEBAR */}
        <div className="col-md-4 col-lg-3 d-flex flex-column border-end bg-white">
          <div className="p-3 bg-dark text-white d-flex align-items-center justify-content-between">
            <h5 className="m-0">WhatsApp Clone</h5>
            <small className="opacity-75">{username}</small>
          </div>
          <div className="p-2 bg-light border-bottom text-muted small fw-bold text-uppercase">Contacts</div>
          <div className="list-group list-group-flush overflow-auto">
            {users.map((user) => (
              <button
                key={user.id}
                className={`list-group-item list-group-item-action p-3 ${selectedReceiver === user.id ? 'active' : ''}`}
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
          <div className="mt-auto p-3 border-top">
            <button className="btn btn-outline-danger btn-sm w-100" onClick={handleLogout}>Déconnexion</button>
          </div>
        </div>

        {/* CHAT AREA */}
        <div className="col-md-8 col-lg-9 d-flex flex-column" style={{ backgroundColor: '#e5ddd5' }}>
          <div className="p-3 bg-white shadow-sm border-bottom d-flex align-items-center">
            <h6 className="m-0">Discussion avec : <strong>{users.find(u => u.id === selectedReceiver)?.username || "..."}</strong></h6>
            <i className="bi bi-telephone-fill text-success" style={{ fontSize: '1.2rem' }}></i>
          { typingUsers && (
            <div style={{ fontSize: "12px", color: "gray" }}>
              {typingUsers} est en train d'écrire...
            </div>
          )}

          </div>

          

          <div className="flex-grow-1 p-4 overflow-auto">
            {messages.map((msg, index) => {
              const isMyMessage = Number(msg.sender) === Number(currentUserId);
              return (
                <div key={index} className={`d-flex mb-2 ${isMyMessage ? 'justify-content-end' : 'justify-content-start'}`}>
                  <div
                    className={`p-3 rounded-4 shadow-sm position-relative ${isMyMessage
                        ? 'bg-success text-white rounded-end-0'
                        : 'bg-white text-dark rounded-start-0'
                      }`}
                    style={{ maxWidth: '70%' }}
                  >
                    {msg.content}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={sendMessage} className="p-3 bg-light border-top d-flex gap-2">
            <input
              className="form-control rounded-pill border-0 shadow-sm px-4"
              placeholder="Tapez un message..."
              value={content}
             onChange={(e) => {setContent(e.target.value);

  if (socketRef.current?.readyState === WebSocket.OPEN && selectedReceiver) {
    socketRef.current.send(JSON.stringify({
      type: "typing",
      receiver: selectedReceiver
    }));
  }
}}
            />
            <button type="submit" className="btn btn-success rounded-circle shadow-sm" style={{ width: 45, height: 45 }}>
              <i className="bi bi-send-fill"></i> {/* Icône avion */}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;

