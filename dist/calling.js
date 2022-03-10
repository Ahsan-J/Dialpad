
const Timer = React.memo((props) => {
  const [duration, setDuration] = React.useState(0);
  const interval = React.useRef(0);

  const tick = React.useCallback(() => setDuration((d) => d + 1), []);

  React.useEffect(() => {
    interval.current = setInterval(tick, 1000);
    return () => {
      clearInterval(interval.current);
    };
  }, []);

  return (
    <span className={props.className || ""} style={props.style}>
      {`${parseInt(duration / 60, 10)}`.padStart(2, '0')}:{`${parseInt(duration % 60, 10)}`.padStart(2, '0')}
    </span>
  );
});

window.useCalling = (number) => {
  const [state, dispatch] = React.useContext(window.Context)
  const [callStatus, setCallStatus] = React.useState((getSocket(number) || {}).connected ? "Connected" : "Disconnected")

  const { acceptCall, callUser, processAfterAccept, requestEndCall, endCall } = window.useRTCClient(state.myNumber);

  const onAcceptIncomingCall = React.useCallback(() => {
    acceptCall(state.incomingOffer);
    const audio = document.querySelector("audio#app-audio");
    audio.pause();
    audio.removeAttribute('src');
    setCallStatus("On Call")
  }, [state.incomingOffer, acceptCall, dispatch]);

  const onRejectIncomingCall = React.useCallback(() => {
    requestEndCall(state.incomingOffer.from);
    dispatch({ type: "RESET_STATES" })
    const audio = document.querySelector("audio#app-audio");
    audio.pause();
    audio.removeAttribute('src');
    setCallStatus((getSocket(number) || {}).connected ? "Connected" : "Disconnected")
  }, [state.incomingOffer, requestEndCall, dispatch]);

  const onRejectOutgoingCall = React.useCallback(() => {
    requestEndCall(state.callingTo);
    dispatch({ type: "RESET_STATES" })
    const audio = document.querySelector("audio#app-audio");
    audio.pause();
    audio.removeAttribute('src');
    setCallStatus((getSocket(number) || {}).connected ? "Connected" : "Disconnected")
  }, [requestEndCall, state, dispatch]);

  const initiateCall = React.useCallback(async () => {
    if (state.callingTo) {
      try {
        const response = await (await fetch(`${window.env.SOCKET_URL}/socket/active-users`)).json()
        if (response.some(id => parseInt(id) == parseInt(state.callingTo))) {
          callUser(state.callingTo);
          setCallStatus("Ringing")
          const audio = document.querySelector("audio#app-audio");
          audio.src = "/assets/waiting.wav";
        } else {
          alert(`${state.callingTo} is unavailable at the moment`);
          if (onRejectOutgoingCall) onRejectOutgoingCall()
        }
      } catch (e) {
        console.log(e);
      }
    }
    else {
      requestEndCall(state.callingTo);
      const audio = document.querySelector("audio#app-audio");
      audio.pause();
      audio.removeAttribute('src');
    }
  }, [state.callingTo, callUser, dispatch, onRejectOutgoingCall])

  React.useEffect(() => {
    initiateCall();
  }, [initiateCall]);

  React.useEffect(() => {
    const onKeyDown = (e) => {
      if (e.keyCode == 116) {
        if (state.incomingOffer) onRejectIncomingCall()
        else onRejectOutgoingCall()
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [state.incomingOffer, onRejectIncomingCall, onRejectOutgoingCall]);

  React.useEffect(() => {
    window.onunload = (event) => {
      if (state.incomingOffer) onRejectIncomingCall()
      else onRejectOutgoingCall()
    };

  }, [state.incomingOffer, onRejectIncomingCall, onRejectOutgoingCall])

  React.useEffect(() => {
    if (!number) return e => e
    const socket = getSocket(number);
    socket.on("connect", () => {
      setCallStatus((getSocket(number) || {}).connected ? "Connected" : "Disconnected")
    });
    return () => {
      socket.off("connect");
    };
  }, [number]);

  React.useEffect(() => {
    if (!number) return e => e
    const socket = getSocket(number);
    socket.on("call-made", (data) => {
      setCallStatus(`Incoming: ${data.from}`);
      dispatch({
        type: "SET_INCOMING_OFFER",
        incomingOffer: data
      });
      const audio = document.querySelector("audio#app-audio");
      audio.src = "/assets/incoming.wav";
    });
    return () => {
      socket.off("call-made");
    };
  }, [number]);

  React.useEffect(() => {
    if (!number) return e => e
    const socket = getSocket(number);
    socket.on("answer-made", async (data) => {
      processAfterAccept(data);
      const audio = document.querySelector("audio#app-audio");
      audio.pause();
      audio.removeAttribute('src');
      setCallStatus("On Call")
      dispatch({
        type: "SET_OUTPUT_NUMBER",
        outputNumber: state.callingTo
      });
    });
    return () => {
      socket.off("answer-made");
    };
  }, [number, state.callingTo, dispatch, processAfterAccept]);

  React.useEffect(() => {
    if (!number) return e => e
    const socket = getSocket(number);
    socket.on("end-call", async () => {
      dispatch({ type: "RESET_STATES" })
      endCall();
      const audio = document.querySelector("audio#app-audio");
      audio.pause();
      audio.removeAttribute('src');
      setCallStatus((getSocket(number) || {}).connected ? "Connected" : "Disconnected")
    });
    return () => {
      socket.off("end-call");
    };
  }, [number, endCall, state.incomingOffer]);

  React.useEffect(() => {
    if (!number) return e => e
    const socket = getSocket(number);
    socket.on("icecandidate-receive", async (data) => {
      const peerConnection = getPeerConnection();
      try {
        await peerConnection.addIceCandidate(
          new RTCIceCandidate(JSON.parse(data))
        );
      } catch (e) {
        console.error(data, e);
      }
    });
    return () => {
      socket.off("icecandidate-receive");
    };
  }, [number]);

  const renderOnIncomingCall = React.useMemo(() => {
    return (
      <div className="incoming__actionContainer">
        <button disabled={!state.incomingOffer} type="button" class="btn btn-success" onClick={onAcceptIncomingCall}>
          <span className={`mdi mdi-phone`}></span>
          Accept
        </button>
        <button disabled={!state.incomingOffer} type="button" class="btn btn-danger" onClick={onRejectIncomingCall}>
          <span className={`mdi mdi-phone-hangup`}></span>
          Reject
        </button>
      </div>
    )
  }, [onAcceptIncomingCall, state.incomingOffer, onRejectIncomingCall])

  const renderOngoingCall = React.useMemo(() => {
    return (
      <div className="ongoing__container">
        <span>{callStatus}</span>
        {callStatus == "On Call" ? <Timer /> : null}
      </div>
    )
  }, [callStatus])

  return {
    renderOnIncomingCall,
    renderOngoingCall,
    onRejectOutgoingCall
  }
};
