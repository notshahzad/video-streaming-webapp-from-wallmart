//goto line 54
flag = false;
const express = require("express");
const socketio = require("socket.io");
const http = require("http");
const path = require("path");
const gstreamer = require("gstreamer-superficial");
require("ejs");
const bodyParser = require("body-parser");
const { createHash } = require("crypto");
const mongoose = require("mongoose");
const UserModel = require("./model/usermodel");
const {
  CreateJWT,
  CreateRefreshToken,
  ValidateToken,
  VideoUpload,
  GetVideos,
} = require("./utils/utils");
var conn = mongoose.connection;
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
dotenv.config();
const app = express();
app.use(express.json());
const httpServer = http.createServer(app);
const io = socketio(httpServer);
io.on("connection", (socket) => {
  var video = {};
  user = ValidateToken(socket.handshake.query.token, process.env.JWT_SECRET);
  if (user == null) console.log("sucket");
  socket.on("upload", (data) => {
    video[user.email] = {};
    video[user.email][data.name] = {};
    video[user.email][data.name].size = data.size;
    video.name = data.name;
    if (!video[user.email][data.name].data)
      video[user.email][data.name].data = [];
    video[user.email][data.name].data.push(data.data);
    if (data.size == video[user.email][data.name].data[0].length) {
      console.log("calling video upload function");
      VideoUpload(video, user);
      video = {};
    }
  });
  socket.on("show-Videos", async (current) => {
    console.log("oke");
    var videos = await GetVideos(current);
    console.log(videos);
    socket.emit("videos", { videos: videos });
  });
  socket.on("stream", (data) => {
    console.log(data);
    if (!stream)
      //socket event stream pr user video-id, resolution aur time ya consumed chunks ki length bhejega
      //us ke hisab se stream ek pipeline create karni hai aur original res se us ko jo res chahiye uspr change karna hai
      //basically original 720p hai aur usko 480p chahiye to gstreamer se quality change karke data socket ke through bhejna hai
      stream = new gstreamer.Pipeline("");
  });
});
mongoose
  .connect("mongodb://localhost:27017/vstream", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("connected"))
  .catch((err) => console.log(err));
if (flag)
  conn
    .collection("users")
    .deleteMany()
    .then(() => console.log("deleted")),
    conn
      .collection("videos")
      .deleteMany()
      .then(() => console.log("deleted"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "/views")));
app.use(cookieParser());
app.set("view engine", "ejs");
app.get("/signup", (req, res) => res.render("signup"));
app.get("/signin", (req, res) => res.render("signin"));
app.get("/upload", (req, res) => {
  const jwt = req.cookies.jwt;
  var IsloggedIn = ValidateToken(jwt, process.env.JWT_SECRET);
  if (IsloggedIn != null) res.render("upload");
  else res.render("landingpage");
});
app.get("/", (req, res) => {
  const jwt = req.cookies.jwt;
  var IsloggedIn = ValidateToken(jwt, process.env.JWT_SECRET);
  if (IsloggedIn == null) {
    res.render("landingpage");
  } else {
    res.render("mainpage");
  }
});
app.post("/token", async (req, res) => {
  var ref_token = req.body.ref_token;
  if (ref_token) {
    isvalid = ValidateToken(ref_token, process.env.JWT_REFRESH_SECRET);
    if (isvalid == null) {
      res.sendStatus(403);
      return;
    }
    var user = await UserModel.exists({
      RefreshToken: ref_token,
    });
    if (!user) {
      res.sendStatus(403);
      return;
    }
    const token = await CreateJWT(isvalid, process.env.JWT_SECRET);
    res.setHeader("set-cookie", `jwt=${token}`);
    res.send({ success: "refreshed successfully", token: token });
  }
});
app.post("/logout", (req, res) => {
  res.redirect("/");
});
app.post("/signup", async (req, res) => {
  let Name = req.body.name;
  let Email = req.body.email;
  let Pass = req.body.password;
  let emailexists = await UserModel.exists({
    email: Email,
  });
  if (emailexists) {
    res.end("email already exists");
    return;
  }
  Pass = createHash("sha256").update(Pass).digest("hex");
  var user = new UserModel({
    name: Name,
    email: Email,
    password: Pass,
  });
  user
    .save()
    .then(() => {
      res.send("/");
    })
    .catch(() => res.send("user already exists"));
  console.log(user);
});
app.post("/signin", async (req, res) => {
  let { name, password } = req.body;
  Pass = createHash("sha256").update(password).digest("hex");
  var User = await UserModel.findOne({ name: name, password: Pass });
  if (User) {
    const token = await CreateJWT(User);
    const refreshtoken = await CreateRefreshToken(User);
    res.setHeader("set-cookie", `jwt=${token}`);
    res.send({ success: true, ref_token: refreshtoken });
  } else res.json({ success: false });
});
app.get("/cookie-test", (req, res) => {
  res.json(req.cookies);
});
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => console.log(`listening on port ${PORT}`));
