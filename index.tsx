import { connect, Provider } from "react-redux";
import { SuperImage } from "./SuperImage";
import { store } from "./Store";

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
  <Provider store={store}>
    <ConnectedSuperImage {...props} />
  </Provider>
);
