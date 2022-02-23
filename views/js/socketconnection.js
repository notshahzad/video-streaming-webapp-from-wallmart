var socket;
function CreateSocketConnection(token) {
  if (!socket) socket = io({ query: { token } });
  else {
    socket.disconnect();
    socket = io({ query: { token } });
    socket.connect();
  }
  if (window.location.pathname == "/") ShowVideos();
  else if (window.location.pathname == "/watch") createStream();
}
