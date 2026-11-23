const TOKEN_KEY = "auth_api_jwt_token";

const els = {
  apiStatus: document.getElementById("api-status"),
  apiStatusText: document.getElementById("api-status-text"),

  authView: document.getElementById("auth-view"),
  sessionView: document.getElementById("session-view"),

  tabLogin: document.getElementById("tab-login"),
  tabRegister: document.getElementById("tab-register"),
  authFeedback: document.getElementById("auth-feedback"),

  loginForm: document.getElementById("panel-login"),
  loginEmail: document.getElementById("login-email"),
  loginPassword: document.getElementById("login-password"),
  loginSubmit: document.getElementById("login-submit"),

  registerForm: document.getElementById("panel-register"),
  registerName: document.getElementById("register-name"),
  registerEmail: document.getElementById("register-email"),
  registerPassword: document.getElementById("register-password"),
  registerSubmit: document.getElementById("register-submit"),

  sessionFeedback: document.getElementById("session-feedback"),
  userAvatar: document.getElementById("user-avatar"),
  userName: document.getElementById("user-name"),
  userEmail: document.getElementById("user-email"),
  userId: document.getElementById("user-id"),
  userCreated: document.getElementById("user-created"),
  tokenValue: document.getElementById("token-value"),
  copyTokenBtn: document.getElementById("copy-token-btn"),
  refreshProfileBtn: document.getElementById("refresh-profile-btn"),
  logoutBtn: document.getElementById("logout-btn"),
};

function clearFeedback(container) {
  container.hidden = true;
  container.className = "feedback";
  container.replaceChildren();
}

function showFeedback(container, message, type) {
  container.className = `feedback is-${type}`;
  container.replaceChildren();

  if (Array.isArray(message)) {
    const list = document.createElement("ul");
    for (const item of message) {
      const li = document.createElement("li");
      li.textContent = item;
      list.appendChild(li);
    }
    container.appendChild(list);
  } else {
    container.textContent = message;
  }

  container.hidden = false;
}

function extractErrors(data, fallback) {
  if (Array.isArray(data?.errors) && data.errors.length > 0) {
    return data.errors.map((err) => err.message || fallback);
  }
  return data?.error || fallback;
}

function getInitials(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function setActiveTab(mode) {
  const isLogin = mode === "login";

  els.tabLogin.classList.toggle("is-active", isLogin);
  els.tabLogin.setAttribute("aria-selected", String(isLogin));
  els.loginForm.hidden = !isLogin;

  els.tabRegister.classList.toggle("is-active", !isLogin);
  els.tabRegister.setAttribute("aria-selected", String(!isLogin));
  els.registerForm.hidden = isLogin;

  clearFeedback(els.authFeedback);
}

function renderSession(user, token) {
  els.userAvatar.textContent = getInitials(user.name);
  els.userName.textContent = user.name;
  els.userEmail.textContent = user.email;
  els.userId.textContent = `#${user.id}`;
  els.userCreated.textContent = user.created_at || "-";
  els.tokenValue.textContent = token;

  els.authView.hidden = true;
  els.sessionView.hidden = false;
}

function showAuthView(mode = "login") {
  els.sessionView.hidden = true;
  els.authView.hidden = false;
  clearFeedback(els.sessionFeedback);
  setActiveTab(mode);
}

async function checkApiHealth() {
  try {
    const res = await fetch("/health");
    if (res.ok) {
      els.apiStatus.className = "status-pill is-online";
      els.apiStatusText.textContent = "API online";
      return;
    }
  } catch {
    // fallback to offline state
  }
  els.apiStatus.className = "status-pill is-offline";
  els.apiStatusText.textContent = "API offline";
}

async function fetchProfile(token) {
  const res = await fetch("/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

async function restoreSession() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    showAuthView("login");
    return;
  }

  try {
    const result = await fetchProfile(token);
    if (result.ok && result.data?.user) {
      renderSession(result.data.user, token);
      return;
    }
    localStorage.removeItem(TOKEN_KEY);
    showAuthView("login");
    showFeedback(els.authFeedback, "Sessão expirada. Entre novamente.", "error");
  } catch {
    showAuthView("login");
    showFeedback(els.authFeedback, "Não foi possível conectar à API.", "error");
  }
}

// Tabs
els.tabLogin.addEventListener("click", () => setActiveTab("login"));
els.tabRegister.addEventListener("click", () => setActiveTab("register"));

// Login
els.loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearFeedback(els.authFeedback);

  const email = els.loginEmail.value.trim();
  const password = els.loginPassword.value;

  if (!email || !password) {
    showFeedback(els.authFeedback, "Preencha e-mail e senha.", "error");
    return;
  }

  els.loginSubmit.disabled = true;
  els.loginSubmit.textContent = "Entrando...";

  try {
    const res = await fetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (res.ok && data.token && data.user) {
      localStorage.setItem(TOKEN_KEY, data.token);
      els.loginForm.reset();
      clearFeedback(els.sessionFeedback);
      renderSession(data.user, data.token);
    } else {
      showFeedback(els.authFeedback, extractErrors(data, "Credenciais inválidas."), "error");
    }
  } catch {
    showFeedback(els.authFeedback, "Não foi possível conectar à API.", "error");
  } finally {
    els.loginSubmit.disabled = false;
    els.loginSubmit.textContent = "Entrar";
  }
});

