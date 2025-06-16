import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/store/authStore";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  is_read: boolean;
  message_type: string;
}

interface ChatRoom {
  id: string;
  match_id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  updated_at: string;
  last_message_at?: string;
  is_active: boolean;
}

interface MatchedUser {
  id: string;
  name: string;
  age: number;
  bio: string;
  profile_images: string[];
  current_city: string;
  sexual_orientation: string;
  dating_preference: string;
  date_of_birth: string;
}

interface MatchDetails {
  match_score: number;
  compatibility_description: string;
  created_at: string;
  status: string;
}

interface UseChatReturn {
  // Data
  messages: Message[];
  chatRoom: ChatRoom | null;
  matchedUser: MatchedUser | null;
  matchDetails: MatchDetails | null;

  // States
  loading: boolean;
  sending: boolean;
  error: string | null;

  // Actions
  sendMessage: (content: string) => Promise<void>;
  markMessagesAsRead: () => Promise<void>;
  refreshChat: () => Promise<void>;
}

export const useChat = (chatId: string | undefined): UseChatReturn => {
  const { user } = useAuthStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [matchedUser, setMatchedUser] = useState<MatchedUser | null>(null);
  const [matchDetails, setMatchDetails] = useState<MatchDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch chat room data
  const fetchChatRoom = useCallback(async () => {
    if (!chatId || !user?.id) return null;

    try {
      const { data: chatRoomData, error: chatRoomError } = await supabase
        .from("chat_rooms")
        .select("*")
        .eq("id", chatId)
        .single();

      if (chatRoomError) {
        throw new Error(`Chat room not found: ${chatRoomError.message}`);
      }

      // Verify user has access to this chat room
      if (
        chatRoomData.user1_id !== user.id &&
        chatRoomData.user2_id !== user.id
      ) {
        throw new Error("You do not have access to this chat room");
      }

      setChatRoom(chatRoomData);
      return chatRoomData;
    } catch (err) {
      console.error("Error fetching chat room:", err);
      throw err;
    }
  }, [chatId, user?.id]);

  // Fetch matched user profile
  const fetchMatchedUser = useCallback(
    async (chatRoomData: ChatRoom) => {
      if (!user?.id) return;

      try {
        // Determine the other user's ID
        const otherUserId =
          chatRoomData.user1_id === user.id
            ? chatRoomData.user2_id
            : chatRoomData.user1_id;

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select(
            "id, name, date_of_birth, bio, profile_images, current_city, sexual_orientation, dating_preference"
          )
          .eq("id", otherUserId)
          .single();

        if (profileError) {
          throw new Error(`Profile not found: ${profileError.message}`);
        }

        // Calculate age
        const age =
          new Date().getFullYear() -
          new Date(profileData.date_of_birth).getFullYear();

        setMatchedUser({
          ...profileData,
          age,
        });
      } catch (err) {
        console.error("Error fetching matched user:", err);
        throw err;
      }
    },
    [user?.id]
  );

  // Fetch match details
  const fetchMatchDetails = useCallback(async (chatRoomData: ChatRoom) => {
    try {
      const { data: matchData, error: matchError } = await supabase
        .from("profiles_match")
        .select("match_score, compatibility_description, created_at, status")
        .eq("id", chatRoomData.match_id)
        .single();

      if (matchError) {
        throw new Error(`Match details not found: ${matchError.message}`);
      }

      setMatchDetails(matchData);
    } catch (err) {
      console.error("Error fetching match details:", err);
      throw err;
    }
  }, []);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!chatId) return;

    try {
      const { data: messagesData, error: messagesError } = await supabase
        .from("messages")
        .select("id, content, sender_id, created_at, is_read, message_type")
        .eq("chat_room_id", chatId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: true });

      if (messagesError) {
        throw new Error(`Error fetching messages: ${messagesError.message}`);
      }

      setMessages(messagesData || []);

      // Auto-mark messages as read
      await markMessagesAsRead();
    } catch (err) {
      console.error("Error fetching messages:", err);
      throw err;
    }
  }, [chatId]);

  // Mark messages as read
  const markMessagesAsRead = useCallback(async () => {
    if (!chatId || !user?.id) return;

    try {
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("chat_room_id", chatId)
        .eq("is_read", false)
        .neq("sender_id", user.id);
    } catch (err) {
      console.error("Error marking messages as read:", err);
    }
  }, [chatId, user?.id]);

  // Send message
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || !chatId || !user?.id || sending) return;

      try {
        setSending(true);
        setError(null);

        const { error: insertError } = await supabase.from("messages").insert({
          chat_room_id: chatId,
          sender_id: user.id,
          content: content.trim(),
          message_type: "text",
        });

        if (insertError) {
          throw new Error(`Failed to send message: ${insertError.message}`);
        }

        // Message will be added to the list via real-time subscription
      } catch (err) {
        console.error("Error sending message:", err);
        setError(err instanceof Error ? err.message : "Failed to send message");
        throw err;
      } finally {
        setSending(false);
      }
    },
    [chatId, user?.id, sending]
  );

  // Setup real-time subscription
  const setupRealtimeSubscription = useCallback(() => {
    if (!chatId || !user?.id) return;

    console.log("Setting up real-time subscription for chat:", chatId);

    const subscription = supabase
      .channel(`chat_${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_room_id=eq.${chatId}`,
        },
        async (payload) => {
          console.log("New message received:", payload);
          const newMessage = payload.new as Message;

          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((msg) => msg.id === newMessage.id)) {
              return prev;
            }
            return [...prev, newMessage];
          });

          // Auto-mark as read if not from current user
          if (newMessage.sender_id !== user.id) {
            setTimeout(async () => {
              try {
                await supabase
                  .from("messages")
                  .update({ is_read: true })
                  .eq("id", newMessage.id);
              } catch (err) {
                console.error("Error marking message as read:", err);
              }
            }, 1000);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `chat_room_id=eq.${chatId}`,
        },
        (payload) => {
          console.log("Message updated:", payload);
          const updatedMessage = payload.new as Message;

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === updatedMessage.id ? updatedMessage : msg
            )
          );
        }
      )
      .subscribe((status) => {
        console.log("Subscription status:", status);
      });

    return () => {
      console.log("Unsubscribing from chat:", chatId);
      subscription.unsubscribe();
    };
  }, [chatId, user?.id]);

  // Refresh all chat data
  const refreshChat = useCallback(async () => {
    if (!chatId || !user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const chatRoomData = await fetchChatRoom();
      if (!chatRoomData) return;

      await Promise.all([
        fetchMatchedUser(chatRoomData),
        fetchMatchDetails(chatRoomData),
        fetchMessages(),
      ]);
    } catch (err) {
      console.error("Error refreshing chat:", err);
      setError(err instanceof Error ? err.message : "Failed to load chat");
    } finally {
      setLoading(false);
    }
  }, [
    chatId,
    user?.id,
    fetchChatRoom,
    fetchMatchedUser,
    fetchMatchDetails,
    fetchMessages,
  ]);

  // Initial data fetch
  useEffect(() => {
    if (!chatId || !user?.id) {
      setLoading(false);
      return;
    }

    refreshChat();
  }, [chatId, user?.id, refreshChat]);

  // Setup real-time subscription
  useEffect(() => {
    if (!chatId || !user?.id || loading) return;

    const unsubscribe = setupRealtimeSubscription();
    return unsubscribe;
  }, [chatId, user?.id, loading, setupRealtimeSubscription]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setMessages([]);
      setChatRoom(null);
      setMatchedUser(null);
      setMatchDetails(null);
      setError(null);
    };
  }, []);

  return {
    // Data
    messages,
    chatRoom,
    matchedUser,
    matchDetails,

    // States
    loading,
    sending,
    error,

    // Actions
    sendMessage,
    markMessagesAsRead,
    refreshChat,
  };
};
