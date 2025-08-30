import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Animated,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Markdown from "react-native-markdown-display";
import ApiService from "../services/api";
import PolicyCardModal from "../components/PolicyCardModal";
import RobotIcon from "../components/icons/RobotIcon";

// 타이핑 애니메이션 컴포넌트
const TypingIndicator = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createAnimation = (dot, delay) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: -8,
            duration: 400,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 400,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.delay(600 - delay),
        ])
      );
    };

    const anim1 = createAnimation(dot1, 0);
    const anim2 = createAnimation(dot2, 200);
    const anim3 = createAnimation(dot3, 400);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, []);

  return (
    <View style={styles.typingIndicator}>
      <View style={styles.typingDots}>
        <Animated.View
          style={[
            styles.typingDot, 
            { transform: [{ translateY: dot1 }] }
          ]}
        />
        <Animated.View
          style={[
            styles.typingDot, 
            { transform: [{ translateY: dot2 }] }
          ]}
        />
        <Animated.View
          style={[
            styles.typingDot, 
            { transform: [{ translateY: dot3 }] }
          ]}
        />
      </View>
      <Text style={styles.typingText}>답변 생성 중</Text>
    </View>
  );
};

const PolicyChatbotScreen = ({ navigation, route }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [agentStatus, setAgentStatus] = useState([]); // 에이전트 상태 표시용
  const [currentAgent, setCurrentAgent] = useState(null); // 현재 작동중인 에이전트
  const [policyModalVisible, setPolicyModalVisible] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const flatListRef = useRef(null);

  // 사용자 정보 (route.params에서 가져오거나 기본값)
  const user = route?.params?.user || {
    id: 1,
    name: "사용자",
    age: 25,
    occupation: "student",
    region: "서울",
  };

  useEffect(() => {
    // 초기 인사 메시지
    const welcomeMessage = {
      id: `welcome_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 11)}`,
      text: `안녕하세요! 정책봇입니다. 😊\n\n맞춤형 주거 정책들을 찾아드립니다.`,
      examples: [
        "청년 전세자금 지원 정책 알려주세요",
        "월세 지원받을 수 있나요?",
        "주택구매 대출 지원 정책이 궁금해요"
      ],
      footer: "무엇을 도와드릴까요?",
      isBot: true,
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  }, []);

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    // 고유 ID 생성 (마이크로초 포함)
    const timestamp = Date.now();
    const userMessageId = `user_${timestamp}_${Math.random()
      .toString(36)
      .substring(2, 11)}`;
    const botMessageId = `bot_${timestamp}_${Math.random()
      .toString(36)
      .substring(2, 11)}`;

    const userMessage = {
      id: userMessageId,
      text: inputText.trim(),
      isBot: false,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);

    // 타이핑 메시지 즉시 추가
    const typingMessage = {
      id: `typing_${Date.now()}`,
      text: "",
      isBot: true,
      timestamp: new Date(),
      isTyping: true,
    };
    setMessages((prev) => [...prev, typingMessage]);

    try {
      // 사용자 컨텍스트 준비
      const userContext = {
        age: user.age,
        occupation: user.occupation,
        region: user.region,
        interests: ["주거", "창업", "취업"], // 기본 관심사
      };

      // 일반 채팅 요청 (스트리밍 제거)
      const response = await ApiService.chatWithPolicyBot({
        message: inputText.trim(),
        user_context: userContext,
        streaming: false,
      });

      // 타이핑 메시지 제거
      setMessages((prev) => prev.filter((msg) => !msg.isTyping));

      // 봇 응답 메시지 추가
      const botMessage = {
        id: botMessageId,
        text: response.answer || "응답을 받지 못했습니다.",
        isBot: true,
        timestamp: new Date(),
        isTyping: false,
      };

      setMessages((prev) => [...prev, botMessage]);
      scrollToBottom();
    } catch (error) {
      console.error("정책 챗봇 오류:", error);

      // 타이핑 메시지 제거하고 오류 메시지 추가
      const errorMessage = {
        id: `error_${Date.now()}_${Math.random()
          .toString(36)
          .substring(2, 11)}`,
        text: "죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        isBot: true,
        timestamp: new Date(),
        isError: true,
      };

      setMessages((prev) => {
        const filtered = prev.filter((msg) => !msg.isTyping);
        return [...filtered, errorMessage];
      });
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };

  // 마크다운 텍스트 정리 함수

  // 정책 참조 패턴 감지 및 답변 섹션 분할
  const parseAnswerWithPolicies = (text) => {
    // 안전성 검사
    if (!text || typeof text !== "string") {
      return [
        {
          type: "text",
          content: "답변을 처리할 수 없습니다.",
        },
      ];
    }

    // 텍스트를 그대로 사용
    const cleanedText = text;

    // 오직 꺾쇠 괄호만 인식 - 대폭 단순화
    const patterns = [
      { regex: /「([^」]+)」/g, type: "bracket" }
    ];

    const allMatches = [];

    // 모든 패턴에 대해 매칭 찾기
    patterns.forEach(({ regex, type }) => {
      let match;
      const tempRegex = new RegExp(regex.source, regex.flags);
      while ((match = tempRegex.exec(cleanedText)) !== null) {
        let title = match[1].trim();

        // 꺾쇠 괄호만 처리 - 검증 없이 바로 추가
        const isDuplicate = allMatches.some((existing) => existing.title === title);

        if (!isDuplicate) {
          allMatches.push({
            index: match.index,
            length: match[0].length,
            title: title,
            originalText: match[0],
            type: type,
          });
        }
      }
    });

    // 위치순으로 정렬
    allMatches.sort((a, b) => a.index - b.index);

    const sections = [];
    let lastIndex = 0;

    allMatches.forEach((match) => {
      // 정책 참조 전 텍스트
      if (match.index > lastIndex) {
        const beforeText = cleanedText.substring(lastIndex, match.index);
        if (beforeText.trim()) {
          sections.push({
            type: "text",
            content: beforeText,
          });
        }
      }

      // 정책 참조
      sections.push({
        type: "policy",
        title: match.title,
        originalText: match.originalText,
      });

      lastIndex = match.index + match.length;
    });

    // 마지막 정책 참조 후 텍스트
    if (lastIndex < cleanedText.length) {
      let afterText = cleanedText.substring(lastIndex);
      // 정책 카드 뒤의 잔여 ** 제거
      afterText = afterText.replace(/^\s*\*\*/, "").trim();
      if (afterText.trim()) {
        sections.push({
          type: "text",
          content: afterText,
        });
      }
    }

    // 정책 참조가 없으면 전체를 텍스트로 처리
    if (sections.length === 0) {
      sections.push({
        type: "text",
        content: cleanedText,
      });
    }

    return sections;
  };

  // 정책 캐시 (중복 API 호출 방지)
  const policyCache = useRef(new Map());

  // 인라인 정책 카드 컴포넌트
  const InlinePolicyCard = ({ policyTitle }) => {
    const [policy, setPolicy] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const loadPolicy = async () => {
        try {
          // 캐시 확인
          if (policyCache.current.has(policyTitle)) {
            const cachedPolicy = policyCache.current.get(policyTitle);
            setPolicy(cachedPolicy);
            setLoading(false);
            return;
          }

          const policyDetail = await ApiService.getPolicyByTitle(policyTitle);

          // 캐시에 저장
          policyCache.current.set(policyTitle, policyDetail);
          setPolicy(policyDetail);
        } catch (error) {
          console.error("정책 정보 로드 오류:", error);
          // 오류도 캐시해서 재시도 방지
          policyCache.current.set(policyTitle, null);
        } finally {
          setLoading(false);
        }
      };

      loadPolicy();
    }, [policyTitle]);

    const handleDetailPress = () => {
      if (policy) {
        navigation.navigate("PolicyDetail", { policy });
      }
    };

    if (loading) {
      return (
        <View style={styles.inlinePolicyCard}>
          <ActivityIndicator size="small" color="#10B585" />
          <Text style={styles.loadingText}>정책 정보 로딩 중...</Text>
        </View>
      );
    }

    if (!policy) {
      // 정책을 찾지 못하면 카드 대신 원래 텍스트 그대로 표시
      return (
        <Text
          style={[
            styles.messageText,
            styles.botText,
            { fontWeight: "600", color: "#1976D2" },
          ]}
        >
          「{policyTitle}」
        </Text>
      );
    }

    return (
      <View style={styles.inlinePolicyCard}>
        <View style={styles.policyCardContent}>
          <Text style={styles.policyTag}>#{policy.category || "정책"}</Text>
          <Text style={styles.policyTitle} numberOfLines={2}>
            {policy.title}
          </Text>
          <Text style={styles.policyOrganization} numberOfLines={1}>
            {policy.organization}
          </Text>
          <Text style={styles.policyDescription} numberOfLines={2}>
            {policy.content?.substring(0, 100) ||
              "정책 상세 내용을 확인하세요."}
            {policy.content?.length > 100 ? "..." : ""}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.policyDetailButton}
          onPress={handleDetailPress}
        >
          <Text style={styles.policyDetailButtonText}>자세히 보기</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // 정책 클릭 처리 (기존 방식 - 모달용, 현재는 사용하지 않음)
  const handlePolicyPress = async (policyTitle) => {
    try {
      const policyDetail = await ApiService.getPolicyByTitle(policyTitle);
      if (policyDetail) {
        setSelectedPolicy(policyDetail);
        setPolicyModalVisible(true);
      }
    } catch (error) {
      console.error("정책 정보 로드 오류:", error);
      Alert.alert("알림", "정책 정보를 불러올 수 없습니다.");
    }
  };

  // 정책 모달 닫기
  const handlePolicyModalClose = () => {
    setPolicyModalVisible(false);
    setSelectedPolicy(null);
  };

  // 정책 상세로 네비게이션
  const handleNavigateToDetail = () => {
    if (selectedPolicy) {
      navigation.navigate("PolicyDetail", { policy: selectedPolicy });
    }
  };

  // 봇 메시지 렌더링 (정책 참조 인식 포함)
  const renderBotMessage = (message) => {
    const text = message.text;

    // 안전성 검사 - 문자열이 아니면 기본 메시지
    if (typeof text !== "string") {
      console.warn(
        "Non-string text received in renderBotMessage:",
        typeof text,
        text
      );
      return (
        <Text style={[styles.messageText, styles.botText]}>
          답변을 표시할 수 없습니다.
        </Text>
      );
    }

    const sections = parseAnswerWithPolicies(text);

    return (
      <View>
        {sections.map((section, index) => {
          if (section.type === "text" && section.content && typeof section.content === "string") {
            return (
              <Markdown
                key={`text-${index}`}
                style={{
                  body: { ...styles.messageText, ...styles.botText },
                  paragraph: { ...styles.messageText, ...styles.botText, marginBottom: 6 },
                  strong: { ...styles.messageText, ...styles.botText, fontWeight: 'bold' },
                  em: { ...styles.messageText, ...styles.botText, fontStyle: 'italic' },
                  list_item: { ...styles.messageText, ...styles.botText, marginBottom: 4 },
                  bullet_list: { ...styles.messageText, ...styles.botText, marginBottom: 8 },
                  text: { ...styles.messageText, ...styles.botText },
                  heading1: { ...styles.messageText, ...styles.botText, fontSize: 18, fontWeight: 'bold', marginTop: 12, marginBottom: 8 },
                  heading2: { ...styles.messageText, ...styles.botText, fontSize: 16, fontWeight: 'bold', marginTop: 10, marginBottom: 6 },
                  heading3: { ...styles.messageText, ...styles.botText, fontSize: 15, fontWeight: 'bold', marginTop: 8, marginBottom: 4 },
                }}
              >
                {section.content}
              </Markdown>
            );
          } else if (section.type === "policy" && section.title && typeof section.title === "string") {
            return (
              <InlinePolicyCard
                key={`policy-${index}`}
                policyTitle={section.title}
              />
            );
          }
          return null;
        })}

        {/* 예시 질문들 렌더링 */}
        {message.examples && (
          <View style={styles.examplesContainer}>
            <Text style={styles.examplesTitle}>ex)</Text>
            <View style={styles.examplesBox}>
              {message.examples.map((example, index) => (
                <Text key={index} style={styles.exampleText}>• {example}</Text>
              ))}
            </View>
          </View>
        )}

        {/* 푸터 텍스트 */}
        {message.footer && (
          <Text style={[styles.messageText, styles.botText, styles.footerText]}>
            {message.footer}
          </Text>
        )}
      </View>
    );
  };

  const renderMessage = ({ item }) => (
    <View
      style={[
        styles.messageContainer,
        item.isBot ? styles.botMessageContainer : styles.userMessageContainer,
      ]}
    >
      <View
        style={[
          styles.messageBubble,
          item.isBot ? styles.botBubble : styles.userBubble,
          item.isError && styles.errorBubble,
        ]}
      >
        {item.isBot && (
          <View style={styles.botHeader}>
            <RobotIcon size={16} color="#10B585" />
            <Text style={styles.botName}>정책봇</Text>
          </View>
        )}

        {item.isTyping ? (
          <TypingIndicator />
        ) : item.isBot ? (
          renderBotMessage(item)
        ) : (
          <Text style={[styles.messageText, styles.userText]}>{item.text}</Text>
        )}

        <Text
          style={[
            styles.timestamp,
            item.isBot ? styles.botTimestamp : styles.userTimestamp,
          ]}
        >
          {item.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
    </View>
  );

  const renderSuggestedQuestions = () => {
    const suggestions = [
      "🏠 청년 전세자금 지원 정책 알려주세요",
      "💰 청년 월세 지원받을 수 있나요?",
      "🏦 주택구매 대출 지원 정책이 궁금해요",
      "💵 청년 생활비 지원 정책 있나요?",
    ];

    return (
      <View style={styles.suggestionsContainer}>
        <Text style={styles.suggestionsTitle}>이런 질문을 해보세요!</Text>
        {suggestions.map((suggestion, index) => (
          <TouchableOpacity
            key={index}
            style={styles.suggestionButton}
            onPress={() =>
              setInputText(suggestion.replace(/^[🏠💼🎓💰]\s/, ""))
            }
            disabled={isLoading}
          >
            <Text style={styles.suggestionText}>{suggestion}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>정책봇</Text>
          <Text style={styles.headerSubtitle}>청년 주거·금융 지원 정책 안내</Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            Alert.alert("대화 초기화", "모든 대화 내역을 삭제하시겠습니까?", [
              { text: "취소", style: "cancel" },
              {
                text: "초기화",
                onPress: () => {
                  setMessages([
                    {
                      id: Date.now(),
                      text: `안녕하세요! 정책 상담 챗봇입니다. 😊\n\n맞춤형 주거 정책들을 찾아드립니다.`,
                      examples: [
                        "청년 전세자금 지원 정책 알려주세요",
                        "월세 지원받을 수 있나요?",
                        "주택구매 대출 지원 정책이 궁금해요"
                      ],
                      footer: "무엇을 도와드릴까요?",
                      isBot: true,
                      timestamp: new Date(),
                    },
                  ]);
                },
              },
            ]);
          }}
          style={styles.clearButton}
        >
          <Ionicons name="refresh" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {/* 메시지 리스트 */}
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
          ListFooterComponent={() =>
            messages.length === 1 ? renderSuggestedQuestions() : null
          }
        />

        {/* 에이전트 상태 표시 */}
        {agentStatus.length > 0 && (
          <View style={styles.agentStatusContainer}>
            <Text style={styles.agentStatusTitle}>🤖 처리 진행 상황</Text>
            {agentStatus.map((status, index) => (
              <View
                key={`agent-${status.agent}-${index}`}
                style={styles.agentStatusItem}
              >
                <View style={styles.agentStatusIcon}>
                  {status.complete ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color="#4CAF50"
                    />
                  ) : status.warning ? (
                    <Ionicons name="warning" size={16} color="#FF9800" />
                  ) : currentAgent === status.agent ? (
                    <ActivityIndicator size="small" color="#007AFF" />
                  ) : (
                    <Ionicons name="ellipse-outline" size={16} color="#ccc" />
                  )}
                </View>
                <Text
                  style={[
                    styles.agentStatusText,
                    status.complete && styles.agentStatusComplete,
                    status.warning && styles.agentStatusWarning,
                    currentAgent === status.agent && styles.agentStatusActive,
                  ]}
                >
                  {status.message}
                </Text>
              </View>
            ))}
          </View>
        )}
      </KeyboardAvoidingView>

      {/* 플로팅 입력 영역 */}
      <View style={styles.floatingInputContainer}>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder="질문을 입력하세요"
          placeholderTextColor="#999"
          multiline
          maxLength={500}
          editable={!isLoading}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
          ]}
          onPress={sendMessage}
          disabled={!inputText.trim() || isLoading}
        >
          <Text style={[styles.sendButtonText, (isLoading || !inputText.trim()) && styles.sendButtonTextDisabled]}>보내기</Text>
          <View style={[styles.arrowIcon, (isLoading || !inputText.trim()) && styles.arrowIconDisabled]}>
            {isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="arrow-forward" size={16} color="white" />
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* 정책 카드 모달 */}
      <PolicyCardModal
        visible={policyModalVisible}
        policy={selectedPolicy}
        onClose={handlePolicyModalClose}
        onNavigateToDetail={handleNavigateToDetail}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 60,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  backButton: {
    padding: 8,
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  clearButton: {
    padding: 8,
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 16,
    paddingBottom: 100, // 플로팅 입력창을 위한 여백
  },
  messageContainer: {
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  botMessageContainer: {
    alignItems: "flex-start",
  },
  userMessageContainer: {
    alignItems: "flex-end",
  },
  messageBubble: {
    maxWidth: "80%",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  botBubble: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  userBubble: {
    backgroundColor: "#10B585",
  },
  errorBubble: {
    backgroundColor: "#ffe6e6",
    borderColor: "#ffcccc",
  },
  botHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  botName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#10B585",
    marginLeft: 6,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  botText: {
    color: "#333",
  },
  userText: {
    color: "#fff",
  },
  timestamp: {
    fontSize: 10,
    marginTop: 6,
  },
  botTimestamp: {
    color: "#999",
  },
  userTimestamp: {
    color: "#ffffff80",
  },
  typingIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  typingDots: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B585",
    marginHorizontal: 2,
  },
  typingText: {
    fontSize: 13,
    color: "#666",
    marginLeft: 8,
  },
  typingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  typingIndicatorText: {
    fontSize: 13,
    color: "#007AFF",
    marginLeft: 8,
  },
  suggestionsContainer: {
    padding: 16,
    marginTop: 16,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  suggestionButton: {
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e9ecef",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  suggestionText: {
    fontSize: 14,
    color: "#333",
  },
  floatingInputContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "transparent",
  },
  textInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: "#e9ecef",
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    fontSize: 15,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    textAlignVertical: "top",
  },
  sendButton: {
    height: 44,
    backgroundColor: "#000000",
    borderRadius: 22,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingRight: 6,
    marginLeft: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sendButtonDisabled: {
    backgroundColor: "#666666",
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    marginRight: 6,
  },
  arrowIcon: {
    width: 28,
    height: 28,
    backgroundColor: "#FC6339",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonTextDisabled: {
    opacity: 0.6,
  },
  arrowIconDisabled: {
    backgroundColor: "#999999",
  },
  examplesContainer: {
    marginTop: 12,
    marginBottom: 8,
  },
  examplesTitle: {
    fontSize: 14,
    color: "#333333",
    marginBottom: 8,
    fontWeight: "500",
  },
  examplesBox: {
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
  },
  exampleText: {
    fontSize: 14,
    color: "#666666",
    lineHeight: 22,
    marginBottom: 4,
  },
  footerText: {
    marginTop: 8,
  },
  agentStatusContainer: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  agentStatusTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  agentStatusItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  agentStatusIcon: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  agentStatusText: {
    fontSize: 13,
    color: "#666",
    flex: 1,
  },
  agentStatusComplete: {
    color: "#4CAF50",
  },
  agentStatusWarning: {
    color: "#FF9800",
  },
  agentStatusActive: {
    color: "#007AFF",
    fontWeight: "500",
  },
  policyReference: {
    backgroundColor: "#E3F2FD",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginHorizontal: 2,
  },
  policyReferenceText: {
    color: "#1976D2",
    fontSize: 15,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  // 인라인 정책 카드 스타일 (홈의 정책 뉴스 카드와 유사)
  inlinePolicyCard: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 12,
    marginHorizontal: 4,
  },
  policyCardContent: {
    flex: 1,
  },
  policyTag: {
    fontSize: 12,
    color: "#FF6600",
    marginBottom: 4,
    fontWeight: "600",
  },
  policyTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  policyOrganization: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  policyDescription: {
    fontSize: 12,
    color: "#666",
    lineHeight: 16,
  },
  policyDetailButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#f8f8f8",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  policyDetailButtonText: {
    fontSize: 12,
    color: "#333",
    fontWeight: "500",
  },
  loadingText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
  },
  errorText: {
    fontSize: 12,
    color: "#FF5722",
    textAlign: "center",
    fontStyle: "italic",
  },
});

export default PolicyChatbotScreen;
