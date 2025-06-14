
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send } from "lucide-react";

const Chat = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      id: "1",
      senderId: "other",
      content: "Hi! I love your interest in astrology 🌟",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
    {
      id: "2",
      senderId: "me",
      content: "Thank you! Your profile shows such amazing compatibility",
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    },
    {
      id: "3",
      senderId: "other",
      content: "I know right! Our Kundli matching score was incredible",
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    }
  ]);

  const matchInfo = {
    name: "Sarah Johnson",
    age: 28,
    matchScore: 85
  };

  const sendMessage = () => {
    if (!message.trim()) return;

    const newMessage = {
      id: Date.now().toString(),
      senderId: "me",
      content: message,
      timestamp: new Date(),
    };

    setMessages([...messages, newMessage]);
    setMessage("");

    // Simulate response after 2 seconds
    setTimeout(() => {
      const responses = [
        "That's so interesting! Tell me more 😊",
        "I feel like we have such a strong connection",
        "The stars really aligned for us to meet!",
        "Would you like to meet up for coffee sometime? ☕",
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        senderId: "other",
        content: randomResponse,
        timestamp: new Date(),
      }]);
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex flex-col">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur border-b border-white/20 p-4">
        <div className="flex items-center gap-4">
          <Button
            onClick={() => navigate("/matches")}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="w-10 h-10 bg-gradient-to-b from-pink-400/30 to-purple-600/30 rounded-full flex items-center justify-center">
            👤
          </div>
          <div>
            <h2 className="text-white font-semibold">{matchInfo.name}, {matchInfo.age}</h2>
            <p className="text-purple-200 text-sm">Match Score: {matchInfo.matchScore}%</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.senderId === "me" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                msg.senderId === "me"
                  ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                  : "bg-white/20 text-white backdrop-blur"
              }`}
            >
              <p>{msg.content}</p>
              <p className="text-xs opacity-70 mt-1">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Message Input */}
      <div className="bg-white/10 backdrop-blur border-t border-white/20 p-4">
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
          />
          <Button
            onClick={sendMessage}
            disabled={!message.trim()}
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
