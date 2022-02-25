const UserModel = require("../model/UserModel");
const VideoModel = require("../model/VideoModel");
const fs = require("fs");
const { nanoid } = require("nanoid");
const jwt = require("jsonwebtoken");
// const getDimensions = require("get-video-dimensions");
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
    fs.appendFileSync(`./videos/temp/${this.VideoId}_temp.${ext}`, video.data);
    this.size += video.data.length;
    if (!(this.size == video.size)) {
      return `${this.VideoId}.${ext}`;
    }
    fs.stat(`./videos/temp${this.VideoId}_temp.${ext}`, (err, stat) => {
      if (!err && stat.size == video.size) return;
      this.VideoId = undefined;
      this.User = undefined;
      this.size = undefined;
      exit = `${this.VideoId}.${ext}`;
    });
    if (exit) return exit;
    //./video/temp/./convert-to-mp4.sh `${this.VideoId}_tenp.${ext}` `../${this.VideoId}.mp4` ``${this.VideoId}_dashinit.mp4``
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
  console.log(current);
  var videos = await VideoModel.find(
    { UploadDate: { $l: current } },
    { Video: 0 }
  )
    .sort({ UploadDate: -1 })
    .limit(2)
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
