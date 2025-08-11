import React, { useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import PropertyMapView from "../components/MapView";
import { dummyProperties } from "../data/dummyProperties";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <PropertyMapView
        properties={dummyProperties}
        onMarkerPress={(property) => Alert.alert(property.title)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
