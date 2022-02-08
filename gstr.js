const gstreamer = require("gstreamer-superficial");
const pipeline = new gstreamer.Pipeline(
  "videotestsrc pattern=ball background-color=0x00ff0000 num-buffers=15 ! appsink name=sink"
);
pipeline.play();
pipeline.pollBus((msg) => console.log);
appsink = pipeline.findChild("sink");
const onData = (buffer, caps) => {
  if (caps) console.log(`caps : ${JSON.stringify(caps)}`);
  if (buffer) {
    console.log(`buffer size :${buffer.length} ${JSON.stringify(buffer)}`);
    appsink.pull(onData);
  }
};
appsink.pull(onData);
