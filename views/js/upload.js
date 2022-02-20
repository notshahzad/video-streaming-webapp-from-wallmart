function ReadFile() {
  const filereader = new FileReader();
  f = document.getElementById("video").files[0];
  filereader.readAsArrayBuffer(f);
  filereader.onload = (e) => {
    Upload(f, e);
  };
  // if (!f.type.includes("video")) {
  //   alert("please upload a video");
  // }
}
async function Upload(metadata, data) {
  console.log(metadata);
  var bytes = new Uint8Array(data.target.result);
  var byteLength = data.target.result.byteLength;
  const CHUNK_SIZE = 1024 * 500;
  const CHUNK_ID = byteLength / CHUNK_SIZE;
  for (let i = 0; i < CHUNK_ID; i++) {
    var CHUNK = bytes.slice(i * CHUNK_SIZE, i * CHUNK_SIZE + CHUNK_SIZE);
    await socket.emit("upload", {
      name: metadata.name,
      size: byteLength,
      data: CHUNK,
    });
  }
}
