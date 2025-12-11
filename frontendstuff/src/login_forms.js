(function () {
  //helper functions
  const empty = (str) => !str || !str.trim();

  function showError(element, message) {
    element.textContent = message;
    element.style.display = "block";
  }

  function clearError(element) {
    element.textContent = "";
    element.style.display = "none";
  }

  //simple regex for valid email address
  const checkEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const checkUsername = (str) =>
    typeof str === "string" &&
    /^[A-Za-z0-9_]{4,20}$/.test(str);

  const checkPassword = (pw) => {
    if (typeof pw !== "string" || !pw.trim()) return false;
    return (
      pw.length >= 8 &&
      /[A-Z]/.test(pw) &&
      /[0-9]/.test(pw)
    );
  };

  const signupForm = document.getElementById("signup-form");

  if (signupForm) {
    signupForm.addEventListener("submit", (event) => {
      event.preventDefault();
      let valid = true;

      
      let username = document.getElementById("username");
      let email = document.getElementById("email");
      let password = document.getElementById("password");

      let usernameErr = document.getElementById("username-error");
      let emailErr = document.getElementById("email-error");
      let passwordErr = document.getElementById("password-error");

      [usernameErr, emailErr, passwordErr].forEach(clearError);

      //validate username
      if (empty(username.value)) {
        showError(usernameErr, "Username is required.");
        valid = false;
      } else if (!checkUsername(username.value.trim())) {
        showError(usernameErr, "Username must be 3–20 characters and alphanumeric.");
        valid = false;
      }

      //validate email
      if (empty(email.value)) {
        showError(emailErr, "Email is required.");
        valid = false;
      } else if (!checkEmail(email.value.trim())) {
        showError(emailErr, "Invalid email format.");
        valid = false;
      }

      //validate password
      if (empty(password.value)) {
        showError(passwordErr, "Password is required.");
        valid = false;
      } else if (!checkPassword(password.value)) {
        showError(passwordErr, "Password must be 8+ chars, contain a capital letter and a number.");
        valid = false;
      }

      if (valid) signupForm.submit();
    });
  }

  const loginForm = document.getElementById("login-form");

  if (loginForm) {
    loginForm.addEventListener("submit", (event) => {
      event.preventDefault();
      let valid = true;

      let email = document.getElementById("email");
      let password = document.getElementById("password");

      let emailErr = document.getElementById("email-error");
      let passwordErr = document.getElementById("password-error");

      clearError(emailErr);
      clearError(passwordErr);

      //validate email
      try {
        if (empty(email.value)) throw "Email is required.";
        if (!checkEmail(email.value.trim()))
          throw "Invalid email format.";
      } catch (e) {
        showError(emailErr, e);
        valid = false;
      }

      //validate password
      try {
        if (empty(password.value)) throw "Password required.";
      } catch (e) {
        showError(passwordErr, e);
        valid = false;
      }

      if (valid) loginForm.submit();
    });
  }

})();
