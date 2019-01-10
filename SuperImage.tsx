import React from "react";
import { View, Image } from "react-native";
import ImageLoader from "./ImageLoader";

const VERSION = 1;
const LOGGING = false;

export type ImageProps = {
  remoteUri: string;
  localUri: string;
  width?: number;
  height?: number;
};

type Props = {
  images: { images: ImageProps[]; version: number };
  expo: any;
  animated: boolean;
  source: { uri: string };
  style?: any;
  dispatch: ({ type, value }: { type: string; value: any }) => void;
  width?: number | string;
  height?: number | string;
};

type State = {
  uri: string;
  image?: ImageProps;
};

class SuperImage extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { uri: null };
  }

  private _mounted = false;

  componentDidMount() {
    this._mounted = true;
  }

  componentWillUnmount() {
    this._mounted = false;
  }

  async componentWillMount() {
    const {
      source: { uri }
    } = this.props;
    if (uri) {
      this.decideOnUri(uri);
    }
  }

  // why decide on uri again? think it's not necessary
  //   async componentWillReceiveProps(props: Props) {
  //     const {
  //       source: { uri }
  //     } = props;
  //     if (uri) {
  //       this.decideOnUri(uri);
  //     }
  //   }

  async decideOnUri(uri: string) {
    this.purgeIfNewVersion();
    const inStore = await this.findWorkingImageInStore(uri);
    if (!inStore) {
      this.setState({ uri }); // use remote uri first
      if (LOGGING) console.log("download and save");
      await this.downloadAndSaveImage(uri);
    } else {
      if (LOGGING) console.log("use store image");
    }
  }

  async findWorkingImageInStore(remoteUri: string) {
    const {
      images: { images }
    } = this.props;
    const already = images.find(image => image.remoteUri === remoteUri);
    if (already) {
      // device could have cleaned storage, so always check twice.
      const really = await this.localImageExists(already.localUri);
      if (really) {
        if (this._mounted) {
          this.setState({ uri: already.localUri, image: already });
          return true;
        }
      } else {
        this.removeImage(already.remoteUri);
      }
    }
    return false;
  }

  async downloadAndSaveImage(uri: string) {
    const { dispatch } = this.props;
    const downloadedImage = await this.downloadImage(uri);
    const localUri = downloadedImage && downloadedImage.uri;

    if (localUri) {
      const really = await this.localImageExists(localUri);
      if (really) {
        Image.getSize(
          localUri,
          (width, height) => {
            const image = { remoteUri: uri, localUri, width, height };
            dispatch({
              type: "ADD_IMAGE",
              value: image
            });

            this.setState({ image });
          },
          e => console.log("error getting size:", e)
        );

        if (this._mounted) {
          this.setState({ uri: localUri });
        }
      } else {
        this.removeImage(uri);
      }
    }
  }

  removeImage = uri => {
    const { dispatch } = this.props;
    if (LOGGING) console.log("found an image but not really");
    dispatch({
      type: "REMOVE_IMAGE",
      value: uri
    });
  };

  localImageExists = async uri => {
    const FileSystem = this.props.expo.FileSystem;
    if (FileSystem) {
      return FileSystem.getInfoAsync(uri)
        .then(res => {
          const { exists, isDirectory } = res;
          return Boolean(exists) && !Boolean(isDirectory);
        })
        .catch(e => console.log(e));
    }
  };

  purgeIfNewVersion() {
    const {
      images: { version },
      dispatch
    } = this.props;

    if (version !== VERSION) {
      dispatch({
        type: "PURGE",
        value: ""
      });

      dispatch({
        type: "SET_VERSION",
        value: VERSION
      });

      if (LOGGING) console.log("Set new version");
    }
  }

  async downloadImage(
    uri: string,
    ext: string | undefined = undefined,
    attempt: number = 1
  ) {
    const FileSystem = this.props.expo.FileSystem;
    if (FileSystem) {
      if (attempt >= 10) {
        console.log(
          "Shouldn't happen, ever, but just in case. Prevent infinite loops that would lead to app crashes"
        );
        return false;
      }

      const defaultExt = "jpg";

      const extension = uri && uri.split(".").pop();
      const extension2 =
        extension && (extension.length > 5 || extension.length < 2)
          ? defaultExt
          : extension;
      const extension3 = ext ? ext : extension2;

      const imageName = Math.round(Math.random() * 1000000);

      return FileSystem.downloadAsync(
        uri,
        FileSystem.documentDirectory + imageName + "." + extension3
      )
        .then(res => {
          const headers = res.headers;

          const contentType =
            headers["Content-Type"] || headers["content-type"]; // seems to be a Android / iOS difference
          const extensions =
            contentType &&
            contentType.split("/").map(x => (x === "jpeg" ? "jpg" : x));
          //jpeg content type is jpg. Saving it as either can be done, result is the same.

          const result = {
            uri: res.uri,
            givenExtension: extension3,
            extension: extensions && extensions[1]
          };

          if (result.givenExtension !== result.extension) {
            if (LOGGING) {
              console.log(
                "Wrong extension. do again",
                "given=",
                result.givenExtension,
                "result=",
                result.extension,
                "res=",
                res
              );
            }

            FileSystem.deleteAsync(result.uri, { idempotent: true });

            return this.downloadImage(uri, result.extension, attempt + 1);
          } else {
            return result;
          }
        })
        .catch(error => {
          console.log("Error", error);
        });
    }
  }

  render() {
    const ImageComponent = this.props.animated ? ImageLoader : Image;

    const isStaticImage = this.props.source.uri === undefined;

    const { uri, image } = this.state;

    const { width, height } = this.props;

    let width2 = width;
    let height2 = height;
    let alteredStyle = undefined;
    if (width && height && image) {
      if (width === "auto") {
        width2 = Math.floor((Number(height) / image.height) * image.width);
      } else if (height === "auto") {
        height2 = Math.floor((Number(width) / image.width) * image.height);
      }

      const originalStyle = {
        ...this.props.style,
        width: undefined,
        height: undefined
      };

      alteredStyle = {
        style: [
          originalStyle,
          {
            width: width2,
            height: height2
          }
        ]
      };
    }

    const alteredProps = {
      ...this.props,
      ...alteredStyle
    };

    delete alteredProps.width;
    delete alteredProps.height;
    delete alteredProps.images;
    delete alteredProps.dispatch;

    return isStaticImage ? (
      <ImageComponent {...this.props} />
    ) : uri ? (
      <ImageComponent {...alteredProps} source={{ uri }} />
    ) : (
      <View style={[this.props.style, { backgroundColor: "#CCC" }]} />
    );
  }
}

export { SuperImage };
