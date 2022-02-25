var queue = [];
const video = document.getElementById("Video");
const VideoId = document.getElementById("videoID").innerText;
var bufferend = 0;
var flag = true;
function createStream() {
  socket.emit("stream", { VideoId: VideoId, bufferend: bufferend });
  if (flag) {
    socket.on("VideoChunks", (data) => {
      queue.push(data.VideoChunk);
      bufferend = data.bufferend;
      flag = false;
    });
  }
}
if (!this.mediaSource) {
  console.log(VideoId);
  this.sourceBuffer;
  this.mediaSource = new MediaSource();
  // var mimecodec = 'video/webm; codecs="vp8"';
  var mimecodec = 'video/mp4; codecs="avc1.64002a"';
  document.getElementById("Video").src = window.URL.createObjectURL(
    this.mediaSource
  );
  this.mediaSource.onsourceopen = (e) => {
    if (!this.sourceBuffer) {
      this.sourceBuffer = this.mediaSource.addSourceBuffer(mimecodec);
      this.sourceBuffer.addEventListener(
        "updateend",
        () => {
          if (queue.length) this.sourceBuffer.appendBuffer(queue.shift());
        },
        false
      );
    }
  };
}
setInterval(() => {
  try {
    if (bufferend != undefined) {
      createStream();
      if (sourceBuffer.updating === false) {
        if (queue.length) this.sourceBuffer.appendBuffer(queue.shift());
      }
    }
  } catch (error) {
    console.log(error);
  }
}, 1000);
