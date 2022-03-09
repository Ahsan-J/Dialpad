window.useCalling = (number) => {
  const [state, dispatch] = React.useContext(window.Context)
  const [incomingOffer, setIncomingOffer] = React.useState();

  const { acceptCall, callUser, processAfterAccept, requestEndCall, endCall } = window.useRTCClient(state.myNumber);

  const onAcceptIncomingCall = React.useCallback(() => {
    acceptCall(incomingOffer);
    const audio = document.querySelector("audio#app-audio");
    audio.removeAttribute('src');
    dispatch({
      type: "SET_ACTIVE_CALLER",
      activeCaller: incomingOffer.fromUser
    });
  }, [incomingOffer, acceptCall, dispatch]);

  const onRejectIncomingCall = React.useCallback(() => {
    requestEndCall(incomingOffer.from);
    setIncomingOffer();
    dispatch({type: "RESET_STATES"})
    const audio = document.querySelector("audio#app-audio");
    audio.removeAttribute('src');
  }, [incomingOffer, requestEndCall, dispatch]);

  const onRejectOutgoingCall = React.useCallback(() => {
    requestEndCall(state.callingTo);
    setIncomingOffer();
    dispatch({type: "RESET_STATES"})
    const audio = document.querySelector("audio#app-audio");
    audio.removeAttribute('src');
  }, [requestEndCall, state, dispatch]);

  const initiateCall = React.useCallback(async () => {
    if (state.callingTo) {
      try {
        const response = await (await fetch(`${window.env.SOCKET_URL}/socket/active-users`)).json()
        if(response.some(id => parseInt(id) == parseInt(state.callingTo))) {
          callUser(state.callingTo);
          const audio = document.querySelector("audio#app-audio");
          audio.src = "/assets/waiting.wav";
        } else {
          alert(`${state.callingTo} is unavailable at the moment`);
          if(onRejectOutgoingCall) onRejectOutgoingCall()
        }
      } catch (e) {
        console.log(e);
      }
    }
  }, [state.callingTo, callUser, dispatch, onRejectOutgoingCall])

  React.useEffect(() => {
    initiateCall();
  }, [initiateCall]);

  React.useEffect(() => {
    if(!number) return e=>e
    console.log("Registering Effect")
    const socket = getSocket(number);
    socket.on("call-made", (data) => {
      console.log("getting call", data)
      setIncomingOffer(data);
      const audio = document.querySelector("audio#app-audio");
      audio.src = "/assets/incoming.wav";
    });
    return () => {
      socket.off("call-made");
    };
  }, [number]);

  React.useEffect(() => {
    if(!number) return e=>e
    const socket = getSocket(number);
    socket.on("answer-made", async (data) => {
      processAfterAccept(data);
      const audio = document.querySelector("audio#app-audio");
      audio.removeAttribute('src');
      dispatch({
        type: "SET_ACTIVE_CALLER",
        activeCaller: state.callingTo
      });
    });
    return () => {
      socket.off("answer-made");
    };
  }, [number, state.callingTo, dispatch, processAfterAccept]);

  React.useEffect(() => {
    if(!number) return e=>e
    const socket = getSocket(number);
    socket.on("end-call", async () => {
      dispatch({type: "RESET_STATES"})
      setIncomingOffer();
      endCall();
    });
    return () => {
      socket.off("end-call");
    };
  }, [number, endCall, incomingOffer]);

  React.useEffect(() => {
    if(!number) return e=>e
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
        <button disabled={!incomingOffer} type="button" class="btn btn-success" onClick={onAcceptIncomingCall}>
          <span className={`mdi mdi-phone`}></span>
          Accept
        </button>
        <button disabled={!incomingOffer} type="button" class="btn btn-danger" onClick={onRejectIncomingCall}>
          <span className={`mdi mdi-phone-hangup`}></span>
          Reject
        </button>
      </div>
    )
  }, [onAcceptIncomingCall, incomingOffer, onRejectIncomingCall])
  
  const renderOngoingCall = React.useMemo(() => {
    return (
      <div className="incoming__actionContainer">
       
      </div>
    )
  }, [incomingOffer])

  return {
    renderOnIncomingCall,
    renderOngoingCall
  }
};
