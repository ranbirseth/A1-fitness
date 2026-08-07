const User = require("../models/user.model");
const jwt = require("jsonwebtoken");
const { asyncHandler } = require("../utils/asyncHandler");
const { sendResponse } = require("../utils/response");
const { signAccessToken, signRefreshToken } = require("../utils/tokens");
const { AppError } = require("../utils/appError");

const toTokens = (user) => {
  const payload = { sub: user._id, role: user.role };
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload)
  };
};

const sanitizeUser = (user, member = null) => ({
  _id: user._id,
  gymId: user.gymId,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  photo: user.photo,
  address: user.address,
  emergencyContact: user.emergencyContact,
  status: member ? member.status : user.status,
  paymentStatus: member ? member.paymentStatus : "paid", // Admins/Trainers are always "paid"
  secretCode: member ? member.secretCode : undefined
});

const updateProfile = asyncHandler(async (req, res) => {
  const { name, email, phone, password, photo, address, emergencyContact } = req.body;
  const userId = req.user.sub;

  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404);

  // Check if email is being changed and if it's already taken
  if (email && email !== user.email) {
    const existingUser = await User.findOne({ email, gymId: user.gymId });
    if (existingUser) throw new AppError("Email already in use", 400);
    user.email = email;
  }

  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (password) user.password = password;
  if (photo) user.photo = photo;
  if (address !== undefined) user.address = address;
  if (emergencyContact !== undefined) user.emergencyContact = emergencyContact;

  await user.save();

  // If user is a member, fetch their member details for sanitization
  let member = null;
  if (user.role === "member") {
    member = await Member.findOne({ user: user._id });
  }

  sendResponse(res, { 
    message: "Profile updated successfully", 
    data: sanitizeUser(user, member) 
  });
});

const Member = require("../models/member.model");

const signup = asyncHandler(async (req, res) => {
  const { gymId, name, email, phone, password } = req.body;

  const user = await User.create({
    gymId,
    name,
    email,
    phone,
    password,
    role: "member",
    status: "pending"
  });
  
  let member = null;
  // Create the Member profile with pending status for all signups
  const secretCodeGenerator = async () => {
    let secretCode;
    let exists = true;
    while (exists) {
      secretCode = Math.floor(100 + Math.random() * 900).toString();
      const existing = await Member.findOne({ secretCode });
      if (!existing) exists = false;
    }
    return secretCode;
  };

  const secretCode = await secretCodeGenerator();

  member = await Member.create({
    gymId,
    user: user._id,
    branchCode: "MAIN",
    isActivePlan: false,
    status: "pending",
    paymentStatus: "pending",
    secretCode
  });

  const tokens = toTokens(user);
  user.refreshTokens.push(tokens.refreshToken);
  await user.save();
  
  res.cookie("refreshToken", tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  sendResponse(res, { status: 201, message: "Signup successful", data: { user: sanitizeUser(user, member), accessToken: tokens.accessToken } });
});

const login = asyncHandler(async (req, res) => {
  const { gymId, email, password, role } = req.body;
  const query = { gymId, email };
  if (role) query.role = role;

  const user = await User.findOne(query);
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
  }

  // Check if user account is deactivated
  if (user.status === "inactive") {
    throw new AppError("Your account has been deactivated. Please contact admin.", 403, "ACCOUNT_INACTIVE");
  }
  
  let member = null;
  // If user is a member, check approval status
  if (user.role === "member") {
    member = await Member.findOne({ user: user._id });
    if (member && member.status !== "active") {
      const message = member.status === "pending"
        ? "Your account is pending approval. Please wait for admin approval."
        : "Your account is inactive. Please contact admin.";
      throw new AppError(message, 403, "ACCOUNT_INACTIVE");
    }
  }

  const tokens = toTokens(user);
  user.refreshTokens.push(tokens.refreshToken);
  await user.save();
  
  res.cookie("refreshToken", tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  sendResponse(res, { message: "Login successful", data: { user: sanitizeUser(user, member), accessToken: tokens.accessToken } });
});

const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!refreshToken) throw new AppError("Refresh token required", 401, "REFRESH_TOKEN_REQUIRED");
  
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new AppError("Invalid refresh token", 401, "INVALID_REFRESH_TOKEN");
  }
  
  const user = await User.findById(decoded.sub);
  if (!user || !user.refreshTokens.includes(refreshToken)) {
    throw new AppError("Refresh token revoked", 401, "REFRESH_TOKEN_REVOKED");
  }
  
  const tokens = toTokens(user);
  user.refreshTokens = user.refreshTokens.slice(-4);
  user.refreshTokens.push(tokens.refreshToken);
  await user.save();
  
  res.cookie("refreshToken", tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  sendResponse(res, { message: "Token refreshed", data: { accessToken: tokens.accessToken } });
});

const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!refreshToken) throw new AppError("Refresh token required for logout", 401, "REFRESH_TOKEN_REQUIRED");
  
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    res.clearCookie("refreshToken");
    return sendResponse(res, { message: "Logout successful", data: {} });
  }
  
  const user = await User.findById(decoded.sub);
  if (user) {
    user.refreshTokens = user.refreshTokens.filter((t) => t !== refreshToken);
    await user.save();
  }
  
  res.clearCookie("refreshToken");
  sendResponse(res, { message: "Logout successful", data: {} });
});

const crypto = require("crypto");

const forgotPassword = asyncHandler(async (req, res) => {
  const { email, gymId } = req.body;
  const user = await User.findOne({ email, gymId });
  
  if (!user) {
    // For security reasons, don't reveal if user exists
    return sendResponse(res, { message: "If your email is registered, you will receive a reset link shortly." });
  }

  // Generate token
  const resetToken = crypto.randomBytes(32).toString("hex");
  user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  user.resetPasswordExpire = Date.now() + 3600000; // 1 hour
  await user.save();

  // In production, send email. In development, log to console.
  const resetUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/reset-password/${resetToken}`;
  console.log(`[PASSWORD_RESET_DEBUG] Link for ${email}: ${resetUrl}`);

  sendResponse(res, { message: "If your email is registered, you will receive a reset link shortly." });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) throw new AppError("Invalid or expired reset token", 400, "INVALID_TOKEN");

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendResponse(res, { message: "Password reset successful" });
});

module.exports = { signup, login, refresh, logout, forgotPassword, resetPassword, updateProfile };
