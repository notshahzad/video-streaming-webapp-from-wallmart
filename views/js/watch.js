function createStream() {
  var VideoId = document.getElementById("videoID").innerText;
  console.log(VideoId);
  socket.emit("stream", VideoId);
}
