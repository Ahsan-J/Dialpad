"use strict";

const initialState = {
  myNumber: "",
  activeCaller: "",
  callingTo: "",
  outputNumber: "",
};

const reducer = (state, action) => {
  switch (action.type) {
    case "SET_ACTIVE_CALLER":
      return {
        ...state,
        activeCaller: action.activeCaller,
      };
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
        activeCaller: initialState.activeCaller,
        callingTo: initialState.callingTo,
      };
    default:
      return state;
  }
};

const Dialpad = React.memo((props) => {
  const [state, dispatch] = React.useContext(window.Context);

  React.useEffect(() => {
    const onKeyDown = (e) => {
      if ((/\d/.test(e.key) || ["*", "#"].includes(e.key)) && !state.callingTo) {
        return dispatch({
          type: "SET_OUTPUT_NUMBER",
          outputNumber: e.key
        })
      }
      if (e.key.toLowerCase() == "backspace" && !state.callingTo) {
        return dispatch({ type: "REMOVE_OUTPUT_NUMBER" })
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [dispatch, state.callingTo]);

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
            disabled={state.callingTo}
            type="button"
            className="btn btn-primary dialpad__number"
            onClick={onClick}
          >
            {value}
          </button>
        );
      }),
    [dispatch, state.callingTo]
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
            disabled={state.callingTo}
            type="button"
            className="btn btn-primary dialpad__number"
            onClick={onClick}
          >
            {value}
          </button>
        );
      }),
    [dispatch, state.callingTo]
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
      <button type="button" disabled={state.callingTo} className="btn btn-success dialpad__callBtn" onClick={onCall}>
        <span className={`mdi mdi-phone`}></span>
      </button>
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

  const { renderOnIncomingCall } = window.useCalling(state.myNumber);

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
        {renderOnIncomingCall}
      </div>
      <div className="card-body">
        <div className="dialpad__container">
          <Dialpad />
        </div>
      </div>
      <audio id="app-audio" loop autoPlay />
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
