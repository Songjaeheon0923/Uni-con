import React, { useState, useEffect, useRef, forwardRef, useMemo } from "react";
import { View, StyleSheet, Text, Dimensions, Animated } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import HomeIcon from "./HomeIcon";
import * as Location from "expo-location";
import Supercluster from "supercluster";

const { width, height } = Dimensions.get("window");

// PropertyMarker 컴포넌트를 MapView 밖으로 이동
const PropertyMarker = ({ property, selectedPropertyId, onMarkerPress }) => {
  const isSelected = selectedPropertyId === property.id;

  const handlePress = () => {
    if (onMarkerPress) {
      onMarkerPress(property);
    }
  };


  // 좌표를 숫자로 강제 변환
  const lat = parseFloat(property.latitude);
  const lng = parseFloat(property.longitude);
  
  // 변환 후 유효성 검사
  if (isNaN(lat) || isNaN(lng)) {
    console.error(`❌ 유효하지 않은 좌표: ${property.address} - lat:${property.latitude}(${typeof property.latitude}), lng:${property.longitude}(${typeof property.longitude})`);
    return null;
  }

  return (
    <Marker
      coordinate={{
        latitude: lat,
        longitude: lng,
      }}
      onPress={handlePress}
      tracksViewChanges={false}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <View style={[
        styles.houseMarkerContainer,
        isSelected ? {
          backgroundColor: "#FF0000",
          borderColor: "#ffffff",
          borderWidth: 3,
          transform: [{ scale: 1.5 }]
        } : {
          backgroundColor: "#FF6600",
          borderWidth: 2,
          borderColor: "#000000"
        }
      ]}>
        <Text style={{ 
          color: isSelected ? "#ffffff" : "#000000",
          fontSize: 12,
          fontWeight: 'bold'
        }}>📍</Text>
      </View>
    </Marker>
  );
};

const PropertyMapView = forwardRef(({
  properties = [],
  onMarkerPress,
  selectedPropertyId,
}, ref) => {
  const [region, setRegion] = useState({
    latitude: 37.566, // 서울 중심 (강북 포함)
    longitude: 126.98,
    latitudeDelta: 0.25,  // 서울 전체가 잘 보이도록 더 확대
    longitudeDelta: 0.2,
  });
  const [userLocation, setUserLocation] = useState(null);
  const mapRef = useRef(null);
  
  // Supercluster 인스턴스 생성
  const supercluster = useMemo(() => {
    const cluster = new Supercluster({
      radius: 60,
      maxZoom: 16,
      minZoom: 0,
      extent: 512,
      nodeSize: 64,
    });
    
    // properties를 GeoJSON 포인트로 변환
    const points = properties
      .filter(p => p.latitude && p.longitude)
      .map(property => ({
        type: "Feature",
        properties: {
          cluster: false,
          property: property,
        },
        geometry: {
          type: "Point",
          coordinates: [property.longitude, property.latitude],
        },
      }));
    
    cluster.load(points);
    return cluster;
  }, [properties]);
  
  // 현재 줌 레벨에 따른 클러스터 계산
  const clusteredMarkers = useMemo(() => {
    if (!region || !supercluster) return [];
    
    const zoom = Math.round(Math.log2(360 / region.latitudeDelta));
    const bbox = [
      region.longitude - region.longitudeDelta / 2,
      region.latitude - region.latitudeDelta / 2,
      region.longitude + region.longitudeDelta / 2,
      region.latitude + region.latitudeDelta / 2,
    ];
    
    return supercluster.getClusters(bbox, Math.max(0, Math.min(16, zoom)));
  }, [region, supercluster]);

  // 클러스터 마커 컴포넌트
  const ClusterMarker = ({ cluster, onPress }) => {
    const [longitude, latitude] = cluster.geometry.coordinates;
    const { cluster: isCluster, point_count: pointCount } = cluster.properties;

    if (isCluster) {
      return (
        <Marker
          coordinate={{ latitude, longitude }}
          onPress={onPress}
          tracksViewChanges={false}
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <View style={[
            styles.clusterMarkerContainer,
            { 
              backgroundColor: pointCount >= 100 ? "#FF3B30" : pointCount >= 50 ? "#FF9500" : pointCount >= 10 ? "#FFCC02" : "#30D158",
              width: Math.max(40, Math.min(80, 40 + pointCount / 10)),
              height: Math.max(40, Math.min(80, 40 + pointCount / 10)),
              borderRadius: Math.max(20, Math.min(40, 20 + pointCount / 10))
            }
          ]}>
            <Text style={styles.clusterText}>+{pointCount}</Text>
          </View>
        </Marker>
      );
    }

    const property = cluster.properties.property;
    return (
      <PropertyMarker 
        property={property}
        selectedPropertyId={selectedPropertyId}
        onMarkerPress={onMarkerPress}
      />
    );
  };

  // 클러스터 클릭 핸들러
  const handleClusterPress = (cluster) => {
    if (!mapRef.current || !cluster.properties.cluster) return;
    
    const zoom = Math.round(Math.log2(360 / region.latitudeDelta));
    const expansionZoom = Math.min(supercluster.getClusterExpansionZoom(cluster.id), 16);
    
    if (expansionZoom > zoom) {
      const [longitude, latitude] = cluster.geometry.coordinates;
      const newDelta = 360 / Math.pow(2, expansionZoom + 1);
      
      mapRef.current.animateToRegion({
        latitude,
        longitude,
        latitudeDelta: newDelta,
        longitudeDelta: newDelta,
      }, 500);
    }
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    console.log(`📍 MapView에 전달된 매물 수: ${properties.length}개`);
    if (properties.length > 0) {
      // 강북쪽 매물 확인
      const northernProps = properties.filter(p => 
        p.address?.includes('강북구') || 
        p.address?.includes('도봉구') || 
        p.address?.includes('노원구') || 
        p.address?.includes('광진구') || 
        p.address?.includes('성북구') || 
        p.address?.includes('용산구')
      );
      console.log(`🌟 MapView 강북쪽 매물: ${northernProps.length}개`);
      northernProps.slice(0, 3).forEach(p => {
        console.log(`  - ${p.address} (${p.latitude}, ${p.longitude})`);
      });
      
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
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        showsBuildings={false}
        showsTraffic={false}
        showsIndoors={false}
        loadingEnabled={true}
        mapType="standard"
        rotateEnabled={false}
        pitchEnabled={false}
        scrollEnabled={true}
        zoomEnabled={true}
        customMapStyle={zigbangMapStyle}
        onRegionChangeComplete={(newRegion) => {
          setRegion(newRegion);
        }}
        onMapReady={() => {
          console.log("지도 로드 완료");
          if (properties.length > 0) {
            setTimeout(() => fitToMarkers(), 500);
          }
        }}
      >
        <CurrentLocationMarker />

        {clusteredMarkers.map((cluster, index) => (
          <ClusterMarker
            key={cluster.properties.cluster 
              ? `cluster-${cluster.id || index}` 
              : `marker-${cluster.properties.property.id}-${selectedPropertyId === cluster.properties.property.id ? 'selected' : 'unselected'}`}
            cluster={cluster}
            onPress={() => handleClusterPress(cluster)}
          />
        ))}
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
  selectedMarkerStyle: {
    backgroundColor: "#333333",
    borderColor: "#ffffff",
    borderWidth: 2,
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
  clusterMarkerContainer: {
    backgroundColor: "#30D158",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#ffffff",
  },
  clusterText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
  },
});
