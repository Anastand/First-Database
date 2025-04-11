// Import modules: Express for server, Mongoose for MongoDB, JWT for auth, bcrypt for password hashing
const express = require("express");
const app = express();
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

// Secret key for JWT signing (keep this safe in a real app)
const JWT_SECRET = "aryan123";

// Connect to MongoDB Atlas database
mongoose.connect("mongodb+srv://bhardwaj03aryan:9g7ncxqbbk@cluster0.le0ri9c.mongodb.net/LearningDB");

// Import user and todo models from db file
const { usersmodel, todosmodel } = require("./db");

// Middleware to parse JSON request bodies
app.use(express.json());

// Signup route: Creates a new user with hashed password
app.post("/signup", async function (req, res) {
  const name = req.body.name;       // Get name from request body
  const email = req.body.email;     // Get email from request body
  const password = req.body.password; // Get password from request body
  const hashedpass = await bcrypt.hash(password, 5); // Hash password with bcrypt (5 salt rounds)
  console.log(hashedpass);          // Log hashed password for debugging
  await usersmodel.create({         // Save user with hashed password to database
    name: name,
    email: email,
    password: hashedpass
  });
  res.json({                        // Send success response
    msg: "you are signed up"
  });
});

// Signin route: Verifies user credentials and returns JWT token
app.post("/signin", async (req, res) => {
  const email = req.body.email;     // Get email from request body
  const password = req.body.password; // Get password from request body
  const users = await usersmodel.findOne({ // Find user by email
    email: email,
  });
  if (!users) {                     // If email not found
    res.status(403).json({ msg: "you this is not a registered email addr" }); // Send error
    return;                         // Stop execution
  }
  const passmatch = await bcrypt.compare(password, users.password); // Compare input password with hashed password
  if (passmatch) {                  // If password matches
    const userToken = jwt.sign({    // Create JWT with user ID
      id: users._id.toString()
    }, JWT_SECRET);
    res.json({                      // Send token in response
      msg: userToken
    });
  } else {                          // If password doesn’t match
    res.status(403).json({         // Send error response
      msg: "incorrect credentials"
    });
  }
});

// Middleware: Verifies JWT token from request header
function auth(req, res, next) {
  const token = req.headers.token;  // Get token from headers
  const decodeddata = jwt.verify(token, JWT_SECRET); // Verify token with secret key
  if (decodeddata) {                // If token is valid
    req.userid = decodeddata.id;    // Attach user ID to request
    next();                         // Move to next function
  } else {                          // If token is invalid
    res.status(403).json("incorrect credentials"); // Send error (should be JSON object ideally)
  }
});

// Todo creation route: Adds a new todo for authenticated user
app.post("/todo", auth, async (req, res) => {
  const userid = req.userid;        // Get user ID from auth middleware
  const title = req.body.title;     // Get todo title from request body
  const completion = req.body.completion; // Get completion status from request body
  await todosmodel.create({         // Save new todo to database
    userid: userid,
    title: title,
    completion: completion
  });
  res.json({                        // Send user ID in response
    userid: userid
  });
});

// Todos retrieval route: Gets all todos for authenticated user
app.get("/todos", auth, async (req, res) => {
  const userid = req.userid;        // Get user ID from auth middleware
  const todos = await todosmodel.find({ userid: userid }); // Find todos for this user
  res.json({                        // Send todos in response
    todos                           // Short for "todos": todos
  });
});

// Start server on port 3000
app.listen(3000);

// Learning notes:
// Day 1: Learned basic MongoDB operations (connecting, creating, finding)
// Day 2: Learned password hashing with bcrypt (and mentioned Zod, likely for validation, not used here yet)