import React, { useState, useEffect, useRef, forwardRef, useMemo } from "react";
import { View, StyleSheet, Text, Dimensions, Animated, TouchableOpacity, Modal } from "react-native";
import { WebMapsView, WebMapsMarker } from "react-native-web-maps";
import { Ionicons } from "@expo/vector-icons";
import LocationIcon from "./LocationIcon";
import * as Location from "expo-location";
import Supercluster from "supercluster";
import BuildingClusterView from "./BuildingClusterView";
import { normalizePrice } from '../utils/priceUtils';

const { width, height } = Dimensions.get("window");

// PropertyMarker 컴포넌트 - 웹용
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
      Animated.spring(markerScales.current[markerId], {
        toValue: isSelected ? 1.1 : 1,
        useNativeDriver: true,
        tension: 40,
        friction: 7,
      }).start();
    }
  }, [isSelected, markerId]);

  const handlePress = () => {
    // 클릭 애니메이션
    Animated.sequence([
      Animated.spring(markerScales.current[markerId], {
        toValue: 1.2,
        useNativeDriver: true,
        tension: 40,
        friction: 7,
      }),
      Animated.spring(markerScales.current[markerId], {
        toValue: 1,
        useNativeDriver: true,
        tension: 40,
        friction: 7,
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
    <WebMapsMarker
      coordinate={{
        latitude: lat,
        longitude: lng,
      }}
      onPress={handlePress}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <View style={{
          width: 100,
          height: 100,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Animated.View style={[
          styles.houseMarkerContainer,
          {
            transform: [{ scale: markerScales.current[markerId] }],
            backgroundColor: isSelected ? "#FF0000" : "#FF6600",
            borderColor: isSelected ? "#ffffff" : "#000000",
            borderWidth: isSelected ? 2 : 1.5,
          }
        ]}>
          <Text style={{
            color: isSelected ? "#ffffff" : "#000000",
            fontSize: 12,
            fontWeight: 'bold'
          }}>📍</Text>
        </Animated.View>
      </View>
    </WebMapsMarker>
  );
};

const PropertyMapView = forwardRef(({
  properties = [],
  showFavoritesOnly = false,
  initialRegion = null,
  onMarkerPress,
  selectedPropertyId,
  navigation,
  onBuildingModalStateChange,
  onMarkerSelectionChange,
  favorites = [],
  onToggleFavorite,
  searchPin = null,
}, ref) => {

  const [region, setRegion] = useState(
    initialRegion || {
      latitude: 37.35,
      longitude: 127.1,
      latitudeDelta: 0.6,
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

  // 현재 위치 가져오기
  useEffect(() => {
    getCurrentLocation();
  }, []);

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
            latitudeDelta: 0.05,
            longitudeDelta: 0.04,
          });
        }
      }
    } catch (error) {
      // 에러시 서울로 고정
      setRegion({
        latitude: 37.5665,
        longitude: 126.978,
        latitudeDelta: 0.15,
        longitudeDelta: 0.12,
      });
    }
  };

  const CurrentLocationMarker = () => {
    if (!userLocation) return null;

    return (
      <WebMapsMarker coordinate={userLocation}>
        <View style={styles.currentLocationMarker}>
          <View style={styles.currentLocationInner} />
        </View>
      </WebMapsMarker>
    );
  };

  return (
    <>
      <View style={styles.container}>
        <WebMapsView
          ref={mapRef}
          style={styles.map}
          initialRegion={region}
          showsUserLocation={false}
          showsMyLocationButton={false}
          onPress={() => {
            // 마커 클릭 직후 100ms 이내이면 무시
            const now = Date.now();
            if (now - markerClickTime.current < 100) {
              return;
            }

            // 마커 선택 상태 해제
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
          scrollEnabled={true}
          zoomEnabled={true}
          onRegionChange={(newRegion) => {
            setRegion(newRegion);
          }}
          onRegionChangeComplete={(newRegion) => {
            setRegion(newRegion);
          }}
        >
          <CurrentLocationMarker />

          {/* 건물 그룹별 마커 렌더링 */}
          {Object.values(buildingGroups)
            .filter(group => group.latitude && group.longitude)
            .map((group, index) => {
              const markerId = `building-${group.buildingAddress}`;
              const isSelected = selectedMarkerId === markerId;
              const hasMultiple = group.count > 1;

              // 애니메이션 스케일 초기화
              if (!markerScales.current[markerId]) {
                markerScales.current[markerId] = new Animated.Value(1);
              }

              const handleMarkerPress = () => {
                markerClickTime.current = Date.now();

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
                  if (onBuildingModalStateChange) {
                    onBuildingModalStateChange(true);
                  }
                } else {
                  // 단일 매물 - 직접 선택
                  onMarkerPress(group.properties[0]);
                }
              };

              return (
                <WebMapsMarker
                  key={markerId}
                  coordinate={{ latitude: group.latitude, longitude: group.longitude }}
                  onPress={handleMarkerPress}
                  anchor={{ x: 0.5, y: 0.5 }}
                >
                  <View style={{
                      width: 100,
                      height: 100,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    <Animated.View style={[
                      styles.houseMarkerContainer,
                      {
                        transform: [{ scale: markerScales.current[markerId] }],
                        backgroundColor: isSelected ? '#000' : '#10B585',
                        borderColor: isSelected ? '#000' : '#fff',
                        borderWidth: 2,
                      }
                    ]}>
                      <Ionicons
                        name="home"
                        size={22}
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
                </WebMapsMarker>
              );
            })}

        </WebMapsView>

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