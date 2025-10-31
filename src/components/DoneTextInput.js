import React from 'react';
import { TextInput } from 'react-native';

const DoneTextInput = (props) => {
  return (
    <TextInput
      {...props}
      returnKeyType="done"
      blurOnSubmit={true}
    />
  );
};

export default DoneTextInput;