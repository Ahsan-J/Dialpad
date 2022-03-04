let pc = null;

const defaultRTCConfig = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  offerToReceiveAudio: true,
  offerToReceiveVideo: true,
};

window.createNewPeerConnection = (configuration = defaultRTCConfig) => {
  pc = new RTCPeerConnection(configuration);
  return pc;
};

window.getPeerConnection = (configuration = defaultRTCConfig) => {
  if (pc) return pc;
  else return createNewPeerConnection(configuration)
};

window.setPeerConnection = (npc) => (pc = npc); // incase a pc is needed an update
