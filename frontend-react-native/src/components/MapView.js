import React, { useState, useEffect, useRef, forwardRef, useMemo } from "react";
import { View, StyleSheet, Text, Dimensions, Animated, TouchableOpacity } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import HomeIcon from "./HomeIcon";
import * as Location from "expo-location";
import Supercluster from "supercluster";
import BuildingClusterView from "./BuildingClusterView";

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
  navigation,
  onBuildingModalStateChange, // 바텀시트 상태 변경 콜백 추가
  onMarkerSelectionChange, // 마커 선택 상태 변경 콜백 추가
}, ref) => {
  const [region, setRegion] = useState({
    latitude: 37.566, // 서울 중심 (강북 포함)
    longitude: 126.98,
    latitudeDelta: 0.25,  // 서울 전체가 잘 보이도록 더 확대
    longitudeDelta: 0.2,
  });
  const [userLocation, setUserLocation] = useState(null);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [buildingProperties, setBuildingProperties] = useState([]);
  const [selectedMarkerId, setSelectedMarkerId] = useState(null);
  const mapRef = useRef(null);
  const markerScales = useRef({});
  const markerClickTime = useRef(0);
  
  // 건물별로 그룹화
  const buildingGroups = useMemo(() => {
    const groups = {};
    properties.forEach(property => {
      // 주소에서 건물 식별자 추출 (동/호 제거)
      let buildingKey = property.address;
      // 호수 제거
      buildingKey = buildingKey.replace(/\d+호/g, '');
      // 층수 정보 제거  
      buildingKey = buildingKey.replace(/\d+층/g, '');
      
      if (!groups[buildingKey]) {
        groups[buildingKey] = {
          buildingAddress: buildingKey,
          latitude: property.latitude,
          longitude: property.longitude,
          properties: [],
          minPrice: Infinity,
          maxPrice: 0,
          count: 0
        };
      }
      
      groups[buildingKey].properties.push(property);
      groups[buildingKey].count++;
      groups[buildingKey].minPrice = Math.min(groups[buildingKey].minPrice, property.price_deposit);
      groups[buildingKey].maxPrice = Math.max(groups[buildingKey].maxPrice, property.price_deposit);
    });
    
    return groups;
  }, [properties]);

  // Supercluster 인스턴스 생성 (건물 그룹 기반)
  const supercluster = useMemo(() => {
    const cluster = new Supercluster({
      radius: 60,
      maxZoom: 16,
      minZoom: 0,
      extent: 512,
      nodeSize: 64,
    });
    
    // 건물 그룹을 GeoJSON 포인트로 변환
    const points = Object.values(buildingGroups)
      .filter(group => group.latitude && group.longitude)
      .map(group => ({
        type: "Feature",
        properties: {
          cluster: false,
          buildingGroup: group,
        },
        geometry: {
          type: "Point",
          coordinates: [group.longitude, group.latitude],
        },
      }));
    
    cluster.load(points);
    return cluster;
  }, [buildingGroups]);
  
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
  const ClusterMarker = ({ cluster }) => {
    const [longitude, latitude] = cluster.geometry.coordinates;
    const { cluster: isCluster, point_count: pointCount, buildingGroup } = cluster.properties;

    if (isCluster) {
      // 지역 클러스터 (여러 건물)
      const clusterId = `cluster-${latitude}-${longitude}`;
      const isSelected = selectedMarkerId === clusterId;
      
      if (!markerScales.current[clusterId]) {
        markerScales.current[clusterId] = new Animated.Value(1);
      }
      
      return (
        <Marker
          coordinate={{ latitude, longitude }}
          onPress={() => {
            // 선택 애니메이션
            Animated.sequence([
              Animated.spring(markerScales.current[clusterId], {
                toValue: 1.2,
                useNativeDriver: true,
                tension: 40,
                friction: 7,
              }),
              Animated.spring(markerScales.current[clusterId], {
                toValue: 1,
                useNativeDriver: true,
                tension: 40,
                friction: 7,
              }),
            ]).start();
            
            // 클러스터 확대
            handleClusterPress(cluster);
          }}
          tracksViewChanges={true}
          anchor={{ x: 0.5, y: 1 }}
        >
          <Animated.View style={[
            styles.clusterMarkerContainer,
            {
              transform: [{ scale: markerScales.current[clusterId] }],
              backgroundColor: '#4A90E2',
              width: Math.max(50, Math.min(80, 50 + pointCount / 20)),
              height: Math.max(50, Math.min(80, 50 + pointCount / 20)),
              borderRadius: Math.max(25, Math.min(40, 25 + pointCount / 20))
            }
          ]}>
            <HomeIcon 
              size={Math.max(24, Math.min(36, 24 + pointCount / 50))} 
              color="#FFFFFF"
            />
            <Text style={[
              styles.clusterText,
              { fontSize: Math.max(14, Math.min(20, 14 + pointCount / 50)) }
            ]}>+{pointCount}</Text>
          </Animated.View>
        </Marker>
      );
    }

    // 건물 그룹 마커
    if (buildingGroup) {
      const group = buildingGroup;
      const hasMultiple = group.count > 1;
      const markerId = `building-${group.buildingAddress}`;
      const isSelected = selectedMarkerId === markerId;
      
      // 애니메이션 스케일 초기화
      if (!markerScales.current[markerId]) {
        markerScales.current[markerId] = new Animated.Value(1);
      }
      
      const handleMarkerPress = () => {
        // 마커 클릭 시간 기록
        markerClickTime.current = Date.now();
        
        // 이미 선택된 마커를 다시 클릭한 경우 무시
        if (selectedMarkerId === markerId) {
          return;
        }
        
        // 이전 선택 해제
        if (selectedMarkerId && markerScales.current[selectedMarkerId]) {
          Animated.spring(markerScales.current[selectedMarkerId], {
            toValue: 1,
            useNativeDriver: true,
            tension: 40,
            friction: 7,
          }).start();
        }
        
        // 새 마커 선택
        setSelectedMarkerId(markerId);
        
        // 선택 애니메이션
        Animated.sequence([
          Animated.spring(markerScales.current[markerId], {
            toValue: 1.3,
            useNativeDriver: true,
            tension: 40,
            friction: 7,
          }),
          Animated.spring(markerScales.current[markerId], {
            toValue: 1.15,
            useNativeDriver: true,
            tension: 40,
            friction: 7,
          }),
        ]).start();
        
        if (hasMultiple) {
          // 여러 매물이 있는 건물 - 모달 표시
          setSelectedBuilding(group.buildingAddress);
          setBuildingProperties(group.properties);
          // 바텀시트 표시 상태 알림
          if (onBuildingModalStateChange) {
            onBuildingModalStateChange(true);
          }
        } else {
          // 단일 매물 - 직접 선택
          onMarkerPress(group.properties[0]);
        }
      };
      
      return (
        <Marker
          coordinate={{ latitude: group.latitude, longitude: group.longitude }}
          onPress={handleMarkerPress}
          tracksViewChanges={true}
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <Animated.View style={[
            styles.houseMarkerContainer,
            {
              transform: [{ scale: markerScales.current[markerId] }],
              backgroundColor: isSelected ? '#2C2C2C' : '#FFFFFF',
              borderColor: isSelected ? '#FFFFFF' : '#2C2C2C',
            }
          ]}>
            <HomeIcon 
              size={24} 
              color={isSelected ? '#FFFFFF' : '#2C2C2C'}
            />
            {hasMultiple && (
              <View style={[
                styles.countBadge,
                { backgroundColor: isSelected ? '#FF6600' : '#4A90E2' }
              ]}>
                <Text style={styles.countBadgeText}>{group.count}</Text>
              </View>
            )}
          </Animated.View>
        </Marker>
      );
    }

    return null;
  };

  // 클러스터 클릭 핸들러
  const handleClusterPress = (cluster) => {
    if (!mapRef.current || !cluster.properties.cluster) return;
    
    // 현재 클러스터에 포함된 모든 포인트 가져오기
    const clusterId = cluster.id;
    const clusterChildren = supercluster.getLeaves(clusterId, Infinity);
    
    if (clusterChildren && clusterChildren.length > 0) {
      // 클러스터 내 모든 포인트의 경계 계산
      let minLat = Infinity, maxLat = -Infinity;
      let minLng = Infinity, maxLng = -Infinity;
      
      clusterChildren.forEach(child => {
        const [lng, lat] = child.geometry.coordinates;
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
        minLng = Math.min(minLng, lng);
        maxLng = Math.max(maxLng, lng);
      });
      
      // 경계에 여유 공간 추가 (10%)
      const latPadding = (maxLat - minLat) * 0.1;
      const lngPadding = (maxLng - minLng) * 0.1;
      
      const newLatitudeDelta = (maxLat - minLat) + (latPadding * 2);
      const newLongitudeDelta = (maxLng - minLng) + (lngPadding * 2);
      
      // 중심점 계산
      const centerLat = (minLat + maxLat) / 2;
      const centerLng = (minLng + maxLng) / 2;
      
      // 최소/최대 줌 레벨 제한
      const finalLatDelta = Math.max(0.005, Math.min(0.5, newLatitudeDelta));
      const finalLngDelta = Math.max(0.004, Math.min(0.4, newLongitudeDelta));
      
      mapRef.current.animateToRegion({
        latitude: centerLat,
        longitude: centerLng,
        latitudeDelta: finalLatDelta,
        longitudeDelta: finalLngDelta,
      }, 600);
    }
  };

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
        }
      }
    } catch (error) {
      // Location permission denied or unavailable
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
    <>
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
        onPress={() => {
          // 마커 클릭 직후 100ms 이내이면 무시 (마커 클릭으로 간주)
          const now = Date.now();
          if (now - markerClickTime.current < 100) {
            return;
          }
          
          // 마커 선택 상태 해제 (애니메이션)
          if (selectedMarkerId && markerScales.current[selectedMarkerId]) {
            Animated.spring(markerScales.current[selectedMarkerId], {
              toValue: 1,
              useNativeDriver: true,
              tension: 40,
              friction: 7,
            }).start();
          }
          setSelectedMarkerId(null);
          
          // 지도 배경 클릭 시 마커 선택 해제
          if (onMarkerSelectionChange) {
            onMarkerSelectionChange(null);
          }
        }}
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
              : `building-${index}`}
            cluster={cluster}
          />
        ))}
      </MapView>
      
      {/* 건물 내 매물 리스트 모달 */}
      {selectedBuilding && buildingProperties.length > 0 && (
        <>
          <BuildingClusterView
            building={selectedBuilding}
            properties={buildingProperties}
            navigation={navigation}
            onClose={() => {
              setSelectedBuilding(null);
              setBuildingProperties([]);
              setSelectedMarkerId(null);
              // 바텀시트 숨김 상태 알림
              if (onBuildingModalStateChange) {
                onBuildingModalStateChange(false);
              }
            }}
            onSelectProperty={(property) => {
              onMarkerPress(property);
            }}
          />
        </>
      )}
      </View>
    </>
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    borderColor: "#2C2C2C",
    overflow: 'visible',
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
    backgroundColor: "#4A90E2",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#ffffff",
    overflow: 'visible',
  },
  clusterText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 2,
  },
  buildingMarkerContainer: {
    backgroundColor: "#FF6600",
    padding: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#ffffff",
    minWidth: 40,
    alignItems: "center",
    justifyContent: "center",
    overflow: 'visible',
  },
  multiPropertyMarker: {
    backgroundColor: "#4A90E2",
  },
  buildingCountText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  buildingPriceText: {
    color: "#ffffff",
    fontSize: 10,
    marginTop: 2,
  },
  singlePropertyIcon: {
    fontSize: 16,
  },
  countBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#4A90E2',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  countBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
