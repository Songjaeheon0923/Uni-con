import React, { useEffect } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Logo from "../components/Logo";

const { width, height } = Dimensions.get("window");


const SplashScreen = ({ navigation }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace("Login");
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Logo width={274} height={44} />
        <View style={styles.textContainer}>
          <Text style={styles.sloganText}>함께 이루는 공간, <Text style={styles.sloganText_bold}>이룸</Text></Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F2",
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    alignItems: "center",
  },
  textContainer: {
    marginTop: 30,
    alignItems: "center",
  },
  logoText: {
    fontSize: 48,
    fontWeight: "900",
    color: "#000",
    letterSpacing: -2,
  },
  sloganText: {
    fontSize: 24,
    color: "#000",
    fontWeight: "300",
  },
  sloganText_bold: {
    fontWeight: "900",
  },
});

export default SplashScreen;
