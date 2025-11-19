// server.js - Production-ready Socket.io chat server with MongoDB
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const compression = require('compression');
const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');

// Load environment variables
dotenv.config();

// Import Models
const Message = require('./models/Message');
const User = require('./models/User');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  maxHttpBufferSize: 5e6,
  pingTimeout: 60000,
  pingInterval: 25000,
});


// MIDDLEWARE


app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

app.use(express.static(path.join(__dirname, 'public')));


// MONGODB CONNECTION


const connectDB = async () => {
  if (process.env.MONGODB_URI) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      console.log(' MongoDB connected successfully');
      console.log(' Database:', mongoose.connection.db.databaseName);
    } catch (error) {
      console.error(' MongoDB connection error:', error.message);
      if (process.env.NODE_ENV === 'production') {
        console.error('  Running without database in production!');
      }
    }
  } else {
    console.log('ℹ  No MONGODB_URI provided - running in-memory only');
  }
};

connectDB();


// IN-MEMORY STORES (Fallback)


const typingUsers = new Map();
const rooms = ['general', 'random', 'tech'];

rooms.forEach(room => {
  typingUsers.set(room, new Set());
});


// HELPER FUNCTIONS


const isMongoConnected = () => mongoose.connection.readyState === 1;


// SOCKET.IO EVENT HANDLERS


