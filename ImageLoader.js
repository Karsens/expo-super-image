import React from "react";
import { Animated } from "react-native";

class ImageLoader extends React.Component {
  state = {
    opacity: new Animated.Value(0),
    loadedTimes: 0
  };

  render() {
    return (
      <Animated.Image
        onLoad={() => {
          this.setState({ loadedTimes: this.state.loadedTimes + 1 });
          if (this.state.loadedTimes === 0) {
            // only do animation once. once url refreshes and image loaded again, it's not needed.
            Animated.timing(this.state.opacity, {
              toValue: 1,
              duration: 100,
              useNativeDriver: true
            }).start();
          }
        }}
        {...this.props}
        style={[
          {
            opacity: this.state.opacity,
            transform: [
              {
                scale: this.state.opacity.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.85, 1]
                })
              }
            ]
          },
          this.props.style
        ]}
      />
    );
  }
}
export default ImageLoader;
