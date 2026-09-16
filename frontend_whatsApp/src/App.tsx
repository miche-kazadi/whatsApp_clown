import React, { useState, useEffect, useMemo, useRef } from "react";
import StoryList from "./components/storyList";
import StoryViewer from "./components/storyViewer";
import AddStory from "./components/addStory";
import Sidebar from "./components/Sidebar";
import ChatHeader from "./components/ChatHeader";
import MessageList from "./components/messageList";
import MessageInput from "./components/MessageInput";

// Interfaces pour le typage TypeScript
interface User {
  id: number | string;
  username: string;
  avatar?: string;
}

interface Story {
  id: number;
  image: string;
}

const ChatContainer = () => {
  // États pour les Stories
  const [openStories, setOpenStories] = useState<Story[] | null>(null);

  // États pour le Chat
  const [users, setUsers] = useState<User[]>([]);
  const [selectedReceiver, setSelectedReceiver] = useState<number | string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const [typingUsers, setTypingUsers] = useState<any>(null);

  const username = localStorage.getItem("username") || "Utilisateur";
  const currentUserId = localStorage.getItem("user_id") || "";
  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Chargement des utilisateurs (Contacts)
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("access_token") || localStorage.getItem("token");
      if (!token) return;

      const response = await fetch("http://127.0.0.1:8000/api/users/", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await response.json();
      setUsers(Array.isArray(data) ? data : (data.results || []));
    } catch (error) {
      console.error("Erreur récupération utilisateurs:", error);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  // 2. Gestion de l'historique et de la connexion WebSocket
  useEffect(() => {
    if (!selectedReceiver) return;

    const token = localStorage.getItem("access_token") || localStorage.getItem("token");

    const fetchHistory = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/messages/?receiver=${selectedReceiver}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await response.json();
        setMessages(data);
      } catch (error) {
        console.error("Erreur historique:", error);
      }
    };
    fetchHistory();

    const socketUrl = `ws://127.0.0.1:8000/ws/chat/${selectedReceiver}/?token=${token}`;
    socketRef.current = new WebSocket(socketUrl);

    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages((prev) => {
        const isDuplicate = prev.find(m => m.id === data.id);
        if (isDuplicate) return prev;
        if (
          String(data.sender) === String(selectedReceiver) ||
          (String(data.sender) === String(currentUserId) && String(data.receiver) === String(selectedReceiver))
        ) {
          return [...prev, data];
        }
        return prev;
      });
    };

    return () => {
      socketRef.current?.close();
    };
  }, [selectedReceiver, currentUserId]);

  // 3. Envoi de message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !selectedReceiver) return;

    const token = localStorage.getItem("access_token") || localStorage.getItem("token");

    try {
      const response = await fetch("http://127.0.0.1:8000/api/messages/", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          receiver: selectedReceiver,
          content: content
        }),
      });

      if (response.ok) {
        const savedMessage = await response.json();
        setMessages((prev) => [...prev, savedMessage]);
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          socketRef.current.send(JSON.stringify(savedMessage));
        }
        setContent("");
      }
    } catch (err) {
      console.error("Erreur envoi:", err);
    }
  };

  const activeUser = useMemo(() => {
    if (!users || !Array.isArray(users)) return null;
    return users.find(u => String(u.id) === String(selectedReceiver)) || null;
  }, [users, selectedReceiver]);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div className="container-fluid vh-100 bg-light p-0 overflow-hidden">
      <div className="row h-100 g-0">

        {/* COLONNE GAUCHE : Sidebar + Stories */}
        <div className={`col-md-4 col-lg-3 h-100 border-end bg-white d-flex flex-column ${selectedReceiver ? 'd-none d-md-flex' : 'd-flex'}`}>

          {/* Header Profil */}
          <div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-light">
            <span className="fw-bold text-primary">{username}</span>
            <button onClick={handleLogout} className="btn btn-sm btn-outline-danger">Quitter</button>
          </div>

          {/* SECTION STORIES : Horizontale */}
          <div className="p-2 border-bottom bg-white overflow-hidden">
            <div className="d-flex align-items-center gap-2 overflow-auto py-1" style={{ scrollbarWidth: 'none' }}>
              <AddStory />
              <div className="vr mx-1" style={{ height: '40px', opacity: 0.2 }}></div>
              <StoryList onOpenStories={setOpenStories} />
            </div>
          </div>

          {/* LISTE DES CONTACTS (Reste de la place) */}
          <div className="flex-grow-1 overflow-auto">
            <Sidebar
              users={users}
              selectedReceiver={selectedReceiver}
              setSelectedReceiver={setSelectedReceiver}
              username={username}
              handleLogout={handleLogout}
            />
          </div>
        </div>

        {/* COLONNE DROITE : Zone de Chat */}
        <div className={`col-md-8 col-lg-9 d-flex flex-column h-100 ${!selectedReceiver ? 'd-none d-md-flex' : 'd-flex'}`} style={{ backgroundColor: "#e5ddd5" }}>
          {selectedReceiver ? (
            <>
              <ChatHeader selectedUser={activeUser || { id: 0, username: "..." }} typingUsers={typingUsers} />
              <div className="flex-grow-1 overflow-auto p-3">
                <MessageList messages={messages} currentUserId={currentUserId} messagesEndRef={messagesEndRef} />
                <div ref={messagesEndRef} />
              </div>
              <MessageInput content={content} setContent={setContent} sendMessage={sendMessage} socket={socketRef.current} selectedReceiver={selectedReceiver} />
            </>
          ) : (
            <div className="h-100 d-flex flex-column align-items-center justify-content-center text-muted p-5 text-center">
              <i className="bi bi-chat-left-text mb-3" style={{ fontSize: "4rem", opacity: 0.3 }}></i>
              <h4>Sélectionnez une discussion</h4>
              <p>Cliquez sur un contact à gauche pour commencer à envoyer des messages.</p>
            </div>
          )}
        </div>
      </div>

      {/* Viewer de stories (Overlay Plein Écran) */}
      {openStories && (
        <StoryViewer
          stories={openStories}
          onClose={() => setOpenStories(null)}
        />
      )}
    </div>
  );
};

export default ChatContainer;