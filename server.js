const express = require('express');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const usersFile = path.join(__dirname, 'users.json');

function loadUsers(){
  if(!fs.existsSync(usersFile)) return [];
  return JSON.parse(fs.readFileSync(usersFile));
}
function saveUsers(users){
  fs.writeFileSync(usersFile, JSON.stringify(users,null,2));
}

app.post('/api/register',(req,res)=>{
  const { username, email, password } = req.body;
  if(!username || !email || !password) return res.json({ message:"Hiányzó mezők" });
  let users = loadUsers();
  if(users.find(u=>u.email===email)) return res.json({ message:"Email már létezik" });
  if(users.find(u=>u.username===username)) return res.json({ message:"Felhasználónév foglalt" });
  const hash = bcrypt.hashSync(password,8);
  users.push({ username,email,passwordHash:hash,servers:[] });
  saveUsers(users);
  res.json({ message:"Sikeres regisztráció!" });
});

app.post('/api/login',(req,res)=>{
  const { email,password } = req.body;
  let users = loadUsers();
  const user = users.find(u=>u.email===email);
  if(!user) return res.json({ success:false,message:"Nincs ilyen felhasználó" });
  const ok = bcrypt.compareSync(password,user.passwordHash);
  if(!ok) return res.json({ success:false,message:"Hibás jelszó" });
  res.json({ success:true, username:user.username });
});

app.get('/api/servers',(req,res)=>{
  const { email } = req.query;
  let users = loadUsers();
  const user = users.find(u=>u.email===email);
  res.json(user? user.servers:[]);
});

app.post('/api/create-server',(req,res)=>{
  const { email,name,type } = req.body;
  let users = loadUsers();
  const user = users.find(u=>u.email===email);
  if(user){
    user.servers.push({ name, type });
    saveUsers(users);
    return res.json({ servers:user.servers });
  }
  res.json({ servers:[] });
});

app.listen(PORT,"0.0.0.0",()=>console.log("Server fut a http://0.0.0.0:"+PORT));
