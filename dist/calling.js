window.useCalling = (number) => {
  const { activeCaller, setActiveCaller, callingTo, setCallingToUser } = React.useContext(window.Context)
  const [incomingOffer, setIncomingOffer] = React.useState();

  const { acceptCall, callUser, processAfterAccept, requestEndCall, endCall } =
    window.useRTCClient();

  const onAcceptIncomingCall = React.useCallback(() => {
    acceptCall(incomingOffer);
    setActiveCaller(incomingOffer.fromUser)
  }, [incomingOffer, acceptCall]);

  const onRejectIncomingCall = React.useCallback(() => {
    requestEndCall(incomingOffer.from);
    setIncomingOffer();
    setCallingToUser()
    setActiveCaller()
  }, [incomingOffer, requestEndCall]);

  const onRejectOutgoingCall = React.useCallback(() => {
    requestEndCall(callingTo.elsemployees_empid);
    setIncomingOffer();
    setCallingToUser()
    setActiveCaller()
  }, [requestEndCall, callingTo]);

  React.useEffect(() => {
    const socket = getSocket(number);
    socket.on("call-made", (data) => {
      setIncomingOffer(data);
    });
    return () => {
      socket.off("call-made");
    };
  }, [number]);

  React.useEffect(() => {
    const socket = getSocket(number);
    socket.on("answer-made", async (data) => {
      processAfterAccept(data);
      setActiveCaller(callingTo)
    });
    return () => {
      socket.off("answer-made");
    };
  }, [number, callingTo, processAfterAccept]);

  React.useEffect(() => {
    const socket = getSocket(number);
    socket.on("end-call", async () => {
      setCallingToUser()
      setActiveCaller()
      setIncomingOffer();
      endCall();
    });
    return () => {
      socket.off("end-call");
    };
  }, [number, endCall, incomingOffer]);

  React.useEffect(() => {
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

  const renderOnCall = React.useMemo(() => {
    return (
      <Modal
        style={{ content: { padding: 0 } }}
        isOpen={!number && callingTo.elsemployees_empid}
      >
        <OnCall
          callUser={callUser}
          onRejectOutgoingCall={onRejectOutgoingCall}
        />
      </Modal>
    );
  }, [callingTo, callUser, onRejectOutgoingCall, activeCaller]);

  const renderOngoingCall = React.useMemo(() => {
    return (
      <OnCalling
        onReject={incomingOffer ? onRejectIncomingCall : onRejectOutgoingCall}
      />
    );
  }, [incomingOffer, onRejectIncomingCall, onRejectOutgoingCall]);

  const renderIncomingAlert = React.useMemo(() => {
    return (
      <Modal
        style={{
          content: { padding: 0, background: "transparent", border: 0 },
        }}
        isOpen={!number && incomingOffer && incomingOffer.offer}
      >
        <ToReceiveCall
          fromUser={(incomingOffer && incomingOffer.fromUser) || {}}
          onAcceptIncomingCall={onAcceptIncomingCall}
          onRejectIncomingCall={onRejectIncomingCall}
        />
      </Modal>
    );
  }, [incomingOffer, onAcceptIncomingCall, onRejectIncomingCall, activeCaller]);

  return {
    renderOnCall,
    renderOngoingCall,
    renderIncomingAlert,
  };
};
