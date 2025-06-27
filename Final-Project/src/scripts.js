

const API        = "http://localhost:3000/users";
const TRIVIA_URL = "https://opentdb.com/api.php?amount=5&type=multiple";

document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("loggedIn") === "true") return showPortal();

  
  showSignup.onclick = e => { e.preventDefault(); swap("signup"); };
  showLogin .onclick = e => { e.preventDefault(); swap("login");  };

  initLoginFlow();
  initSignupFlow();
});


function swap(view){
  loginForm .style.display = view === "login"  ? "block" : "none";
  signupForm.style.display = view === "signup" ? "block" : "none";
}

/* ---------- LOGIN ---------- */
function initLoginFlow(){
  loginForm.addEventListener("submit", async e=>{
    e.preventDefault();
    const u = loginUsername.value.trim();
    const p = loginPassword.value;

    try{
      const users = await fetch(`${API}?username=${encodeURIComponent(u)}&password=${encodeURIComponent(p)}`).then(r=>r.json());
      if(users.length){
        localStorage.setItem("loggedIn","true");
        localStorage.setItem("userId", users[0].id);   
        showPortal();
      }else flash(loginMessage," Incorrect username or password.");
    }catch{ flash(loginMessage," Server error."); }
  });
}


function initSignupFlow(){
  signupForm.addEventListener("submit", async e=>{
    e.preventDefault();
    const u = signupUsername.value.trim();
    const p = signupPassword.value;
    if(!u||!p) return flash(signupMessage,"Both fields required.");

    try{
      const exists = await fetch(`${API}?username=${encodeURIComponent(u)}`).then(r=>r.json());
      if(exists.length) return flash(signupMessage," Username already taken.");

      const res = await fetch(API,{method:"POST",headers:{ "Content-Type":"application/json"},body:JSON.stringify({username:u,password:p})});
      if(!res.ok) throw Error();
      flash(loginMessage," Account created! Please log in.","lime");
      swap("login");
      signupUsername.value = signupPassword.value = "";
    }catch{ flash(signupMessage,"Server error."); }
  });
}


document.getElementById("deleteAccountBtn").onclick = async ()=>{
  const id = localStorage.getItem("userId");
  if(!id) return alert("User ID missing.");
  if(!confirm("This will permanently delete your account. Continue?")) return;

  try{
    const res = await fetch(`${API}/${id}`,{method:"DELETE"});
    if(!res.ok) throw Error();
    alert("Account deleted.");
    logout();
  }catch{
    alert("Server error. Could not delete.");
  }
};

function flash(el, text, color="red"){
  el.textContent = text;
  el.style.color = color;
}

function showPortal(){
  authSection.style.display   = "none";
  contentWrapper.style.display= "block";
  loadTrivia();
}

function logout(){
  localStorage.removeItem("loggedIn");
  localStorage.removeItem("userId");
  location.reload();
}


async function loadTrivia(){
  try{
    const data = await fetch(TRIVIA_URL).then(r=>r.json());
    triviaContent.innerHTML = data.results.map(renderCard).join("");
    triviaSection.style.display = "block";
  }catch{
    triviaContent.textContent="Unable to load trivia.";
  }
}

function renderCard(q,i){
  const answers=[...q.incorrect_answers,q.correct_answer]
     .sort(()=>Math.random()-0.5)
     .map(a=>`<li data-ok='${a===q.correct_answer}'>${decode(a)}</li>`).join("");
  return `<div class="trivia-card"><h3>Q${i+1}. ${decode(q.question)}</h3><ul>${answers}</ul></div>`;
}
function decode(html){const t=document.createElement("textarea");t.innerHTML=html;return t.value;}

document.addEventListener("click",e=>{
  if(!e.target.matches(".trivia-card li"))return;
  const li=e.target;
  li.parentElement.querySelectorAll("li").forEach(l=>l.style.pointerEvents="none");
  li.classList.add(li.dataset.ok==="true"?"correct":"wrong");
  if(li.dataset.ok!=="true")
    li.parentElement.querySelector("li[data-ok='true']").classList.add("correct");
});
