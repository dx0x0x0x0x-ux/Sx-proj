const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const app = express();
const db = require("./firebase");

app.use(express.json());
app.use(cors());

const JWT_SECRET = "dx_movies_secret_key";
const ADMIN_USERNAMES = ['admin', 'admin', 'admin123'];

// ==================== TEST ROUTE ====================
app.get("/", (req, res) => {
    res.json({
        message: "🎬 Dx Movies API is running",
        version: "1.0.0",
        endpoints: {
            register: "POST /register",
            login: "POST /login",
            profile: "GET /profile, PUT /profile",
            movies: "GET /movies",
            addMovie: "POST /movies",
            updateMovie: "PUT /movies/:id",
            deleteMovie: "DELETE /movies/:id"
        }
    });
});

// ==================== REGISTER USER ====================
app.post("/register", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || username.trim().length < 3) {
            return res.status(400).json({ 
                message: "Username must be at least 3 characters" 
            });
        }

        if (!password || password.length < 6) {
            return res.status(400).json({ 
                message: "Password must be at least 6 characters" 
            });
        }

        const usersRef = db.collection("users");
        const existing = await usersRef.where("username", "==", username.trim()).get();

        if (!existing.empty) {
            return res.status(400).json({ 
                message: "Username already exists" 
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

               const isAdmin = ADMIN_USERNAMES.includes(username.trim().toLowerCase());
        const newUser = {
            username: username.trim(),
            password: hashedPassword,
            role: isAdmin ? "admin" : "user",
            isBanned: false,
            createdAt: new Date().toISOString()
        };

        const userRef = await usersRef.add(newUser);

        res.status(201).json({
            message: "User registered successfully 🎉",
            user: {
                id: userRef.id,
                username: username.trim()
            }
        });

    } catch (error) {
        console.error("Register error:", error);
        res.status(500).json({ 
            message: "Server error during registration",
            error: error.message 
        });
    }
});

// ==================== LOGIN USER ====================
app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ 
                message: "Username and password are required" 
            });
        }

        const usersRef = db.collection("users");
        const userSnapshot = await usersRef.where("username", "==", username.trim()).get();

        if (userSnapshot.empty) {
            return res.status(401).json({ 
                message: "Invalid username or password" 
            });
        }

        let user;
        userSnapshot.forEach(doc => {
            user = { id: doc.id, ...doc.data() };
        });

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ 
                message: "Invalid username or password" 
            });
        }

        const token = jwt.sign(
            { 
                userId: user.id, 
                username: user.username,
                role: user.role 
            },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            message: "Login successful 🎉",
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ 
            message: "Server error during login",
            error: error.message 
        });
    }
});

// ==================== AUTH MIDDLEWARE ====================
function authMiddleware(req, res, next) {
    const header = req.headers.authorization;

    if (!header) {
        return res.status(401).json({ 
            message: "No token provided. Please login first." 
        });
    }

    const parts = header.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
        return res.status(401).json({ 
            message: "Token format invalid. Use: Bearer <token>" 
        });
    }

    const token = parts[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ 
                message: "Token expired. Please login again." 
            });
        }
        return res.status(401).json({ 
            message: "Invalid token. Access denied." 
        });
    }
}

// ==================== GET ALL MEDIA ====================
app.get("/movies", authMiddleware, async (req, res) => {
    try {
        const snapshot = await db.collection("movies")
            .orderBy("createdAt", "desc")
            .get();

        const movies = [];
        snapshot.forEach(doc => {
            movies.push({
                id: doc.id,
                ...doc.data()
            });
        });

        res.json(movies);

    } catch (error) {
        console.error("Get movies error:", error);
        res.status(500).json({ 
            message: "Error fetching movies",
            error: error.message 
        });
    }
});

