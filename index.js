const express = require('express');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const bcrypt = require('bcrypt');
const multer = require('multer');
const cors = require('cors');
const { ObjectId } = require('bson');


const Users = require('./user');
const Movies = require('./movie');

const { validateInput } = require('./helpers');

// Dummy database (replace with a real database in production)
const app = express();
const PORT = 3000;


var corsOptions = {
    origin: 'http://localhost:3000/',
}

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('./uploads', express.static('uploads'));
app.use(
    session({
        secret: 'your-secret-key',
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false },
    })
);
app.use(passport.initialize());
app.use(passport.session());

x


// Passport configuration
passport.use(
    new LocalStrategy((username, password, done) => {
        Users.find({ email: username })
            .then((user) => {
                if (!user) {
                    return done(null, false, { message: 'User not found' });

                }

                bcrypt.compare(password, user[0].password, (err, isMatch) => {
                    if (err) return done(err);
                    if (!isMatch) return done(null, false, { message: 'Incorrect password' });
                    return done(null, user);
                });
            })
            .catch(err => {
                console.error(err);
                return done(null, false, { message: 'User not found' });

            })

    })
);

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((id, done) => {
    Users.findById(id)
        .then((user) => {
            done(null, user);
        })
});


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads'); // Directory to store uploaded files
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`); // Rename file to avoid conflicts
    },
});
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
            cb(null, true);
        } else {
            cb(new Error('Only JPEG and PNG files are allowed'));
        }
    },
});

// Routes
app.post('/register', async (req, res) => {
    const { password, email, name } = req.body;

    if (!validateInput(password, 'nonEmpty')) {
        return res.status(422).json({ message: 'Invalid Password' });
    }

    if (!validateInput(email, 'email')) {
        return res.status(422).json({ message: 'Invalid Email' });
    }

    if (!validateInput(name, 'alphanumeric')) {
        return res.status(422).json({ message: 'Invalid Name' });
    }

    const check = await Users.find({ email: email });
    if (check.length !== 0) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const user = new Users({
        email: email,
        name: name,
        password: password
    });

    user.save();

    res.status(201).json({ message: 'User registered successfully' });
});

app.post(
    '/login',
    passport.authenticate('local', { failureMessage: true }),
    (req, res) => {
        res.json({ message: 'Login successful', user: req.user });
    }
);

app.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) return res.status(500).json({ message: 'Error logging out' });
        res.json({ message: 'Logged out successfully' });
    });
});

// Protected route example
app.get('/profile', (req, res) => {
    if (req.isAuthenticated()) {
        return res.json({ message: 'Welcome to your profile', user: req.user });
    } else {
        return res.status(401).json({ message: 'Unauthorized' });
    }
});

app.put(
    '/movies/:id',
    upload.single('poster'), // Accept a single file with the key 'poster'
    async (req, res) => {

        if (!req.isAuthenticated()) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        try {
            const { id } = req.params;
            const { title, publishedYear } = req.body;
            const poster = req.file ? `/uploads/${req.file.filename}` : undefined;

            // Validate input
            if (!title || !publishedYear || isNaN(publishedYear)) {
                return res.status(400).json({ message: 'Invalid input. Title and published year are required.' });
            }

            // Find and update the movie
            const updatedMovie = await Movies.findByIdAndUpdate(
                id,
                {
                    ...(poster && { poster }),
                    title,
                    publishedYear: parseInt(publishedYear, 10),
                },
                { new: true, runValidators: true } // Return the updated document
            );

            if (!updatedMovie) {
                return res.status(404).json({ message: 'Movie not found' });
            }

            res.status(200).json({ message: 'Movie updated successfully', movie: updatedMovie });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Server error', error: err.message });
        }
    }
);


app.post(
    '/movies/',
    upload.single('poster'), // Accept a single file with the key 'poster'
    async (req, res) => {
        if (!req.isAuthenticated()) {
            return res.status(401).json({ message: 'Unauthorized' });
        }


        try {
            const userId = req.session.passport.user[0]._id;
            const { title, publishedYear } = req.body;
            const poster = req.file ? `/uploads/${req.file.filename}` : undefined;

            // Validate input
            if (!poster || !title || !publishedYear || isNaN(publishedYear)) {
                return res.status(400).json({
                    message: 'Invalid input. Poster, title, and published year are required.',
                });
            }

            // Create new movie
            const newMovie = new Movies({
                poster,
                title,
                publishedYear: parseInt(publishedYear, 10),
                owner: new ObjectId(userId)
            });

            const savedMovie = await newMovie.save();

            res.status(201).json({
                message: 'Movie created successfully',
                movie: savedMovie,
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Server error', error: err.message });
        }
    }
);

// Route to get all movies for a specific user ID
app.get('/movies/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        const movies = await Movies.findById(userId);
        if (movies.length === 0) {
            return res.status(404).json({ message: 'No movies found for this user' });
        }

        res.status(200).json({
            message: 'Movies retrieved successfully',
            movie: movies,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// Route to delete a movie by its ID
app.delete('/movies/:movieId', async (req, res) => {
    try {
        const { movieId } = req.params;

        const deletedMovie = await Movies.findByIdAndDelete(movieId);
        if (!deletedMovie) {
            return res.status(404).json({ message: 'Movie not found' });
        }

        res.status(200).json({
            message: 'Movie deleted successfully',
            movie: deletedMovie,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

app.get('/movies', async (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    try {
        const userId = req.session.passport.user[0]._id;
        const page = parseInt(req.query.page) || 1; // Get the page number, default to 1 if not provided
        const limit = 8; // Number of movies per page
        const skip = (page - 1) * limit; // Skip movies based on the page number

        // Fetch movies with pagination
        const movies = await Movies.find({ owner: new ObjectId(userId) })
            .skip(skip)
            .limit(limit)
            .exec();

        // Get total count of movies for pagination metadata
        const totalMovies = await Movies.countDocuments();

        // Calculate total number of pages
        const totalPages = Math.ceil(totalMovies / limit);

        // Response with movies and pagination metadata
        res.status(200).json({
            message: 'Movies retrieved successfully',
            movies,
            pagination: {
                currentPage: page,
                totalPages,
                totalMovies,
                limit,
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});


// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
