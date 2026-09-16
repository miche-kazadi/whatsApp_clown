interface SidebarProps {
  users: any[];
  selectedReceiver: number | string | null;
  setSelectedReceiver: (id: number | string | null) => void;
  username: string;
  handleLogout: () => void;
}

export default function Sidebar({
  users = [], // Sécurité : tableau vide par défaut
  selectedReceiver,
  setSelectedReceiver,
  username,
  handleLogout
}: SidebarProps) {
  return (
    // J'ai supprimé "col-md-4" ici car c'est le parent qui s'en occupe
    <div className="d-flex flex-column h-100 border-end bg-white">

      {/* Header de la Sidebar */}
      <div className="p-3 bg-dark text-white d-flex align-items-center justify-content-between shadow-sm">
        <div>
          <h6 className="m-0 fw-bold">WhatsApp Clone</h6>
          <small className="text-success">● {username}</small>
        </div>
      </div>

      <div className="p-2 bg-light border-bottom text-muted small fw-bold tracking-wider">
        CONTACTS ({users.length})
      </div>

      {/* Liste des contacts avec scroll indépendant */}
      <div className="list-group list-group-flush overflow-auto flex-grow-1 custom-scrollbar">
        {users.length > 0 ? (
          users.map((user) => (
            <button
              key={user.id}
              className={`list-group-item list-group-item-action p-3 border-0 d-flex align-items-center ${selectedReceiver === user.id ? "bg-light border-start border-4 border-primary" : ""
                }`}
              onClick={() => setSelectedReceiver(user.id)}
            >
              {/* Bulle Avatar */}
              <div
                className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-3 shadow-sm"
                style={{ width: 45, height: 45, minWidth: 45, fontSize: '1.1rem' }}
              >
                {user.username ? user.username[0].toUpperCase() : "?"}
              </div>

              <div className="text-truncate">
                <strong className="d-block text-dark">{user.username}</strong>
                <small className="text-muted">Cliquer pour discuter</small>
              </div>
            </button>
          ))
        ) : (
          <div className="p-4 text-center text-muted italic">
            Aucun contact trouvé
          </div>
        )}
      </div>

      {/* Pied de page Sidebar */}
      <div className="p-3 border-top bg-light">
        <button
          className="btn btn-outline-danger btn-sm w-100 fw-bold"
          onClick={handleLogout}
        >
          <i className="bi bi-box-arrow-left me-2"></i>Déconnexion
        </button>
      </div>
    </div>
  );
}