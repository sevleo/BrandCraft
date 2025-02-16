const bcrypt = require("bcryptjs");

async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

async function comparePassword(enteredPassword, userPassword) {
  return await bcrypt.compare(enteredPassword, userPassword);
}

module.exports = {
  hashPassword,
  comparePassword,
};
