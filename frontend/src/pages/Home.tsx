import { useState, useEffect } from "react";
import axios from "axios";
import { Send, Mic, Volume2, Star, ThumbsUp } from "lucide-react";

const API_BASE = "http://localhost:8000/api";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [greetingLoading, setGreetingLoading] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechRate, setSpeechRate] = useState(1);

  useEffect(() => {
    const fetchGreeting = async () => {
      try {
        const response = await axios.get(`${API_BASE}/qa/greeting`);
        console.log("Greeting API response:", response.data);
        const greetingContent = response.data.greeting || "哥哥好～（歪头）我是港航智能助手，可以帮你查水位、船舶、泊位、法规这些哦～";
        const greetingMessage: Message = {
          id: 1,
          role: "assistant",
          content: greetingContent,
          timestamp: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages([greetingMessage]);
      } catch (error) {
        console.error("Failed to fetch greeting:", error);
        const fallbackMessage: Message = {
          id: 1,
          role: "assistant",
          content: "哥哥好～（歪头）我是港航智能助手，可以帮你查水位、船舶、泊位、法规这些哦～",
          timestamp: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages([fallbackMessage]);
      } finally {
        setGreetingLoading(false);
      }
    };
    fetchGreeting();
  }, []);



  const handleSend = async () => {
    if (!inputValue.trim() || loading || greetingLoading) return;

    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content: inputValue,
      timestamp: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE}/qa/`, {
        query: inputValue,
        top_k: 5,
      });

      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: "assistant",
        content: response.data.answer || "抱歉，我暂时无法回答这个问题～（低头）",
        timestamp: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("QA failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSpeech = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === "assistant") {
      const utterance = new SpeechSynthesisUtterance(lastMessage.content);
      utterance.lang = "zh-CN";
      utterance.rate = speechRate;
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-8 h-[500px] overflow-y-auto space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] p-4 rounded-2xl ${
                    message.role === "user"
                      ? "bg-blue-600 text-white rounded-tr-none"
                      : "bg-slate-100 text-slate-800 rounded-tl-none"
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={`text-xs ${message.role === "user" ? "text-blue-200" : "text-slate-500"}`}>
                      {message.role === "user" ? "我" : "AI"}
                    </span>
                    <span className={`text-xs ${message.role === "user" ? "text-blue-200" : "text-slate-500"}`}>
                      {message.timestamp}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  {message.role === "assistant" && (
                    <div className="flex items-center space-x-3 mt-3">
                      <button className="p-1.5 rounded-full hover:bg-slate-200 transition-colors text-slate-500">
                        <ThumbsUp className="h-4 w-4" />
                      </button>
                      <button className="p-1.5 rounded-full hover:bg-slate-200 transition-colors text-slate-500">
                        <Star className="h-4 w-4" />
                      </button>
                      <button
                        onClick={handleSpeech}
                        className={`p-1.5 rounded-full hover:bg-slate-200 transition-colors ${isSpeaking ? "text-blue-600" : "text-slate-500"}`}
                      >
                        <Volume2 className={`h-4 w-4 ${isSpeaking ? "animate-pulse" : ""}`} />
                      </button>
                      <span className="text-xs text-slate-400 ml-1">朗读</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 text-slate-800 p-4 rounded-2xl rounded-tl-none">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-200">

            <div className="flex items-center space-x-3">
              <button className="p-2.5 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
                <Mic className="h-5 w-5" />
              </button>
              <div className="flex-1 relative">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="输入问题，或点击麦克风语音输入..."
                  className="w-full px-4 py-3 border border-slate-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                  rows={1}
                />
              </div>
              <button
                onClick={handleSend}
                disabled={loading || greetingLoading || !inputValue.trim()}
                title={greetingLoading ? "请稍后，正在加载问候语..." : loading ? "请稍后，正在思考中..." : undefined}
                className="p-2.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center justify-center space-x-6 mt-3 text-xs text-slate-400">
              <span>Enter 发送 · Shift+Enter 换行</span>
              <span className="flex items-center space-x-1">
                <Mic className="h-3 w-3" />
                语音输入
              </span>
              <span className="flex items-center space-x-1">
                <ThumbsUp className="h-3 w-3" />
                反馈
              </span>
              <span className="flex items-center space-x-1">
                <Volume2 className="h-3 w-3" />
                朗读听回答
              </span>
            </div>

            <div className="flex items-center justify-center space-x-3 mt-2">
              <span className="text-xs text-slate-400">朗读语速</span>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.25"
                value={speechRate}
                onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                className="w-32 accent-blue-600"
              />
              <span className="text-xs text-slate-500">{speechRate}x</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
