function isValidEmail(email) {
  const emailValidator = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailValidator.test(email);
}

function isValidPassword(password) {
  return password && password.length >= 8;
}

module.exports = {
  isValidEmail,
  isValidPassword,
};
