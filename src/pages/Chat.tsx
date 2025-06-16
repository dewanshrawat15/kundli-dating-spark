import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Send,
  MoreVertical,
  X,
  Heart,
  Star,
  MapPin,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

import { useAuthStore } from "@/store/authStore"; // Add this import
import { useChat } from "@/hooks/useChat";

const Chat = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore(); // Get current user
  const [newMessage, setNewMessage] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use the custom hook
  const {
    messages,
    chatRoom,
    matchedUser,
    matchDetails,
    loading,
    sending,
    error,
    sendMessage,
    markMessagesAsRead,
    refreshChat,
  } = useChat(chatId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mark messages as read when component becomes visible
  useEffect(() => {
    const handleFocus = () => {
      markMessagesAsRead();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [markMessagesAsRead]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    try {
      await sendMessage(newMessage);
      setNewMessage("");
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatMatchDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString([], {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const goBack = () => {
    navigate("/matches");
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-b from-purple-600 via-blue-600 to-blue-700">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="text-white text-opacity-90">Loading chat...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-b from-purple-600 via-blue-600 to-blue-700">
        <div className="text-center space-y-4 p-6">
          <AlertCircle className="w-12 h-12 text-white mx-auto" />
          <h2 className="text-xl font-semibold text-white">Chat Error</h2>
          <p className="text-white text-opacity-80">{error}</p>
          <div className="flex space-x-3 justify-center">
            <button
              onClick={refreshChat}
              className="flex items-center space-x-2 px-4 py-2 bg-white bg-opacity-20 backdrop-blur-sm text-white rounded-lg hover:bg-opacity-30 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry</span>
            </button>
            <button
              onClick={goBack}
              className="px-4 py-2 border border-white border-opacity-30 text-white rounded-lg hover:bg-white hover:bg-opacity-10 transition-colors"
            >
              Back to Matches
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Not found state
  if (!matchedUser || !matchDetails) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-b from-purple-600 via-blue-600 to-blue-700">
        <div className="text-center space-y-4">
          <p className="text-white text-lg">Chat not found</p>
          <button
            onClick={goBack}
            className="px-6 py-2 bg-white bg-opacity-20 backdrop-blur-sm text-white rounded-lg hover:bg-opacity-30 transition-colors"
          >
            Back to Matches
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-purple-600 via-blue-600 to-blue-700  mx-auto">
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-600 to-blue-600 cursor-pointer hover:bg-opacity-90 transition-all"
        onClick={() => setShowProfile(true)}
      >
        <div className="flex items-center space-x-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              goBack();
            }}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>

          {matchedUser.profile_images?.[0] && (
            <div className="relative">
              <img
                src={matchedUser.profile_images[0]}
                alt={matchedUser.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-white border-opacity-50"
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
            </div>
          )}

          <div>
            <h1 className="font-semibold text-lg text-white">
              {matchedUser.name}, {matchedUser.age}
            </h1>
            <div className="text-sm text-white text-opacity-90">
              Match Score: {matchDetails.match_score}%
            </div>
          </div>
        </div>

        <button className="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors">
          <MoreVertical className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Match notification */}
        <div className="text-center">
          <div className="inline-flex items-center space-x-2 bg-white bg-opacity-20 text-white px-3 py-1 rounded-full text-xs">
            <Heart className="w-3 h-3 fill-current" />
            <span>
              You matched on {formatMatchDate(matchDetails.created_at)}
            </span>
          </div>
        </div>

        {/* Messages list */}
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-white text-opacity-80">
              No messages yet. Start the conversation! 💬
            </p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isCurrentUser = message.sender_id === user?.id;
            const prevMessage = messages[index - 1];
            const showSender =
              !prevMessage || prevMessage.sender_id !== message.sender_id;

            return (
              <div key={message.id} className="space-y-1">
                {/* Sender name - WhatsApp style - only show if different from previous message */}
                {showSender && (
                  <div
                    className={`text-xs text-white text-opacity-70 px-2 ${isCurrentUser ? "text-right" : "text-left"}`}
                  >
                    {isCurrentUser ? "Me" : matchedUser?.name}
                  </div>
                )}

                {/* Message bubble */}
                <div
                  className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs lg: px-4 py-3 rounded-3xl shadow-sm ${
                      isCurrentUser
                        ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white"
                        : "bg-white bg-opacity-20 backdrop-blur-sm text-white border border-white border-opacity-30"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    <p
                      className={`text-xs mt-2 ${
                        isCurrentUser
                          ? "text-white text-opacity-80"
                          : "text-white text-opacity-70"
                      }`}
                    >
                      {formatTime(message.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="w-full px-4 py-3 bg-white bg-opacity-20 backdrop-blur-sm border border-white border-opacity-30 rounded-3xl resize-none focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-all text-white placeholder-white placeholder-opacity-70"
              rows={1}
              style={{ minHeight: "48px", maxHeight: "120px" }}
              disabled={sending}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || sending}
            className="p-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full hover:from-pink-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 shadow-lg"
          >
            {sending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Profile Bottom Sheet */}
      {showProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="bg-white w-full max-h-[85vh] rounded-t-3xl overflow-y-auto animate-in slide-in-from-bottom duration-300">
            <div className="sticky top-0 bg-white p-4 border-b border-gray-200 flex items-center justify-between rounded-t-3xl">
              <h2 className="text-xl font-bold text-gray-900">Profile</h2>
              <button
                onClick={() => setShowProfile(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Profile Images */}
              {matchedUser.profile_images?.length > 0 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {matchedUser.profile_images
                      .slice(0, 4)
                      .map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={image}
                            alt={`${matchedUser.name} ${index + 1}`}
                            className="w-full h-48 object-cover rounded-xl group-hover:scale-105 transition-transform duration-200"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-xl transition-all duration-200"></div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Basic Info */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-3xl font-bold text-gray-900">
                    {matchedUser.name}, {matchedUser.age}
                  </h3>
                  <div className="flex items-center space-x-1 bg-pink-100 px-3 py-1 rounded-full">
                    <Star className="w-4 h-4 text-pink-500 fill-current" />
                    <span className="text-sm font-semibold text-pink-700">
                      {matchDetails.match_score}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{matchedUser.current_city}</span>
                </div>

                {matchedUser.bio && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-gray-700 leading-relaxed">
                      {matchedUser.bio}
                    </p>
                  </div>
                )}
              </div>

              {/* Match Details */}
              <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-5 space-y-4 border border-pink-100">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-pink-100 rounded-full">
                    <Heart className="w-5 h-5 text-pink-600 fill-current" />
                  </div>
                  <h4 className="font-bold text-pink-900 text-lg">
                    Match Analysis
                  </h4>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-pink-600">
                      {matchDetails.match_score}%
                    </div>
                    <div className="text-xs text-pink-700 uppercase tracking-wide">
                      Compatibility
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-3 text-center">
                    <div className="text-lg font-bold text-pink-600">
                      {formatMatchDate(matchDetails.created_at).split(",")[0]}
                    </div>
                    <div className="text-xs text-pink-700 uppercase tracking-wide">
                      Matched On
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4">
                  <h5 className="text-sm font-semibold text-pink-800 mb-2">
                    Why You're Compatible
                  </h5>
                  <p className="text-sm text-pink-700 leading-relaxed">
                    {matchDetails.compatibility_description}
                  </p>
                </div>
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <p className="text-xs text-blue-600 uppercase tracking-wide font-semibold">
                      Looking for
                    </p>
                  </div>
                  <p className="font-semibold text-blue-900 capitalize">
                    {matchedUser.dating_preference.replace("_", " ")}
                  </p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <p className="text-xs text-purple-600 uppercase tracking-wide font-semibold">
                      Orientation
                    </p>
                  </div>
                  <p className="font-semibold text-purple-900 capitalize">
                    {matchedUser.sexual_orientation.replace("_", " ")}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowProfile(false)}
                  className="flex-1 bg-gradient-to-r from-pink-500 to-pink-600 text-white py-3 rounded-xl font-semibold hover:from-pink-600 hover:to-pink-700 transition-all transform hover:scale-105 active:scale-95"
                >
                  Continue Chatting
                </button>
                <button className="px-6 py-3 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
                  Block
                </button>
              </div>

              {/* Bottom padding for safe area */}
              <div className="h-8"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
