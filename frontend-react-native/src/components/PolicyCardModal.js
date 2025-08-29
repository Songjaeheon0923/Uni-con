import React from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

const PolicyCardModal = ({ visible, policy, onClose, onNavigateToDetail }) => {
  if (!policy) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return "정보 없음";
    try {
      if (dateStr.length === 8) {
        // YYYYMMDD 형식
        const year = dateStr.substring(0, 4);
        const month = dateStr.substring(4, 6);
        const day = dateStr.substring(6, 8);
        return `${year}.${month}.${day}`;
      }
      // 이미 포맷된 날짜면 그대로 반환
      return dateStr;
    } catch (error) {
      return "정보 없음";
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={onClose}
        >
          <View style={styles.modalContainer}>
            <TouchableOpacity activeOpacity={1}>
              <View style={styles.modalContent}>
                {/* 헤더 */}
                <View style={styles.modalHeader}>
                  <View style={styles.categoryContainer}>
                    <Text style={styles.categoryText}>
                      #{policy.category || "정책"}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={onClose}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>

                {/* 제목 */}
                <Text style={styles.policyTitle}>{policy.title}</Text>

                {/* 기관 */}
                {policy.organization && (
                  <Text style={styles.organizationText}>
                    {policy.organization}
                  </Text>
                )}

                {/* 내용 */}
                <ScrollView
                  style={styles.contentContainer}
                  showsVerticalScrollIndicator={false}
                >
                  <Text style={styles.contentText}>
                    {policy.content || "정책 상세 내용을 확인하세요."}
                  </Text>
                </ScrollView>

                {/* 정보 박스 */}
                <View style={styles.infoBoxesContainer}>
                  <View style={styles.infoBox}>
                    <Text style={styles.infoBoxTitle}>지원 대상</Text>
                    <Text style={styles.infoBoxContent}>
                      {policy.target || "자세한 내용 확인 필요"}
                    </Text>
                  </View>

                  {(policy.start_date || policy.end_date) && (
                    <View style={styles.infoBox}>
                      <Text style={styles.infoBoxTitle}>신청 기간</Text>
                      <Text style={styles.infoBoxContent}>
                        {policy.start_date
                          ? formatDate(policy.start_date)
                          : "시작일 미정"}{" "}
                        ~{" "}
                        {policy.end_date
                          ? formatDate(policy.end_date)
                          : "종료일 미정"}
                      </Text>
                    </View>
                  )}
                </View>

                {/* 버튼 */}
                <TouchableOpacity
                  style={styles.detailButton}
                  onPress={() => {
                    onClose();
                    onNavigateToDetail();
                  }}
                >
                  <Text style={styles.detailButtonText}>자세히 보기</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  backdropTouchable: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContainer: {
    width: "100%",
    maxWidth: width * 0.9,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  categoryContainer: {
    backgroundColor: "#FF6600",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  closeButton: {
    padding: 4,
  },
  policyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 6,
    lineHeight: 24,
  },
  organizationText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  contentContainer: {
    maxHeight: 120,
    marginBottom: 16,
  },
  contentText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  infoBoxesContainer: {
    gap: 12,
    marginBottom: 20,
  },
  infoBox: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#10B585",
  },
  infoBoxTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    marginBottom: 4,
  },
  infoBoxContent: {
    fontSize: 13,
    color: "#333",
    lineHeight: 18,
  },
  detailButton: {
    backgroundColor: "#10B585",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  detailButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

export default PolicyCardModal;
