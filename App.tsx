
import React, { useState, useEffect } from 'react';
import { Welcome } from './components/Welcome';
import { ChatRoom } from './components/ChatRoom';
import { Header } from './components/Header';
import { socketService } from './services/mockSocketService';
import { IntroAnimation } from './components/IntroAnimation';

const App: React.FC = () => {
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
  const [showIntro, setShowIntro] = useState(true);

  // Simple Hash-based routing to avoid complex setup
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash.startsWith('/chat/')) {
        const roomId = hash.split('/chat/')[1];
        if (roomId) {
          setCurrentRoomId(roomId);
        } else {
          setCurrentRoomId(null);
        }
      } else {
        setCurrentRoomId(null);
      }
    };

    // Check on mount
    handleHashChange();

    // Listen for changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const createRoom = () => {
    // Generate a random 6-character ID
    const newRoomId = Math.random().toString(36).substring(2, 8);
    socketService.setAsHost(true);
    window.location.hash = `/chat/${newRoomId}`;
  };

  const joinRoom = (roomId: string) => {
    socketService.setAsHost(false);
    window.location.hash = `/chat/${roomId}`;
  };

  if (showIntro) {
    return <IntroAnimation onComplete={() => setShowIntro(false)} />;
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 selection:bg-indigo-500/30">
      <Header />
      <main>
        {currentRoomId ? (
          <ChatRoom roomId={currentRoomId} />
        ) : (
          <Welcome onCreateRoom={createRoom} onJoinRoom={joinRoom} />
        )}
      </main>
    </div>
  );
};

export default App;
