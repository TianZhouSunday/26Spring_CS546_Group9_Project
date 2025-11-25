import bcrypt from 'bcrypt';
import { users } from '../config/mongoCollections.js';

const SALT_ROUNDS = 16;

const checkString = (str) => {
		return (typeof(str) === "string" && str.trim().length > 0);
}

/**
 * Create a new user.
 * Required fields: username, password, email.
 * Initialize all other fields in the schema
 */
export const createUser = async (username, password, email) => {
  //validate input
	if(!checkString(username) || !checkString(password) || !checkString(email)){
    throw Error('createUser: Must provide a valid username, password, and email.');
  }
  username = username.trim().toLowerCase();
  email = email.trim().toLowerCase();

  const userCollection = await users();

  // Check duplicates
  const existingUsername = await userCollection.findOne({ username });
  if (existingUsername) throw Error('createUser: Username already exists');

  const existingEmail = await userCollection.findOne({ email });
  if (existingEmail) throw Error('createUser: Email already in use');

  // generate hashed password
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // Initialize remaining fields
  const newUser = {
    username,
    password: hashedPassword,
    email,
    role: 'user', // Default role is 'user', can be 'admin'
    location: {
      longitude: null,
      latitude: null
    },
    profile_picture: null,
    user_score: 0,
    posts: [],
    comments: [],
    blocked_users: [],
    reports: []
  };

  const insertInfo = await userCollection.insertOne(newUser);
  if (!insertInfo.acknowledged || !insertInfo.insertedId)
    throw Error('createUser: Could not add user');

  const createdUser = await userCollection.findOne({ _id: insertInfo.insertedId });
  return createdUser;
};

/**
 * Validate user credentials for login.
 */
export const checkUser = async (email, password) => {
  //validate input
	if(!checkString(email) || !checkString(password)){
    throw Error('checkUser: must provide valid email and password.');
  }
  email = email.trim().toLowerCase();


  const userCollection = await users();
  const user = await userCollection.findOne({ email });
  if (!user) throw Error('checkUser: Invalid email or password');

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw Error('checkUser: Invalid email or password');

  return {
    _id: user._id,
    username: user.username,
    email: user.email,
    role: user.role || 'user', // Include role in session
    location: user.location,
    profile_picture: user.profile_picture,
    user_score: user.user_score,
    posts: user.posts,
    comments: user.comments,
    blocked_users: user.blocked_users,
    reports: user.reports
  };
};
