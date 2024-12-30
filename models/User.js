import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  firebaseUid: {
    type: String,
    required: true,
    unique: true
  },
  email: String,
  name: String,
  selectedLanguage: String,
  proficiencyLevel: Number,
  learningGoal: String,
  progress: {
    currentLevel: {
      type: Number,
      default: 1
    },
    xpPoints: {
      type: Number,
      default: 0
    },
    lessonsCompleted: [{
      lessonId: String,
      completedAt: Date,
      score: Number,
      mistakes: Number
    }],
    streakDays: {
      type: Number,
      default: 0
    },
    lastActivity: {
      type: Date,
      default: Date.now
    },
    achievements: [{
      id: String,
      name: String,
      unlockedAt: Date
    }]
  }
}, {
  timestamps: true
});

export default mongoose.models.User || mongoose.model('User', UserSchema); 