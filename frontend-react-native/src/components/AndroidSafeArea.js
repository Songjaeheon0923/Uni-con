import React from 'react';
import { Platform, StatusBar, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AndroidSafeArea({ children, style, edges = ['top', 'bottom'] }) {
  const insets = useSafeAreaInsets();
  
  if (Platform.OS !== 'android') {
    return <View style={style}>{children}</View>;
  }
  
  const paddingTop = edges.includes('top') ? Math.max(insets.top, StatusBar.currentHeight || 0) : 0;
  const paddingBottom = edges.includes('bottom') ? insets.bottom : 0;
  const paddingLeft = edges.includes('left') ? insets.left : 0;
  const paddingRight = edges.includes('right') ? insets.right : 0;
  
  return (
    <View 
      style={[
        {
          flex: 1,
          paddingTop,
          paddingBottom,
          paddingLeft,
          paddingRight,
          backgroundColor: '#ffffff',
        },
        style
      ]}
    >
      {children}
    </View>
  );
}