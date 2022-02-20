const mongoose = require("mongoose");
let userSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  image: {
    type: String,
  },
  password: {
    type: String,
  },
  RefreshToken: { type: String, default: null },
  Videos: [{ type: mongoose.Schema.Types.ObjectId, ref: "video" }],
});
const model = mongoose.model("user", userSchema);
module.exports = model;
