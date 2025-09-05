import React, { forwardRef, useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, Platform, Image } from 'react-native';
import { normalizePrice, formatPrice, formatArea, formatFloor } from '../utils/priceUtils';
import ErrorBoundary from './ErrorBoundary';
import Supercluster from 'supercluster';
import { Ionicons } from '@expo/vector-icons';
import BuildingClusterView from './BuildingClusterView';
import HomeIcon from './HomeIcon';
import FavoriteButton from './FavoriteButton';
import * as Location from 'expo-location';

const { width, height } = Dimensions.get("window");

// Google Maps 웹 컴포넌트 (모바일과 동일한 기능)
const GoogleMapWeb = ({
  region,
  onRegionChangeComplete,
  onPress,
  properties = [],
  selectedProperty,
  onPropertyPress,
  children,
  showFavoritesOnly = false,
  navigation,
  onBuildingModalStateChange,
  onMarkerSelectionChange,
  favorites = [],
  onToggleFavorite,
  searchPin = null,
}) => {
  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const markersRef = useRef([]);
  const overlaysRef = useRef([]);
  const markerScales = useRef({});
  const markerClickTime = useRef(0);

  const [userLocation, setUserLocation] = useState(null);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [buildingProperties, setBuildingProperties] = useState([]);
  const [selectedMarkerId, setSelectedMarkerId] = useState(null);
  const [currentRegion, setCurrentRegion] = useState(region);
  const [selectedSingleProperty, setSelectedSingleProperty] = useState(null);
  const [localFavoriteCount, setLocalFavoriteCount] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;

  // 찜한 매물만 필터링 (모바일과 동일)
  const filteredProperties = useMemo(() => {
    if (!showFavoritesOnly) return properties;
    return properties.filter(property =>
      favorites.includes(property.room_id || property.id)
    );
  }, [properties, favorites, showFavoritesOnly]);

  // 건물별로 그룹화 (모바일과 동일한 로직)
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

  // Supercluster 인스턴스 생성 (모바일과 동일한 설정)
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

  // 현재 줌 레벨에 따른 클러스터 계산 (모바일과 동일)
  const clusteredMarkers = useMemo(() => {
    if (!currentRegion || !supercluster) return [];

    const zoom = Math.round(Math.log2(360 / currentRegion.latitudeDelta));
    const bbox = [
      currentRegion.longitude - currentRegion.longitudeDelta / 2,
      currentRegion.latitude - currentRegion.latitudeDelta / 2,
      currentRegion.longitude + currentRegion.longitudeDelta / 2,
      currentRegion.latitude + currentRegion.latitudeDelta / 2,
    ];

    return supercluster.getClusters(bbox, Math.max(0, Math.min(16, zoom)));
  }, [currentRegion, supercluster]);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    // Google Maps API가 이미 로드되어 있는지 확인
    if (window.google && window.google.maps) {
      initializeMap();
      return;
    }

    // Google Maps API 로드
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.onload = () => {
      initializeMap();
    };
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
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
      }
    } catch (error) {
      console.log('위치 권한 오류:', error);
    }
  };

  const initializeMap = () => {
    if (!mapRef.current || !window.google?.maps) return;

    try {
      const mapOptions = {
        center: {
          lat: currentRegion?.latitude || 37.5665,
          lng: currentRegion?.longitude || 126.9780,
        },
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        rotateControl: false,
        tiltControl: false,
        scrollwheel: true,
        disableDoubleClickZoom: false,
        draggable: true,
        keyboardShortcuts: false,
        // 모바일과 동일한 지도 스타일 적용
        styles: naverMapStyle
      };

      googleMapRef.current = new window.google.maps.Map(mapRef.current, mapOptions);

      // 지도 이동 이벤트
      googleMapRef.current.addListener('bounds_changed', () => {
        if (googleMapRef.current) {
          const bounds = googleMapRef.current.getBounds();
          const center = googleMapRef.current.getCenter();
          if (bounds && center) {
            const ne = bounds.getNorthEast();
            const sw = bounds.getSouthWest();
            const newRegion = {
              latitude: center.lat(),
              longitude: center.lng(),
              latitudeDelta: ne.lat() - sw.lat(),
              longitudeDelta: ne.lng() - sw.lng(),
            };
            setCurrentRegion(newRegion);
            if (onRegionChangeComplete) {
              onRegionChangeComplete(newRegion);
            }
          }
        }
      });

      // 지도 클릭 이벤트 (모바일과 동일)
      googleMapRef.current.addListener('click', () => {
        const now = Date.now();
        if (now - markerClickTime.current < 100) {
          return;
        }

        // 마커 선택 상태 해제
        if (selectedMarkerId && markerScales.current[selectedMarkerId]) {
          animateMarkerScale(selectedMarkerId, 1);
        }

        // PropertyCard가 있다면 슬라이드 다운 애니메이션 후 숨김
        if (selectedSingleProperty) {
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }).start(() => {
            setSelectedSingleProperty(null);
            setSelectedMarkerId(null);
          });
        } else {
          // 애니메이션 없이 바로 상태 초기화
          setSelectedSingleProperty(null);
          setSelectedMarkerId(null);
        }

        if (onMarkerSelectionChange) {
          onMarkerSelectionChange(null);
        }
      });

      // 마커 업데이트
      updateMarkers();
    } catch (error) {
      console.error('Google Maps 초기화 오류:', error);
    }
  };

  const animateMarkerScale = (markerId, toValue) => {
    if (markerScales.current[markerId]) {
      // CSS 트랜지션으로 애니메이션 구현
      const marker = document.getElementById(markerId);
      if (marker) {
        marker.style.transform = `scale(${toValue})`;
        marker.style.transition = 'transform 0.3s ease-out';
      }
    }
  };

  const updateMarkers = () => {
    if (!googleMapRef.current || !window.google?.maps) return;

    try {
      // 기존 마커 및 오버레이 제거
      markersRef.current.forEach(marker => marker.setMap(null));
      overlaysRef.current.forEach(overlay => overlay.setMap(null));
      markersRef.current = [];
      overlaysRef.current = [];

      // 사용자 위치 마커 추가
      if (userLocation) {
        addCurrentLocationMarker();
      }

      // 클러스터된 마커들 추가
      clusteredMarkers.forEach((cluster, index) => {
        const [longitude, latitude] = cluster.geometry.coordinates;
        const { cluster: isCluster, point_count: pointCount, buildingGroup } = cluster.properties;
        const isRealCluster = isCluster === true || (pointCount && pointCount > 1);

        if (isRealCluster) {
          addClusterMarker(cluster, latitude, longitude, pointCount, index);
        } else if (buildingGroup) {
          addBuildingMarker(buildingGroup, latitude, longitude, index);
        }
      });

    } catch (error) {
      console.error('마커 업데이트 오류:', error);
    }
  };

  const addCurrentLocationMarker = () => {
    // 사용자 위치 마커 (모바일과 동일한 스타일)
    const userMarker = new window.google.maps.Marker({
      position: {
        lat: userLocation.latitude,
        lng: userLocation.longitude,
      },
      map: googleMapRef.current,
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
            <circle cx="10" cy="10" r="10" fill="rgba(74, 144, 226, 0.3)" />
            <circle cx="10" cy="10" r="5" fill="#4A90E2" stroke="white" stroke-width="2" />
          </svg>
        `),
        scaledSize: new window.google.maps.Size(20, 20),
        anchor: new window.google.maps.Point(10, 10),
      },
      zIndex: 1000,
    });
    markersRef.current.push(userMarker);
  };

  const addClusterMarker = (cluster, latitude, longitude, pointCount, index) => {
    const clusterId = `cluster-${latitude}-${longitude}`;
    const markerSize = Math.max(56, Math.min(90, 56 + pointCount / 20));

    const clusterOverlay = new window.google.maps.OverlayView();
    clusterOverlay.onAdd = function() {
      const div = document.createElement('div');
      div.id = clusterId;
      div.style.cssText = `
        position: absolute;
        width: ${markerSize}px;
        height: ${markerSize}px;
        border-radius: 50px;
        background-color: #10B585;
        border: 2px solid #ffffff;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0,0,0,0.25);
        transform: scale(1);
        transition: transform 0.3s ease-out;
      `;

      const iconSize = Math.max(20, Math.min(30, Math.round(markerSize * 0.4)));
      const textSize = Math.max(11, Math.min(20, Math.round(markerSize * 0.22)));

      div.innerHTML = `
        <svg width="${iconSize}" height="${Math.round(iconSize * (36.63/32.87))}" viewBox="0 0 33 37" fill="none" style="margin-bottom: 2px;">
          <path d="M18.1476 3.74088L29.1658 12.7888C29.7857 13.2959 30.1557 14.0773 30.1557 14.9113V31.4461C30.1557 32.9751 28.9573 34.1509 27.558 34.1509H22.6424V25.2289C22.6424 23.8589 22.0982 22.5451 21.1295 21.5764C20.1608 20.6077 18.847 20.0635 17.477 20.0635H15.5987C14.2288 20.0635 12.9149 20.6077 11.9462 21.5764C10.9775 22.5451 10.4333 23.8589 10.4333 25.2289V34.1509H5.51776C4.11841 34.1509 2.92004 32.9751 2.92004 31.4461V14.9131C2.92004 14.0773 3.29007 13.2978 3.90992 12.7906L14.9281 3.73901C15.3802 3.36289 15.9498 3.15695 16.5379 3.15695C17.126 3.15695 17.6955 3.36477 18.1476 3.74088ZM27.558 36.9665C30.5821 36.9665 32.9732 34.459 32.9732 31.4442V14.9113C32.9753 14.0896 32.7954 13.2778 32.4462 12.534C32.0971 11.7903 31.5875 11.1331 30.954 10.6099L19.9376 1.56203C18.9815 0.772015 17.78 0.339844 16.5397 0.339844C15.2995 0.339844 14.098 0.772015 13.1419 1.56203L2.12175 10.6118C1.48827 11.135 0.978632 11.7921 0.629492 12.5359C0.280352 13.2796 0.100392 14.0915 0.102558 14.9131V31.4461C0.102558 34.4608 2.49366 36.9684 5.51776 36.9684L27.558 36.9665Z" fill="#FFFFFF"/>
        </svg>
        <div style="color: #ffffff; font-size: ${textSize}px; font-weight: bold; font-family: 'Pretendard', Arial, sans-serif;">${pointCount}</div>
      `;

      div.addEventListener('click', () => handleClusterPress(cluster));

      this.getPanes().overlayMouseTarget.appendChild(div);
      this.div = div;
    };

    clusterOverlay.draw = function() {
      const overlayProjection = this.getProjection();
      const position = overlayProjection.fromLatLngToDivPixel(
        new window.google.maps.LatLng(latitude, longitude)
      );
      if (this.div) {
        this.div.style.left = (position.x - markerSize / 2) + 'px';
        this.div.style.top = (position.y - markerSize / 2) + 'px';
      }
    };

    clusterOverlay.onRemove = function() {
      if (this.div && this.div.parentNode) {
        this.div.parentNode.removeChild(this.div);
      }
    };

    clusterOverlay.setMap(googleMapRef.current);
    overlaysRef.current.push(clusterOverlay);
  };

  const addBuildingMarker = (buildingGroup, latitude, longitude, index) => {
    const group = buildingGroup;
    const hasMultiple = group.count > 1;
    const markerId = `building-${group.buildingAddress}-${index}`;
    const isSelected = selectedMarkerId === markerId;

    const buildingOverlay = new window.google.maps.OverlayView();
    buildingOverlay.onAdd = function() {
      const div = document.createElement('div');
      div.id = markerId;
      div.style.cssText = `
        position: absolute;
        width: 50px;
        height: 50px;
        border-radius: 50px;
        background-color: ${isSelected ? '#000' : '#10B585'};
        border: 2px solid ${isSelected ? '#000' : '#fff'};
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 2px 4px rgba(0,0,0,0.25);
        transform: scale(${isSelected ? 1.1 : 1});
        transition: transform 0.3s ease-out;
      `;

      div.innerHTML = `
        <svg width="22" height="${Math.round(22 * (36.63/32.87))}" viewBox="0 0 33 37" fill="none">
          <path d="M18.1476 3.74088L29.1658 12.7888C29.7857 13.2959 30.1557 14.0773 30.1557 14.9113V31.4461C30.1557 32.9751 28.9573 34.1509 27.558 34.1509H22.6424V25.2289C22.6424 23.8589 22.0982 22.5451 21.1295 21.5764C20.1608 20.6077 18.847 20.0635 17.477 20.0635H15.5987C14.2288 20.0635 12.9149 20.6077 11.9462 21.5764C10.9775 22.5451 10.4333 23.8589 10.4333 25.2289V34.1509H5.51776C4.11841 34.1509 2.92004 32.9751 2.92004 31.4461V14.9131C2.92004 14.0773 3.29007 13.2978 3.90992 12.7906L14.9281 3.73901C15.3802 3.36289 15.9498 3.15695 16.5379 3.15695C17.126 3.15695 17.6955 3.36477 18.1476 3.74088ZM27.558 36.9665C30.5821 36.9665 32.9732 34.459 32.9732 31.4442V14.9113C32.9753 14.0896 32.7954 13.2778 32.4462 12.534C32.0971 11.7903 31.5875 11.1331 30.954 10.6099L19.9376 1.56203C18.9815 0.772015 17.78 0.339844 16.5397 0.339844C15.2995 0.339844 14.098 0.772015 13.1419 1.56203L2.12175 10.6118C1.48827 11.135 0.978632 11.7921 0.629492 12.5359C0.280352 13.2796 0.100392 14.0915 0.102558 14.9131V31.4461C0.102558 34.4608 2.49366 36.9684 5.51776 36.9684L27.558 36.9665Z" fill="#FFFFFF"/>
        </svg>
        ${hasMultiple ? `
          <div style="
            position: absolute;
            top: -3px;
            right: -4px;
            background-color: ${isSelected ? '#FF6600' : '#000'};
            border-radius: 50%;
            min-width: 20px;
            width: 20px;
            height: 20px;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1.5px solid #FFFFFF;
          ">
            <span style="color: #FFFFFF; font-size: 11px; font-weight: bold; font-family: 'Pretendard', Arial, sans-serif;">${group.count}</span>
          </div>
        ` : ''}
      `;

      div.addEventListener('click', () => handleBuildingMarkerPress(group, markerId));

      this.getPanes().overlayMouseTarget.appendChild(div);
      this.div = div;
    };

    buildingOverlay.draw = function() {
      const overlayProjection = this.getProjection();
      const position = overlayProjection.fromLatLngToDivPixel(
        new window.google.maps.LatLng(latitude, longitude)
      );
      if (this.div) {
        this.div.style.left = (position.x - 25) + 'px';
        this.div.style.top = (position.y - 50) + 'px';
      }
    };

    buildingOverlay.onRemove = function() {
      if (this.div && this.div.parentNode) {
        this.div.parentNode.removeChild(this.div);
      }
    };

    buildingOverlay.setMap(googleMapRef.current);
    overlaysRef.current.push(buildingOverlay);
  };

  // 클러스터 클릭 핸들러 (모바일과 동일)
  const handleClusterPress = (cluster) => {
    const { cluster: isCluster, point_count: pointCount } = cluster.properties;
    const isRealCluster = isCluster === true || (pointCount && pointCount > 1);

    if (!googleMapRef.current || !isRealCluster || !cluster.id) {
      return;
    }

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

      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(new window.google.maps.LatLng(minLat - latPadding, minLng - lngPadding));
      bounds.extend(new window.google.maps.LatLng(maxLat + latPadding, maxLng + lngPadding));

      googleMapRef.current.fitBounds(bounds);
    }
  };

  // 건물 마커 클릭 핸들러 (모바일과 동일)
  const handleBuildingMarkerPress = (group, markerId) => {
    markerClickTime.current = Date.now();

    // 같은 마커를 다시 클릭해도 PropertyCard 애니메이션을 재실행하도록 제한 해제
    // (단, 다중 매물의 경우 모달이 이미 열려있으면 중복 방지)
    if (selectedMarkerId === markerId && group.count > 1 && selectedBuilding) {
      return;
    }

    // 이전 선택 해제
    if (selectedMarkerId) {
      animateMarkerScale(selectedMarkerId, 1);
    }

    // 새 마커 선택
    setSelectedMarkerId(markerId);
    animateMarkerScale(markerId, 1.1);

    const hasMultiple = group.count > 1;

    if (hasMultiple) {
      // 여러 매물이 있는 건물 - 모달 표시
      setSelectedBuilding(group.buildingAddress);
      setBuildingProperties(group.properties);
      if (onBuildingModalStateChange) {
        onBuildingModalStateChange(true);
      }
    } else {
      // 단일 매물 - PropertyCard 표시 (모바일과 동일)

      if (selectedSingleProperty) {
        // 기존 PropertyCard가 있으면 먼저 슬라이드 다운
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }).start(() => {
          // 새로운 매물로 교체하고 슬라이드 업
          setSelectedSingleProperty(group.properties[0]);
          setLocalFavoriteCount(group.properties[0].favorite_count || 0);
          Animated.spring(slideAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }).start();
        });
      } else {
        // 처음 선택하는 경우 바로 슬라이드 업
        slideAnim.setValue(0);
        setSelectedSingleProperty(group.properties[0]);
        setLocalFavoriteCount(group.properties[0].favorite_count || 0);

        Animated.spring(slideAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start();
      }

      if (onPropertyPress) {
        onPropertyPress(group.properties[0]);
      }
    }
  };

  useEffect(() => {
    if (googleMapRef.current) {
      updateMarkers();
    }
  }, [clusteredMarkers, selectedMarkerId, userLocation]);

  useEffect(() => {
    if (googleMapRef.current && region) {
      googleMapRef.current.setCenter({
        lat: region.latitude,
        lng: region.longitude,
      });
      setCurrentRegion(region);
    }
  }, [region]);

  // 웹용 PropertyCard 컴포넌트 (모바일과 동일한 디자인)
  const WebPropertyCard = () => {
    if (!selectedSingleProperty) return null;

    const handleCardPress = () => {
      // 매물 상세 페이지로 이동 (모바일과 동일한 로직)
      if (selectedSingleProperty.id && selectedSingleProperty.id.startsWith('mock_')) {
        alert('샘플 데이터입니다. 실제 매물을 확인해주세요.');
      } else if (navigation) {
        navigation.navigate('RoomDetail', { roomId: selectedSingleProperty.id });
      }
    };

    const handleCloseCard = () => {
      // 슬라이드 다운 애니메이션 (모바일과 동일)
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setSelectedSingleProperty(null);
        setSelectedMarkerId(null);
      });
    };

    const getRoomType = (area, rooms) => {
      if (rooms !== undefined && rooms !== null) {
        if (rooms === 1) return '원룸';
        if (rooms === 2) return '투룸';
        if (rooms === 3) return '쓰리룸';
        return `${rooms}룸`;
      }
      const numericArea = typeof area === 'string' && area.includes('㎡')
        ? parseFloat(area)
        : parseFloat(area);

      if (numericArea && numericArea <= 35) {
        return '원룸';
      } else if (numericArea && numericArea <= 50) {
        return '투룸';
      } else if (numericArea && numericArea <= 70) {
        return '쓰리룸';
      } else {
        return '원룸';
      }
    };

    const getRoomImage = (roomId) => {
      return `https://via.placeholder.com/100x100/f0f0f0/666?text=매물`;
    };

    const formatMaintenanceCost = (area) => {
      const numArea = parseFloat(area) || 20;
      return Math.floor(numArea * 1000).toLocaleString();
    };

    const getNearestStation = (address) => {
      return "지하철 2분";
    };

    return (
      <Animated.View
        style={[
          webPropertyCardStyles.propertyCard,
          {
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [200, 0],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={webPropertyCardStyles.cardContent}
          onPress={handleCardPress}
          activeOpacity={0.9}
        >
          <View style={webPropertyCardStyles.cardImageContainer}>
            <Image
              source={{ uri: getRoomImage(selectedSingleProperty?.room_id) }}
              style={webPropertyCardStyles.cardImage}
            />
          </View>

          <View style={webPropertyCardStyles.cardInfo}>
            <Text style={webPropertyCardStyles.cardPrice}>
              {selectedSingleProperty.transaction_type} {formatPrice(
                selectedSingleProperty.price_deposit,
                selectedSingleProperty.transaction_type,
                selectedSingleProperty.price_monthly,
                selectedSingleProperty.room_id
              )}
            </Text>
            <Text style={webPropertyCardStyles.cardSubInfo} numberOfLines={1}>
              {getRoomType(selectedSingleProperty.area, selectedSingleProperty.rooms)} | {formatArea(selectedSingleProperty.area)} | {formatFloor(selectedSingleProperty.floor)}
            </Text>
            <Text style={webPropertyCardStyles.cardAddress} numberOfLines={1}>
              관리비 {formatMaintenanceCost(selectedSingleProperty.area)}원 | {getNearestStation(selectedSingleProperty.address)}
            </Text>
            <View style={webPropertyCardStyles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={12} color="#fff" />
              <Text style={webPropertyCardStyles.verifiedText}>집주인 인증</Text>
            </View>
          </View>

          <View style={webPropertyCardStyles.cardRightSection}>
            <View style={webPropertyCardStyles.favoriteSection}>
              <FavoriteButton
                isFavorited={favorites.includes(selectedSingleProperty.room_id || selectedSingleProperty.id)}
                onPress={() => {
                  const isFavorited = favorites.includes(selectedSingleProperty.room_id || selectedSingleProperty.id);

                  // 즉시 로컬 상태 업데이트
                  setLocalFavoriteCount(prev => isFavorited ? prev - 1 : prev + 1);

                  if (onToggleFavorite) {
                    onToggleFavorite(selectedSingleProperty);
                  }
                }}
              />
              <View style={webPropertyCardStyles.cardLikeCount}>
                <Text style={webPropertyCardStyles.likeCountText}>{localFavoriteCount}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#f5f5f5'
        }}
      />

      {/* 웹용 PropertyCard (모바일과 동일한 디자인) */}
      <WebPropertyCard />

      {/* 건물 내 매물 리스트 모달 (모바일과 동일) */}
      {selectedBuilding && buildingProperties.length > 0 && (
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
            if (onPropertyPress) {
              onPropertyPress(property);
            }
          }}
        />
      )}

      {children}
    </View>
  );
};

const PropertyMapView = forwardRef(({
  region,
  onRegionChangeComplete,
  properties = [],
  selectedProperty,
  onPropertyPress,
  children,
  showFavoritesOnly = false,
  initialRegion = null,
  navigation,
  onBuildingModalStateChange,
  onMarkerSelectionChange,
  favorites = [],
  onToggleFavorite,
  searchPin = null,
  ...props
}, ref) => {
  return (
    <ErrorBoundary>
      <GoogleMapWeb
        region={region || initialRegion}
        onRegionChangeComplete={onRegionChangeComplete}
        properties={properties}
        selectedProperty={selectedProperty}
        onPropertyPress={onPropertyPress}
        showFavoritesOnly={showFavoritesOnly}
        navigation={navigation}
        onBuildingModalStateChange={onBuildingModalStateChange}
        onMarkerSelectionChange={onMarkerSelectionChange}
        favorites={favorites}
        onToggleFavorite={onToggleFavorite}
        searchPin={searchPin}
        {...props}
      >
        {children}
      </GoogleMapWeb>
    </ErrorBoundary>
  );
});

// 모바일과 동일한 지도 스타일
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
    backgroundColor: '#f5f5f5',
  },
});

// 웹용 PropertyCard 스타일 (모바일과 동일)
const webPropertyCardStyles = StyleSheet.create({
  propertyCard: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: '#ffffff',
    zIndex: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 12,
  },
  cardRightSection: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginLeft: 8,
    height: 100,
  },
  favoriteSection: {
    alignItems: 'center',
    gap: 4,
  },
  cardImageContainer: {
    marginRight: 12,
  },
  cardImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  cardInfo: {
    flex: 1,
    paddingVertical: 2,
    height: 100,
    justifyContent: 'space-between',
  },
  cardPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
  },
  cardSubInfo: {
    fontSize: 12,
    color: '#888',
  },
  cardAddress: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#595959',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#595959',
    alignSelf: 'flex-start',
  },
  verifiedText: {
    fontSize: 11,
    color: '#fff',
    marginLeft: 4,
    fontWeight: '600',
  },
  cardLikeCount: {
    alignItems: 'center',
  },
  likeCountText: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
    fontFamily: 'Pretendard',
  },
});

PropertyMapView.displayName = 'PropertyMapView';

export default PropertyMapView;
