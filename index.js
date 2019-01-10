import React from "react";
import { connect, Provider } from "react-redux";
import { SuperImage } from "./SuperImage";
import { store, persistor } from "./Store";
import { PersistGate } from "redux-persist/es/integration/react";

const mapStateToProps = ({ images }) => {
  return { images };
};
const mapDispatchToProps = dispatch => ({
  dispatch
});

const ConnectedSuperImage = connect(
  mapStateToProps,
  mapDispatchToProps
)(SuperImage);

export default props => (
  <PersistGate persistor={persistor}>
    <Provider store={store}>
      <ConnectedSuperImage {...props} />
    </Provider>
  </PersistGate>
);
