var socket;
function CreateSocketConnection(token) {
  if (!socket) socket = io({ query: { token } });
  else {
    socket.disconnect();
    socket = io({ query: { token } });
    socket.connect();
  }
}
