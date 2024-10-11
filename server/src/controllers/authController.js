// server/src/controllers/authController.js
const User = require('../models/User');

exports.register = async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ message: 'Username is required' });

  const existingUser = await User.findOne({ username });
  if (existingUser) return res.status(400).json({ message: 'Username already exists' });

  const newUser = new User({ username });
  await newUser.save();
  res.status(201).json({ message: 'User registered successfully', userId: newUser._id });
};

exports.login = async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ message: 'Username is required' });

  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ message: 'User not found' });

  res.status(200).json({ message: 'Login successful', userId: user._id });
};
