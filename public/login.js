/**
 * CRM Login Page — Client-side logic
 */

(function () {
  'use strict';

  // ─── DOM elements ───────────────────────────────────────────────
  const form       = document.getElementById('loginForm');
  const userIdInput= document.getElementById('userId');
  const pwdInput   = document.getElementById('password');
  const loginBtn   = document.getElementById('loginBtn');
  const btnText    = loginBtn.querySelector('.btn-text');
  const btnLoader  = document.getElementById('loginLoader');
  const errorBox   = document.getElementById('loginError');
  const errorText  = document.getElementById('loginErrorText');
  const successBox = document.getElementById('loginSuccess');
  const successText= document.getElementById('loginSuccessText');
  const timeoutBox = document.getElementById('timeoutAlert');
  const togglePwd  = document.getElementById('togglePwd');
  const eyeOpen    = document.getElementById('eyeOpen');
  const eyeClosed  = document.getElementById('eyeClosed');
  const userIdErr  = document.getElementById('userIdError');
  const pwdErr     = document.getElementById('passwordError');

  // ─── Check URL params ───────────────────────────────────────────
  const params = new URLSearchParams(window.location.search);
  if (params.get('reason') === 'timeout') {
    timeoutBox.style.display = 'flex';
  }
  if (params.get('logout') === '1') {
    // Already logged out — just show the form clean
  }

  // ─── Password toggle ────────────────────────────────────────────
  togglePwd.addEventListener('click', () => {
    const isHidden = pwdInput.type === 'password';
    pwdInput.type = isHidden ? 'text' : 'password';
    eyeOpen.style.display  = isHidden ? 'none' : 'block';
    eyeClosed.style.display= isHidden ? 'block' : 'none';
    pwdInput.focus();
  });

  // ─── Clear errors on input ──────────────────────────────────────
  userIdInput.addEventListener('input', () => {
    userIdErr.textContent = '';
    hideAlert(errorBox);
  });
  pwdInput.addEventListener('input', () => {
    pwdErr.textContent = '';
    hideAlert(errorBox);
  });

  // ─── Form submit ────────────────────────────────────────────────
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const userId   = userIdInput.value.trim();
    const password = pwdInput.value;

    // Basic client-side validation
    let valid = true;
    if (!userId) {
      userIdErr.textContent = 'User ID is required.';
      userIdInput.focus();
      valid = false;
    }
    if (!password) {
      pwdErr.textContent = 'Password is required.';
      if (valid) pwdInput.focus();
      valid = false;
    }
    if (!valid) return;

    setLoading(true);
    hideAlert(errorBox);
    hideAlert(successBox);
    hideAlert(timeoutBox);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ user_id: userId, password })
      });

      const data = await res.json();

      if (data.success) {
        successText.textContent = data.message || 'Login successful! Redirecting...';
        showAlert(successBox);
        
        // Brief delay then redirect
        setTimeout(() => {
          window.location.href = data.redirect || '/index.html';
        }, 800);

      } else {
        setLoading(false);
        showError(data.error || 'Invalid User ID or Password.');
      }

    } catch (err) {
      setLoading(false);
      showError('Unable to connect to the server. Please try again.');
      console.error('Login request failed:', err);
    }
  });

  // ─── Helpers ────────────────────────────────────────────────────

  function setLoading(loading) {
    loginBtn.disabled = loading;
    btnText.style.display  = loading ? 'none' : 'inline-block';
    btnLoader.style.display= loading ? 'flex' : 'none';
  }

  function showError(message) {
    errorText.textContent = message;
    showAlert(errorBox);
    // Shake animation on the form
    form.classList.remove('shake');
    void form.offsetWidth; // force reflow
    form.classList.add('shake');
    setTimeout(() => form.classList.remove('shake'), 500);
  }

  function showAlert(el) {
    el.style.display = 'flex';
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = '';
  }

  function hideAlert(el) {
    el.style.display = 'none';
  }

  // ─── Shake animation ────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shake {
      0%,100%{transform:translateX(0)}
      15%{transform:translateX(-6px)}
      30%{transform:translateX(6px)}
      45%{transform:translateX(-4px)}
      60%{transform:translateX(4px)}
      75%{transform:translateX(-2px)}
      90%{transform:translateX(2px)}
    }
    .shake { animation: shake 0.45s ease; }
  `;
  document.head.appendChild(style);

  // ─── Auto-focus ─────────────────────────────────────────────────
  setTimeout(() => {
    if (!userIdInput.value) userIdInput.focus();
    else pwdInput.focus();
  }, 100);

})();
