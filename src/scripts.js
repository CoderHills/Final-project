const API = "http://localhost:3000/users";
const TRIVIA = "https://opentdb.com/api.php?amount=5&type=multiple";
const $ = id => document.getElementById(id);

const loginForm      = $("loginForm");
const signupForm     = $("signupForm");
const loginMsg       = $("loginMessage");
const signupMsg      = $("signupMessage");
const authSection    = $("authSection");
const portal         = $("contentWrapper");
const triviaSection  = $("triviaSection");
const triviaContent  = $("triviaContent");
const deleteBtn      = $("deleteAccountBtn");

const wrongFeedbacks = [
  "You are so dumb ",
  "Ouch, try harder! ",
  "Wrong again... ",
  "Epic fail! ",
  "That was… not it. ",
  "Seriously? Try again! ",
  "Brain on vacation? ",
  "Missed by a mile! ",
  "Better luck next time! ",
  "Are you even trying? "
];

const correctFeedbacks = [
  "Brilliant! ",
  "You nailed it! ",
  "Spot on! ",
  "You rock! ",
  "Top tier knowledge! ",
  "Savvy answer! ",
  "Bullseye! ",
  "You’re on fire! ",
  "Absolutely correct! ",
  "Genius move! "
];

$("showSignup").onclick = e => { e.preventDefault(); swap("signup"); };
$("showLogin").onclick  = e => { e.preventDefault(); swap("login");  };

loginForm .addEventListener("submit", login);
signupForm.addEventListener("submit", signup);
deleteBtn .addEventListener("click", deleteAccount);

document.addEventListener("DOMContentLoaded", () => {
  localStorage.getItem("loggedIn") === "true" ? enter() : reset();
});

function swap(view) {
  loginForm .classList.toggle("shown", view === "login");
  signupForm.classList.toggle("shown", view === "signup");
}

function reset() {
  authSection.classList.add("active");
  authSection.classList.remove("hidden");
  portal.classList.add("hidden");
  portal.classList.remove("active");
  swap("login");
  loginForm.reset();
  signupForm.reset();
  loginMsg.textContent = "";
  signupMsg.textContent = "";
}

async function login(e) {
  e.preventDefault();
  const u = $("loginUsername").value.trim();
  const p = $("loginPassword").value;
  try {
    const users = await fetch(`${API}?username=${encodeURIComponent(u)}&password=${encodeURIComponent(p)}`)
      .then(r => r.json());
    if (users.length) {
      localStorage.setItem("loggedIn", "true");
      localStorage.setItem("userId", users[0].id);
      enter();
    } else {
      flash(loginMsg, " Incorrect username or password.");
    }
  } catch {
    flash(loginMsg, " Server error.");
  }
}

async function signup(e) {
  e.preventDefault();
  const u = $("signupUsername").value.trim();
  const p = $("signupPassword").value;
  if (!u || !p) return flash(signupMsg, "Both fields required.");
  try {
    const exists = await fetch(`${API}?username=${encodeURIComponent(u)}`).then(r => r.json());
    if (exists.length) return flash(signupMsg, " Username already taken.");
    await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: u, password: p })
    });
    flash(loginMsg, "Account created! Please log in.", "lime");
    signupForm.reset();
    swap("login");
  } catch {
    flash(signupMsg, " Server error.");
  }
}

async function deleteAccount() {
  const id = localStorage.getItem("userId");
  if (!id) return alert("User id missing.");
  if (!confirm("Delete your account permanently?")) return;
  try {
    const res = await fetch(`${API}/${id}`, { method: "DELETE" });
    if (!res.ok) throw Error();
    alert("Account deleted.");
    logout();
  } catch {
    alert("Server error. Could not delete.");
  }
}

function logout() {
  localStorage.removeItem("loggedIn");
  localStorage.removeItem("userId");
  portal.classList.remove("active");
  portal.classList.add("hidden");
  authSection.classList.remove("hidden");
  authSection.classList.add("active");
  loginForm.scrollIntoView({ behavior: "smooth", block: "start" });
  reset();
}

function enter() {
  authSection.classList.remove("active");
  authSection.classList.add("hidden");
  portal.classList.remove("hidden");
  portal.classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
  loadTrivia();
}

async function loadTrivia() {
  try {
    const data = await fetch(TRIVIA).then(r => r.json());
    triviaContent.innerHTML = data.results.map(renderCard).join("");
    triviaSection.classList.remove("hidden");
  } catch {
    triviaContent.textContent = "Unable to load trivia.";
  }
}

function renderCard(q, i) {
  const answers = [...q.incorrect_answers, q.correct_answer]
    .sort(() => Math.random() - 0.5)
    .map(a => `<li data-ok='${a === q.correct_answer}'>${decode(a)}</li>`)
    .join("");
  return `<div class="trivia-card">
            <h3>Q${i + 1}. ${decode(q.question)}</h3>
            <ul>${answers}</ul>
          </div>`;
}

function decode(html) {
  const t = document.createElement("textarea");
  t.innerHTML = html;
  return t.value;
}

document.addEventListener("click", e => {
  if (!e.target.matches(".trivia-card li")) return;

  const li = e.target;
  const card = li.closest(".trivia-card");
  card.querySelectorAll("li").forEach(l => (l.style.pointerEvents = "none"));

  const isCorrect = li.dataset.ok === "true";
  li.classList.add(isCorrect ? "correct" : "wrong");

  
  card.querySelector("li[data-ok='true']").classList.add("correct");

  
  const pool = isCorrect ? correctFeedbacks : wrongFeedbacks;
  const msgText = pool[Math.floor(Math.random() * pool.length)];

  let msg = card.querySelector(".feedback");
  if (!msg) {
    msg = document.createElement("p");
    msg.className = "feedback";
    card.appendChild(msg);
  }
  msg.textContent = msgText;
  msg.classList.toggle("feedback-correct", isCorrect);
  msg.classList.toggle("feedback-wrong", !isCorrect);
});

function flash(el, msg, color = "red") {
  el.textContent = msg;
  el.style.color = color;
}
