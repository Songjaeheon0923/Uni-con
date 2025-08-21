import React, { useState, useEffect, useRef, forwardRef } from "react";
import { View, StyleSheet, Text, Dimensions } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";

const { width, height } = Dimensions.get("window");

const PropertyMapView = forwardRef(({
  properties = [],
  onMarkerPress,
  selectedPropertyId,
}, ref) => {
  const [region, setRegion] = useState({
    latitude: 37.5665, // 서울 시청 위치
    longitude: 126.978,
    latitudeDelta: 0.15,  // 서울 전체가 보이도록 확대
    longitudeDelta: 0.12,
  });
  const [userLocation, setUserLocation] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (properties.length > 0) {
      setTimeout(() => fitToMarkers(), 1000); // 지도 로드 후 실행
    }
  }, [properties]);

  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        let userLoc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          timeout: 10000,
        });
        const userCoords = {
          latitude: userLoc.coords.latitude,
          longitude: userLoc.coords.longitude,
        };
        setUserLocation(userCoords);
        // 사용자 위치가 서울 지역인지 확인
        const isInSeoul = userCoords.latitude >= 37.4 && userCoords.latitude <= 37.7 && 
                         userCoords.longitude >= 126.8 && userCoords.longitude <= 127.2;
        
        if (isInSeoul) {
          setRegion({
            ...userCoords,
            latitudeDelta: 0.05,  // 사용자 위치 중심으로 줌인
            longitudeDelta: 0.04,
          });
        } else {
          // 사용자가 서울 외 지역에 있으면 서울 중심으로 유지
          console.log('사용자가 서울 외 지역에 있어 서울 중심으로 유지합니다');
        }
      }
    } catch (error) {
      console.log("Location error:", error);
      // 에러시 서울로 고정
      setRegion({
        latitude: 37.5665,
        longitude: 126.978,
        latitudeDelta: 0.15,
        longitudeDelta: 0.12,
      });
    }
  };

  const fitToMarkers = () => {
    if (mapRef.current && properties.length > 0) {
      const coordinates = properties
        .filter((p) => p.latitude && p.longitude)
        .map((p) => ({ latitude: p.latitude, longitude: p.longitude }));

      if (userLocation) {
        coordinates.push(userLocation);
      }

      if (coordinates.length > 0) {
        mapRef.current.fitToCoordinates(coordinates, {
          edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
          animated: true,
        });
      }
    }
  };


  const PropertyMarker = ({ property }) => {
    const isSelected = selectedPropertyId === property.id;

    return (
      <Marker
        key={property.id}
        coordinate={{
          latitude: property.latitude,
          longitude: property.longitude,
        }}
        onPress={() => onMarkerPress && onMarkerPress(property)}
        tracksViewChanges={false}
        anchor={{ x: 0.5, y: 0.5 }}
      >
        <View style={isSelected ? styles.selectedHouseMarker : styles.houseMarkerContainer}>
          <Ionicons 
            name="home" 
            size={isSelected ? 24 : 20} 
            color={isSelected ? "#ffffff" : "#333333"}
          />
        </View>
      </Marker>
    );
  };

  const CurrentLocationMarker = () => {
    if (!userLocation) return null;

    return (
      <Marker coordinate={userLocation} tracksViewChanges={false}>
        <View style={styles.currentLocationMarker}>
          <View style={styles.currentLocationInner} />
        </View>
      </Marker>
    );
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={ref || mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={region}
        showsUserLocation={false} // 커스텀 마커 사용
        showsMyLocationButton={true}
        showsCompass={false}
        showsScale={false}
        showsBuildings={true}
        showsTraffic={false}
        loadingEnabled={true}
        mapType="standard"
        customMapStyle={zigbangMapStyle} // 직방 스타일
        onMapReady={() => {
          console.log("지도 로드 완료");
          if (properties.length > 0) {
            setTimeout(() => fitToMarkers(), 500);
          }
        }}
      >
        <CurrentLocationMarker />

        {properties.map((property) =>
          property.latitude && property.longitude ? (
            <PropertyMarker key={property.id} property={property} />
          ) : null
        )}
      </MapView>
    </View>
  );
});

export default PropertyMapView;

// 직방 스타일 지도 테마
const zigbangMapStyle = [
  {
    featureType: "all",
    elementType: "geometry",
    stylers: [{ color: "#f5f5f5" }],
  },
  {
    featureType: "all",
    elementType: "labels.text.fill",
    stylers: [{ color: "#616161" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#e0e0e0" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#e3f2fd" }],
  },
  {
    featureType: "poi",
    elementType: "all",
    stylers: [{ visibility: "off" }],
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: width,
    height: height,
  },
  houseMarkerContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  selectedHouseMarker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#333333",
    borderWidth: 2,
    borderColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  currentLocationMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(74, 144, 226, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  currentLocationInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#4A90E2",
    borderWidth: 2,
    borderColor: "white",
  },
});
