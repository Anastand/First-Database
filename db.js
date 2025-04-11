// Importing the mongoose library to interact with MongoDB
const mongoose = require("mongoose");
// Extracting the Schema constructor from mongoose
const Schema = mongoose.Schema;
// Defining a shorthand for MongoDB's ObjectID type
const objectId = mongoose.Types.ObjectId;

// Creating a schema for the "Users" collection with fields: name, email, and password
const Users = new Schema({
  name: String, // User's name
  email: {type:String, unique:true}, // User's email address
  password: String, // User's password
});

// Creating a schema for the "Todo" collection with fields: title, completion status, and user ID
const Todo = new Schema({
  title: String, // Title of the to-do item
  completion: Boolean, // Whether the to-do item is completed (true/false)
  userid: objectId, // Reference to the user who owns this to-do item
});

// Creating a model for the "Users" schema to interact with the "users" collection in MongoDB
const usersmodel = mongoose.model("users", Users);
// Creating a model for the "Todo" schema to interact with the "todos" collection in MongoDB
const todosmodel = mongoose.model("todos", Todo);

module.exports = {
  usersmodel:usersmodel,
  todosmodel:todosmodel
}