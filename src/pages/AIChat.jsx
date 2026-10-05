import AppLayout from "../components/AppLayout";
import ChatPanel from "../components/ChatPanel";

export default function AIChat() {
  return (
    <AppLayout
      title="AI Assistant"
      subtitle="Ask me anything about campus"
    >
      <div className="chat-page">
        <ChatPanel />
      </div>
    </AppLayout>
  );
}