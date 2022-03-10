"use strict";

const initialState = {
  myNumber: "",
  callingTo: "",
  outputNumber: "",
  incomingOffer: null,
};

const reducer = (state, action) => {
  switch (action.type) {
    case "SET_CALLING_TO":
      return {
        ...state,
        callingTo: action.callingTo || state.outputNumber,
      };
    case "SET_CURRENT_NUMBER":
      return {
        ...state,
        myNumber: action.myNumber,
      };
    case "SET_INCOMING_OFFER":
      return {
        ...state,
        incomingOffer: action.incomingOffer,
        outputNumber: action.incomingOffer.from
      };
    case "SET_OUTPUT_NUMBER":
      return {
        ...state,
        outputNumber: `${state.outputNumber}${action.outputNumber}`,
      };
    case "REMOVE_OUTPUT_NUMBER":
      return {
        ...state,
        outputNumber: `${state.outputNumber.slice(0, state.outputNumber.length - 1)}`,
      };
    case "RESET_STATES":
      return {
        ...state,
        outputNumber: initialState.outputNumber,
        callingTo: initialState.callingTo,
        incomingOffer: initialState.incomingOffer,
      };
    default:
      return state;
  }
};

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
            className="btn btn-primary dialpad__number"
            onClick={onClick}
          >
            {value}
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
            className="btn btn-primary dialpad__number"
            onClick={onClick}
          >
            {value}
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

  return (
    <React.Fragment>
      {renderLinearDialPad}
      {renderSpecialDialPad}
      {state.callingTo ? (
        <button type="button" className="btn btn-danger dialpad__callBtn" onClick={props.onReject}>
          <span className={`mdi mdi-phone-hangup`}></span>
        </button>
      ) : (
        <button type="button" disabled={state.callingTo || state.incomingOffer} className="btn btn-success dialpad__callBtn" onClick={onCall}>
          <span className={`mdi mdi-phone`}></span>
        </button>
      )}
    </React.Fragment>
  );
});

const App = React.memo(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const [state, dispatch] = React.useContext(window.Context);

  React.useEffect(() => {
    if (!urlParams.get("number")) {
      const myNumber = prompt("Enter your number");
      window.location = window.location.pathname + `?number=${myNumber}`;
    } else {
      dispatch({
        type: "SET_CURRENT_NUMBER",
        myNumber: urlParams.get("number"),
      });
    }
  }, []);

  const { renderOnIncomingCall, renderOngoingCall, onRejectOutgoingCall } = window.useCalling(state.myNumber);

  return (
    <div
      className="card text-white bg-secondary mb-3"
      style={{ width: "20rem", minHeight: "36rem" }}
    >
      <div className="card-header">
        <p>Your Number: {state.myNumber} </p>
        <div className="output__container">
          <p>{state.outputNumber}</p>
        </div>
        {renderOngoingCall}
        {renderOnIncomingCall}
      </div>
      <div className="card-body">
        <div className="dialpad__container">
          <Dialpad onReject={onRejectOutgoingCall} />
        </div>
      </div>
    </div>
  );
});

const AppWrapper = () => {
  const [state, dispatch] = React.useReducer(reducer, initialState);
  return (
    <Context.Provider value={[state, dispatch]}>
      <App />
    </Context.Provider>
  );
};

ReactDOM.render(<AppWrapper />, document.querySelector("#root"));
