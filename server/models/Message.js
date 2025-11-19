// models/Message.js
const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: String,
    required: true,
    trim: true,
  },
  senderId: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  room: {
    type: String,
    default: 'general',
    index: true,
  },
  isPrivate: {
    type: Boolean,
    default: false,
  },
  to: {
    type: String,
    default: null,
  },
  file: {
    name: String,
    type: String,
    data: String, // Base64 encoded file data
  },
  read: {
    type: Boolean,
    default: false,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt
});

// Compound indexes for better query performance
messageSchema.index({ room: 1, timestamp: -1 });
messageSchema.index({ senderId: 1, timestamp: -1 });
messageSchema.index({ to: 1, timestamp: -1 });

// Virtual for formatted date
messageSchema.virtual('formattedDate').get(function() {
  return this.timestamp.toISOString();
});

module.exports = mongoose.model('Message', messageSchema);