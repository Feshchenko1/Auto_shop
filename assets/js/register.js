document.getElementById("signup").addEventListener("click", function (event) {
  event.preventDefault();

  document.querySelector(".message").style.transform = "translateX(100%)";
  if (document.querySelector(".message").classList.contains("login")) {
    document.querySelector(".message").classList.remove("login");
  }
  document.querySelector(".message").classList.add("signup");
});

document.querySelector(".form--signup form").addEventListener("submit", function(event) {
  event.preventDefault();

  const nameInput = document.querySelector(".form--signup input[type='text']");
  const emailInput = document.querySelector(".form--signup input[type='email']");
  const passwordInput = document.querySelector(".form--signup input[type='password']");

  if (!nameInput.value || !emailInput.value || !passwordInput.value) {
    alert("Please fill in all the registration fields.");
    return;
  }

  const name = nameInput.value;
  const email = emailInput.value;
  const password = passwordInput.value;

  fetch('/api/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ name, email, password })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error("Failed to register user.");
    }
    return response.json();
  })
  .then(data => {
    if (data.success) {
      window.location.href = "../../client/store.html";
    } else {
      alert(data.message || "Failed to register user.");
    }
  })
  .catch(error => {
    console.error("Error registering user:", error);
    alert("An error occurred. Please try again later.");
  });
});

document.getElementById("login").addEventListener("click", function (event) {
  event.preventDefault();

  document.querySelector(".message").style.transform = "translateX(0)";
  if (document.querySelector(".message").classList.contains("login")) {
    document.querySelector(".message").classList.remove("signup");
  }
  document.querySelector(".message").classList.add("login");
});

document.querySelector(".form--login form").addEventListener("submit", function (event) {
  event.preventDefault();

  const email = document.querySelector(".form--login input[type='email']").value;
  const password = document.querySelector(".form--login input[type='password']").value;

  fetch('/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      window.location.href = "../../client/store.html";
    } else {
      alert(data.message || "Invalid email or password.");
    }
  })
  .catch(error => {
    console.error("Error logging in:", error);
    alert("An error occurred. Please try again later.");
  });
});