const mongoose = require("mongoose");
let VideoSchema = mongoose.Schema({
  VideoName: { type: String, required: true },
  VideoID: { type: String, required: true, unique: true },
  UploadDate: { type: Date, default: Date.now },
  Video: { type: String, required: true },
  Resolution: { type: String, required: true },
  Channel: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
});
const VideoModel = mongoose.model("video", VideoSchema);
module.exports = VideoModel;
