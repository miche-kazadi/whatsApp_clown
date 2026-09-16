interface Message {
  sender: number;
  content: string;
  is_read?: boolean;
}

interface Props {
  messages: Message[];
  currentUserId: number | string | null;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export default function MessageList({
  messages,
  currentUserId,
  messagesEndRef
}: Props) {
  return (
    <div className="flex-grow-1 p-4 overflow-auto d-flex flex-column">
      {messages.map((msg, index) => {
        const isMyMessage = Number(msg.sender) === Number(currentUserId);

        return (
          <div
            key={index}
            className={`d-flex mb-2 ${isMyMessage ? "justify-content-end" : "justify-content-start"
              }`}
          >
            <div
              className={`p-2 px-3 rounded-3 shadow-sm ${isMyMessage
                  ? "bg-success text-white"
                  : "bg-white text-dark"
                }`}
              style={{ maxWidth: "70%" }}
            >
              <div>{msg.content}</div>

              <div className="text-end" style={{ fontSize: "10px" }}>
                {isMyMessage && (msg.is_read ? "✔✔" : "✔")}
              </div>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}