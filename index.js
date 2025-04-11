// Import required modules: Express for the server, Mongoose for MongoDB, and JWT for authentication
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

// Secret key for JWT signing (should be kept secure in a real app)
const JWT_SECRET = "aryan123";

// Connect to MongoDB Atlas database
mongoose.connect("mongodb+srv://bhardwaj03aryan:9g7ncxqbbk@cluster0.le0ri9c.mongodb.net/LearningDB");

// Import user and todo models from db file
const { usersmodel, todosmodel } = require("./db");

// Middleware to parse JSON request bodies
app.use(express.json());

// Signup route: Creates a new user in the database
app.post("/signup", async function (req, res) {
  const name = req.body.name;       // Get name from request body
  const email = req.body.email;     // Get email from request body
  const password = req.body.password; // Get password from request body
  await usersmodel.create({         // Save new user to database
    name: name,
    email: email,
    password: password
  });
  res.json({                        // Send success response
    msg: "you are signed up"
  });
});

// Signin route: Authenticates user and returns a JWT token
app.post("/signin", async (req, res) => {
  const email = req.body.email;     // Get email from request body
  const password = req.body.password; // Get password from request body
  const users = await usersmodel.findOne({ // Find user in database
    email: email,
    password: password,
  });
  console.log(users);               // Log user data for debugging
  if (users) {                      // If user exists
    const userToken = jwt.sign({    // Create JWT with user ID
      id: users._id.toString()
    }, JWT_SECRET);
    res.json({                      // Send token in response
      msg: userToken
    });
  } else {                          // If user not found
    res.status(403).json({         // Send error response
      msg: "incorrect credentials"
    });
  }
});

// Middleware: Verifies JWT token from request header
function auth(req, res, next) {
  const token = req.headers.token;  // Get token from headers
  const decodeddata = jwt.verify(token, JWT_SECRET); // Verify token
  if (decodeddata) {                // If token is valid
    req.userid = decodeddata.id;    // Attach user ID to request
    next();                         // Proceed to next function
  } else {                          // If token is invalid
    res.status(403).json("incorrect credentials"); // Send error (should be JSON object ideally)
  }
}

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