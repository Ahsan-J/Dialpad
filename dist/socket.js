let socket = null;

window.initSocket = (empId = 0) => {
  socket = io(`${window.env["SOCKET_URL"]}/user-${empId}`, {
    transports: ["websocket", "polling"],
  });
  return socket;
};

window.getSocket = (empId = 0) => {
  return !socket ? initSocket(empId) : socket;
};