// ==================== ADD MEDIA ====================
app.post("/movies", authMiddleware, async (req, res) => {
    try {
        const { 
            title, 
            type, 
            rating, 
            year, 
            genre, 
            img, 
            url, 
            description 
        } = req.body;

        if (!title || title.trim().length < 2) {
            return res.status(400).json({ 
                message: "Title is required (minimum 2 characters)" 
            });
        }

        if (title.trim().length > 100) {
            return res.status(400).json({ 
                message: "Title too long (maximum 100 characters)" 
            });
        }

        const newMedia = {
            title: title.trim(),
            type: type || 'movie',
            rating: rating || null,
            year: year || null,
            genre: genre || null,
            img: img || null,
            url: url || null,
            description: description || null,
            userId: req.user.userId,
            createdBy: req.user.username,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const docRef = await db.collection("movies").add(newMedia);

        res.status(201).json({
            message: "Media added successfully 🎬",
            media: {
                id: docRef.id,
                ...newMedia
            }
        });

    } catch (error) {
        console.error("Add media error:", error);
        res.status(500).json({ 
            message: "Error adding media",
            error: error.message 
        });
    }
});

// ==================== UPDATE MEDIA ====================
app.put("/movies/:id", authMiddleware, async (req, res) => {
    try {
        const movieId = req.params.id;
        const { title, year, rating, genre, img, url, description } = req.body;

        if (!title || title.trim().length < 2) {
            return res.status(400).json({ 
                message: "Title is required (minimum 2 characters)" 
            });
        }

        if (title.trim().length > 100) {
            return res.status(400).json({ 
                message: "Title too long (maximum 100 characters)" 
            });
        }

        const movieRef = db.collection("movies").doc(movieId);
        const movie = await movieRef.get();

        if (!movie.exists) {
            return res.status(404).json({ 
                message: "Media not found" 
            });
        }

        if (movie.data().userId !== req.user.userId) {
            return res.status(403).json({ 
                message: "Access denied. You can only edit your own media." 
            });
        }

        const updatedData = {
            title: title.trim(),
            year: year || null,
            rating: rating || null,
            genre: genre || null,
            img: img || null,
            url: url || null,
            description: description || null,
            updatedAt: new Date().toISOString(),
            updatedBy: req.user.username
        };

        await movieRef.update(updatedData);

        res.json({
            message: "Media updated successfully ✏️",
            media: {
                id: movieId,
                ...movie.data(),
                ...updatedData
            }
        });

    } catch (error) {
        console.error("Update media error:", error);
        res.status(500).json({ 
            message: "Error updating media",
            error: error.message 
        });
    }
});

// ==================== DELETE MEDIA ====================
app.delete("/movies/:id", authMiddleware, async (req, res) => {
    try {
        const movieId = req.params.id;
        const movieRef = db.collection("movies").doc(movieId);
        const movie = await movieRef.get();

        if (!movie.exists) {
            return res.status(404).json({ 
                message: "Media not found" 
            });
        }

        if (movie.data().userId !== req.user.userId) {
            return res.status(403).json({ 
                message: "Access denied. You can only delete your own media." 
            });
        }

        await movieRef.delete();

        res.json({ 
            message: "Media deleted successfully 🗑️",
            deletedMovieId: movieId
        });

    } catch (error) {
        console.error("Delete media error:", error);
        res.status(500).json({ 
            message: "Error deleting media",
            error: error.message 
        });
    }
});

// ==================== GET USER PROFILE ====================
app.get("/profile", authMiddleware, async (req, res) => {
    try {
        const userRef = db.collection("users").doc(req.user.userId);
        const user = await userRef.get();

        if (!user.exists) {
            return res.status(404).json({ message: "User not found" });
        }

        const userData = user.data();
        
        res.json({
            id: user.id,
            username: userData.username,
            role: userData.role,
            createdAt: userData.createdAt
        });

    } catch (error) {
        console.error("Profile error:", error);
        res.status(500).json({ 
            message: "Error fetching profile",
            error: error.message 
        });
    }
});

// ==================== UPDATE USER PROFILE ====================
app.put("/profile", authMiddleware, async (req, res) => {
    try {
        const { username } = req.body;
        const userId = req.user.userId;

        if (!username || username.trim().length < 3) {
            return res.status(400).json({ 
                message: "Username must be at least 3 characters" 
            });
        }

        const usersRef = db.collection("users");
        const existingUser = await usersRef
            .where("username", "==", username.trim())
            .get();

        if (!existingUser.empty) {
            let isSameUser = false;
            existingUser.forEach(doc => {
                if (doc.id === userId) isSameUser = true;
            });
            
            if (!isSameUser) {
                return res.status(400).json({ 
                    message: "Username already taken by another user" 
                });
            }
        }

        const userRef = db.collection("users").doc(userId);
        await userRef.update({
            username: username.trim(),
            updatedAt: new Date().toISOString()
        });

        const moviesRef = db.collection("movies");
        const userMovies = await moviesRef.where("userId", "==", userId).get();
        
        const batch = db.batch();
        userMovies.forEach(doc => {
            batch.update(doc.ref, { createdBy: username.trim() });
        });
        await batch.commit();

        const newToken = jwt.sign(
            { userId: userId, username: username.trim(), role: req.user.role },
            JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            message: "Profile updated successfully! ✨",
            token: newToken,
            user: {
                id: userId,
                username: username.trim(),
                role: req.user.role
            }
        });

    } catch (error) {
        console.error("Update profile error:", error);
        res.status(500).json({ 
            message: "Error updating profile",
            error: error.message 
        });
    }
});



