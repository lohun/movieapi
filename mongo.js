const mongoose = require('mongoose');

mongoose
  .connect('mongodb+srv://movie:UMzhceFUPMrobZVp@cluster0.gmrsueq.mongodb.net/movies?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

module.exports = mongoose;