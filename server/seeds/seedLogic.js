const User = require("../models/user.model");

const DEFAULT_ADMIN = {
  gymId: "MAIN",
  name: "Rudra Fitness Admin",
  email: "shivadas01635@gmail.com",
  password: "rudra2026",
  role: "admin",
  phone: "9999999999",
  status: "active"
};

const seedData = async () => {
  const adminExists = await User.exists({ role: "admin" });

  if (adminExists) {
    console.log("Default Admin already exists.");
    return;
  }

  console.log("Database empty. Creating default data...");

  await User.create(DEFAULT_ADMIN);

  console.log("===================================");
  console.log("Default Admin Created");
  console.log("Email:");
  console.log(DEFAULT_ADMIN.email);
  console.log("\nPassword:");
  console.log(DEFAULT_ADMIN.password);
  console.log("\nGym:");
  console.log(DEFAULT_ADMIN.gymId);
  console.log("===================================");
};

module.exports = { seedData };
