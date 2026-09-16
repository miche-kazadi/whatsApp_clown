  import { useState, useEffect } from "react";
  import { useNavigate } from "react-router-dom";
  import api from "./api";

  interface User {
    id: number;
    username: string;
    avatar: string;
  }

  export default function Profile({ onAvatarChange }: { onAvatarChange: (url: string) => void }) {
    const [avatar, setAvatar] = useState<string | null>(null);
    const [username, setUsername] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false); // État ajouté ici
    const navigate = useNavigate();

    useEffect(() => {
      const token = localStorage.getItem("access_token");
      const userId = localStorage.getItem("user_id");
      if (!token || !userId) {
        navigate("/login");
        return;
      }

      api.get("users/")
        .then(res => {
          const currentUser: User = res.data.find((u: User) => u.id === Number(userId));
          if (currentUser) {
            setUsername(currentUser.username);
            setAvatar(currentUser.avatar);
          }
        })
        .catch(console.error);
    }, [navigate]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        setSelectedFile(e.target.files[0]);
      }
    };

    const handleChangeAvatar = async () => {
      if (!selectedFile || isUploading) return; // Protection ajoutée
      
      setIsUploading(true); // Bloque les clics multiples

      const formData = new FormData();
      formData.append("avatar", selectedFile);

      const token = localStorage.getItem("access_token");
      try {
        const res = await fetch("http://127.0.0.1:8000/api/update-avatar/", {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        const data = await res.json();
        setAvatar(data.avatar);
        onAvatarChange(data.avatar); 
        setSelectedFile(null);
      } catch (error) {
        console.error("Erreur lors de l'upload :", error);
      } finally {
        setIsUploading(false); // Réactive le bouton une fois fini
      }
    };

    return (
      <div className="container vh-100 d-flex flex-column align-items-center justify-content-center">
        <h2>Profil de {username}</h2>

        <div className="mb-3">
          {avatar ? (
            <img
              src={avatar}
              alt="avatar"
              style={{ width: 150, height: 150, borderRadius: "50%", objectFit: "cover" }}
            />
          ) : (
            <div style={{ width: 150, height: 150, borderRadius: "50%", backgroundColor: "#ccc" }} />
          )}
        </div>

        <input type="file" accept="image/*" onChange={handleFileSelect} />
        <button
          className="btn btn-primary mt-2"
          onClick={handleChangeAvatar}
          // Désactivé si aucun fichier sélectionné OU si en train de charger
          disabled={!selectedFile || isUploading} 
        >
          {isUploading ? "Chargement..." : "Changer l'avatar"}
        </button>

        <button className="btn btn-secondary mt-3" onClick={() => navigate("/chat")}>
          Retour au chat
        </button>
      </div>
    );
  }