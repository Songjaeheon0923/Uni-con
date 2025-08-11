import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Text, Dimensions, Platform } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import * as Location from "expo-location";

const { width, height } = Dimensions.get("window");

export default function PropertyMapView({
  properties = [],
  onMarkerPress,
  selectedPropertyId,
}) {
  const [region, setRegion] = useState({
    latitude: 37.5665,
    longitude: 126.978,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
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
        setRegion({
          ...userCoords,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
      }
    } catch (error) {
      console.log("Location error:", error);
      // 에러시 서울로 고정
      setRegion({
        latitude: 37.5665,
        longitude: 126.978,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
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

  const getMarkerColor = (property) => {
    if (!property.price) return "#FF6B35";

    if (property.price.includes("전세")) return "#4A90E2";
    if (property.price.includes("월세")) return "#4ECDC4";
    if (property.price.includes("매매")) return "#FF6B6B";
    return "#FF6B35";
  };

  const PropertyMarker = ({ property }) => {
    const isSelected = selectedPropertyId === property.id;
    const markerColor = getMarkerColor(property);

    // 가격에서 숫자만 추출해서 간단하게 표시
    const displayPrice = property.price
      ? property.price.replace(/[^0-9]/g, "").slice(0, 4) +
        (property.price.includes("만") ? "만" : "")
      : "문의";

    return (
      <Marker
        coordinate={{
          latitude: property.latitude,
          longitude: property.longitude,
        }}
        onPress={() => onMarkerPress && onMarkerPress(property)}
        tracksViewChanges={false} // 성능 최적화
      >
        <View
          style={[
            styles.markerContainer,
            { backgroundColor: markerColor },
            isSelected && styles.selectedMarker,
          ]}
        >
          <Text style={styles.markerText} numberOfLines={1}>
            {displayPrice}
          </Text>
          <View style={[styles.markerTail, { borderTopColor: markerColor }]} />
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
        ref={mapRef}
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
}

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
  markerContainer: {
    backgroundColor: "#FF6B35",
    borderRadius: 15,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: "white",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 40,
    maxWidth: 80,
  },
  selectedMarker: {
    transform: [{ scale: 1.3 }],
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },
  markerText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
  },
  markerTail: {
    position: "absolute",
    top: "100%",
    left: "50%",
    marginLeft: -3,
    width: 0,
    height: 0,
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderTopWidth: 5,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#FF6B35",
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
