import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Alert,
  SafeAreaView,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Asset } from "expo-asset";
import Svg, { Path } from "react-native-svg";
import ApiService from "../services/api";
import {
  formatPrice as formatPriceUtil,
  formatArea,
  getRoomType,
  formatFloor,
} from "../utils/priceUtils";
import BackIcon from "../components/icons/BackIcon";
import HeartFilledIcon from "../components/icons/HeartFilledIcon";
import HeartOutlineIcon from "../components/icons/HeartOutlineIcon";
import ShareIcon from "../components/icons/ShareIcon";
import { getLandlordInfo } from "../data/fakeLandlords";

const { width } = Dimensions.get("window");

// 아이콘 컴포넌트들
const CubeIcon = ({ size = 16, color = "#595959" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 21L20.131 16.792C20.447 16.628 20.605 16.547 20.72 16.426C20.8219 16.3198 20.899 16.1925 20.946 16.053C21 15.894 21 15.717 21 15.361V7.53302M12 21L3.869 16.792C3.553 16.628 3.395 16.547 3.28 16.426C3.17814 16.3198 3.10097 16.1925 3.054 16.053C3 15.894 3 15.716 3 15.359V7.53302M12 21V11.937M21 7.53302L12 11.937M21 7.53302L12.73 3.25302C12.463 3.11502 12.33 3.04502 12.189 3.01802C12.0641 2.99399 11.9359 2.99399 11.811 3.01802C11.671 3.04502 11.537 3.11502 11.269 3.25302L3 7.53302M3 7.53302L12 11.937"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const RulerIcon = ({ size = 16, color = "#595959" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 8H6M4 12H7M4 16H6M8 4V6M12 4V7M16 4V6M5 4H19C19.2652 4 19.5196 4.10536 19.7071 4.29289C19.8946 4.48043 20 4.73478 20 5V10C20 10.2652 19.8946 10.5196 19.7071 10.7071C19.5196 10.8946 19.2652 11 19 11H12C11.7348 11 11.4804 11.1054 11.2929 11.2929C11.1054 11.4804 11 11.7348 11 12V19C11 19.2652 10.8946 19.5196 10.7071 19.7071C10.5196 19.8946 10.2652 20 10 20H5C4.73478 20 4.48043 19.8946 4.29289 19.7071C4.10536 19.5196 4 19.2652 4 19V5C4 4.73478 4.10536 4.48043 4.29289 4.29289C4.48043 4.10536 4.73478 4 5 4Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const StairsIcon = ({ size = 16, color = "#595959" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9.79975 15.2999H2.64995C2.13737 15.2999 1.88108 15.2999 1.67868 15.3835C1.4097 15.4954 1.19608 15.7094 1.0847 15.9786C1 16.181 1 16.4373 1 16.9499C1 17.4624 1 17.7187 1.0836 17.9211C1.19547 18.1901 1.40949 18.4037 1.67868 18.5151C1.88108 18.5998 2.13737 18.5998 2.64995 18.5998H9.79975V15.2999ZM13.0997 12H6.49985C5.46258 12 4.94449 12 4.6222 12.3223C4.29991 12.6446 4.29991 13.1627 4.29991 14.1999V15.2999H13.0997V12Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9.80042 18.5998H18.6002C20.6747 18.5998 21.7109 18.5998 22.3555 17.9552C23 17.3106 23 16.2744 23 14.1999V7.60009C23 6.56281 23 6.04473 22.6778 5.72244C22.3555 5.40015 21.8374 5.40015 20.8001 5.40015H19.7001"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M16.3996 8.70005H9.79979C8.76252 8.70005 8.24444 8.70005 7.92214 9.02235C7.59985 9.34464 7.59985 9.86272 7.59985 10.9V12H16.3996V8.70005ZM19.6995 5.40015H13.0997C12.0624 5.40015 11.5443 5.40015 11.2221 5.72244C10.8998 6.04473 10.8998 6.56281 10.8998 7.60009V8.70005H19.6995V5.40015Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const MoneyIcon = ({ size = 16, color = "#595959" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M2 7C2 6.46957 2.21071 5.96086 2.58579 5.58579C2.96086 5.21071 3.46957 5 4 5H20C20.5304 5 21.0391 5.21071 21.4142 5.58579C21.7893 5.96086 22 6.46957 22 7V17C22 17.5304 21.7893 18.0391 21.4142 18.4142C21.0391 18.7893 20.5304 19 20 19H4C3.46957 19 2.96086 18.7893 2.58579 18.4142C2.21071 18.0391 2 17.5304 2 17V7Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M2 9C3.06087 9 4.07828 8.57857 4.82843 7.82843C5.57857 7.07828 6 6.06087 6 5M18 19C18 17.9391 18.4214 16.9217 19.1716 16.1716C19.9217 15.4214 20.9391 15 22 15"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const PeopleIcon = ({ width = 18, height = 16, color = "white" }) => (
  <Svg width={width} height={height} viewBox="0 0 18 16" fill="none">
    <Path
      d="M5.6 7.5749C6.50174 7.5749 7.36654 7.21669 8.00416 6.57907C8.64179 5.94144 9 5.07664 9 4.1749C9 3.27317 8.64179 2.40836 8.00416 1.77074C7.36654 1.13312 6.50174 0.774902 5.6 0.774902C4.69826 0.774902 3.83346 1.13312 3.19584 1.77074C2.55821 2.40836 2.2 3.27317 2.2 4.1749C2.2 5.07664 2.55821 5.94144 3.19584 6.57907C3.83346 7.21669 4.69826 7.5749 5.6 7.5749ZM13.25 7.5749C13.9263 7.5749 14.5749 7.30624 15.0531 6.82802C15.5313 6.34981 15.8 5.7012 15.8 5.0249C15.8 4.3486 15.5313 3.7 15.0531 3.22178C14.5749 2.74356 13.9263 2.4749 13.25 2.4749C12.5737 2.4749 11.9251 2.74356 11.4469 3.22178C10.9687 3.7 10.7 4.3486 10.7 5.0249C10.7 5.7012 10.9687 6.34981 11.4469 6.82802C11.9251 7.30624 12.5737 7.5749 13.25 7.5749ZM2.4125 9.2749C1.90527 9.2749 1.41882 9.4764 1.06016 9.83506C0.701495 10.1937 0.5 10.6802 0.5 11.1874V11.3999C0.5 11.3999 0.5 15.2249 5.6 15.2249C10.7 15.2249 10.7 11.3999 10.7 11.3999V11.1874C10.7 10.6802 10.4985 10.1937 10.1398 9.83506C9.78118 9.4764 9.29473 9.2749 8.7875 9.2749H2.4125ZM13.25 13.9499C12.2547 13.9499 11.4922 13.7961 10.9082 13.5606C11.2482 12.987 11.4615 12.3474 11.5339 11.6847C11.5421 11.6041 11.5475 11.5233 11.55 11.4424V11.1874C11.5511 10.4753 11.2763 9.79046 10.7833 9.2766L10.87 9.2749H15.63C16.126 9.2749 16.6016 9.47192 16.9523 9.82261C17.303 10.1733 17.5 10.6489 17.5 11.1449C17.5 11.1449 17.5 13.9499 13.25 13.9499Z"
      fill={color}
    />
  </Svg>
);

const PhoneIcon = ({ width = 13, height = 18, color = "white" }) => (
  <Svg width={width} height={height} viewBox="0 0 13 18" fill="none">
    <Path
      d="M2.32564 0.394928L3.29494 0.0853287C4.20214 -0.204471 5.17234 0.264428 5.56114 1.18063L6.33514 3.00583C6.67264 3.80052 6.48544 4.73562 5.87254 5.31702L4.16884 6.93522C4.27384 7.90362 4.59904 8.85672 5.14444 9.79452C5.66308 10.7016 6.35803 11.4957 7.18834 12.13L9.23674 11.446C10.0125 11.1877 10.8576 11.4856 11.3337 12.1849L12.4425 13.8139C12.9969 14.6275 12.897 15.7489 12.2103 16.4383L11.4741 17.1772C10.7415 17.9125 9.69573 18.1798 8.72734 17.8774C6.44254 17.1646 4.34164 15.0487 2.42464 11.5297C0.505247 8.00472 -0.172152 5.01432 0.392447 2.55853C0.630046 1.52533 1.36625 0.701828 2.32744 0.394928"
      fill={color}
    />
  </Svg>
);

const formatMaintenanceCost = (area) => {
  if (!area) return "7만";

  const cost = Math.round(area * 1000);
  const manWon = Math.round(cost / 10000);

  return `${manWon}만`;
};

export default function RoomDetailScreen({ route, navigation }) {
  const { roomId, room: roomFromParams, user } = route.params || {};
  const [room, setRoom] = useState(roomFromParams || null);
  const [loading, setLoading] = useState(!roomFromParams);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [landlordInfo, setLandlordInfo] = useState(null);

  // 사용자 정보 (params에서 받거나 기본값 사용)
  const userData = user || { id: "1", name: "김대학생" };

  const getRoomImages = (roomId) => {
    // 홈 화면의 이미지를 첫 번째로, 나머지는 다른 이미지들로 구성
    const imageIndex = parseInt(roomId?.toString().slice(-1) || "0") % 8;
    const roomImages = [
      "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop", // 모던 거실
      "https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop", // 침실
      "https://images.pexels.com/photos/2029722/pexels-photo-2029722.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop", // 주방
      "https://images.pexels.com/photos/1571453/pexels-photo-1571453.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop", // 원룸
      "https://images.pexels.com/photos/2079249/pexels-photo-2079249.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop", // 아파트 거실
      "https://images.pexels.com/photos/2121121/pexels-photo-2121121.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop", // 화이트 인테리어
      "https://images.pexels.com/photos/1454804/pexels-photo-1454804.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop", // 밝은 방
      "https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop", // 아늑한 방
    ];

    return [
      roomImages[imageIndex], // 홈 화면과 동일한 메인 이미지
      roomImages[(imageIndex + 1) % 8],
      roomImages[(imageIndex + 2) % 8],
      roomImages[(imageIndex + 3) % 8],
    ];
  };

  const [images, setImages] = useState([]);

  // 탭 바 숨기기 - useLayoutEffect로 렌더링 전에 실행
  React.useLayoutEffect(() => {
    const parent = navigation.getParent();
    if (parent) {
      parent.setOptions({
        tabBarStyle: { display: "none" },
      });
    }
    return () => {
      // 화면을 떠날 때 탭 바 복원
      if (parent) {
        parent.setOptions({
          tabBarStyle: {
            height: 100,
            paddingBottom: 30,
            paddingTop: 15,
            backgroundColor: "#FFFFFF",
            borderTopWidth: 0,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 8,
            tabBarActiveTintColor: "#000000",
            tabBarInactiveTintColor: "#C0C0C0",
          },
        });
      }
    };
  }, [navigation]);

  useEffect(() => {
    // roomId가 있으면 항상 API를 통해 최신 데이터 가져오기
    const id = roomId || roomFromParams?.room_id;
    if (id) {
      // 이미지 먼저 설정 (빠른 렌더링)
      setImages(getRoomImages(id));
      // 집주인 정보 설정
      setLandlordInfo(getLandlordInfo(id));
      // 비동기로 API 호출
      setTimeout(() => {
        loadRoomDetail(id);
        checkFavoriteStatus();
      }, 0);
    }
  }, [roomId, roomFromParams]);

  const loadRoomDetail = async (id) => {
    try {
      setLoading(true);
      const roomData = await ApiService.getRoomDetail(id || roomId);
      setRoom(roomData);
    } catch (error) {
      console.error("방 정보 로드 실패:", error);
      // API 실패 시 홈에서 전달받은 room 데이터 사용
      if (!room && roomFromParams) {
        setRoom(roomFromParams);
      }
    } finally {
      setLoading(false);
    }
  };

  const checkFavoriteStatus = async () => {
    try {
      const id = roomId || room?.room_id;
      if (!id) return;

      const response = await ApiService.checkFavoriteStatus(id);
      setIsFavorited(response.is_favorited);
    } catch (error) {
      console.error("찜 상태 확인 실패:", error);
      // 에러 시 기본값 false 유지
      setIsFavorited(false);
    }
  };

  const formatPrice = () => {
    if (!room) return "";
    return formatPriceUtil(
      room.price_deposit,
      room.transaction_type,
      room.price_monthly,
      room.room_id || room.id
    );
  };

  const toggleFavorite = async () => {
    try {
      const id = roomId || room?.room_id;
      if (!id) {
        setIsFavorited(!isFavorited);
        return;
      }

      if (isFavorited) {
        await ApiService.removeFavorite(id);
      } else {
        await ApiService.addFavorite(id, String(userData.id));
      }
      setIsFavorited(!isFavorited);
    } catch (error) {
      console.error("찜 상태 변경 실패:", error);
      // API 실패해도 로컬 상태는 변경
      setIsFavorited(!isFavorited);
    }
  };

  const handleContactOwner = () => {
    const id = roomId || room?.room_id;
    navigation.navigate("FavoritedUsers", { roomId: id });
  };

  const handleViewContract = async () => {
    try {
      // ex.png 이미지의 URI 가져오기
      const asset = Asset.fromModule(require("../../assets/ex.png"));
      await asset.downloadAsync();

      // 이미지 파일 정보 구성
      const imageFile = {
        uri: asset.uri,
        type: "image/png",
        name: "ex.png",
      };

      // 비동기 분석 시작
      const response = await ApiService.startAnalysisAsync(imageFile);

      if (response && response.success) {
        // 기존 ContractResultScreen으로 이동 (실제 분석 진행)
        navigation.navigate("ContractResult", {
          photoUri: asset.uri,
          analysisData: null, // 실제 분석 진행
          taskId: response.task_id, // 실제 task_id 사용
        });
      } else {
        Alert.alert("오류", "계약서 분석을 시작할 수 없습니다.");
      }
    } catch (error) {
      console.error("계약서 분석 시작 오류:", error);
      Alert.alert("오류", "계약서 분석을 시작하는 중 문제가 발생했습니다.");
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>로딩 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!room) return null;

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerButton}
        >
          <BackIcon size={24} />
        </TouchableOpacity>
        <View style={styles.headerRightButtons}>
          <TouchableOpacity
            onPress={toggleFavorite}
            style={styles.headerButton}
          >
            {isFavorited ? (
              <HeartFilledIcon size={20} />
            ) : (
              <HeartOutlineIcon size={20} />
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <ShareIcon size={23} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* 이미지 갤러리 */}
        <View style={styles.imageContainer}>
          <FlatList
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(event) => {
              const index = Math.round(
                event.nativeEvent.contentOffset.x / width
              );
              setCurrentImageIndex(index);
            }}
            renderItem={({ item: imageItem }) => (
              <Image
                source={{ uri: imageItem }}
                style={styles.mainImage}
                resizeMode="cover"
              />
            )}
            keyExtractor={(item, index) => index.toString()}
          />

          {/* 이미지 카운터 */}
          <View style={styles.imageCounter}>
            <Text style={styles.imageCountText}>
              {currentImageIndex + 1}/{images.length}
            </Text>
          </View>
        </View>
        {/* 매물 기본 정보 */}
        <View style={styles.basicInfoSection}>
          <View style={styles.propertyHeader}>
            <Text style={styles.propertyId}>
              매물번호{" "}
              {room?.room_id?.substring(
                room?.room_id?.lastIndexOf("_") + 1,
                room?.room_id?.lastIndexOf("_") + 9
              ) || "123123123"}
            </Text>
            <View style={styles.verificationBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#FFF" />
              <Text style={styles.verificationText}>집주인 인증</Text>
            </View>
          </View>

          <Text style={styles.price}>
            {room?.transaction_type} {formatPrice()}
          </Text>
          <Text style={styles.description}>
            {room?.description || room?.address || "매물 설명이 없습니다."}
          </Text>

          <View style={styles.basicDetails}>
            <View style={styles.mainInfoBox}>
              <View style={styles.infoBoxContainer}>
                <View style={styles.infoItem}>
                  <CubeIcon size={16} color="#595959" />
                  <Text style={styles.infoItemText}>
                    {getRoomType(room?.area, room?.rooms)},{" "}
                    {room?.building_year &&
                    new Date().getFullYear() - room.building_year < 5
                      ? "신축"
                      : "기존건물"}
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <RulerIcon size={16} color="#595959" />
                  <Text style={styles.infoItemText}>
                    {formatArea(room?.area)} ({room?.area || 19.8347}㎡)
                  </Text>
                </View>
              </View>
              <View style={[styles.infoBoxContainer, { marginBottom: 0 }]}>
                <View style={styles.infoItem}>
                  <StairsIcon size={16} color="#595959" />
                  <Text style={styles.infoItemText}>
                    {formatFloor(room?.floor)},{" "}
                    {room?.floor >= 3 ? "엘리베이터 사용" : "계단 이용"}
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <MoneyIcon size={16} color="#595959" />
                  <Text style={styles.infoItemText}>
                    관리비 {formatMaintenanceCost(room?.area)}원 (수도 포함)
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* 기본 정보 테이블 */}
        <View style={styles.basicInfoTable}>
          <Text style={styles.sectionTitle}>기본 정보</Text>
          <View style={styles.infoTable}>
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>매물 유형</Text>
              <Text style={styles.tableValue}>
                {getRoomType(room?.area, room?.rooms)},{" "}
                {room?.building_year &&
                new Date().getFullYear() - room.building_year < 5
                  ? "신축"
                  : "기존"}{" "}
                건물
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>크기</Text>
              <Text style={styles.tableValue}>
                {formatArea(room?.area)} ({room?.area || 19.8347}㎡)
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>가격 정보</Text>
              <Text style={styles.tableValue}>
                {room?.transaction_type} {formatPrice()}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>관리비</Text>
              <Text style={styles.tableValue}>
                {formatMaintenanceCost(room?.area)}원 (수도세 포함)
              </Text>
            </View>
          </View>
        </View>

        {/* 상세 정보 테이블 */}
        <View style={styles.detailInfoTable}>
          <Text style={styles.sectionTitle}>상세 정보</Text>
          <View style={styles.infoTable}>
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>건물 이름</Text>
              <Text style={styles.tableValue}>
                {(() => {
                  const addressParts = room?.address
                    ?.trim()
                    .split(" ")
                    .filter((part) => part !== "");
                  const lastPart = addressParts?.pop();
                  // 마지막 부분이 단순히 동/가로 끝나는지 (예: "장충동1가") vs 건물명인지 (예: "비전빌라트2동") 구분
                  if (
                    !lastPart ||
                    (lastPart?.endsWith("동") &&
                      lastPart?.length < 6 &&
                      /\d+동$/.test(lastPart)) ||
                    (lastPart?.endsWith("가") && lastPart?.length < 6)
                  ) {
                    return room?.room_id?.split("_")[2] || "건물명 정보 없음";
                  }
                  return lastPart;
                })()}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>해당층/건물층</Text>
              <Text style={styles.tableValue}>
                {formatFloor(room?.floor)} /{" "}
                {room?.floor ? room.floor + 1 : "-"}층
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>방 수/화장실 수</Text>
              <Text style={styles.tableValue}>
                {room?.rooms || 1}개 / {room?.rooms || 1}개
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>방향</Text>
              <Text style={styles.tableValue}>남향</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>난방종류</Text>
              <Text style={styles.tableValue}>개별난방</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>엘리베이터</Text>
              <Text style={styles.tableValue}>
                {room?.floor >= 3 ? "있음" : "없음"}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>입주가능일</Text>
              <Text style={styles.tableValue}>즉시 입주 (협의 가능)</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>사용승인일</Text>
              <Text style={styles.tableValue}>
                {room?.building_year || "정보 없음"}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>최초등록일</Text>
              <Text style={styles.tableValue}>
                {room?.created_at
                  ? new Date(room.created_at).toLocaleDateString("ko-KR")
                  : "정보 없음"}
              </Text>
            </View>
          </View>
        </View>

        {/* 집주인 정보 섹션 */}
        <View style={styles.landlordSection}>
          <View style={styles.landlordHeader}>
            <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>
              집주인 정보
            </Text>
            <View style={styles.landlordVerificationBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#FFF" />
              <Text style={styles.landlordVerificationText}>집주인 인증</Text>
            </View>
          </View>
          <View style={styles.landlordProfile}>
            <View style={styles.landlordAvatar}>
              <Svg width="45" height="45" viewBox="0 0 45 45" fill="none">
                <Path
                  d="M33.4631 26.3357C34.563 26.3366 35.6176 26.7743 36.395 27.5524C37.1725 28.3305 37.6092 29.3855 37.6092 30.4854V32.1785C37.6091 33.2353 37.279 34.2657 36.6648 35.1258C33.8135 39.1169 29.1584 41.0922 22.8507 41.0922C16.5394 41.0922 11.8861 39.1151 9.04218 35.1239C8.43009 34.2645 8.10128 33.2355 8.10156 32.1804V30.4836C8.10205 29.3836 8.53922 28.3289 9.317 27.5511C10.0948 26.7733 11.1495 26.3361 12.2495 26.3357H33.4631ZM22.8489 4.2128C24.0599 4.2128 25.2591 4.45132 26.3779 4.91476C27.4967 5.37819 28.5133 6.05746 29.3696 6.91377C30.2259 7.77009 30.9052 8.78668 31.3686 9.90551C31.8321 11.0243 32.0706 12.2235 32.0706 13.4345C32.0706 14.6455 31.8321 15.8447 31.3686 16.9635C30.9052 18.0823 30.2259 19.0989 29.3696 19.9552C28.5133 20.8115 27.4967 21.4908 26.3779 21.9542C25.2591 22.4177 24.0599 22.6562 22.8489 22.6562C20.4032 22.6562 18.0576 21.6846 16.3282 19.9552C14.5988 18.2258 13.6272 15.8802 13.6272 13.4345C13.6272 10.9888 14.5988 8.64318 16.3282 6.91377C18.0576 5.18437 20.4032 4.2128 22.8489 4.2128Z"
                  fill="#595959"
                />
              </Svg>
            </View>
            <View style={styles.landlordDetails}>
              <Text style={styles.landlordName}>
                {landlordInfo?.maskedName || "정보 없음"}
              </Text>
              <Text style={styles.landlordPhone}>
                안심번호: {landlordInfo?.safetyNumber || "0504-000-0000"}
              </Text>
              <Text style={styles.landlordSubtext}>
                계약 성사 시 실제 번호 공유 가능
              </Text>
              <TouchableOpacity style={styles.landlordCallButton}>
                <Text style={styles.landlordCallText}>
                  소유자 여부 : 등기상 소유자
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 계약서 확인하기 섹션 */}
        <View style={styles.contractSection}>
          <View style={styles.contractContainer}>
            <Text style={styles.contractTitle}>이 매물 계약서 확인하기</Text>
            <View style={styles.contractPreview}>
              <Image
                source={require("../../assets/ex.png")}
                style={styles.contractImage}
                resizeMode="contain"
              />
              <TouchableOpacity
                style={styles.contractViewButton}
                onPress={handleViewContract}
              >
                <Text style={styles.contractViewText}>이 계약서 검증하기</Text>
                <View style={styles.contractArrowIcon}>
                  <Svg width="43" height="42" viewBox="0 0 43 42" fill="none">
                    <Path
                      d="M21.308 41.5302C33.1241 41.5302 42.616 32.231 42.616 20.7651C42.616 9.29926 33.1241 0 21.308 0C9.49193 0 0 9.29926 0 20.7651C0 32.231 9.49193 41.5302 21.308 41.5302Z"
                      fill="black"
                    />
                    <Path
                      d="M10 19.0332C9.04431 19.0332 8.26958 19.808 8.26958 20.7637C8.26958 21.7194 9.04431 22.4941 10 22.4941L10 20.7637L10 19.0332ZM32.5316 21.9873C33.2074 21.3115 33.2074 20.2158 32.5316 19.5401L21.5193 8.52773C20.8435 7.85196 19.7478 7.85196 19.0721 8.52773C18.3963 9.2035 18.3963 10.2991 19.0721 10.9749L28.8608 20.7637L19.0721 30.5524C18.3963 31.2282 18.3963 32.3238 19.0721 32.9996C19.7478 33.6754 20.8435 33.6754 21.5193 32.9996L32.5316 21.9873ZM10 20.7637L10 22.4941L31.308 22.4941L31.308 20.7637L31.308 19.0332L10 19.0332L10 20.7637Z"
                      fill="white"
                    />
                  </Svg>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 찜한 사람들
        <TouchableOpacity style={styles.favoritedUsersSection} onPress={handleViewFavoritedUsers}>
          <View style={styles.favoritedUsersHeader}>
            <Ionicons name="heart" size={20} color="#FF6600" />
            <Text style={styles.favoritedUsersTitle}>{room?.favorite_count || 0}명이 찜했어요</Text>
          </View>
          <View style={styles.favoritedUsersSubtitle}>
            <Text style={styles.favoritedUsersSubtext}>궁합 점수 순으로 보기</Text>
            <Ionicons name="chevron-forward" size={16} color="#666" />
          </View>
        </TouchableOpacity> */}

        {/* 하단 여백 */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* 하단 고정 버튼 */}
      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity
          style={styles.bottomButton}
          onPress={handleContactOwner}
        >
          <View style={styles.buttonContent}>
            <PeopleIcon width={18} height={16} color="white" />
            <Text style={styles.bottomButtonText}>룸메이트 구하기</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomCallButton}>
          <View style={styles.buttonContent}>
            <PhoneIcon width={13} height={16} color="white" />
            <Text style={styles.bottomCallButtonText}>전화문의</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  imageContainer: {
    height: 300,
    position: "relative",
  },
  mainImage: {
    width: width,
    height: 300,
  },
  header: {
    backgroundColor: "transparent",
    paddingTop: 54,
    paddingBottom: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  headerButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
  headerRightButtons: {
    flexDirection: "row",
    gap: 8,
  },
  imageCounter: {
    position: "absolute",
    bottom: 16,
    right: 16,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCountText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  playButton: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -20 }, { translateY: -20 }],
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  basicInfoSection: {
    padding: 20,
    marginBottom: 8,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
  propertyHeader: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    marginBottom: 22,
    gap: 12,
  },
  propertyId: {
    fontSize: 12,
    color: "#595959",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: "#f5f5f5",
    borderColor: "#eee",
  },
  verificationBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#595959",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#595959",
    gap: 4,
  },
  verificationText: {
    fontSize: 11,
    color: "#FFF",
    fontWeight: "800",
  },
  price: {
    fontSize: 28,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: "#333",
    lineHeight: 24,
    marginBottom: 20,
  },
  basicDetails: {
    gap: 16,
  },
  detailRowContainer: {
    flexDirection: "row",
    gap: 16,
  },
  detailItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  detailIcon: {
    marginRight: 8,
    width: 20,
  },
  detailText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    flex: 1,
  },
  basicInfoTable: {
    padding: 20,
    marginBottom: 8,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
  detailInfoTable: {
    padding: 20,
    marginBottom: 8,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 16,
  },
  infoTable: {
    backgroundColor: "#fff",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  tableLabel: {
    fontSize: 14,
    color: "#666",
    width: 100,
    marginRight: 20,
  },
  tableValue: {
    fontSize: 14,
    color: "#333",
    flex: 1,
    fontWeight: "500",
  },
  landlordSection: {
    padding: 20,
    marginBottom: 8,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
  },
  landlordHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  landlordVerificationBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#595959",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#595959",
    gap: 4,
  },
  landlordVerificationText: {
    fontSize: 11,
    color: "#FFF",
    fontWeight: "800",
  },
  landlordProfile: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  landlordAvatar: {
    width: 45,
    height: 45,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  landlordDetails: {
    flex: 1,
  },
  landlordName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  landlordPhone: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  landlordSubtext: {
    fontSize: 12,
    color: "#999",
    marginBottom: 8,
  },
  landlordCallButton: {
    alignSelf: "flex-start",
  },
  landlordCallText: {
    fontSize: 12,
    color: "#595959",
    fontWeight: "500",
  },
  contractSection: {
    padding: 15,
    borderBottomWidth: 8,
    borderBottomColor: "#f5f5f5",
    backgroundColor: "#f5f5f5",
  },
  contractContainer: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  contractTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    marginBottom: 20,
  },
  contractPreview: {
    alignItems: "center",
  },
  contractImage: {
    width: 200,
    height: 280,
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: "#f8f9fa",
  },
  contractViewButton: {
    backgroundColor: "#FC6339",
    paddingLeft: 20,
    paddingRight: 5,
    paddingVertical: 5,
    borderRadius: 83,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 52,
    width: 260,
  },
  contractViewText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
    marginRight: -22, // Co mpensate for arrow icon width
  },
  contractArrowIcon: {
    width: 43,
    height: 42,
  },
  favoritedUsersSection: {
    padding: 20,
    borderBottomWidth: 8,
    borderBottomColor: "#f5f5f5",
  },
  favoritedUsersHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  favoritedUsersTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginLeft: 8,
  },
  favoritedUsersSubtitle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  favoritedUsersSubtext: {
    fontSize: 14,
    color: "#666",
  },
  bottomSpacing: {
    height: 100,
  },
  bottomButtonContainer: {
    position: "absolute",
    bottom: 50,
    left: 20,
    right: 20,
    flexDirection: "row",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 8,
  },
  bottomButton: {
    flex: 1,
    backgroundColor: "#13AE86",
    paddingVertical: 16,
    borderRadius: 100,
    alignItems: "center",
  },
  bottomButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  bottomCallButton: {
    flex: 1,
    backgroundColor: "#000000",
    paddingVertical: 16,
    borderRadius: 100,
    alignItems: "center",
  },
  bottomCallButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  mainInfoBox: {
    backgroundColor: "#F2F2F2",
    borderRadius: 9,
    padding: 16,
  },
  infoBoxContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  infoItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 4,
  },
  infoItemText: {
    fontSize: 12,
    color: "#333",
    fontWeight: "500",
    flex: 1,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
});
