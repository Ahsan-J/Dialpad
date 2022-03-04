const offerOptions = {
  offerToReceiveAudio: true,
  offerToReceiveVideo: false,
  voiceActivityDetection: false,
};

window.useRTCClient = (number) => {
  if (!/\d+/.test(number)) {
    return {
      processAfterAccept: (e) => e,
      callUser: (e) => e,
      endCal: (e) => e,
      requestEndCall: (e) => e,
      acceptCall: (e) => e,
    };
  }
  const localStream = React.useRef(null);

  const endCall = React.useCallback(() => {
    const peerConnection = window.getPeerConnection();
    if (localStream.current) {
      localStream.current.getTracks().forEach((track) => track.stop());
    }
    localStream.current = null;
    peerConnection.close();
    window.createNewPeerConnection();
  }, []);

  const requestEndCall = React.useCallback(
    (user_id) => {
      const socket = window.getSocket(number);
      endCall();
      socket.emit("request-end-call", {
        to: user_id,
        from: number,
      });
    },
    [number, endCall]
  );

  const callUser = React.useCallback(
    async (toNumber) => {
      const devices = await navigator.mediaDevices.enumerateDevices();
      if (devices.filter((d) => d.kind == "audioinput").length == 0)
        return alert("No Input media detected");
      const peerConnection = window.getPeerConnection();
      const socket = window.getSocket(number);
      localStream.current =
        localStream.current ||
        (await navigator.mediaDevices.getUserMedia({ audio: true }));

      const remoteVideo = document.querySelector("audio#remoteVideo");
      if (!remoteVideo) return console.log("Element missing");

      peerConnection.addEventListener("track", (e) => {
        if (remoteVideo.srcObject !== e.streams[0]) {
          remoteVideo.srcObject = e.streams[0];
        }
      });

      peerConnection.addEventListener("icecandidate", (event) => {
        if (event.candidate && event.candidate.candidate) {
          socket.emit("icecandidate-sent", {
            candidate: JSON.stringify(event.candidate),
            user_id: number,
          });
        }
      });

      peerConnection.addEventListener("connectionstatechange", (event) => {
        if (peerConnection.connectionState === "disconnected") {
          try {
            requestEndCall();
          } catch (e) {
            console.log(e);
          }
        }
      });

      localStream.current
        .getTracks()
        .forEach((track) =>
          peerConnection.addTrack(track, localStream.current)
        );
      peerConnection.addStream(localStream.current);

      const offer = await peerConnection.createOffer(offerOptions);
      await peerConnection.setLocalDescription(
        new RTCSessionDescription(offer)
      );
      window.setPeerConnection(peerConnection);

      socket.emit("call-user", {
        offer,
        to: user.elsemployees_empid, // who is receiving
        from: number, // who is calling
      });
    },
    [number, requestEndCall]
  );

  const acceptCall = React.useCallback(
    async (data) => {
      const devices = await navigator.mediaDevices.enumerateDevices();
      if (devices.filter((d) => d.kind == "audioinput").length == 0)
        return alert("No Input media detected");
      const peerConnection = window.getPeerConnection();
      const socket = window.getSocket(number);

      localStream.current =
        localStream.current ||
        (await navigator.mediaDevices.getUserMedia({ audio: true }));

      const remoteVideo = document.querySelector("audio#remoteVideo");
      if (!remoteVideo) return console.log("Element missing");

      peerConnection.addEventListener("track", (e) => {
        if (remoteVideo.srcObject !== e.streams[0]) {
          remoteVideo.srcObject = e.streams[0];
        }
      });

      peerConnection.addEventListener("icecandidate", (event) => {
        if (event.candidate && peerConnection.localDescription.type) {
          socket.emit("icecandidate-sent", {
            candidate: JSON.stringify(event.candidate),
            user_id: data.from,
          });
        }
      });

      peerConnection.addEventListener("connectionstatechange", (event) => {
        if (peerConnection.connectionState === "disconnected") {
          try {
            requestEndCall();
          } catch (e) {
            console.log(e);
          }
        }
      });

      localStream.current
        .getTracks()
        .forEach((track) =>
          peerConnection.addTrack(track, localStream.current)
        );
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(data.offer)
      );
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(
        new RTCSessionDescription(answer)
      );

      socket.emit("make-answer", {
        answer,
        from: data.from, // who is calling
        to: data.to, // who is receiving
      });
      window.setPeerConnection(peerConnection);
    },
    [number, requestEndCall]
  );

  const processAfterAccept = React.useCallback(async (data) => {
    const peerConnection = window.getPeerConnection();
    await peerConnection.setRemoteDescription(
      new RTCSessionDescription(data.answer)
    );
    window.setPeerConnection(peerConnection);
  }, []);

  return {
    processAfterAccept,
    callUser,
    endCall,
    requestEndCall,
    acceptCall,
  };
};
