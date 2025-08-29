import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Linking,
  Alert,
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from "@expo/vector-icons";
import Markdown from "react-native-markdown-display";
import { useFocusEffect } from "@react-navigation/native";
import ApiService from "../services/api";

const PolicyDetailScreen = ({ navigation, route }) => {
  const { policy } = route.params;
  const [aiSummary, setAiSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);

  useEffect(() => {
    loadAISummary();
  }, []);

  // 탭 바 숨기기
  useFocusEffect(
    React.useCallback(() => {
      const parent = navigation.getParent();
      if (parent) {
        parent.setOptions({
          tabBarStyle: { display: "none" },
        });
      }
      return () => {
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
    }, [navigation])
  );

  const loadAISummary = async () => {
    const policyId = policy?.id || policy?.policy?.id;
    const cacheKey = `policy_ai_summary_${policyId}`;
    
    try {
      setLoadingSummary(true);
      
      // 먼저 캐시에서 확인
      const cachedSummary = await AsyncStorage.getItem(cacheKey);
      if (cachedSummary) {
        const parsedSummary = JSON.parse(cachedSummary);
        
        // 만료 확인
        if (parsedSummary.expires_at && Date.now() < parsedSummary.expires_at) {
          setAiSummary(parsedSummary);
          setLoadingSummary(false);
          return;
        } else {
          // 만료된 캐시 삭제
          await AsyncStorage.removeItem(cacheKey);
        }
      }
      
      // 캐시에 없으면 API 호출
      const summary = await ApiService.getPolicyAISummary(policyId);
      if (summary) {
        setAiSummary(summary);
        // 캐시에 저장 (30일 만료)
        const cacheData = {
          ...summary,
          cached_at: Date.now(),
          expires_at: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30일
        };
        await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
      }
    } catch (error) {
      console.error("AI 요약 로드 실패:", error);
    } finally {
      setLoadingSummary(false);
    }
  };

  const getPolicySearchUrl = (policyData) => {
    const title = policyData?.title || "";
    const organization = policyData?.organization || "";
    return `https://www.google.com/search?q=${encodeURIComponent(
      title + " " + organization + " 신청방법"
    )}`;
  };

  const handleApplyPress = async () => {
    try {
      const policyData = policy?.policy || policy;
      const directUrl =
        policyData?.application_url ||
        policyData?.reference_url ||
        policyData?.url ||
        policy?.application_url ||
        policy?.reference_url ||
        policy?.url;

      if (directUrl && directUrl.trim() && !directUrl.includes("example.com")) {
        await Linking.openURL(directUrl);
      } else {
        // 직접 링크가 없거나 잘못된 경우 검색 결과로 연결
        Alert.alert(
          "신청 안내",
          "정확한 신청 링크를 찾기 위해 검색 결과로 이동하시겠습니까?",
          [
            { text: "취소", style: "cancel" },
            {
              text: "검색하기",
              onPress: async () => {
                const searchUrl = getPolicySearchUrl(policyData);
                await Linking.openURL(searchUrl);
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error("URL 열기 실패:", error);
      Alert.alert("오류", "URL을 열 수 없습니다.");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";

    // YYYYMMDD 형식인 경우 처리
    if (
      typeof dateString === "string" &&
      dateString.length === 8 &&
      /^\d{8}$/.test(dateString)
    ) {
      const year = dateString.substring(0, 4);
      const month = dateString.substring(4, 6);
      const day = dateString.substring(6, 8);
      const date = new Date(year, month - 1, day);

      if (isNaN(date.getTime())) return "";

      return date.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }

    // 기본 날짜 형식 처리
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";

    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const cleanTargetText = (text) => {
    if (!text) return "";

    // 숫자 코드 패턴 제거 (예: 0055003, 0043003 등)
    // 만 X세 형식은 유지하면서 단독 숫자 코드만 제거
    let cleaned = text
      .replace(/\b\d{7,}\b[\s,]*/g, "") // 7자리 이상 숫자 제거
      .replace(/\b0\d{5,}\b[\s,]*/g, "") // 0으로 시작하는 6자리 이상 숫자 제거
      .replace(/^[\s,]+|[\s,]+$/g, "") // 앞뒤 공백 및 쉼표 제거
      .replace(/,\s*,/g, ",") // 연속된 쉼표 정리
      .replace(/,\s*$/g, ""); // 마지막 쉼표 제거

    // "만 0~0세" 형식 처리 (0세는 의미없으므로 제거)
    cleaned = cleaned.replace(/만\s+0~0세[\s,]*/g, "");

    // 빈 괄호 제거
    cleaned = cleaned.replace(/\(\s*\)/g, "");

    // 여러 개의 공백을 하나로
    cleaned = cleaned.replace(/\s+/g, " ").trim();

    return cleaned || "청년층";
  };

  const policyData = policy?.policy || policy;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>주요 정책 NEWS</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 제목 */}
        <Text style={styles.title}>{policyData?.title || "정책 정보"}</Text>

        {/* 소제목 */}
        <Text style={styles.subtitle}>
          {policyData?.content || policyData?.description || ""}
        </Text>

        {/* 메타 정보 */}
        <View style={styles.metaContainer}>
          <Text style={styles.metaText}>
            게시일: {formatDate(policyData?.start_date)} | 작성자:{" "}
            {policyData?.organization || "기획조정실"}
          </Text>
        </View>

        {/* AI 핵심 요약 */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Ionicons name="sparkles" size={16} color="#FF6600" />
            <Text style={styles.sectionTitle}>AI 핵심 요약</Text>
          </View>

          <View style={styles.summaryBox}>
            {loadingSummary ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>
                  AI가 정책을 분석하고 있습니다...
                </Text>
              </View>
            ) : (
              <Markdown style={markdownStyles}>
                {aiSummary?.summary || "정책 요약을 생성하지 못했습니다."}
              </Markdown>
            )}
          </View>
        </View>

        {/* 정책 핵심 요약 */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text" size={16} color="#FF6600" />
            <Text style={styles.sectionTitle}>정책 핵심 요약</Text>
          </View>

          {/* 지원 대상 */}
          <View style={styles.grayBox}>
            <Text style={styles.grayBoxTitle}>지원 대상</Text>
            <Text style={styles.grayBoxContent}>
              {cleanTargetText(
                policyData?.target ||
                  policyData?.details?.additional_qualification ||
                  "청년층"
              )}
            </Text>
            {policyData?.details?.min_age && policyData?.details?.max_age && (
              <Text style={[styles.grayBoxContent, { marginTop: 4 }]}>
                연령: 만 {policyData?.details?.min_age}세 ~{" "}
                {policyData?.details?.max_age}세
              </Text>
            )}
            {policyData?.details?.income_condition && (
              <Text style={[styles.grayBoxContent, { marginTop: 4 }]}>
                소득조건:{" "}
                {cleanTargetText(policyData?.details?.income_condition)}
              </Text>
            )}
          </View>

          {/* 신청 방법 */}
          <View style={[styles.grayBox, { marginTop: 15 }]}>
            <Text style={styles.grayBoxTitle}>신청 방법</Text>
            <Text style={styles.grayBoxContent}>
              {policyData?.details?.application_method ||
                `신청기간: ${policyData?.application_period || "상시 접수"}`}
            </Text>
            {policyData?.details?.required_documents && (
              <Text style={[styles.grayBoxContent, { marginTop: 8 }]}>
                필요서류: {policyData?.details?.required_documents}
              </Text>
            )}
            {policyData?.details?.selection_method && (
              <Text style={[styles.grayBoxContent, { marginTop: 8 }]}>
                심사방법: {policyData?.details?.selection_method}
              </Text>
            )}
          </View>

          {/* 내용 */}
          <View style={styles.contentSection}>
            <Text style={styles.contentText}>
              {policyData?.details?.explanation ||
                policyData?.content ||
                policyData?.description ||
                "이 정책은 청년들의 주거 안정을 위해 마련된 지원 제도입니다. 자세한 내용은 관련 기관에 문의하시기 바랍니다."}
            </Text>

            {policyData?.details?.etc_matters && (
              <Text style={[styles.contentText, { marginTop: 15 }]}>
                기타사항: {policyData?.details?.etc_matters}
              </Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* 하단 신청 버튼 */}
      <LinearGradient
        colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.7)', 'rgba(255,255,255,1)']}
        locations={[0, 0.5, 1]}
        style={styles.bottomContainer}
      >
        <TouchableOpacity style={styles.applyButton} onPress={handleApplyPress}>
          <Text style={styles.applyButtonText}>신청하러 가기</Text>
          <View style={styles.arrowContainer}>
            <Ionicons name="arrow-forward" size={35} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212529",
  },
  placeholder: {
    width: 34,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 100,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#212529",
    lineHeight: 32,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6C757D",
    lineHeight: 24,
    marginBottom: 15,
  },
  metaContainer: {
    paddingVertical: 10,
    marginBottom: 20,
  },
  metaText: {
    fontSize: 12,
    color: "#6C757D",
  },
  sectionContainer: {
    marginBottom: 25,
  },
  summaryBox: {
    backgroundColor: "#F8F8F8",
    borderRadius: 12,
    padding: 16,
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#212529",
    marginLeft: 6,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
  },
  loadingText: {
    fontSize: 14,
    color: "#6C757D",
    marginLeft: 8,
  },
  sectionContent: {
    fontSize: 14,
    color: "#495057",
    lineHeight: 22,
  },
  grayBox: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: 16,
    marginBottom: 0,
  },
  grayBoxTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212529",
    marginBottom: 8,
  },
  grayBoxContent: {
    fontSize: 14,
    color: "#495057",
    lineHeight: 20,
  },
  contentSection: {
    marginTop: 25,
    paddingBottom: 20,
  },
  contentText: {
    fontSize: 14,
    color: "#495057",
    lineHeight: 22,
  },
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 60,
  },
  applyButton: {
    backgroundColor: "#000000",
    borderRadius: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 90,
    position: "relative",
    alignSelf: "center",
    maxWidth: 320,
  },
  applyButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  arrowContainer: {
    position: "absolute",
    right: 7,
    width: 40,
    height: 40,
    borderRadius: 50,
    backgroundColor: "#FF6600",
    alignItems: "center",
    justifyContent: "center",
  },
});

const markdownStyles = {
  body: {
    fontSize: 14,
    color: "#495057",
    lineHeight: 22,
    fontFamily: "System",
  },
  strong: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212529",
  },
  paragraph: {
    marginBottom: 8,
  },
};

export default PolicyDetailScreen;
