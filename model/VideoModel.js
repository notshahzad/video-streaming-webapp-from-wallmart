const mongoose = require("mongoose");
let VideoSchema = mongoose.Schema({
  VideoName: { type: String, required: true },
  UploadDate: { type: Date, default: Date.now },
  Video: { type: Array, required: true },
  Channel: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
});
const VideoModel = mongoose.model("video", VideoSchema);
module.exports = VideoModel;
