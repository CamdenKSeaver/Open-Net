import React, { useMemo } from 'react';
import { TextInput, View, Text, TouchableOpacity, InputAccessoryView, Keyboard, Platform } from 'react-native';
let idCounter =0;
const DoneTextInput = (props) => {
  const accessoryID = useMemo(() => `doneButtonAccessory_${idCounter++}`, []);
return (
  <>
    <TextInput
      {...props}
      inputAccessoryViewID={Platform.OS === 'ios' ? accessoryID : undefined}
    />

    {Platform.OS === 'ios' && (
      <InputAccessoryView nativeID={accessoryID}>
        <View style={{ alignItems:'flex-end', backgroundColor: '#f8f8f8', padding: 6 }}>
          <TouchableOpacity
            onPress={() => Keyboard.dismiss()}
            style={{ backgroundColor: '#FB923C', borderRadius: 6, paddingVertical: 6, paddingHorizontal: 14 }}
          >
            <Text style={{ color:'#fff',fontWeight:'600'}}>Done</Text>
          </TouchableOpacity>
        </View>
      </InputAccessoryView>
    )}
  </>
);
};

export default DoneTextInput;