import { AsyncStorage } from "react-native";
import { createStore, compose } from "redux";
import { persistStore, persistCombineReducers } from "redux-persist";
import { imageReducer } from "./Reducer";

const config = {
  key: "v1",
  storage: AsyncStorage,
  whitelist: ["images"]
};

const reducers = {
  images: imageReducer
};

const rootReducer = persistCombineReducers(config, reducers);
const store = createStore(rootReducer, compose());
const persistor = persistStore(store);

export { store, persistor };
