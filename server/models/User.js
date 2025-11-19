// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 20,
  },
  socketId: {
    type: String,
    required: true,
    unique: true,
  },
  currentRoom: {
    type: String,
    default: 'general',
  },
  isOnline: {
    type: Boolean,
    default: true,
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
  lastActive: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Index for faster queries
userSchema.index({ socketId: 1 });
userSchema.index({ username: 1 });
userSchema.index({ isOnline: 1 });

// Update last active timestamp
userSchema.methods.updateActivity = function() {
  this.lastActive = Date.now();
  return this.save();
};

module.exports = mongoose.model('User', userSchema);