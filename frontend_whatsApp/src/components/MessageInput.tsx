interface Props {
  content: string;
  setContent: (value: string) => void;
  sendMessage: (e: React.FormEvent) => void;
  socket: WebSocket | null;
  selectedReceiver: number | string | null;
}

export default function MessageInput({
  content,
  setContent,
  sendMessage,
  socket,
  selectedReceiver
}: Props) {
  return (
    <form
      onSubmit={sendMessage}
      className="p-3 bg-white border-top d-flex gap-2"
    >
      <input
        className="form-control rounded-pill border-light bg-light px-4"
        placeholder="Tapez un message..."
        value={content}
        onChange={(e) => {
          setContent(e.target.value);

          if (
            socket?.readyState === WebSocket.OPEN &&
            selectedReceiver
          ) {
            socket.send(
              JSON.stringify({
                type: "typing",
                receiver: selectedReceiver,
              })
            );
          }
        }}
      />

      <button
        type="submit"
        className="btn btn-success rounded-circle shadow-sm"
        style={{ width: 45, height: 45 }}
      >
        ➤
      </button>
    </form>
  );
}