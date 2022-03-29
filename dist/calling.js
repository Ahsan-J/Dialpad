
const Timer = React.memo((props) => {
  const [duration, setDuration] = React.useState(0);
  const interval = React.useRef(0);

  const tick = React.useCallback(() => setDuration((d) => d + 1), []);

  React.useEffect(() => {
    interval.current = setInterval(tick, 1000);
    return () => {
      clearInterval(interval.current);
    };
  }, [tick]);

  return (
    <span className={props.className || ""} style={props.style}>
      {`${parseInt(duration / 60, 10)}`.padStart(2, '0')}:{`${parseInt(duration % 60, 10)}`.padStart(2, '0')}
    </span>
  );
});

const alphabet = [, "©", "ABC", "DEF", "GHI", "JKL", "MNO", "PQRS", "TUV", "WXYZ"]

const Dialpad = React.memo((props) => {
  const [state, dispatch] = React.useContext(window.Context);

  React.useEffect(() => {
    const onKeyDown = (e) => {
      if ((/\d/.test(e.key) || ["*", "#"].includes(e.key)) && !(state.callingTo || state.incomingOffer)) {
        return dispatch({
          type: "SET_OUTPUT_NUMBER",
          outputNumber: e.key
        })
      }
      if (e.key.toLowerCase() == "backspace" && !(state.callingTo || state.incomingOffer)) {
        return dispatch({ type: "REMOVE_OUTPUT_NUMBER" })
      }

      if (e.key.toLowerCase() == "enter" && !(state.callingTo || state.incomingOffer)) {
        return dispatch({ type: "SET_CALLING_TO" });
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [dispatch, state.callingTo, state.incomingOffer]);

  const renderLinearDialPad = React.useMemo(
    () =>
      [...Array(9)].map((_, i) => {
        const value = i + 1;
        const onClick = (e) => {
          e.preventDefault();
          dispatch({
            type: "SET_OUTPUT_NUMBER",
            outputNumber: value
          })
        };
        return (
          <button
            key={value}
            disabled={state.callingTo || state.incomingOffer}
            type="button"
            className="btn btn-secondary dialpad__number"
            onClick={onClick}
          >
            <p>
              {value}
            </p>
            <span>
              {alphabet[value] || ""}
            </span>
          </button>
        );
      }),
    [dispatch, state.callingTo, state.incomingOffer]
  );

  const renderSpecialDialPad = React.useMemo(
    () =>
      ["*", "0", "#"].map((value) => {
        const onClick = (e) => {
          e.preventDefault();
          dispatch({
            type: "SET_OUTPUT_NUMBER",
            outputNumber: value
          })
        };
        return (
          <button
            key={value}
            disabled={state.callingTo || state.incomingOffer}
            type="button"
            className="btn btn-secondary dialpad__number"
            onClick={onClick}
          >
            <p>
              {value}
            </p>
            <span>
              {alphabet[value] || ""}
            </span>
          </button>
        );
      }),
    [dispatch, state.callingTo, state.incomingOffer]
  );

  const onCall = React.useCallback(() => {
    dispatch({
      type: "SET_CALLING_TO",
    });
  }, [dispatch])

  const onContact = () => {
    dispatch({
      type: "SET_SHOW_CONTACTS",
      showContacts: true
    });
  }

  return (
    <React.Fragment>
      {renderLinearDialPad}
      {renderSpecialDialPad}
      <button type="button" className="btn btn-link dialpad__action" onClick={onContact}>
        <span className={`mdi mdi-chat-processing`} style={{ color: "var(--bs-primary)", fontSize: "2.5rem" }}></span>
      </button>
      {state.callingTo ? (
        <button type="button" className="btn btn-danger dialpad__callBtn" onClick={props.onReject}>
          <span className={`mdi mdi-phone-hangup`}></span>
        </button>
      ) : (
        <button type="button" disabled={state.callingTo || state.incomingOffer} className="btn btn-success dialpad__callBtn" onClick={onCall}>
          <span className={`mdi mdi-phone`}></span>
        </button>
      )}
      <button type="button" className="btn btn-link dialpad__action" onClick={props.onReject}>
        <span className={`mdi mdi-close`} style={{ color: "var(--bs-danger)", fontSize: "2.5rem" }}></span>
      </button>
    </React.Fragment>
  );
});

const Avatar = React.memo((props) => {

  return (
    <div className="avatar__container">
      <img src="/logo.png" />
      <h5>{props.callerID}</h5>
    </div>
  );
});

window.useCalling = (number) => {
  const [state, dispatch] = React.useContext(window.Context)
  const [callStatus, setCallStatus] = React.useState((getSocket(number) || {}).connected ? "Connected" : "Disconnected")

  const { acceptCall, callUser, processAfterAccept, requestEndCall, endCall } = window.useRTCClient(state.myNumber);

  const onAcceptIncomingCall = React.useCallback(() => {
    acceptCall(state.incomingOffer);
    setCallStatus("On Call")
  }, [state.incomingOffer, acceptCall]);

  const onRejectIncomingCall = React.useCallback(() => {
    requestEndCall(state.incomingOffer.from);
    dispatch({ type: "RESET_STATES" })
    setCallStatus((getSocket(number) || {}).connected ? "Connected" : "Disconnected")
  }, [state.incomingOffer, requestEndCall, dispatch, number]);

  const onRejectOutgoingCall = React.useCallback(() => {
    requestEndCall(state.callingTo || (state.incomingOffer && state.incomingOffer.from));
    dispatch({ type: "RESET_STATES" })
    setCallStatus((getSocket(number) || {}).connected ? "Connected" : "Disconnected")
  }, [requestEndCall, state.callingTo, state.incomingOffer, dispatch, number]);

  const initiateCall = React.useCallback(async () => {
    if (state.callingTo) {
      try {
        const response = await (await fetch(`${window.env.SOCKET_URL}/socket/active-users`)).json()
        if (response.some(id => parseInt(id) == parseInt(state.callingTo))) {
          callUser(state.callingTo);
          setCallStatus("Ringing")
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
    }
  }, [state.callingTo, onRejectOutgoingCall, requestEndCall, callUser])

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
      setCallStatus(`Incoming`);
      dispatch({
        type: "SET_INCOMING_OFFER",
        incomingOffer: data
      });
    });
    return () => {
      socket.off("call-made");
    };
  }, [number, dispatch]);

  React.useEffect(() => {
    if (!number) return e => e
    const socket = getSocket(number);
    socket.on("answer-made", async (data) => {
      setCallStatus("On Call")
      processAfterAccept(data);
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
      setCallStatus((getSocket(number) || {}).connected ? "Connected" : "Disconnected")
    });
    return () => {
      socket.off("end-call");
    };
  }, [number, endCall, state.incomingOffer, dispatch]);

  React.useEffect(() => {
    if (!number) return e => e
    const socket = getSocket(number);
    socket.on("icecandidate-receive", async (data) => {
      const peerConnection = getPeerConnection();
      try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(JSON.parse(data)));
      } catch (e) {
        console.error(data, e);
      }
    });
    return () => {
      socket.off("icecandidate-receive");
    };
  }, [number]);

  const renderOnIncomingCall = React.useMemo(() => {
    if (!state.incomingOffer) return null;

    return (
      <React.Fragment>
        <div className="ongoing__container">
          <Avatar callerID={state.incomingOffer.from}/>
          <p>Incoming Call</p>
          <div className="incoming__actionContainer">
            <button disabled={!state.incomingOffer} type="button" className="btn btn-success" onClick={onAcceptIncomingCall}>
              <span className={`mdi mdi-phone`}></span>
            </button>
            <button disabled={!state.incomingOffer} type="button" className="btn btn-danger" onClick={onRejectIncomingCall}>
              <span className={`mdi mdi-phone-hangup`}></span>
            </button>
          </div>
        </div>
        {callStatus == "Incoming" ? (
          <audio loop autoPlay>
            <source src="/audio/incoming.wav" type="audio/wav" />
          </audio>
        ): null}
      </React.Fragment>
    )
  }, [onAcceptIncomingCall, state.incomingOffer, onRejectIncomingCall, callStatus])

  const renderOngoingCall = React.useMemo(() => {
    return (
      <React.Fragment>
        <div className="ongoing__container">
          <Avatar callerID={state.callingTo || (state.incomingOffer && state.incomingOffer.from)}/>
          {callStatus == "On Call" ? <Timer />: callStatus}
          <button type="button" className="btn btn-danger dialpad__callBtn" onClick={onRejectOutgoingCall}>
            <span className={`mdi mdi-close`}></span>
          </button>
        </div>
        {callStatus == "Ringing" ? (
          <audio loop autoPlay>
            <source src="/audio/waiting.wav" type="audio/wav" />
          </audio>
        ): null}
      </React.Fragment>

    )
  }, [callStatus, onRejectOutgoingCall, state.callingTo, state.incomingOffer])

  const renderDialpad = React.useMemo(() => {
    return (
      <React.Fragment>
        <div className="output__container">
          <p>{state.outputNumber}</p>
        </div>
        <div className="dialpad__container">
          <Dialpad onReject={onRejectOutgoingCall} />
        </div>
      </React.Fragment>
    )
  }, [onRejectOutgoingCall, state.outputNumber])

  const renderHeader = React.useMemo(() => {
    return (
      <div className="card-header status_header">
        <span className="badge rounded-pill bg-primary">Your number: {state.myNumber} </span>
        <span class="badge rounded-pill bg-success">{callStatus}</span>
      </div>
    )
  }, [state.myNumber, callStatus])

  const renderCallingState = React.useMemo(() => {
    if (state.incomingOffer && callStatus == "Incoming") return renderOnIncomingCall;
    if (state.callingTo || (state.incomingOffer && state.incomingOffer.from)) return renderOngoingCall
    return renderDialpad;
  }, [renderDialpad, callStatus, state.callingTo, state.incomingOffer, renderOngoingCall, renderOnIncomingCall])

  return {
    renderCallingState,
    renderHeader,
  }
};
