import { ImageProps } from "./SuperImage";

type ImageReducer = {
  images: ImageProps[];
  version: number;
};
const initImages: ImageReducer = {
  images: [],
  version: 0
};

export const imageReducer = (state: ImageReducer = initImages, action) => {
  switch (action.type) {
    case "ADD_IMAGE": {
      return {
        images: [...state.images, action.value],
        version: state.version
      };
    }
    case "REMOVE_IMAGE": {
      return {
        images: state.images.filter(s => s.remoteUri !== action.value),
        version: state.version
      };
    }

    case "SET_VERSION": {
      return { images: state.images, version: action.value };
    }

    case "PURGE": {
      return { images: [], version: state.version };
    }

    default:
      return state;
  }
};
