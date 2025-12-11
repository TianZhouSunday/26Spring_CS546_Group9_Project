import bcrypt from 'bcrypt';
import { users } from '../config/mongoCollections.js';
import isEmail from 'validator/lib/isEmail.js';
import { ObjectId } from "mongodb";

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

  if(!isEmail(email)){
    throw Error('createUser: Must provide a valid email address.');
  }
  const userCollection = await users();

  //confirm password is at least 8 characters and contains a number and capital letter
  if(!password.match(/[0-9]/) || !password.match(/[A-Z]/) || (password.trim()).length < 8){
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
    reports: []
  };

  const insertInfo = await userCollection.insertOne(newUser);
  if (!insertInfo.acknowledged) throw Error('createUser: Could not add user');

  return { registrationCompleted: true };
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
    reports: user.reports
  };
};

export const updateUser = async (
  username,
  phone_number,
  email,
  age,
  home_address,
  location,
  profile_picture,
) => {
  //validate input
	if(!checkString(userId) || !checkString(username) || !checkString(email)){
    throw Error('updateUser: Must provide a valid Id, username and email.');
  }
  const userCollection = await users();
  const _id = ObjectId.isValid(userId) ? ObjectId.createFromHexString(userId) : null;
  if (!_id) throw new Error('updateUser: invalid user id');

  const user = await userCollection.findOne({ _id });
  if (!user) throw new Error('updateUser: user not found');

  username = username.trim().toLowerCase();
  email = email.trim().toLowerCase();

  if(!isEmail(email)){
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

  const updatedUser = {
    username,
    phone_number,
    email,
    age,
    home_address,
    location,
    profile_picture
  };

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
  if(!newPassword.match(/[0-9]/) || !newPassword.match(/[A-Z]/) || (newPassword.trim()).length < 8){
    throw Error('createUser: Password must be at least 8 characters and contain a capital letter and a number.');
  }

  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
  const updateRes = await userCollection.updateOne({ _id }, { $set: { password: hashedPassword } });
  if (!updateRes.matchedCount) throw new Error('changePassword: could not update password');

  return { passwordChanged: true };
};

export const getUserById = async (id) => {
  if(!checkString(id)){
    throw Error("getUserById: input must be a nonempty string.");
  }
  id = id.trim();
  if(!ObjectId.isValid(id)){
    throw Error("getUserById: input must be a valid object ID.");
  }

  //connect to database and find corresponding user
  const userCollection = await users();
  let user = await userCollection.findOne({ _id: ObjectId.createFromHexString(id) });

  //throw if not found
  if(!user) {
    throw Error("getUserById: no user found with id " + id);
  }
  user._id = user._id.toString();
  return movie;
}

export const blockUser = async (block_id, user_id) => {
  if(!checkString(block_id) || !checkString(user_id)){
    throw Error("blockUser: inputs must be nonempty strings.");
  }
  block_id = block_id.trim();
  user_id = user_id.trim();
  if(!ObjectId.isValid(block_id) || !ObjectId.isValid(user_id)){
    throw Error("blockUser: inputs must be valid object IDs.");
  }

  //connect to database and find corresponding users
  const userCollection = await users();
  let user = await userCollection.findOne({ _id: ObjectId.createFromHexString(user_id) });
  let block_user = await userCollection.findOne({ _id: ObjectId.createFromHexString(block_id) });
  //throw if either user not found
  if(!user || !block_user) {
    throw Error("blockUser: one or more users not found");
  }

  //update the database
  let updatedInfo = await userCollection.findOneAndUpdate(
    { _id: ObjectId.createFromHexString(user_id) },
    { $push: { blocked_users: block_id } },
    { returnDocument: "after" }
  );

  //convert id to a string
  updatedInfo._id = updatedInfo._id.toString();
  return updatedInfo;
}

export const deleteUser = async (userId) => {

}