io.on('connection', (socket) => {
  console.log(` User connected: ${socket.id}`);

  // Handle user joining
  socket.on('user_join', async (username) => {
    try {
      // Save to MongoDB if connected
      if (isMongoConnected()) {
        const user = new User({
          username,
          socketId: socket.id,
          currentRoom: 'general',
          isOnline: true,
        });
        await user.save();
        console.log(` User saved to DB: ${username}`);
      }

      socket.join('general');

      // Get all online users from DB
      let users = [];
      if (isMongoConnected()) {
        users = await User.find({ isOnline: true }).select('username socketId currentRoom');
      }

      io.emit('user_list', users);
      io.emit('user_joined', {
        username,
        id: socket.id,
        timestamp: new Date().toISOString(),
      });

      // Send recent messages from DB
      if (isMongoConnected()) {
        const recentMessages = await Message.find({ room: 'general' })
          .sort({ timestamp: -1 })
          .limit(50)
          .lean();
        
        socket.emit('message_history', {
          room: 'general',
          messages: recentMessages.reverse(),
        });
      }

      console.log(`👤 ${username} joined the chat`);
    } catch (error) {
      console.error(' Error in user_join:', error);
    }
  });

  // Handle joining a room
  socket.on('join_room', async (room) => {
    try {
      // Update user's current room in DB
      if (isMongoConnected()) {
        await User.findOneAndUpdate(
          { socketId: socket.id },
          { currentRoom: room, lastActive: Date.now() }
        );
      }

      // Leave current room
      const rooms = Array.from(socket.rooms);
      rooms.forEach(r => {
        if (r !== socket.id) {
          socket.leave(r);
        }
      });

      // Join new room
      socket.join(room);

      // Send room message history from DB
      if (isMongoConnected()) {
        const roomMessages = await Message.find({ room })
          .sort({ timestamp: -1 })
          .limit(50)
          .lean();
        
        socket.emit('message_history', {
          room,
          messages: roomMessages.reverse(),
        });
      }

      console.log(` User joined room: ${room}`);
    } catch (error) {
      console.error(' Error in join_room:', error);
    }
  });

  // Handle chat messages
  socket.on('send_message', async (data) => {
    try {
      const { message, file, room = 'general' } = data;

      // Get user info from DB
      let sender = 'Anonymous';
      if (isMongoConnected()) {
        const user = await User.findOne({ socketId: socket.id });
        if (user) {
          sender = user.username;
          await user.updateActivity();
        }
      }

      const messageData = {
        sender,
        senderId: socket.id,
        message,
        file,
        room,
        timestamp: new Date().toISOString(),
        read: false,
      };

      // Save to MongoDB
      if (isMongoConnected()) {
        const newMessage = new Message(messageData);
        await newMessage.save();
        messageData.id = newMessage._id.toString();
        console.log(` Message saved to DB: ${newMessage._id}`);
      } else {
        messageData.id = `${Date.now()}-${socket.id}`;
      }

      // Emit to all users in the room
      io.to(room).emit('receive_message', messageData);

      socket.emit('message_delivered', {
        id: messageData.id,
        timestamp: messageData.timestamp,
      });

      console.log(`💬 Message in ${room} from ${sender}`);
    } catch (error) {
      console.error(' Error in send_message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle private messages
  socket.on('private_message', async ({ to, message, file }) => {
    try {
      let sender = 'Anonymous';
      if (isMongoConnected()) {
        const user = await User.findOne({ socketId: socket.id });
        if (user) {
          sender = user.username;
        }
      }

      const messageData = {
        sender,
        senderId: socket.id,
        to,
        message,
        file,
        timestamp: new Date().toISOString(),
        isPrivate: true,
        read: false,
      };

      // Save to MongoDB
      if (isMongoConnected()) {
        const newMessage = new Message(messageData);
        await newMessage.save();
        messageData.id = newMessage._id.toString();
        console.log(` Private message saved to DB: ${newMessage._id}`);
      } else {
        messageData.id = `${Date.now()}-${socket.id}`;
      }

      io.to(to).emit('private_message', messageData);
      socket.emit('private_message', messageData);
      socket.emit('message_delivered', {
        id: messageData.id,
        timestamp: messageData.timestamp,
      });

      console.log(` Private message from ${sender}`);
    } catch (error) {
      console.error(' Error in private_message:', error);
    }
  });

  // Handle typing indicator
  socket.on('typing', async (isTyping) => {
    try {
      let currentRoom = 'general';
      if (isMongoConnected()) {
        const user = await User.findOne({ socketId: socket.id });
        if (user) currentRoom = user.currentRoom;
      }

      const typingSet = typingUsers.get(currentRoom) || new Set();

      if (isTyping) {
        typingSet.add(socket.id);
      } else {
        typingSet.delete(socket.id);
      }

      typingUsers.set(currentRoom, typingSet);

      // Get usernames for typing users
      let typingUsernames = [];
      if (isMongoConnected()) {
        const socketIds = Array.from(typingSet);
        const users = await User.find({ socketId: { $in: socketIds } }).select('username');
        typingUsernames = users.map(u => u.username);
      }

      socket.to(currentRoom).emit('typing_users', {
        room: currentRoom,
        users: typingUsernames,
      });
    } catch (error) {
      console.error(' Error in typing:', error);
    }
  });

  // Handle read receipts
  socket.on('message_read', async ({ messageId, room }) => {
    try {
      if (isMongoConnected()) {
        const message = await Message.findByIdAndUpdate(
          messageId,
          { read: true },
          { new: true }
        );

        if (message && message.senderId) {
          const user = await User.findOne({ socketId: socket.id });
          io.to(message.senderId).emit('message_read_receipt', {
            messageId,
            readBy: user?.username || 'Someone',
            readAt: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      console.error(' Error in message_read:', error);
    }
  });

  // Handle message reactions
  socket.on('add_reaction', async ({ messageId, emoji, room }) => {
    try {
      let username = 'Anonymous';
      if (isMongoConnected()) {
        const user = await User.findOne({ socketId: socket.id });
        if (user) username = user.username;
      }

      io.to(room).emit('reaction_added', {
        messageId,
        emoji,
        username,
        userId: socket.id,
      });
    } catch (error) {
      console.error(' Error in add_reaction:', error);
    }
  });

  // Handle pagination request
  socket.on('request_messages', async ({ room, before, limit = 20 }) => {
    try {
      if (isMongoConnected()) {
        let query = { room };
        
        if (before) {
          const beforeMessage = await Message.findById(before);
          if (beforeMessage) {
            query.timestamp = { $lt: beforeMessage.timestamp };
          }
        }

        const messages = await Message.find(query)
          .sort({ timestamp: -1 })
          .limit(limit)
          .lean();

        socket.emit('message_history', {
          room,
          messages: messages.reverse(),
          hasMore: messages.length === limit,
        });
      }
    } catch (error) {
      console.error(' Error in request_messages:', error);
    }
  });

  // Handle disconnection
  socket.on('disconnect', async () => {
    try {
      let username = 'User';
      
      if (isMongoConnected()) {
        const user = await User.findOneAndUpdate(
          { socketId: socket.id },
          { isOnline: false, lastActive: Date.now() }
        );
        
        if (user) {
          username = user.username;
          
          // Clear typing indicator
          const typingSet = typingUsers.get(user.currentRoom);
          if (typingSet) {
            typingSet.delete(socket.id);
          }
        }
      }

      io.emit('user_left', {
        username,
        id: socket.id,
        timestamp: new Date().toISOString(),
      });

      // Send updated user list
      if (isMongoConnected()) {
        const onlineUsers = await User.find({ isOnline: true }).select('username socketId currentRoom');
        io.emit('user_list', onlineUsers);
      }

      console.log(`👋 ${username} left the chat`);
    } catch (error) {
      console.error(' Error in disconnect:', error);
    }
  });

  // Handle reconnection
  socket.on('reconnect_user', (username) => {
    console.log(`🔄 User reconnecting: ${username}`);
    socket.emit('user_join', username);
  });
});


// API ROUTES


app.get('/api/health', async (req, res) => {
  let userCount = 0;
  let messageCount = 0;
  
  if (isMongoConnected()) {
    userCount = await User.countDocuments({ isOnline: true });
    messageCount = await Message.countDocuments();
  }

  res.json({
    status: 'ok',
    users: userCount,
    rooms: rooms.length,
    messages: messageCount,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    mongodb: isMongoConnected() ? 'connected' : 'disconnected',
  });
});

app.get('/api/messages/:room', async (req, res) => {
  try {
    const { room } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    
    if (isMongoConnected()) {
      const messages = await Message.find({ room })
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();
      
      res.json({
        room,
        messages: messages.reverse(),
        count: messages.length,
      });
    } else {
      res.json({
        room,
        messages: [],
        count: 0,
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    if (isMongoConnected()) {
      const users = await User.find({ isOnline: true }).select('username socketId currentRoom');
      res.json({
        users,
        count: users.length,
      });
    } else {
      res.json({
        users: [],
        count: 0,
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/rooms', async (req, res) => {
  try {
    let roomStats = [];
    
    if (isMongoConnected()) {
      roomStats = await Promise.all(rooms.map(async room => {
        const userCount = await User.countDocuments({ currentRoom: room, isOnline: true });
        const messageCount = await Message.countDocuments({ room });
        return {
          name: room,
          users: userCount,
          messages: messageCount,
        };
      }));
    }
    
    res.json({ rooms: roomStats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/', (req, res) => {
  res.send('Socket.io Chat Server is running ');
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    path: req.path 
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(' Error:', err.stack);
  
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Something went wrong!' 
    : err.message;
  
  res.status(statusCode).json({ 
    error: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log('═══════════════════════════════════════');
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📁 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
  console.log(`📦 Available rooms: ${rooms.join(', ')}`);
  console.log(`🗄️  Database: ${isMongoConnected() ? ' Connected' : '  Not connected'}`);
  console.log('═══════════════════════════════════════');
});


// GRACEFUL SHUTDOWN

const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Closing server gracefully...`);
  
  server.close(() => {
    console.log('✅ HTTP server closed');
  });
  
  if (isMongoConnected()) {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
  }
  
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  if (process.env.NODE_ENV === 'production') {
    gracefulShutdown('UNHANDLED_REJECTION');
  }
});

module.exports = { app, server, io };


