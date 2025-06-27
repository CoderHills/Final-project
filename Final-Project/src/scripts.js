
document.addEventListener("DOMContentLoaded", () => {
  const loginSection   = document.getElementById("loginSection");
  const contentWrapper = document.getElementById("contentWrapper");

  const isLoggedIn = localStorage.getItem("loggedIn") === "true";
  if (isLoggedIn) {
    showPortal();
  } else {
    loginSection.style.display = "block";
    contentWrapper.style.display = "none";
    initLoginFlow();
  }
});



function initLoginFlow() {
  const form = document.getElementById("loginForm");
  const msg  = document.getElementById("loginMessage");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const submit   = form.querySelector("button");
    submit.disabled = true;

    try {
      const res   = await fetch(`http://localhost:3000/users?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`);
      const users = await res.json();

      if (users.length) {
        localStorage.setItem("loggedIn", "true");
        showPortal();                 
      } else {
        showError("Invalid username or password.");
      }
    } catch {
      showError("⚠️ Server error.");
    }

    function showError(text) {
      msg.textContent = text;
      msg.style.color = "red";
      submit.disabled = false;
    }
  });
}



function showPortal() {
  document.getElementById("loginSection").style.display   = "none";
  document.getElementById("contentWrapper").style.display = "block";
  loadTrivia();                         
}

function logout() {
  localStorage.removeItem("loggedIn");
  document.getElementById("loginSection").style.display   = "block";
  document.getElementById("contentWrapper").style.display = "none";
}



const TRIVIA_API_URL   = "https://opentdb.com/api.php?amount=5&type=multiple";
const triviaSectionEl  = document.getElementById("triviaSection");
const triviaContentEl  = document.getElementById("triviaContent");

async function loadTrivia() {
  try {
    const res = await fetch(TRIVIA_API_URL);
    if (!res.ok) throw new Error("API error");

    const data      = await res.json();
    const questions = data.results;

    triviaContentEl.innerHTML     = renderTrivia(questions);
    triviaSectionEl.style.display = "block";

    
    triviaContentEl.querySelectorAll(".trivia-card").forEach(card => {
      card.addEventListener("click", (e) => {
        if (e.target.tagName !== "LI") return;
        const li = e.target;
        const correct = li.dataset.correct === "true";

        li.parentElement.querySelectorAll("li").forEach(l => (l.style.pointerEvents = "none"));

        if (correct) {
          li.classList.add("correct");
        } else {
          li.classList.add("wrong");
          li.parentElement.querySelector("li[data-correct='true']").classList.add("correct");
        }
      });
    });
  } catch {
    triviaContentEl.textContent = "⚠️ Could not load trivia questions.";
  }
}

function renderTrivia(questions) {
  return questions.map((q, i) => {
    const answers = [...q.incorrect_answers, q.correct_answer]
      .sort(() => Math.random() - 0.5)
      .map(ans => `<li data-correct="${ans === q.correct_answer}">${decode(ans)}</li>`)
      .join("");

    return `
      <div class="trivia-card">
        <h3>Q${i + 1}. ${decode(q.question)}</h3>
        <ul>${answers}</ul>
      </div>`;
  }).join("");
}

function decode(html) {          
  const txt = document.createElement("textarea");
  txt.innerHTML = html;
  return txt.value;
}
