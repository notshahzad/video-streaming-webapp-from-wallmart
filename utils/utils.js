const UserModel = require("../model/UserModel");
const VideoModel = require("../model/VideoModel");
const fs = require("fs");
const { nanoid } = require("nanoid");
const jwt = require("jsonwebtoken");
const gst_superficial = require("gstreamer-superficial");
const getDimensions = require("get-video-dimensions");
async function LoginCheck(details) {
  Name = details.name;
  Email = details.email;
  Pass = details.password;
  var isloggedin = await UserModel.exists({
    name: Name,
    email: Email,
    password: Pass,
  });
  return isloggedin;
}
async function CreateJWT(User) {
  const payload = { name: User.name, email: User.email };
  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: 15 * 60,
  });
  return token;
}
async function CreateRefreshToken(User) {
  const payload = { name: User.name, email: User.email };
  const refreshtoken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    algorithm: "HS256",
  });
  await UserModel.findOneAndUpdate(
    { _id: User._id },
    { RefreshToken: refreshtoken },
    { new: true }
  );
  return refreshtoken;
}
function ValidateToken(token, secret) {
  try {
    IsValid = jwt.verify(token, secret);
    return IsValid;
  } catch (ex) {
    return null;
  }
}
async function VideoSave(video, user) {
  try {
    if (!this.User) this.User = await UserModel.findOne({ email: user.email });
    if (!this.VideoId) this.VideoId = nanoid();
    if (!this.size) this.size = 0;
    var ext = video.name.split(".");
    var exit;
    ext = ext[ext.length - 1];
    // if (!this.res) {
    //   fs.appendFileSync(`./videos/temp/${this.VideoId}.${ext}`, video.data);
    //   getDimensions(`./videos/temp/${this.VideoId}.${ext}`).then(
    //     (resolution) => {
    //       this.res.height = resolution.height;
    //       this.res.width = resolution.width;
    //       ratio = this.res.height / this.res.width;

    //     }
    //   );
    //   fs.unlinkSync(`./videos/temp/${this.VideoId}.${ext}`);
    // }
    //save file in original encoding
    fs.appendFileSync(`./videos/temp/${this.VideoId}.${ext}`, video.data);
    this.size += video.data.length;
    if (!(this.size == video.size)) {
      return `${this.VideoId}.${ext}`;
    }
    fs.stat(`./videos/${this.VideoId}.${ext}`, (err, stat) => {
      if (!err && stat.size == video.size) return;
      this.VideoId = undefined;
      this.User = undefined;
      this.size = undefined;
      exit = `${this.VideoId}.${ext}`;
    });
    //get quality of the video
    if (!this.res) {
      getDimensions(`./videos/temp/${this.VideoId}.${ext}`).then(
        (resolution) => {
          this.res.height = resolution.height;
          this.res.width = resolution.width;
          ratio = this.res.height / this.res.width;
        }
      );
    }
    //convert to orginal video to webm

    //fs.unlinkSync(`./videos/temp/${this.VideoId}.${ext}`); //delete the original video
    if (exit) return exit;
    //make a copy of the video and change the quality
    // pipeline720p = new gst_superficial.Pipeline(
    //   `filesrc location="./videos/${this.VideoId}.${ext}" ! video/x-raw,width=1280,height=720,framerate=30/1 ! videoconvert ! filesink location="./videos/720p/${this.VideoId}.${ext}"`
    // );
    // pipeline720p.play();
    var Video = new VideoModel({
      VideoName: video.name,
      VideoID: this.VideoId,
      Video: `./videos/${this.VideoId}.${ext}`,
      Channel: this.User._id,
    });
    await UserModel.findOneAndUpdate(
      { _id: this.User._id },
      { $push: { Videos: Video._id } }
    );
    await Video.save();
    console.log("video saved");
    this.VideoId = undefined;
    this.User = undefined;
    this.size = undefined;
    return undefined;
  } catch (ex) {
    console.log("ex :", ex);
  }
}
async function GetVideos(current) {
  var videos = await VideoModel.find(
    { UploadDate: { $lt: current } },
    { Video: 0 }
  )
    .sort({ UploadDate: -1 })
    .limit(10)
    .populate("Channel", "name")
    .exec();
  return videos;
}
exports.LoginCheck = LoginCheck;
exports.CreateJWT = CreateJWT;
exports.CreateRefreshToken = CreateRefreshToken;
exports.ValidateToken = ValidateToken;
exports.VideoSave = VideoSave;
exports.GetVideos = GetVideos;