// Cadastro
els.registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearFeedback(els.authFeedback);

  const name = els.registerName.value.trim();
  const email = els.registerEmail.value.trim();
  const password = els.registerPassword.value;

  if (!name || !email || !password) {
    showFeedback(els.authFeedback, "Preencha todos os campos.", "error");
    return;
  }

  els.registerSubmit.disabled = true;
  els.registerSubmit.textContent = "Criando conta...";

  try {
    const res = await fetch("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();

    if (res.ok) {
      els.registerForm.reset();
      setActiveTab("login");
      els.loginEmail.value = email;
      els.loginPassword.focus();
      showFeedback(els.authFeedback, "Conta criada com sucesso. Faça login para continuar.", "success");
    } else {
      showFeedback(els.authFeedback, extractErrors(data, "Erro ao criar conta."), "error");
    }
  } catch {
    showFeedback(els.authFeedback, "Não foi possível conectar à API.", "error");
  } finally {
    els.registerSubmit.disabled = false;
    els.registerSubmit.textContent = "Criar conta";
  }
});

// Validar sessão (GET /auth/me)
els.refreshProfileBtn.addEventListener("click", async () => {
  clearFeedback(els.sessionFeedback);
  const token = localStorage.getItem(TOKEN_KEY);

  if (!token) {
    showAuthView("login");
    return;
  }

  els.refreshProfileBtn.disabled = true;
  els.refreshProfileBtn.textContent = "Validando...";

  try {
    const result = await fetchProfile(token);
    if (result.ok && result.data?.user) {
      renderSession(result.data.user, token);
      showFeedback(els.sessionFeedback, "Token validado em GET /auth/me.", "success");
    } else {
      localStorage.removeItem(TOKEN_KEY);
      showAuthView("login");
      showFeedback(els.authFeedback, extractErrors(result.data, "Sessão inválida."), "error");
    }
  } catch {
    showFeedback(els.sessionFeedback, "Não foi possível conectar à API.", "error");
  } finally {
    els.refreshProfileBtn.disabled = false;
    els.refreshProfileBtn.textContent = "Validar sessão";
  }
});

// Copiar JWT
els.copyTokenBtn.addEventListener("click", async () => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return;

  try {
    await navigator.clipboard.writeText(token);
    els.copyTokenBtn.textContent = "Copiado";
    setTimeout(() => {
      els.copyTokenBtn.textContent = "Copiar token";
    }, 1500);
  } catch {
    showFeedback(els.sessionFeedback, "Não foi possível copiar o token.", "error");
  }
});

// Logout
els.logoutBtn.addEventListener("click", () => {
  localStorage.removeItem(TOKEN_KEY);
  showAuthView("login");
  showFeedback(els.authFeedback, "Sessão encerrada.", "success");
});

// Inicialização
checkApiHealth();
restoreSession();
