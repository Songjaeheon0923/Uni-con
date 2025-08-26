import React from 'react';
import { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Markdown from 'react-native-markdown-display';
import ApiService from '../services/api';

const PolicyChatbotScreen = ({ navigation, route }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [agentStatus, setAgentStatus] = useState([]); // 에이전트 상태 표시용
  const [currentAgent, setCurrentAgent] = useState(null); // 현재 작동중인 에이전트
  const flatListRef = useRef(null);

  // 사용자 정보 (route.params에서 가져오거나 기본값)
  const user = route?.params?.user || {
    id: 1,
    name: '사용자',
    age: 25,
    occupation: 'student',
    region: '서울'
  };

  useEffect(() => {
    // 초기 인사 메시지
    const welcomeMessage = {
      id: `welcome_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      text: `안녕하세요! 정책 상담 챗봇입니다. 😊\n\n청년을 위한 다양한 정책들을 찾아드립니다.\n예를 들어:\n• "전세자금 지원 정책 알려주세요"\n• "창업 지원 받을 수 있나요?"\n• "주거 지원 정책이 궁금해요"\n\n무엇을 도와드릴까요?`,
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
    const userMessageId = `user_${timestamp}_${Math.random().toString(36).substring(2, 11)}`;
    const botMessageId = `bot_${timestamp}_${Math.random().toString(36).substring(2, 11)}`;

    const userMessage = {
      id: userMessageId,
      text: inputText.trim(),
      isBot: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      // 사용자 컨텍스트 준비
      const userContext = {
        age: user.age,
        occupation: user.occupation,
        region: user.region,
        interests: ['주거', '창업', '취업'], // 기본 관심사
      };

      // 멀티 에이전트 스트리밍 채팅 요청
      const response = await ApiService.chatWithPolicyBot({
        message: inputText.trim(),
        user_context: userContext,
        streaming: true
      });

      // 스트리밍 응답 처리
      let botResponse = '';
      let botMessageAdded = false; // 메시지 추가 여부 추적
      const currentBotMessage = {
        id: botMessageId,
        text: '',
        isBot: true,
        timestamp: new Date(),
        isTyping: false,
      };

      // 에이전트 상태 초기화
      setAgentStatus([]);
      setIsTyping(false);

      // 스트리밍 응답을 실시간으로 처리
      for await (const chunk of response) {
        if (chunk.trim()) {
          try {
            // JSON 파싱 시도
            const data = JSON.parse(chunk);

            if (data.type === 'status') {
              console.log('Status received:', data); // 디버깅용

              // 에이전트 상태 업데이트 - 강제 즉시 렌더링
              setAgentStatus(prev => {
                console.log('Updating agent status:', prev, '->', data); // 디버깅용
                const newStatus = [...prev];
                const existingIndex = newStatus.findIndex(s => s.agent === data.agent);

                if (existingIndex >= 0) {
                  newStatus[existingIndex] = data;
                } else {
                  newStatus.push(data);
                }

                return newStatus;
              });

              if (!data.complete) {
                setCurrentAgent(data.agent);
              } else {
                setCurrentAgent(null);
              }

            } else if (data.type === 'content') {
              // 실제 답변 컨텐츠
              if (!botMessageAdded) {
                // 첫 컨텐츠가 도착하면 메시지 추가
                setMessages(prev => [...prev, currentBotMessage]);
                botMessageAdded = true;
              }

              botResponse += data.message;
              setMessages(prev =>
                prev.map(msg =>
                  msg.id === botMessageId
                    ? { ...msg, text: botResponse }
                    : msg
                )
              );
              scrollToBottom();

            } else if (data.type === 'error') {
              // 에러 메시지
              console.error('에이전트 오류:', data.message);
            }

          } catch (e) {
            // JSON이 아닌 경우 일반 텍스트로 처리 (하위 호환성)
            console.warn('Non-JSON chunk received:', chunk);
            botResponse += chunk;

            if (!botMessageAdded) {
              setMessages(prev => [...prev, currentBotMessage]);
              botMessageAdded = true;
            }

            setMessages(prev =>
              prev.map(msg =>
                msg.id === botMessageId
                  ? { ...msg, text: botResponse }
                  : msg
              )
            );
            scrollToBottom();
          }
        }
      }

      // 에이전트 상태 클리어 (3초 후)
      setTimeout(() => {
        setAgentStatus([]);
        setCurrentAgent(null);
      }, 3000);

    } catch (error) {
      console.error('정책 챗봇 오류:', error);

      // 오류 시 폴백 메시지
      const errorMessage = {
        id: `error_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        text: '죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        isBot: true,
        timestamp: new Date(),
        isError: true,
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
      scrollToBottom();
    }
  };

  const renderMessage = ({ item }) => (
    <View style={[
      styles.messageContainer,
      item.isBot ? styles.botMessageContainer : styles.userMessageContainer
    ]}>
      <View style={[
        styles.messageBubble,
        item.isBot ? styles.botBubble : styles.userBubble,
        item.isError && styles.errorBubble
      ]}>
        {item.isBot && (
          <View style={styles.botHeader}>
            <Ionicons name="information-circle" size={16} color="#10B585" />
            <Text style={styles.botName}>정책 상담봇</Text>
          </View>
        )}

        {item.isTyping ? (
          <View style={styles.typingIndicator}>
            <ActivityIndicator size="small" color="#666" />
            <Text style={styles.typingText}>답변을 생성하고 있습니다...</Text>
          </View>
        ) : item.isBot ? (
          <Markdown
            style={{
              body: { ...styles.messageText, ...styles.botText },
              heading1: { fontSize: 18, fontWeight: 'bold', color: '#333', marginVertical: 8 },
              heading2: { fontSize: 16, fontWeight: 'bold', color: '#333', marginVertical: 6 },
              heading3: { fontSize: 15, fontWeight: '600', color: '#333', marginVertical: 4 },
              paragraph: { fontSize: 15, lineHeight: 20, color: '#333', marginVertical: 2 },
              strong: { fontWeight: 'bold' },
              em: { fontStyle: 'italic' },
              list_item: { fontSize: 15, color: '#333', marginVertical: 2 },
              bullet_list: { marginVertical: 4 },
              ordered_list: { marginVertical: 4 },
              code_inline: {
                backgroundColor: '#f0f0f0',
                paddingHorizontal: 4,
                paddingVertical: 2,
                borderRadius: 4,
                fontSize: 14,
                fontFamily: 'monospace'
              },
              code_block: {
                backgroundColor: '#f5f5f5',
                padding: 12,
                borderRadius: 8,
                fontSize: 14,
                fontFamily: 'monospace',
                marginVertical: 8
              },
              blockquote: {
                backgroundColor: '#f8f9fa',
                borderLeftWidth: 4,
                borderLeftColor: '#007AFF',
                paddingLeft: 12,
                paddingVertical: 8,
                marginVertical: 8
              },
              link: { color: '#007AFF', textDecorationLine: 'underline' }
            }}
            rules={{
              list_item: (node, children, _parent, styles) => {
                // 텍스트 전체를 문자열로 합치기
                let textContent = '';
                React.Children.forEach(children, child => {
                  if (typeof child === 'string') {
                    textContent += child;
                  } else if (child && typeof child === 'object' && child.props && child.props.children) {
                    textContent += child.props.children;
                  }
                });

                console.log('List item text content:', JSON.stringify(textContent)); // 디버깅용

                // 체크박스 패턴 감지 및 렌더링 (- [ ] 또는 - [x] 패턴)
                if (textContent.trim().startsWith('[ ]') || textContent.trim().startsWith('[x]') || textContent.trim().startsWith('[X]')) {
                  const isChecked = textContent.trim().startsWith('[x]') || textContent.trim().startsWith('[X]');
                  const cleanText = textContent.trim().replace(/^\[[\sxX]\]\s*/, '');

                  console.log('Checkbox detected:', { isChecked, cleanText }); // 디버깅용

                  return (
                    <View key={node.key} style={{
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      marginVertical: 4,
                      paddingLeft: 0
                    }}>
                      <Ionicons
                        name={isChecked ? "checkbox" : "square-outline"}
                        size={18}
                        color={isChecked ? "#4CAF50" : "#666"}
                        style={{ marginRight: 8, marginTop: 1 }}
                      />
                      <Text style={{
                        fontSize: 15,
                        color: '#333',
                        flex: 1,
                        lineHeight: 20
                      }}>
                        {cleanText}
                      </Text>
                    </View>
                  );
                }

                // 일반 리스트 아이템
                return (
                  <View key={node.key} style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    marginVertical: 2,
                    paddingLeft: 0
                  }}>
                    <Text style={{ fontSize: 15, color: '#333', marginRight: 8 }}>•</Text>
                    <Text style={{ fontSize: 15, color: '#333', flex: 1, lineHeight: 20 }}>
                      {textContent}
                    </Text>
                  </View>
                );
              },
              table: (node, children, _parent, _styles) => {
                return (
                  <View key={node.key} style={{
                    marginVertical: 12,
                    borderWidth: 1,
                    borderColor: '#ddd',
                    borderRadius: 8,
                    backgroundColor: '#fff',
                    overflow: 'hidden'
                  }}>
                    {children}
                  </View>
                );
              },
              thead: (node, children, _parent, _styles) => {
                return (
                  <View key={node.key} style={{
                    backgroundColor: '#f8f9fa',
                    borderBottomWidth: 2,
                    borderBottomColor: '#ddd'
                  }}>
                    {children}
                  </View>
                );
              },
              tbody: (node, children, _parent, _styles) => {
                return (
                  <View key={node.key}>
                    {children}
                  </View>
                );
              },
              tr: (node, children, _parent, _styles) => {
                return (
                  <View key={node.key} style={{
                    flexDirection: 'row',
                    borderBottomWidth: 1,
                    borderBottomColor: '#eee'
                  }}>
                    {children}
                  </View>
                );
              },
              th: (node, children, _parent, _styles) => {
                return (
                  <View key={node.key} style={{
                    flex: 1,
                    paddingVertical: 8,
                    paddingHorizontal: 6,
                    borderRightWidth: 1,
                    borderRightColor: '#ddd',
                    backgroundColor: '#f8f9fa',
                    justifyContent: 'center'
                  }}>
                    <Text style={{
                      fontSize: 12,
                      fontWeight: 'bold',
                      color: '#333',
                      textAlign: 'center'
                    }}>
                      {children}
                    </Text>
                  </View>
                );
              },
              td: (node, children, _parent, _styles) => {
                return (
                  <View key={node.key} style={{
                    flex: 1,
                    paddingVertical: 8,
                    paddingHorizontal: 6,
                    borderRightWidth: 1,
                    borderRightColor: '#eee',
                    justifyContent: 'center'
                  }}>
                    <Text style={{
                      fontSize: 11,
                      color: '#333',
                      textAlign: 'center',
                      lineHeight: 14
                    }}>
                      {children}
                    </Text>
                  </View>
                );
              }
            }}
          >
            {item.text}
          </Markdown>
        ) : (
          <Text style={[
            styles.messageText,
            styles.userText
          ]}>
            {item.text}
          </Text>
        )}

        <Text style={[
          styles.timestamp,
          item.isBot ? styles.botTimestamp : styles.userTimestamp
        ]}>
          {item.timestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
      </View>
    </View>
  );

  const renderSuggestedQuestions = () => {
    const suggestions = [
      '🏠 전세자금 지원 정책 알려주세요',
      '💼 창업 지원받을 수 있나요?',
      '🎓 청년 취업 지원 정책이 궁금해요',
      '💰 생활비 지원 정책 있나요?',
    ];

    return (
      <View style={styles.suggestionsContainer}>
        <Text style={styles.suggestionsTitle}>이런 질문을 해보세요!</Text>
        {suggestions.map((suggestion, index) => (
          <TouchableOpacity
            key={index}
            style={styles.suggestionButton}
            onPress={() => setInputText(suggestion.replace(/^[🏠💼🎓💰]\s/, ''))}
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
          <Text style={styles.headerTitle}>정책 상담봇</Text>
          <Text style={styles.headerSubtitle}>청년을 위한 맞춤 정책 안내</Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            Alert.alert(
              '대화 초기화',
              '모든 대화 내역을 삭제하시겠습니까?',
              [
                { text: '취소', style: 'cancel' },
                {
                  text: '초기화',
                  onPress: () => {
                    setMessages([{
                      id: Date.now(),
                      text: `안녕하세요! 정책 상담 챗봇입니다. 😊\n\n무엇을 도와드릴까요?`,
                      isBot: true,
                      timestamp: new Date(),
                    }]);
                  }
                }
              ]
            );
          }}
          style={styles.clearButton}
        >
          <Ionicons name="refresh" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      {/* 메시지 리스트 */}
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
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
          ListFooterComponent={() => (
            messages.length === 1 ? renderSuggestedQuestions() : null
          )}
        />

        {/* 에이전트 상태 표시 */}
        {agentStatus.length > 0 && (
          <View style={styles.agentStatusContainer}>
            <Text style={styles.agentStatusTitle}>🤖 처리 진행 상황</Text>
            {agentStatus.map((status, index) => (
              <View key={`agent-${status.agent}-${index}`} style={styles.agentStatusItem}>
                <View style={styles.agentStatusIcon}>
                  {status.complete ? (
                    <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                  ) : status.warning ? (
                    <Ionicons name="warning" size={16} color="#FF9800" />
                  ) : currentAgent === status.agent ? (
                    <ActivityIndicator size="small" color="#007AFF" />
                  ) : (
                    <Ionicons name="ellipse-outline" size={16} color="#ccc" />
                  )}
                </View>
                <Text style={[
                  styles.agentStatusText,
                  status.complete && styles.agentStatusComplete,
                  status.warning && styles.agentStatusWarning,
                  currentAgent === status.agent && styles.agentStatusActive
                ]}>
                  {status.message}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* 입력 영역 */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder="정책에 대해 궁금한 것을 물어보세요..."
            placeholderTextColor="#999"
            multiline
            maxLength={500}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || isLoading) && styles.sendButtonDisabled
            ]}
            onPress={sendMessage}
            disabled={!inputText.trim() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
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
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
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
  },
  messageContainer: {
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  botMessageContainer: {
    alignItems: 'flex-start',
  },
  userMessageContainer: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  botBubble: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  userBubble: {
    backgroundColor: '#10B585',
  },
  errorBubble: {
    backgroundColor: '#ffe6e6',
    borderColor: '#ffcccc',
  },
  botHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  botName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B585',
    marginLeft: 6,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  botText: {
    color: '#333',
  },
  userText: {
    color: '#fff',
  },
  timestamp: {
    fontSize: 10,
    marginTop: 6,
  },
  botTimestamp: {
    color: '#999',
  },
  userTimestamp: {
    color: '#ffffff80',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 8,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  typingIndicatorText: {
    fontSize: 13,
    color: '#007AFF',
    marginLeft: 8,
  },
  suggestionsContainer: {
    padding: 16,
    marginTop: 16,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  suggestionButton: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    shadowColor: '#000',
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
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 100,
    fontSize: 15,
    backgroundColor: '#f8f9fa',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  agentStatusContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  agentStatusTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  agentStatusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  agentStatusIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  agentStatusText: {
    fontSize: 13,
    color: '#666',
    flex: 1,
  },
  agentStatusComplete: {
    color: '#4CAF50',
  },
  agentStatusWarning: {
    color: '#FF9800',
  },
  agentStatusActive: {
    color: '#007AFF',
    fontWeight: '500',
  },
});

export default PolicyChatbotScreen;
