interface ChatHeaderProps {
  selectedUser: any;
  typingUsers: number | string | null
}

export default function ChatHeader({ selectedUser, typingUsers }: ChatHeaderProps) {
  return (
    <div className="p-3 bg-white shadow-sm">
      <h6 className="m-0">
        Discussion avec : <strong>{selectedUser?.username}</strong>
      </h6>

      {typingUsers && (
        <small className="text-success">
          {typingUsers} est en train d'écrire...
        </small>
      )}
    </div>
  );
}