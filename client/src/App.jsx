
//import { useState, useEffect } from 'react';
import { useState, useEffect, lazy, Suspense } from 'react';
import { useSocket } from './socket/socket';
//import Login from './components/Login';
//import ChatRoom from './components/ChatRoom';
//import Sidebar from './components/Sidebar';
import './App.css';

// Lazy load components for code splitting
const Login = lazy(() => import('./components/Login'));
const ChatRoom = lazy(() => import('./components/ChatRoom'));
const Sidebar = lazy(() => import('./components/Sidebar'));

// Loading component
const LoadingSpinner = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    background: 'var(--background)',
    color: 'var(--text-primary)'
  }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: '50px',
        height: '50px',
        border: '4px solid var(--border)',
        borderTop: '4px solid var(--primary-color)',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '0 auto 1rem'
      }}></div>
      <p>Loading...</p>
    </div>
  </div>
);

function App() {
  const [username, setUsername] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentRoom, setCurrentRoom] = useState('general');
  const [rooms] = useState(['general', 'random', 'tech']);
  const [selectedUser, setSelectedUser] = useState(null);
  
  const {
    isConnected,
    messages,
    users,
    typingUsers,
    connect,
    disconnect,
    sendMessage,
    sendPrivateMessage,
    setTyping,
  } = useSocket();

  const handleLogin = (name) => {
    setUsername(name);
    connect(name);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    disconnect();
    setIsLoggedIn(false);
    setUsername('');
    setCurrentRoom('general');
    setSelectedUser(null);
  };

  const handleRoomChange = (room) => {
    setCurrentRoom(room);
    setSelectedUser(null);
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    setCurrentRoom(null);
  };

  // Request notification permission
  useEffect(() => {
    if (isLoggedIn && 'Notification' in window) {
      Notification.requestPermission();
    }
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return (
      <Suspense fallback={<LoadingSpinner />}>
        <Login onLogin={handleLogin} />
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <div className="app-container">
        <Sidebar
          username={username}
          users={users}
          rooms={rooms}
          currentRoom={currentRoom}
          selectedUser={selectedUser}
          onRoomChange={handleRoomChange}
          onUserSelect={handleUserSelect}
          onLogout={handleLogout}
          isConnected={isConnected}
        />
        <ChatRoom
          username={username}
          messages={messages}
          users={users}
          typingUsers={typingUsers}
          currentRoom={currentRoom}
          selectedUser={selectedUser}
          sendMessage={sendMessage}
          sendPrivateMessage={sendPrivateMessage}
          setTyping={setTyping}
          isConnected={isConnected}
        />
      </div>
    </Suspense>
  );
}

export default App;


