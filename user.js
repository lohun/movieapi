const mongoose = require('./mongo');
const bcrypt = require('bcrypt');


// Define the User schema
const userSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId(),
  },
  name: {
    type: String,
    required: true,
    trim: true, // Removes extra spaces from the string
    minlength: 2, // Ensures a minimum length for the name
  },
  email: {
    type: String,
    required: true,
    unique: true, // Ensures no duplicate emails
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email address',
    ],
  },
  password: {
    type: String,
    required: true,
    minlength: 8, // Ensures password has at least 8 characters
  },
});

// Pre-save middleware to hash the password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Create the User model
const User = mongoose.model('User', userSchema);

module.exports = User;
