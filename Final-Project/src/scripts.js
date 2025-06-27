const API="http://localhost:3000/users";
const TRIVIA="https://opentdb.com/api.php?amount=5&type=multiple";
const $=id=>document.getElementById(id);

const loginForm=$("loginForm"),signupForm=$("signupForm"),loginMsg=$("loginMessage"),signupMsg=$("signupMessage"),
      auth=$("authSection"),portal=$("contentWrapper"),trSec=$("triviaSection"),trCon=$("triviaContent"),
      delBtn=$("deleteAccountBtn");

$("showSignup").onclick=e=>{e.preventDefault();swap("signup")};
$("showLogin").onclick =e=>{e.preventDefault();swap("login") };

loginForm .addEventListener("submit",login);
signupForm.addEventListener("submit",signup);
delBtn     .addEventListener("click",deleteAcc);

document.addEventListener("DOMContentLoaded",()=>localStorage.loggedIn==="true"?enter():reset());

function swap(v){
  loginForm.classList.toggle("shown",v==="login");
  signupForm.classList.toggle("shown",v==="signup")
}

function reset(){
  auth.classList.add("active");auth.classList.remove("hidden");
  portal.classList.add("hidden");portal.classList.remove("active");
  swap("login");loginForm.reset();signupForm.reset();
  loginMsg.textContent="";signupMsg.textContent=""
}

async function login(e){
  e.preventDefault();
  const u=loginUsername.value.trim(),p=loginPassword.value;
  try{
    const users=await fetch(`${API}?username=${encodeURIComponent(u)}&password=${encodeURIComponent(p)}`).then(r=>r.json());
    users.length?(localStorage.loggedIn="true",localStorage.userId=users[0].id,enter()):flash(loginMsg,"❌ Incorrect username or password.")
  }catch{flash(loginMsg,"⚠️ Server error.")}
}

async function signup(e){
  e.preventDefault();
  const u=signupUsername.value.trim(),p=signupPassword.value;
  if(!u||!p)return flash(signupMsg,"Both fields required.");
  try{
    const exists=await fetch(`${API}?username=${encodeURIComponent(u)}`).then(r=>r.json());
    if(exists.length)return flash(signupMsg,"❌ Username already taken.");
    await fetch(API,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:u,password:p})});
    flash(loginMsg,"✅ Account created! Please log in.","lime");signupForm.reset();swap("login")
  }catch{flash(signupMsg,"⚠️ Server error.")}
}

async function deleteAcc(){
  const id=localStorage.userId;
  if(!id)return alert("User id missing.");
  if(!confirm("Delete account permanently?"))return;
  try{
    const ok=await fetch(`${API}/${id}`,{method:"DELETE"});
    if(!ok.ok)throw Error();
    alert("Account deleted.");logout()
  }catch{alert("Server error. Could not delete.")}
}

function logout(){delete localStorage.loggedIn;delete localStorage.userId;portal.classList.add("hidden");reset()}

function enter(){
  auth.classList.add("hidden");portal.classList.remove("hidden");portal.classList.add("active");
  window.scrollTo({top:0,behavior:"smooth"});loadTrivia()
}

async function loadTrivia(){
  try{
    const data=await fetch(TRIVIA).then(r=>r.json());
    trCon.innerHTML=data.results.map(card).join("");trSec.classList.remove("hidden")
  }catch{trCon.textContent="Unable to load trivia."}
}

function card(q,i){
  const a=[...q.incorrect_answers,q.correct_answer].sort(()=>Math.random()-.5)
         .map(t=>`<li data-ok='${t===q.correct_answer}'>${dec(t)}</li>`).join("");
  return`<div class="trivia-card"><h3>Q${i+1}. ${dec(q.question)}</h3><ul>${a}</ul></div>`
}

function dec(str){const t=document.createElement("textarea");t.innerHTML=str;return t.value}

document.addEventListener("click",e=>{
  if(!e.target.matches(".trivia-card li"))return;
  const li=e.target;li.parentElement.querySelectorAll("li").forEach(l=>l.style.pointerEvents="none");
  li.classList.add(li.dataset.ok==="true"?"correct":"wrong");
  if(li.dataset.ok!=="true")li.parentElement.querySelector("li[data-ok='true']").classList.add("correct")
});

function flash(el,msg,color="red"){el.textContent=msg;el.style.color=color}
