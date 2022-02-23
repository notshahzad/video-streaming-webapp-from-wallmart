var current = new Date();
var video;
function ShowVideos() {
  socket.emit("show-Videos", current);
  if (socket.hasListeners("videos")) return;
  socket.on("videos", (data) => {
    console.log(data);
    video = data;
    current = data[data.length - 1].UploadDate;
    for (let i = 0; i < data.length; i++) {
      const div = document.createElement("div");
      div.classList.add("video");
      div.innerHTML = `<a href="/watch?v=${data[i].VideoID}"><p>${data[i].VideoName}</p></a>`;
      document.querySelector(".VideoContainer").appendChild(div);
    }
  });
}
