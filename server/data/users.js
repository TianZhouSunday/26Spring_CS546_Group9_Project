import bcrypt from 'bcrypt';
import { users } from '../config/mongoCollections.js';
import isEmail from 'validator/lib/isEmail.js';
import { ObjectId } from "mongodb";

const SALT_ROUNDS = 16;

const checkString = (str) => {
  return (typeof (str) === "string" && str.trim().length > 0);
}

/**
 * Create a new user.
 * Required fields: username, password, email.
 * Initialize all other fields in the schema
 */
export const createUser = async (username, password, email, hideSensitiveContent = false) => {
  //validate input
  if (!checkString(username) || !checkString(password) || !checkString(email)) {
    throw Error('createUser: Must provide a valid username, password, and email.');
  }
  username = username.trim().toLowerCase();
  email = email.trim().toLowerCase();

  if (!isEmail(email)) {
    throw Error('createUser: Must provide a valid email address.');
  }
  const userCollection = await users();

  //confirm password is at least 8 characters and contains a number and capital letter
  if (!password.match(/[0-9]/) || !password.match(/[A-Z]/) || (password.trim()).length < 8) {
    throw Error('createUser: Password must be at least 8 characters and contain a capital letter and a number.');
  }


  // Check duplicates
  const existingUsername = await userCollection.findOne({ username });
  if (existingUsername) throw Error('createUser: Username already exists');

  const existingEmail = await userCollection.findOne({ email });
  if (existingEmail) throw Error('createUser: Email already in use');

  // generate hashed password
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // Initialize remaining fields
  const newUser = {
    username: username,
    password: hashedPassword,
    phone_number: null,
    email: email,
    age: null,
    home_address: null,
    location: {
      longitude: null,
      latitude: null
    },
    profile_picture: null,
    user_score: 0,
    posts: [],
    comments: [],
    blocked_users: [],
    reports: [],
    reports: [],
    hideSensitiveContent: hideSensitiveContent,
    role: "user"
  };

  const insertInfo = await userCollection.insertOne(newUser);
  if (!insertInfo.acknowledged) throw Error('createUser: Could not add user');

  newUser._id = insertInfo.insertedId;
  return newUser;
};

/**
 * Validate user credentials for login.
 */
export const checkUser = async (email, password) => {
  //validate input
  if (!checkString(email) || !checkString(password)) {
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
    phone_number: user.phone_number,
    email: user.email,
    age: user.age,
    home_address: user.home_address,
    location: user.location,
    profile_picture: user.profile_picture,
    user_score: user.user_score,
    posts: user.posts,
    comments: user.comments,
    blocked_users: user.blocked_users,
    reports: user.reports,
    hideSensitiveContent: user.hideSensitiveContent || false,
    role: user.role || "user"
  };
};

export const updateUser = async (
  userId,
  username,
  phone_number,
  email,
  age,
  home_address,
  location,
  profile_picture,
  hideSensitiveContent
) => {
  //validate input
  if (!checkString(userId) || !checkString(username) || !checkString(email)) {
    throw Error('updateUser: Must provide a valid Id, username and email.');
  }
  const userCollection = await users();
  const _id = ObjectId.isValid(userId) ? ObjectId.createFromHexString(userId) : null;
  if (!_id) throw new Error('updateUser: invalid user id');

  const user = await userCollection.findOne({ _id });
  if (!user) throw new Error('updateUser: user not found');

  username = username.trim().toLowerCase();
  email = email.trim().toLowerCase();

  if (!isEmail(email)) {
    throw Error('updateUser: Must provide a valid email address.');
  }

  // Check duplicates
  const existingUsername = await userCollection.findOne({ username, _id: { $ne: _id } });
  if (existingUsername) throw Error('updateUser: Username already exists');

  const existingEmail = await userCollection.findOne({ email, _id: { $ne: _id } });
  if (existingEmail) throw Error('updateUser: Email already in use');


  //validate remaining fields
  if (phone_number !== null && typeof phone_number !== "string") {
    throw Error("updateUser: phone_number must be a string or null");
  }

  if (age !== null) {
    if (typeof age !== "number" || age < 0 || age > 120) {
      throw Error("updateUser: age must be a valid number between 0-120 or null");
    }
  }

  if (home_address !== null && !checkString(home_address)) {
    throw Error("updateUser: home_address must be a valid string or null");
  }

  if (location !== null) {
    if (typeof location !== "object") {
      throw Error("updateUser: location must be an object with latitude & longitude");
    }
    if (
      typeof location.latitude !== "number" ||
      typeof location.longitude !== "number"
    ) {
      throw Error("updateUser: location must include valid numeric latitude & longitude");
    }
  }

  if (profile_picture !== null && typeof profile_picture !== "string") {
    throw Error("updateUser: profile_picture must be a string URL or null");
  }

  if (hideSensitiveContent !== undefined && hideSensitiveContent !== null && typeof hideSensitiveContent !== "boolean") {
    throw Error("updateUser: hideSensitiveContent must be a boolean");
  }

  const updatedUser = {
    username,
    phone_number,
    email,
    age,
    home_address,
    location,
    profile_picture
  };

  if (hideSensitiveContent !== undefined && hideSensitiveContent !== null) {
    updatedUser.hideSensitiveContent = hideSensitiveContent;
  }

  //perform update
  const updateRes = await userCollection.updateOne(
    { _id },
    { $set: updatedUser }
  );

  if (!updateRes.matchedCount) {
    throw Error("updateUser: Failed to update user.");
  }

  return { updated: true };
}

export const changePassword = async (userId, currentPassword, newPassword) => {
  //input validation
  if (!checkString(userId) || !checkString(currentPassword) || !checkString(newPassword)) {
    throw new Error('changePassword: invalid arguments');
  }
  const userCollection = await users();
  const _id = ObjectId.isValid(userId) ? ObjectId(userId) : null;
  if (!_id) throw new Error('changePassword: invalid user id');

  const user = await userCollection.findOne({ _id });
  if (!user) throw new Error('changePassword: user not found');

  let match = await bcrypt.compare(currentPassword, user.password);
  if (!match) throw new Error('changePassword: current password incorrect');

  // add password strength validation here
  //confirm password is at least 8 characters and contains a number and capital letter
  if (!newPassword.match(/[0-9]/) || !newPassword.match(/[A-Z]/) || (newPassword.trim()).length < 8) {
    throw Error('createUser: Password must be at least 8 characters and contain a capital letter and a number.');
  }

  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
  const updateRes = await userCollection.updateOne({ _id }, { $set: { password: hashedPassword } });
  if (!updateRes.matchedCount) throw new Error('changePassword: could not update password');

  return { passwordChanged: true };
};