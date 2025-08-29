import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  formatPrice,
  formatArea,
  getRoomType,
  formatFloor,
} from "../utils/priceUtils";
import FavoriteButton from "./FavoriteButton";

const getRoomImage = (roomId) => {
  // roomId 기반으로 부동산 이미지 선택
  const imageIndex = parseInt(roomId?.toString().slice(-1) || "0") % 8;
  const roomImages = [
    "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop", // 모던 거실
    "https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop", // 침실
    "https://images.pexels.com/photos/2029722/pexels-photo-2029722.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop", // 주방
    "https://images.pexels.com/photos/1571453/pexels-photo-1571453.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop", // 원룸
    "https://images.pexels.com/photos/2079249/pexels-photo-2079249.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop", // 아파트 거실
    "https://images.pexels.com/photos/2121121/pexels-photo-2121121.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop", // 화이트 인테리어
    "https://images.pexels.com/photos/1454804/pexels-photo-1454804.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop", // 밝은 방
    "https://images.pexels.com/photos/2291136/pexels-photo-2291136.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop", // 미니멀 룸
  ];
  return roomImages[imageIndex];
};

const PropertyCard = ({
  property,
  onPress,
  onFavorite,
  isFavorited = false,
}) => {
  // 관리비를 만원 단위로 반올림하여 포맷팅
  const formatMaintenanceCost = (area) => {
    if (!area) return "7만";
    // 문자열에서 숫자 부분만 추출 ("190.32㎡" -> 190.32)
    const numericArea = parseFloat(area.toString().replace(/㎡/g, ""));
    if (isNaN(numericArea)) return "7만";
    const cost = Math.round(numericArea * 1000);
    const manWon = Math.round(cost / 10000);
    return `${manWon}만`;
  };

  // 주소에서 가장 가까운 역 정보 추출
  const getNearestStation = (address) => {
    if (!address) return "안암역 10분 거리";

    if (address.includes("성수동")) return "성수역 5분 거리";
    if (address.includes("안암동")) return "안암역 7분 거리";
    if (address.includes("종로")) return "종로3가역 8분 거리";
    if (address.includes("성북")) return "성신여대입구역 10분 거리";
    if (address.includes("동대문")) return "동대문역 6분 거리";

    return "안암역 10분 거리"; // 기본값
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardContent}>
        {/* 매물 이미지 */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: getRoomImage(property?.room_id || property?.id) }}
            style={styles.propertyImage}
            defaultSource={{
              uri: "https://via.placeholder.com/90x90/f0f0f0/666?text=매물",
            }}
          />
        </View>

        {/* 매물 정보 */}
        <View style={styles.propertyInfo}>
          <Text style={styles.priceText}>
            {property.transaction_type}{" "}
            {formatPrice(
              property.price_deposit,
              property.transaction_type,
              property.price_monthly,
              property.room_id || property.id
            )}
          </Text>

          <Text style={styles.detailText}>
            {getRoomType(property.area, property.rooms)} |{" "}
            {formatArea(property.area)} | {formatFloor(property.floor)}
          </Text>

          {/* 관리비와 거리 정보 */}
          <Text style={styles.additionalInfoText} numberOfLines={1}>
            관리비 {formatMaintenanceCost(property.area)}원 |{" "}
            {getNearestStation(property.address)}
          </Text>

          {/* 집주인 인증 뱃지 */}
          <View style={styles.badgeContainer}>
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={12} color="#fff" />
              <Text style={styles.badgeText}>집주인 인증</Text>
            </View>
          </View>
        </View>

        {/* 우측 섹션 - 즐겨찾기 버튼과 좋아요 수 */}
        <View style={styles.rightSection}>
          <View style={styles.favoriteSection}>
            <FavoriteButton
              isFavorited={isFavorited}
              onPress={() => onFavorite && onFavorite(property)}
              style={{ marginBottom: 3 }}
            />
            <View style={styles.likeCount}>
              <Text style={styles.likeCountText}>
                {property.favorite_count || 0}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    marginVertical: 6,
    marginHorizontal: 8,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
  },
  imageContainer: {
    marginRight: 16,
  },
  propertyImage: {
    width: 90,
    height: 90,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
  },
  propertyInfo: {
    flex: 1,
    paddingRight: 8,
  },
  priceText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  detailText: {
    fontSize: 12,
    color: "#888",
    marginBottom: 4,
  },
  additionalInfoText: {
    fontSize: 12,
    color: "#888",
    marginBottom: 8,
  },
  badgeContainer: {
    flexDirection: "row",
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#595959",
    paddingHorizontal: 6,
    paddingVertical: 6,
    borderRadius: 7,
  },
  badgeText: {
    fontSize: 11,
    color: "#fff",
    marginLeft: 3,
    fontWeight: "500",
  },
  rightSection: {
    alignItems: "center",
    justifyContent: "flex-start",
    marginLeft: 8,
    height: 100,
  },
  favoriteSection: {
    alignItems: "center",
    gap: 0,
  },
  likeCount: {
    alignItems: "center",
  },
  likeCountText: {
    fontSize: 11,
    color: "#999",
    fontWeight: "500",
  },
});

export default PropertyCard;
