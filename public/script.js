let user = null;

document.addEventListener("DOMContentLoaded", () => {
  const app = document.getElementById("app");
  const logoutBtn = document.getElementById("logoutBtn");
  const serversLink = document.getElementById("serversLink");

  function setUser(u){
    user = u;
    if(user){
      logoutBtn.classList.remove("hidden");
      serversLink.classList.remove("hidden");
    } else {
      logoutBtn.classList.add("hidden");
      serversLink.classList.add("hidden");
    }
  }

  logoutBtn.addEventListener("click", () => {
    setUser(null);
    navigateTo("/login");
  });

  document.querySelectorAll("[data-link]").forEach(a=>{
    a.addEventListener("click", e=>{
      e.preventDefault();
      navigateTo(a.getAttribute("href"));
    });
  });

  function navigateTo(path){
    window.history.pushState({}, "", path);
    router();
  }
  window.addEventListener("popstate", router);

  async function router(){
    const path = window.location.pathname;
    if(path === "/"){
      app.innerHTML = `<div class="container">
        <h2 style="text-align:center;">Ingyenes Játékszerver Hosting</h2>
        <div class="card">
          <h3>FiveM</h3>
          <p>2GB RAM<br>5GB Tárhely<br>35 férőhely</p>
          <p>Státusz: Aktív</p>
        </div>
        <div class="card">
          <h3>Minecraft</h3>
          <p>2GB RAM<br>5GB Tárhely<br>20 férőhely</p>
          <p>Státusz: Aktív</p>
        </div>
      </div>`;
    }
    else if(path === "/register"){
      app.innerHTML = `<div class="container">
        <h2 style="text-align:center;">Regisztráció</h2>
        <form id="registerForm">
          <input type="text" name="username" placeholder="Felhasználónév" required>
          <input type="email" name="email" placeholder="Email" required>
          <input type="password" name="password" placeholder="Jelszó" required>
          <button type="submit">Regisztráció</button>
        </form>
        <p id="msg"></p>
      </div>`;
      document.getElementById("registerForm").addEventListener("submit", async e=>{
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target).entries());
        const res = await fetch("/api/register", {
          method:"POST", headers:{'Content-Type':'application/json'},
          body: JSON.stringify(data)
        });
        const r = await res.json();
        document.getElementById("msg").innerText = r.message;
      });
    }
    else if(path === "/login"){
      app.innerHTML = `<div class="container">
        <h2 style="text-align:center;">Bejelentkezés</h2>
        <form id="loginForm">
          <input type="email" name="email" placeholder="Email" required>
          <input type="password" name="password" placeholder="Jelszó" required>
          <button type="submit">Bejelentkezés</button>
        </form>
        <p id="msg"></p>
      </div>`;
      document.getElementById("loginForm").addEventListener("submit", async e=>{
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target).entries());
        const res = await fetch("/api/login", {
          method:"POST", headers:{'Content-Type':'application/json'},
          body: JSON.stringify(data)
        });
        const r = await res.json();
        if(r.success){
          setUser({ email: data.email, username: r.username });
          navigateTo("/servers");
        } else {
          document.getElementById("msg").innerText = r.message;
        }
      });
    }
    else if(path === "/servers"){
      if(!user){
        navigateTo("/login");
        return;
      }
      const res = await fetch("/api/servers?email="+encodeURIComponent(user.email));
      const servers = await res.json();
      app.innerHTML = `<div class="container">
        <h2 style="text-align:center;">Szervereid</h2>
        <form id="createForm">
          <input type="text" name="name" placeholder="Szerver neve" required>
          <select name="type">
            <option value="fivem">FiveM</option>
            <option value="minecraft">Minecraft</option>
          </select>
          <button type="submit">Létrehozás</button>
        </form>
        <div id="serverList"></div>
      </div>`;
      const list = document.getElementById("serverList");
      servers.forEach((s,i)=>{
        const div = document.createElement("div");
        div.className = "card";
        div.innerText = s.name + " ("+s.type+")";
        div.addEventListener("click",()=>{
          navigateTo("/server/"+i);
        });
        list.appendChild(div);
      });
      document.getElementById("createForm").addEventListener("submit", async e=>{
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target).entries());
        data.email = user.email;
        const res = await fetch("/api/create-server", {
          method:"POST", headers:{'Content-Type':'application/json'},
          body: JSON.stringify(data)
        });
        const r = await res.json();
        list.innerHTML = "";
        r.servers.forEach((s,i)=>{
          const div = document.createElement("div");
          div.className = "card";
          div.innerText = s.name + " ("+s.type+")";
          div.addEventListener("click",()=>{
            navigateTo("/server/"+i);
          });
          list.appendChild(div);
        });
        e.target.reset();
      });
    }
    else if(path.startsWith("/server/")){
      if(!user){
        navigateTo("/login");
        return;
      }
      const res = await fetch("/api/servers?email="+encodeURIComponent(user.email));
      const servers = await res.json();
      const id = parseInt(path.split("/").pop());
      const srv = servers[id];
      if(!srv){
        app.innerHTML = "<div class='container'><p>Nincs ilyen szerver.</p></div>";
        return;
      }
      app.innerHTML = `<div class="container">
        <h2>${srv.name} (${srv.type})</h2>
        <div class="card">Státusz</div>
        <div class="card">Fájlok</div>
        <div class="card">Mentések</div>
      </div>`;
    }
  }

  router();
});