// ==================== ADMIN MIDDLEWARE ====================
function adminMiddleware(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Access denied. Admin only." });
    }
    next();
}

// ==================== ADMIN STATS ====================
app.get("/admin/stats", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const usersSnapshot = await db.collection("users").get();
        const moviesSnapshot = await db.collection("movies").where("type", "==", "movie").get();
        const showsSnapshot = await db.collection("movies").where("type", "==", "show").get();
        
        res.json({
            users: usersSnapshot.size,
            movies: moviesSnapshot.size,
            shows: showsSnapshot.size
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ==================== ADMIN GET ALL USERS ====================
app.get("/admin/users", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const snapshot = await db.collection("users").get();
        const users = [];
        snapshot.forEach(doc => {
            users.push({
                id: doc.id,
                username: doc.data().username,
                role: doc.data().role || "user",
                isBanned: doc.data().isBanned || false,
                createdAt: doc.data().createdAt
            });
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ==================== ADMIN CREATE USER ====================
app.post("/admin/users", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { username, password, role } = req.body;
        
        if (!username || username.length < 3) {
            return res.status(400).json({ message: "Username must be at least 3 characters" });
        }
        if (!password || password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }
        
        const existing = await db.collection("users").where("username", "==", username).get();
        if (!existing.empty) {
            return res.status(400).json({ message: "Username already exists" });
        }
        
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = {
            username: username.trim(),
            password: hashedPassword,
            role: role === "admin" ? "admin" : "user",
            isBanned: false,
            createdAt: new Date().toISOString()
        };
        
        const docRef = await db.collection("users").add(newUser);
        res.status(201).json({ id: docRef.id, username: newUser.username, role: newUser.role });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ==================== ADMIN UPDATE USER ====================
app.put("/admin/users/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { username, role } = req.body;
        const userId = req.params.id;
        
        const userRef = db.collection("users").doc(userId);
        const user = await userRef.get();
        if (!user.exists) {
            return res.status(404).json({ message: "User not found" });
        }
        
        const updates = {};
        if (username) updates.username = username.trim();
        if (role) updates.role = role;
        updates.updatedAt = new Date().toISOString();
        
        await userRef.update(updates);
        res.json({ message: "User updated" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ==================== ADMIN DELETE USER ====================
app.delete("/admin/users/:id", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const userId = req.params.id;
        
        // Don't allow deleting yourself
        if (userId === req.user.userId) {
            return res.status(400).json({ message: "You cannot delete your own account" });
        }
        
        await db.collection("users").doc(userId).delete();
        res.json({ message: "User deleted" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ==================== ADMIN TOGGLE BAN ====================
app.post("/admin/users/:id/ban", authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const userId = req.params.id;
        const userRef = db.collection("users").doc(userId);
        const user = await userRef.get();
        
        if (!user.exists) {
            return res.status(404).json({ message: "User not found" });
        }
        
        const currentBan = user.data().isBanned || false;
        await userRef.update({ isBanned: !currentBan });
        res.json({ message: `User ${!currentBan ? 'banned' : 'unbanned'}` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// ==================== 404 - ROUTE NOT FOUND ====================
app.use((req, res) => {
    res.status(404).json({
        message: "Route not found",
        availableRoutes: [
            "GET /",
            "POST /register",
            "POST /login",
            "GET /profile",
            "PUT /profile",
            "GET /movies",
            "POST /movies",
            "PUT /movies/:id",
            "DELETE /movies/:id"
        ]
    });
});

// ==================== ERROR HANDLING MIDDLEWARE ====================
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({
        message: "Internal server error",
        error: err.message
    });
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("=".repeat(50));
    console.log("🎬 Dx Movies Server is running!");
    console.log(`📍 URL: http://localhost:${PORT}`);
    console.log(`🔐 JWT Authentication: Enabled`);
    console.log(`📦 Database: Firebase Firestore`);
    console.log("=".repeat(50));
    console.log("\nAvailable Endpoints:");
    console.log(`  • POST   http://localhost:${PORT}/register`);
    console.log(`  • POST   http://localhost:${PORT}/login`);
    console.log(`  • GET    http://localhost:${PORT}/profile`);
    console.log(`  • PUT    http://localhost:${PORT}/profile`);
    console.log(`  • GET    http://localhost:${PORT}/movies`);
    console.log(`  • POST   http://localhost:${PORT}/movies`);
    console.log(`  • PUT    http://localhost:${PORT}/movies/:id`);
    console.log(`  • DELETE http://localhost:${PORT}/movies/:id`);
    console.log("=".repeat(50));
});