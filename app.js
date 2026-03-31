const API = "https://script.google.com/macros/s/AKfycbybwGXfrHhP6IkGJb39Gej_kbQZSxK6SfzFpsgqNdp5zMq-gF1_Qp1mXFui0KzKOxq_/exec";

//  Notifications 
function showNotification(message, type = 'info') {
  const n = document.createElement('div');
  n.className = `notification notification-${type}`;
  n.textContent = message;
  document.body.appendChild(n);
  setTimeout(() => n.classList.add('show'), 10);
  setTimeout(() => {
    n.classList.remove('show');
    setTimeout(() => n.remove(), 300);
  }, 3500);
}

//  Loading State 
function setLoading(button, isLoading) {
  if (!button) return;
  if (isLoading) {
    button.disabled = true;
    button.setAttribute('data-original-text', button.textContent);
    button.textContent = 'Please wait...';
    button.style.opacity = '0.65';
  } else {
    button.disabled = false;
    button.textContent = button.getAttribute('data-original-text') || 'Submit';
    button.style.opacity = '1';
  }
}

// GAS-safe fetch — GET with query params to avoid redirect issues
function gasFetch(params) {
  return fetch(API + '?' + new URLSearchParams(params).toString(), {
    method: 'GET',
    redirect: 'follow'
  }).then(res => res.json());
}

//  Register (Borrower & CI Borrower) 
function register(button) {
  if (!button) button = event && event.target;

  const roleSelect = document.getElementById('roleSelect');
  const role = roleSelect ? roleSelect.value : 'Borrower';

  if (!role) { showNotification('Please select your account type', 'error'); return; }

  const name       = document.getElementById('name').value.trim();
  const department = document.getElementById('department').value.trim();
  const contact    = document.getElementById('contact').value.trim();
  const email      = document.getElementById('email').value.trim();
  const password   = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  // Fields only for students
  const idNumberEl = document.getElementById('idNumber');
  const yearEl     = document.getElementById('year');
  const idNumber   = idNumberEl ? idNumberEl.value.trim() : '';
  const year       = yearEl     ? yearEl.value.trim()     : '';

  const isStudent = role === 'Borrower';
  const isCI      = role === 'CI Borrower';

  if (!name)       { showNotification('Please enter your full name', 'error'); return; }
  if (isStudent && !idNumber) { showNotification('Please enter your school ID number', 'error'); return; }
  if (!department) { showNotification('Please enter your department/course', 'error'); return; }
  if (isStudent && !year) { showNotification('Please enter your year level', 'error'); return; }
  if (!contact)    { showNotification('Please enter your contact number', 'error'); return; }
  if (!email)      { showNotification('Please enter your email', 'error'); return; }

  // Email domain validation — only for students
  if (isStudent && !email.toLowerCase().endsWith('@gbox.ncf.edu.ph')) {
    showNotification('Email must use @gbox.ncf.edu.ph', 'error');
    return;
  }

  if (!password)            { showNotification('Please enter a password', 'error'); return; }
  if (password.length < 8)  { showNotification('Password must be at least 8 characters', 'error'); return; }
  if (password !== confirmPassword) {
    showNotification('Passwords do not match', 'error');
    return;
  }

  setLoading(button, true);

  gasFetch({ action: 'register', role, name, idNumber, department, year, contact, email, password })
  .then(data => {
    setLoading(button, false);
    if (data.status === 'success') {
      showNotification('Registration successful! Redirecting to login...', 'success');
      setTimeout(() => window.location = 'login.html', 1600);
    } else {
      showNotification(data.message || 'Registration failed', 'error');
    }
  })
  .catch(error => {
    setLoading(button, false);
    showNotification('Network error: ' + error.message, 'error');
  });
}

//  Login 
function login(button) {
  if (!button) button = event && event.target;

  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!email)    { showNotification('Please enter your email', 'error'); return; }
  if (!password) { showNotification('Please enter your password', 'error'); return; }

  setLoading(button, true);

  gasFetch({ action: 'login', email, password })
  .then(data => {
    setLoading(button, false);
    if (data.status === 'success') {
      localStorage.setItem('userID',    data.userID);
      localStorage.setItem('userName',  data.name);
      localStorage.setItem('userRole',  data.role);
      localStorage.setItem('userEmail', email);
      if (data.idNumber) localStorage.setItem('userIDNumber', data.idNumber);
      showNotification('Login successful! Redirecting...', 'success');
      // CI Borrower goes to borrower dashboard (they borrow too), but role tag shows CI
      if (data.role === 'Borrower' || data.role === 'CI Borrower') {
        setTimeout(() => window.location = 'dashboard_borrower.html', 800);
      } else {
        setTimeout(() => window.location = 'dashboard_admin.html', 800);
      }
    } else {
      showNotification(data.message || 'Invalid email or password', 'error');
    }
  })
  .catch(error => {
    setLoading(button, false);
    showNotification('Network error: ' + error.message, 'error');
  });
}

//  Logout 
function logout() {
  const userID   = localStorage.getItem('userID')    || '';
  const userName = localStorage.getItem('userName')  || '';
  const userRole = localStorage.getItem('userRole')  || '';
  const email    = localStorage.getItem('userEmail') || '';

  // Fire-and-forget logout log
  gasFetch({ action: 'logout', userID, userName, userRole, email }).catch(() => {});

  localStorage.clear();
  showNotification('Logged out successfully', 'success');
  setTimeout(() => window.location = 'login.html', 900);
}
