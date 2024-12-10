document.addEventListener("DOMContentLoaded", function() {
  const loginForm = document.getElementById("login-form");

  loginForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const email = document.querySelector("input[name='email']").value;
    const password = document.querySelector("input[name='password']").value;

    axios.post('/api/admin-login', { email, password })
      .then(response => {
        if (response.data.success) {
          window.location.href = "../../admin/home.html";
        } else {
          alert("Invalid email or password. Please try again.");
        }
      })
      .catch(error => {
        console.error("Failed to login:", error);
        alert("An error occurred. Please try again later.");
      });
  });
});
