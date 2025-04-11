// Import required modules:
// - Express: Framework for building the server and handling HTTP requests
// - Mongoose: ODM (Object Data Modeling) library for MongoDB interaction
// - JWT: Library for generating and verifying JSON Web Tokens for authentication
// - Bcrypt: Library for securely hashing passwords
// - Zod: Schema validation library for request body validation
const express = require("express");
const app = express();
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { z } = require("zod");

// JWT secret key for signing tokens
// Improvement: In production, store this in an environment variable (e.g., process.env.JWT_SECRET) for security
const JWT_SECRET = "aryan123";

// Establish connection to MongoDB Atlas
// Note: Hardcoded credentials are shown here; in practice, use environment variables to hide sensitive info
mongoose.connect("mongodb+srv://bhardwaj03aryan:9g7ncxqbbk@cluster0.le0ri9c.mongodb.net/LearningDB");

// Import Mongoose models for users and todos from a separate database file
const { usersmodel, todosmodel } = require("./db");

// Middleware to parse incoming JSON request bodies
// This allows the server to interpret JSON data sent in POST requests
app.use(express.json());

// Signup route: Registers a new user with email, name, and hashed password
app.post("/signup", async function (req, res) {
  // Define a Zod schema to validate request body
  const bodyvalid = z.object({
    email: z.string().min(3).max(100).email(), // Ensures valid email format
    name: z.string().min(3).max(100),          // Ensures name is between 3-100 characters
    password: z.string().min(3).max(100)       // Ensures password meets length requirements
  });
  
  // Validate the request body against the schema
  const parsedbodyvalid = bodyvalid.safeParse(req.body);
  if (!parsedbodyvalid.success) {
    // Improvement: Return specific error details (parsedbodyvalid.error) for better debugging
    res.json({ msg: "Please enter valid details" });
    return;
  }

  const name = req.body.name;       // Extract name from validated request body
  const email = req.body.email;     // Extract email from validated request body
  const password = req.body.password; // Extract password from validated request body
  
  // Hash the password with bcrypt using 5 salt rounds
  // Note: Higher salt rounds (e.g., 10) increase security but slow down hashing
  const hashedpass = await bcrypt.hash(password, 5);
  console.log(hashedpass);          // Log hashed password (remove in production for security)

  // Create a new user document in the database with hashed password
  await usersmodel.create({
    name: name,
    email: email,
    password: hashedpass
  });
  
  // Send a success response to the client
  res.json({ msg: "You are signed up successfully" });
});

// Signin route: Authenticates a user and returns a JWT token
app.post("/signin", async (req, res) => {
  const email = req.body.email;     // Extract email from request body
  const password = req.body.password; // Extract password from request body
  
  // Search for a user with the provided email in the database
  const users = await usersmodel.findOne({ email: email });
  
  if (!users) {
    // If no user is found, return a 403 Forbidden status with an error message
    res.status(403).json({ msg: "This email is not registered" });
    return;
  }
  
  // Compare provided password with stored hashed password
  const passmatch = await bcrypt.compare(password, users.password);
  
  if (passmatch) {
    // If passwords match, generate a JWT containing the user’s ID
    const userToken = jwt.sign({ id: users._id.toString() }, JWT_SECRET);
    // Send the token in the response for client-side authentication
    res.json({ msg: userToken });
  } else {
    // If passwords don’t match, return a 403 Forbidden status
    res.status(403).json({ msg: "Incorrect password" });
  }
});

// Authentication middleware: Verifies JWT token from request headers
function auth(req, res, next) {
  const token = req.headers.token;  // Extract token from request headers
  
  // Verify the token using the secret key
  // Improvement: Wrap in try-catch to handle invalid token errors gracefully
  const decodeddata = jwt.verify(token, JWT_SECRET);
  
  if (decodeddata) {
    // If token is valid, attach the decoded user ID to the request object
    req.userid = decodeddata.id;
    next();                         // Proceed to the next middleware or route handler
  } else {
    // If token is invalid, return a 403 Forbidden status
    // Improvement: Use res.status(403).json({ msg: "Invalid token" }) for consistency
    res.status(403).json("incorrect credentials");
  }
};

// Todo creation route: Adds a new todo for an authenticated user
app.post("/todo", auth, async (req, res) => {
  const userid = req.userid;        // Get authenticated user ID from middleware
  const title = req.body.title;     // Extract todo title from request body
  const completion = req.body.completion; // Extract completion status from request body
  
  // Create a new todo document linked to the user
  await todosmodel.create({
    userid: userid,
    title: title,
    completion: completion
  });
  
  // Respond with the user ID (could return the created todo’s ID for better tracking)
  res.json({ userid: userid });
});

// Todos retrieval route: Fetches all todos for an authenticated user
app.get("/todos", auth, async (req, res) => {
  const userid = req.userid;        // Get authenticated user ID from middleware
  
  // Query the database for all todos associated with the user
  const todos = await todosmodel.find({ userid: userid });
  
  // Send the list of todos in the response
  res.json({ todos: todos });
});

// Start the Express server and listen on port 3000
app.listen(3000);

// Learning notes:
// Day 1: Mastered MongoDB basics—connecting to Atlas, creating records, and querying data
// Day 2: Explored password security with bcrypt and introduced Zod for input validation