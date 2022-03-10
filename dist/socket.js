let socket = null;

window.initSocket = (empId) => {
  if(!empId) return null;
  socket = io(`${window.env["SOCKET_URL"]}/user-${empId}`, {
    transports: ["websocket", "polling"],
  });
  return socket;
};

window.getSocket = (empId) => {
  if(!empId) return null;
  return !socket ? initSocket(empId) : socket;
};
