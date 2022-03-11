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

  const { renderCallingState, renderHeader } = window.useCalling(state.myNumber);

  return (
    <div
      className="card bg-secondary border-primary mb-3"
      style={{ width: "20rem", minHeight: "36rem" }}
    >
      {renderHeader}
      <div className="card-body">
        {renderCallingState}
      </div>
      <h6 id="footer">Powered by: Bizz World Communications</h6>
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
