"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Field } from "@/components/ui/Field";
import styles from "./page.module.css";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface Profile {
  id: string;
  name: string;
  age: number;
  gender: string;
  goals: string[];
  healthConcerns?: string;
  experience: string;
  preferredTime: string;
  subscriptionType: string;
}

export default function CustomGPT() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load profiles on mount
  useEffect(() => {
    loadProfiles();
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadProfiles = async () => {
    try {
      const response = await fetch("/api/lifeengine/profiles");
      if (response.ok) {
        const data = await response.json();
        setProfiles(data.profiles || []);
        if (data.profiles?.length > 0 && !selectedProfileId) {
          setSelectedProfileId(data.profiles[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to load profiles:", error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !selectedProfileId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/lifeengine/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: selectedProfileId,
          message: userMessage.content,
          conversationHistory: messages.slice(-10), // Last 10 messages for context
        }),
      });

      if (!response.ok) throw new Error("Failed to get response");

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const selectedProfile = profiles.find(p => p.id === selectedProfileId);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>🩵 TH_LifeEngine v3.0 — The AI Wellness Architect</h1>
        <p className={styles.subtitle}>
          Hyper-personalized wellness coaching with precision, empathy, and cultural diversity. Chat for adaptive guidance that understands your unique lifestyle.
        </p>
      </header>

      <div className={styles.chatContainer}>
        {/* Profile Selector */}
        <div className={styles.profileSelector}>
          <Field label="Chat with Profile Context">
            <Select
              value={selectedProfileId}
              onChange={(e) => setSelectedProfileId(e.target.value)}
            >
              <option value="">Select a profile for personalized responses</option>
              {profiles.map(profile => (
                <option key={profile.id} value={profile.id}>
                  {profile.name} ({profile.age}y, {profile.experience})
                </option>
              ))}
            </Select>
          </Field>
          {selectedProfile && (
            <div className={styles.profileInfo}>
              <strong>{selectedProfile.name}</strong> • {selectedProfile.goals.join(", ")}
              {selectedProfile.healthConcerns && ` • ${selectedProfile.healthConcerns}`}
            </div>
          )}
        </div>

        {/* Messages */}
        <div className={styles.messages}>
          {messages.length === 0 ? (
            <div className={styles.welcome}>
              <div className={styles.welcomeIcon}>🩵</div>
              <h3>Welcome to TH_LifeEngine v3.0 — The AI Wellness Architect!</h3>
              <p>
                I'm your hyper-personalized wellness coach with the depth of an expert health coach, yoga trainer, nutritionist, and mindfulness mentor combined:
              </p>
              <ul>
                <li>🧘‍♀️ **Movement**: Yoga progressions, alignment, strength building, restorative flows</li>
                <li>🥗 **Nutrition**: Culturally rooted meals, weekly nutrition themes, sustainable habits</li>
                <li>🌙 **Rest & Recovery**: Sleep optimization, digital detox, regeneration protocols</li>
                <li>💭 **Mind & Emotion**: Meditation, breathwork, journaling, stress management</li>
                <li>🤝 **Social & Environment**: Community wellness, relationship health, lifestyle integration</li>
                <li>⚡ **Specialized Plans**: Sleep, stress reset, hormonal balance, corporate wellness, menstrual wellness</li>
              </ul>
              <p><strong>My Promise:</strong> Every plan feels handcrafted for YOUR unique background, culture, and motivation level.</p>
              <p>Select a profile above and let's architect your wellness journey together!</p>
            </div>
          ) : (
            messages.map(message => (
              <div
                key={message.id}
                className={`${styles.message} ${styles[message.role]}`}
              >
                <div className={styles.messageContent}>
                  {message.content}
                </div>
                <div className={styles.messageTime}>
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className={`${styles.message} ${styles.assistant} ${styles.loading}`}>
              <div className={styles.messageContent}>
                <div className={styles.typing}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className={styles.inputArea}>
          <div className={styles.inputContainer}>
            <Input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about wellness, plans, or health..."
              disabled={loading || !selectedProfileId}
            />
            <Button
              onClick={sendMessage}
              disabled={loading || !input.trim() || !selectedProfileId}
            >
              {loading ? "..." : "Send"}
            </Button>
          </div>
          <div className={styles.actions}>
            <Button variant="ghost" size="sm" onClick={clearChat}>
              Clear Chat
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}