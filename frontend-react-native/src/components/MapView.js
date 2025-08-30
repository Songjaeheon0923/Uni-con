import React, { useState, useEffect, useRef, forwardRef, useMemo } from "react";
import { View, StyleSheet, Text, Dimensions, Animated, TouchableOpacity, Modal } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import HomeIcon from "./HomeIcon";
import LocationIcon from "./LocationIcon";
import * as Location from "expo-location";
import Supercluster from "supercluster";
import BuildingClusterView from "./BuildingClusterView";
import { normalizePrice } from '../utils/priceUtils';

const { width, height } = Dimensions.get("window");

// PropertyMarker 컴포넌트를 MapView 밖으로 이동
const PropertyMarker = ({ property, selectedPropertyId, onMarkerPress, markerScales }) => {
  const isSelected = selectedPropertyId === property.id;
  const markerId = `property-${property.id}`;

  // 애니메이션 스케일 초기화
  if (!markerScales.current[markerId]) {
    markerScales.current[markerId] = new Animated.Value(isSelected ? 1.1 : 1);
  }

  // 선택 상태가 변경될 때 크기 조정
  React.useEffect(() => {
    if (markerScales.current[markerId]) {
      Animated.timing(markerScales.current[markerId], {
        toValue: isSelected ? 1.1 : 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [isSelected, markerId]);

  const handlePress = () => {
    // 클릭 애니메이션
    Animated.sequence([
      Animated.timing(markerScales.current[markerId], {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(markerScales.current[markerId], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

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
      stopPropagation={true}
    >
      <View
        collapsable={false}
        style={{
          width: 100,  // 44px * 1.2 scale + padding for animation
          height: 100,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'visible',
        }}>
        <Animated.View style={[
          styles.houseMarkerContainer,
          {
            transform: [{ scale: markerScales.current[markerId] }],
            backgroundColor: isSelected ? "#FF0000" : "#FF6600",
            borderColor: isSelected ? "#ffffff" : "#000000",
            borderWidth: isSelected ? 2 : 1.5,
            overflow: 'visible',
          }
        ]}>
          <HomeIcon
            size={20}
            color={isSelected ? "#ffffff" : "#000000"}
          />
        </Animated.View>
      </View>
    </Marker>
  );
};

const PropertyMapView = forwardRef(({
  properties = [],
  showFavoritesOnly = false,
  initialRegion = null,
  onMarkerPress,
  selectedPropertyId,
  navigation,
  onBuildingModalStateChange, // 바텀시트 상태 변경 콜백 추가
  onMarkerSelectionChange, // 마커 선택 상태 변경 콜백 추가
  favorites = [],
  onToggleFavorite,
  searchPin = null, // 검색 핀 데이터
}, ref) => {

  // 디버깅: MapView가 받는 properties 개수 확인
  // console.log('🗺️ MapView 받은 properties 개수:', properties.length);
  const [region, setRegion] = useState(
    initialRegion || {
      latitude: 37.35, // 기본값: 서울이 화면 중앙에 오도록 조정
      longitude: 127.1,
      latitudeDelta: 0.6,  // 서울 주변 지역까지 포함하여 표시
      longitudeDelta: 0.5,
    }
  );
  const [userLocation, setUserLocation] = useState(null);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [buildingProperties, setBuildingProperties] = useState([]);
  const [selectedMarkerId, setSelectedMarkerId] = useState(null);
  const [searchPinPosition, setSearchPinPosition] = useState(null);
  const mapRef = useRef(null);

  // forwardRef로 외부 ref에도 mapRef를 연결
  useEffect(() => {
    if (ref) {
      if (typeof ref === 'function') {
        ref(mapRef.current);
      } else {
        ref.current = mapRef.current;
      }
    }
  }, [ref, mapRef.current]);

  // initialRegion이 변경되면 region 업데이트
  useEffect(() => {
    if (initialRegion) {
      setRegion(initialRegion);
      console.log('🗺️ 초기 지역이 Google API로 업데이트됨:', initialRegion);
    }
  }, [initialRegion]);

  // searchPin 위치를 화면 좌표로 변환
  useEffect(() => {
    if (searchPin && mapRef.current) {
      mapRef.current.pointForCoordinate({
        latitude: searchPin.latitude,
        longitude: searchPin.longitude,
      }).then((point) => {
        setSearchPinPosition(point);
      });
    } else {
      setSearchPinPosition(null);
    }
  }, [searchPin, region]);
  const markerScales = useRef({});
  const markerClickTime = useRef(0);

  // 찜한 매물만 필터링
  const filteredProperties = useMemo(() => {
    if (!showFavoritesOnly) return properties;
    return properties.filter(property => 
      favorites.includes(property.room_id || property.id)
    );
  }, [properties, favorites, showFavoritesOnly]);

  // 건물별로 그룹화
  const buildingGroups = useMemo(() => {
    const groups = {};
    filteredProperties.forEach(property => {
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

      // 가격을 만원 단위로 정규화하여 비교
      const normalizedPrice = normalizePrice(property.price_deposit, property.room_id, property.transaction_type);

      groups[buildingKey].properties.push(property);
      groups[buildingKey].count++;
      groups[buildingKey].minPrice = Math.min(groups[buildingKey].minPrice, normalizedPrice);
      groups[buildingKey].maxPrice = Math.max(groups[buildingKey].maxPrice, normalizedPrice);
    });

    return groups;
  }, [filteredProperties]);

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

    // 실제 클러스터인지 확인 (point_count가 있거나 cluster가 true인 경우)
    const isRealCluster = isCluster === true || (pointCount && pointCount > 1);

    if (isRealCluster) {
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
          tracksViewChanges={false}
          anchor={{ x: 0.5, y: 0.5 }}
          stopPropagation={true}
        >
          <View
            collapsable={false}
            style={{
              // 애니메이션을 위한 외부 컨테이너 (충분한 여유 공간 확보)
              width: Math.max(100, Math.min(130, 100 + pointCount / 20)), // scale 1.2 + border 3px*2 + 충분한 여유
              height: Math.max(100, Math.min(130, 100 + pointCount / 20)),
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'visible',
            }}>
            <Animated.View style={[
              styles.clusterMarkerContainer,
              {
                transform: [{ scale: markerScales.current[clusterId] }],
                backgroundColor: '#10B585',
                width: Math.max(56, Math.min(90, 56 + pointCount / 20)),
                height: Math.max(56, Math.min(90, 56 + pointCount / 20)),
                borderRadius: Math.max(28, Math.min(45, 28 + pointCount / 20))
              }
            ]}>
            <HomeIcon
              size={Math.max(26, Math.min(45, Math.round((56 + pointCount / 20) * 0.5)))} // 핀 크기의 50%
              color="#FFFFFF"
            />
            <Text style={[
              styles.clusterText,
              { fontSize: Math.max(11, Math.min(20, Math.round((56 + pointCount / 20) * 0.22))) } // 핀 크기의 22%
            ]}>{pointCount}</Text>
            </Animated.View>
          </View>
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
            toValue: 1.2,
            useNativeDriver: true,
            tension: 40,
            friction: 7,
          }),
          Animated.spring(markerScales.current[markerId], {
            toValue: 1.1,
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
          tracksViewChanges={false}
          anchor={{ x: 0.5, y: 0.5 }}
          stopPropagation={true}
        >
          <View
            collapsable={false}
            style={{
              width: 100,  // 44px * 1.2 = 52.8px + badge overflow(10px) + padding
              height: 100,
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'visible',
            }}>
            <Animated.View style={[
              styles.houseMarkerContainer,
              {
                transform: [{ scale: markerScales.current[markerId] }],
                backgroundColor: isSelected ? '#000' : '#10B585',
                borderColor: isSelected ? '#000' : '#fff',
                borderWidth: 2,
                overflow: 'visible',
              }
            ]}>
              <HomeIcon
                size={24}
                color="#FFFFFF"
              />
              {hasMultiple && (
                <View style={[
                  styles.countBadge,
                  { backgroundColor: isSelected ? '#FF6600' : '#000' }
                ]}>
                  <Text style={styles.countBadgeText}>{group.count}</Text>
                </View>
              )}
            </Animated.View>
          </View>
        </Marker>
      );
    }

    return null;
  };

  // 클러스터 클릭 핸들러
  const handleClusterPress = (cluster) => {
    const { cluster: isCluster, point_count: pointCount } = cluster.properties;
    const isRealCluster = isCluster === true || (pointCount && pointCount > 1);

    console.log('handleClusterPress:', {
      isCluster,
      pointCount,
      isRealCluster,
      clusterId: cluster.id,
      hasMapRef: !!mapRef.current
    });

    if (!mapRef.current || !isRealCluster || !cluster.id) {
      console.log('Early return from handleClusterPress');
      return;
    }

    console.log('Proceeding with cluster expansion...');

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

  // useEffect(() => {
  //   if (properties.length > 0) {
  //
  //     setTimeout(() => fitToMarkers(), 1000); // 지도 로드 후 실행
  //   }
  // }, [properties]);

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
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={region}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        showsBuildings={false}
        showsTraffic={false}
        showsPointsOfInterest={false}
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
        loadingEnabled={true}
        mapType="standard"
        rotateEnabled={false}
        pitchEnabled={false}
        scrollEnabled={true}
        zoomEnabled={true}
        customMapStyle={naverMapStyle}
        moveOnMarkerPress={false}
        animationEnabled={false}
        onRegionChange={(newRegion) => {
          setRegion(newRegion);
        }}
        onRegionChangeComplete={(newRegion) => {
          setRegion(newRegion);
        }}
        onMapReady={() => {
          // 초기 지도 로드 시 자동 맞춤 비활성화 (서울 중심 유지)
          // if (properties.length > 0) {
          //   setTimeout(() => fitToMarkers(), 500);
          // }
        }}
      >
        <CurrentLocationMarker />

        {clusteredMarkers.map((cluster, index) => (
          <ClusterMarker
            key={cluster.properties.cluster
              ? `cluster-${cluster.id || index}-${region.latitude}`
              : `building-${index}-${region.longitude}`}
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
            favorites={favorites}
            onToggleFavorite={onToggleFavorite}
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

      {/* 검색 핀 오버레이 */}
      {searchPinPosition && (
        <View
          style={[
            styles.searchPinOverlay,
            {
              left: searchPinPosition.x - 16,
              top: searchPinPosition.y - 16,
            },
          ]}
        >
          <View style={styles.searchMarker}>
            <LocationIcon width={20} height={20} color="#333333" />
          </View>
        </View>
      )}
      </View>

    </>
  );
});

export default PropertyMapView;

// 깔끔한 회색갈 지도 스타일 테마
const naverMapStyle = [
  {
    featureType: "all",
    elementType: "geometry",
    stylers: [{ color: "#f5f5f5" }],
  },
  {
    featureType: "all",
    elementType: "labels.text.fill",
    stylers: [{ color: "#777777" }],
  },
  {
    featureType: "all",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#ffffff" }, { weight: 2 }],
  },
  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [{ color: "#cccccc" }, { weight: 0.5 }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#dddddd" }, { weight: 0.8 }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#bbbbbb" }, { weight: 1 }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#666666" }],
  },
  {
    featureType: "road.arterial",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "road.arterial",
    elementType: "geometry.stroke",
    stylers: [{ color: "#cccccc" }],
  },
  {
    featureType: "road.local",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "road.local",
    elementType: "geometry.stroke",
    stylers: [{ color: "#e5e5e5" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#e0e0e0" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#999999" }],
  },
  {
    featureType: "landscape",
    elementType: "geometry",
    stylers: [{ color: "#f8f8f8" }],
  },
  {
    featureType: "landscape.natural",
    elementType: "geometry",
    stylers: [{ color: "#f5f5f5" }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#f0f0f0" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#eeeeee" }],
  },
  {
    featureType: "poi",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "transit",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "poi.business",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "poi.government",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "poi.medical",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "poi.school",
    elementType: "labels",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "transit.line",
    elementType: "geometry",
    stylers: [{ color: "#cccccc" }],
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
    backgroundColor: "#10B585",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
    overflow: 'visible',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3, // Android shadow
  },
  searchMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
    overflow: 'hidden',
  },
  selectedMarkerStyle: {
    backgroundColor: "#0E9B73",
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
    backgroundColor: "#10B585",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
    overflow: 'visible',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3, // Android shadow
  },
  clusterText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 2,
  },
  buildingMarkerContainer: {
    backgroundColor: "#10B585",
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
    backgroundColor: "#10B585",
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
    backgroundColor: '#10B585',
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
  searchPinOverlay: {
    position: 'absolute',
    zIndex: 1000,
    pointerEvents: 'none',
  },
});
