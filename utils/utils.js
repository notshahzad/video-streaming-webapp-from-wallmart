const UserModel = require("../model/usermodel");
const VideoModel = require("../model/VideoModel");
const jwt = require("jsonwebtoken");
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
async function VideoUpload(video, user) {
  try {
    var User = await UserModel.findOne({ email: user.email });
    var Video = new VideoModel({
      VideoName: video.name,
      Video: video[user.email][video.name].data[0],
      Channel: User._id,
    });
    await UserModel.findOneAndUpdate(
      { _id: User._id },
      { $push: { Videos: Video._id } }
    );
    await Video.save();
  } catch (ex) {
    console.log("ex :", ex);
  }
}
async function GetVideos(current) {
  var videos = await VideoModel.find(
    { UploadDate: { $lte: current } },
    { Video: 0 }
  )
    .sort({ UploadDate: 1 })
    .limit(10)
    .populate("Channel", "name")
    .exec();
  return { videos };
}
exports.LoginCheck = LoginCheck;
exports.CreateJWT = CreateJWT;
exports.CreateRefreshToken = CreateRefreshToken;
exports.ValidateToken = ValidateToken;
exports.VideoUpload = VideoUpload;
exports.GetVideos = GetVideos;
