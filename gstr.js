const gstreamer = require("gstreamer-superficial");
pipeline = new gstreamer.Pipeline(
  "filesrc location=Big_Buck_Bunny_1080_10s_20MB.mp4 ! decodebin name=demux ! queue ! videoconvert ! x264enc ! mp4mux ! filesink location=b.mp4"
);
pipeline.play();
while (pipeline) {}
