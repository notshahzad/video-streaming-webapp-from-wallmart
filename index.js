flag = true;
const fs = require("fs");
const express = require("express");
const socketio = require("socket.io");
const http = require("http");
const path = require("path");
const gstreamer = require("gstreamer-superficial");
require("ejs");
const bodyParser = require("body-parser");
const { createHash } = require("crypto");
const mongoose = require("mongoose");
const UserModel = require("./model/UserModel");
const {
  CreateJWT,
  CreateRefreshToken,
  ValidateToken,
  VideoSave,
  GetVideos,
} = require("./utils/utils");
var conn = mongoose.connection;
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const VideoModel = require("./model/VideoModel");
dotenv.config();
const app = express();
app.use(express.json());
const httpServer = http.createServer(app);
const io = socketio(httpServer);
io.on("connection", (socket) => {
  var video;
  user = ValidateToken(socket.handshake.query.token, process.env.JWT_SECRET);
  if (user == null) console.log("sucket"), socket.disconnect();
  socket.on("upload", async (data) => {
    video = VideoSave(data, user);
  });
  socket.on("disconnect", () => {
    if (video && typeof video == "string") {
      console.log(typeof video, toString(video));
      fs.unlinkSync(`./videos/${video}`);
    }
  });
  socket.on("show-Videos", async (current) => {
    if (current == null) return;
    video = await GetVideos(current);
    console.log(video);

    if (video.length == 0) return;
    socket.emit("videos", video);
  });
  socket.on("stream", async (data) => {
    if (data.bufferend == NaN || data.bufferend == undefined) {
      return;
    }
    // var videodata;
    // try {
    //   videodata = await VideoModel.findOne({ VideoID: data.VideoId });
    //   console.log(data.VideoId);
    // } catch (err) {
    //   console.log(err);
    //   return;
    // }
    if (!this.filesize) {
      this.filesize = fs.statSync("./b_dashinit.mp4").size;
      console.log(this.filesize);
    }
    new_end = data.bufferend + 665536 - 1;
    console.log(this.filesize - data.bufferend);
    if (this.filesize - data.bufferend < 665536) {
      new_end = this.filesize;
    }
    // console.log(videodata);
    // if (!videodata) return;
    // var videostream = fs.createReadStream(videodata.Video, {
    //   start: data.bufferend,
    //   end: data.bufferend + 1000,
    // });
    var videostream = fs.createReadStream("./b_dashinit.mp4", {
      start: data.bufferend,
      end: new_end - 1,
    });
    if (this.filesize == new_end) new_end = undefined;
    videostream.addListener("data", (data) => {
      socket.emit("VideoChunks", {
        VideoChunk: data,
        bufferend: new_end,
      });
    });
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
  else res.redirect("/");
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
app.get("/watch", (req, res) => {
  const jwt = req.cookies.jwt;
  var IsloggedIn = ValidateToken(jwt, process.env.JWT_SECRET);
  if (IsloggedIn == null) {
    res.render("landingpage");
  } else {
    res.render("watch", { video: req.query.v });
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
