const mongoose = require('./mongo');

// Define the Movie schema
const movieSchema = new mongoose.Schema({
  poster: {
    type: String,
    required: true,
    trim: true, // Removes extra spaces from the string
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  publishedYear: {
    type: Number,
    required: true,
    validate: {
      validator: (value) => value > 1800 && value <= new Date().getFullYear(),
      message: (props) => `${props.value} is not a valid year!`,
    },
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
});



// Create the Movie model
const Movie = mongoose.model('Movie', movieSchema);

module.exports = Movie;
