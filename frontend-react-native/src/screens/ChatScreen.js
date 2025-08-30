import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  ScrollView,
  Keyboard,
  Image,
  Dimensions,
  Animated,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path } from "react-native-svg";
import ApiService from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { generateSubTags, isProfileComplete } from "../utils/personalityUtils";
import {
  formatPrice as utilFormatPrice,
  formatArea as utilFormatArea,
  getRoomType as utilGetRoomType,
  formatFloor as utilFormatFloor,
} from "../utils/priceUtils";
import RoomMessageCard from "../components/RoomMessageCard";
import RoommateRoomCard from "../components/RoommateRoomCard";
import UserProfileMessageCard from "../components/UserProfileMessageCard";
import CompatibilityMessageCard from "../components/CompatibilityMessageCard";
import PhoneIcon from "../components/icons/PhoneIcon";

// Alarm Icon SVG Component (확장 시에만 사용)
const AlarmIcon = ({ size = 26, color = "#000000" }) => {
  return (
    <Svg width={size} height={25} viewBox="0 0 26 25" fill="none">
      <Path
        d="M6.75 13.625C6.75 10.1731 9.54813 7.375 13 7.375C16.4519 7.375 19.25 10.1731 19.25 13.625V23.625H6.75V13.625Z"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <Path
        d="M13.0002 1.125V3M20.4327 3.83L19.227 5.26625M24.387 10.6794L22.5402 11.005M1.61328 10.6794L3.46016 11.005M5.56828 3.83L6.77328 5.26625M1.75016 23.625H24.8752"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
import PersonIcon from "../components/icons/PersonIcon";
import VotingIcon from "../components/icons/VotingIcon";
import ClipboardIcon from "../components/icons/ClipboardIcon";
import HomeIcon from "../components/icons/HomeIcon";
import SendIcon from "../components/icons/SendIcon";
import PlusIcon from "../components/icons/PlusIcon";
import QuickActions from "../components/QuickActions";
import FavoriteButton from "../components/FavoriteButton";

const { width } = Dimensions.get("window");

// 매물 이미지 선택 함수
const getRoomImage = (roomId) => {
  const imageIndex = parseInt(roomId?.toString().slice(-1) || "0") % 8;
  const roomImages = [
    "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop",
    "https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop",
    "https://images.pexels.com/photos/2029722/pexels-photo-2029722.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop",
    "https://images.pexels.com/photos/1571453/pexels-photo-1571453.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop",
    "https://images.pexels.com/photos/2079249/pexels-photo-2079249.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop",
    "https://images.pexels.com/photos/2121121/pexels-photo-2121121.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop",
    "https://images.pexels.com/photos/1454804/pexels-photo-1454804.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop",
    "https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop",
  ];
  return roomImages[imageIndex];
};

// 가장 가까운 역 정보 (RoomMessageCard와 동일한 로직)
const getNearestStation = (address) => {
  if (!address) return "안암역 10분 거리";
  if (address.includes("성수동")) return "성수역 5분 거리";
  if (address.includes("안암동")) return "안암역 7분 거리";
  if (address.includes("종로")) return "종로3가역 8분 거리";
  if (address.includes("성북")) return "성신여대입구역 10분 거리";
  if (address.includes("동대문")) return "동대문역 6분 거리";
  return "안암역 10분 거리";
};

// 주소 포맷팅 함수
const formatAddress = (address) => {
  if (!address) return "";
  const parts = address.split(" ");
  const filteredParts = parts.filter((part) => {
    if (
      part.includes("특별시") ||
      part.includes("광역시") ||
      part.includes("도") ||
      part.endsWith("시") ||
      part.endsWith("구")
    ) {
      return false;
    }
    return true;
  });
  return filteredParts.slice(0, 2).join(" ");
};

const formatMaintenanceCost = (area) => {
  if (!area) return "7만";
  const cost = Math.round(area * 1000);
  const manWon = Math.round(cost / 10000);
  return `${manWon}만`;
};

export default function ChatScreen({ navigation, route }) {
  const { roomId, chatRoomId, otherUser } = route.params;
  const actualRoomId = roomId || chatRoomId;
  const { user: currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [otherUserProfile, setOtherUserProfile] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(280);
  const [showPropertySelector, setShowPropertySelector] = useState(false);
  const [selectedProperties, setSelectedProperties] = useState([]);
  const [favoriteRooms, setFavoriteRooms] = useState([]);
  const [currentPropertyType, setCurrentPropertyType] = useState("favorites"); // 'favorites' or 'common'
  const [showRulesGuide, setShowRulesGuide] = useState(false);
  const [showVotingModal, setShowVotingModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [votingQuestion, setVotingQuestion] = useState("");
  const [votingOptions, setVotingOptions] = useState(["", ""]);
  const [disputeGuideTitle, setDisputeGuideTitle] = useState("");
  const [disputeGuideContent, setDisputeGuideContent] = useState("");
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState("");
  const expandAnimation = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null);
  const pollIntervalRef = useRef(null);

  useEffect(() => {
    loadMessages();
    loadOtherUserProfile();
    loadUserFavorites(); // 찜 목록 로드 추가

    // 실시간 메시지 폴링 시작
    startPolling();

    // 키보드 이벤트 리스너
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      (event) => {
        setKeyboardHeight(event.endCoordinates.height);
        setShowQuickActions(false);
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        // 키보드가 사라져도 QuickActions는 자동으로 표시하지 않음
      }
    );

    return () => {
      // 컴포넌트 언마운트 시 폴링 정리
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }

      // 키보드 리스너 정리
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, [actualRoomId]);

  // 유저 이름 초기화
  useEffect(() => {
    if (otherUser?.name) {
      setDisplayName(otherUser.name);
    } else {
      setDisplayName("반짝이는스케이트");
    }
  }, [otherUser]);

  // 이전 메시지 길이를 추적
  const [previousMessageCount, setPreviousMessageCount] = useState(0);

  // 초기 로드시와 새 메시지가 있을 때 스크롤
  useEffect(() => {
    if (messages.length > 0 && !loading) {
      // 항상 맨 아래로 스크롤 (애니메이션은 초기 로드시에만 사용하지 않음)
      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToEnd({ animated: previousMessageCount > 0 });
        }
      }, 100);
    }
    setPreviousMessageCount(messages.length);
  }, [messages.length, loading]);

  const handleFavoriteToggle = async (roomId) => {
    try {
      const isFavorited = favorites.includes(roomId);
      if (isFavorited) {
        setFavorites((prev) => prev.filter((id) => id !== roomId));
        // 찜 해제 시 개수 -1
        setMessages((prevMessages) =>
          prevMessages.map((msg) => {
            if (msg.messageType === "room_share") {
              try {
                const roomData = JSON.parse(msg.text);
                if (roomData.room_id === roomId) {
                  const updatedRoomData = {
                    ...roomData,
                    favorite_count: Math.max(
                      0,
                      (roomData.favorite_count || 0) - 1
                    ),
                  };
                  return {
                    ...msg,
                    text: JSON.stringify(updatedRoomData),
                  };
                }
              } catch (e) {
                console.error("JSON parse error:", e);
              }
            }
            return msg;
          })
        );
      } else {
        setFavorites((prev) => [...prev, roomId]);
        // 찜 추가 시 개수 +1
        setMessages((prevMessages) =>
          prevMessages.map((msg) => {
            if (msg.messageType === "room_share") {
              try {
                const roomData = JSON.parse(msg.text);
                if (roomData.room_id === roomId) {
                  const updatedRoomData = {
                    ...roomData,
                    favorite_count: (roomData.favorite_count || 0) + 1,
                  };
                  return {
                    ...msg,
                    text: JSON.stringify(updatedRoomData),
                  };
                }
              } catch (e) {
                console.error("JSON parse error:", e);
              }
            }
            return msg;
          })
        );
      }
    } catch (error) {
      console.error("찜 토글 실패:", error);
    }
  };

  const loadMessages = async () => {
    try {
      const response = await ApiService.getChatMessages(actualRoomId);
      if (response && response.messages) {
        const formattedMessages = response.messages.map((msg) => {
          // 메시지 prefix 확인
          const isRoomShare = msg.content?.startsWith("ROOM_SHARE:");
          const isRoomCard = msg.content?.startsWith("ROOM_CARD:");
          const isUserProfile = msg.content?.startsWith("USER_PROFILE:");
          const isCompatibilityMessage = msg.content?.startsWith("COMPATIBILITY_MESSAGE:");
          const isHouseRules = msg.content?.startsWith("HOUSE_RULES:");
          const isVoting = msg.content?.startsWith("VOTING:");
          const isDisputeGuide = msg.content?.startsWith("DISPUTE_GUIDE:");

          let messageType = msg.message_type || "text";
          let content = msg.content;

          if (isRoomShare) {
            messageType = "room_share";
            content = msg.content.substring(11); // ROOM_SHARE: 제거
          } else if (isRoomCard) {
            messageType = "room_card";
            content = msg.content.substring(10); // ROOM_CARD: 제거
          } else if (isUserProfile) {
            messageType = "user_profile";
            content = msg.content.substring(13); // USER_PROFILE: 제거
          } else if (isCompatibilityMessage) {
            messageType = "compatibility_message";
            content = msg.content.substring(22); // COMPATIBILITY_MESSAGE: 제거
          } else if (isHouseRules) {
            messageType = "house_rules";
            content = msg.content.substring(12); // HOUSE_RULES: 제거
          } else if (isVoting) {
            messageType = "voting";
            content = msg.content.substring(7); // VOTING: 제거
          } else if (isDisputeGuide) {
            messageType = "dispute_guide";
            content = msg.content.substring(14); // DISPUTE_GUIDE: 제거
          }

          const message = {
            id: msg.id.toString(),
            text: content,
            messageId: msg.id,
            sender: msg.sender_id === currentUser.id ? "me" : "other",
            timestamp: new Date(msg.created_at),
            senderName: msg.sender_name,
            unreadCount: msg.unread_count || 0, // 읽지 않은 사용자 수
            sent: msg.sent || false,
            delivered: msg.delivered || false,
            read: msg.read || false,
            status: msg.status || "pending",
            messageType: messageType, // 메시지 타입 추가
          };

          // 메시지 로딩 디버깅
          console.log("Loading message:", {
            id: message.id,
            type: message.messageType,
            sender: message.sender,
            originalContent: msg.content?.substring(0, 50) + "...",
            timestamp: msg.created_at,
          });

          return message;
        });

        // 메시지를 ID 순서로 정렬 (오래된 것부터)
        const sortedMessages = formattedMessages.sort(
          (a, b) => parseInt(a.id) - parseInt(b.id)
        );
        setMessages(sortedMessages);

        // 메시지 읽음 처리
        await ApiService.markMessagesAsRead(actualRoomId);
      }
    } catch (error) {
      console.error("메시지 로드 실패:", error);
    } finally {
      setLoading(false);
      // 초기 로드시에만 스크롤 (메시지가 처음 로드될 때)
      if (previousMessageCount === 0) {
        setTimeout(() => {
          if (flatListRef.current) {
            flatListRef.current.scrollToEnd({ animated: false });
          }
        }, 50);
      }
    }
  };

  const loadMessagesWithoutMarkingAsRead = async () => {
    try {
      // peek API를 사용하여 읽음 처리 없이 메시지 로드
      const response = await ApiService.peekChatMessages(actualRoomId);
      if (response && response.messages) {
        const formattedMessages = response.messages.map((msg) => {
          // 메시지 prefix 확인
          const isRoomShare = msg.content?.startsWith("ROOM_SHARE:");
          const isRoomCard = msg.content?.startsWith("ROOM_CARD:");
          const isUserProfile = msg.content?.startsWith("USER_PROFILE:");
          const isCompatibilityMessage = msg.content?.startsWith("COMPATIBILITY_MESSAGE:");
          const isHouseRules = msg.content?.startsWith("HOUSE_RULES:");
          const isVoting = msg.content?.startsWith("VOTING:");
          const isDisputeGuide = msg.content?.startsWith("DISPUTE_GUIDE:");

          let messageType = msg.message_type || "text";
          let content = msg.content;

          if (isRoomShare) {
            messageType = "room_share";
            content = msg.content.substring(11); // ROOM_SHARE: 제거
          } else if (isRoomCard) {
            messageType = "room_card";
            content = msg.content.substring(10); // ROOM_CARD: 제거
          } else if (isUserProfile) {
            messageType = "user_profile";
            content = msg.content.substring(13); // USER_PROFILE: 제거
          } else if (isCompatibilityMessage) {
            messageType = "compatibility_message";
            content = msg.content.substring(22); // COMPATIBILITY_MESSAGE: 제거
          } else if (isHouseRules) {
            messageType = "house_rules";
            content = msg.content.substring(12); // HOUSE_RULES: 제거
          } else if (isVoting) {
            messageType = "voting";
            content = msg.content.substring(7); // VOTING: 제거
          } else if (isDisputeGuide) {
            messageType = "dispute_guide";
            content = msg.content.substring(14); // DISPUTE_GUIDE: 제거
          }

          const message = {
            id: msg.id.toString(),
            text: content,
            messageId: msg.id,
            sender: msg.sender_id === currentUser.id ? "me" : "other",
            timestamp: new Date(msg.created_at),
            senderName: msg.sender_name,
            unreadCount: msg.unread_count || 0, // 읽지 않은 사용자 수
            sent: msg.sent || false,
            delivered: msg.delivered || false,
            read: msg.read || false,
            status: msg.status || "pending",
            messageType: messageType, // 메시지 타입 추가
          };

          // 메시지 로딩 디버깅
          console.log("Loading message:", {
            id: message.id,
            type: message.messageType,
            sender: message.sender,
            originalContent: msg.content?.substring(0, 50) + "...",
            timestamp: msg.created_at,
          });

          return message;
        });

        // 메시지를 ID 순서로 정렬 (오래된 것부터)
        const sortedMessages = formattedMessages.sort(
          (a, b) => parseInt(a.id) - parseInt(b.id)
        );
        setMessages(sortedMessages);

        // 읽음 처리하지 않음 - 내가 보낸 메시지의 읽음 상태 확인용
      }
    } catch (error) {
      console.error("메시지 로드 실패:", error);
    } finally {
      // loadMessagesWithoutMarkingAsRead에서는 스크롤하지 않음 (읽음 처리 없이 상태 확인용)
    }
  };

  const loadOtherUserProfile = async () => {
    try {
      // 채팅방 정보를 가져와서 상대방 정보 추출
      const response = await ApiService.getChatRooms();
      if (response && response.rooms) {
        const currentRoom = response.rooms.find(
          (room) => room.id.toString() === actualRoomId.toString()
        );
        if (currentRoom && currentRoom.participants) {
          const otherUserData = currentRoom.participants.find(
            (p) => p.id !== currentUser.id
          );
          if (otherUserData) {
            // UserProfileScreen과 동일하게 전체 프로필 데이터 로드
            try {
              const fullUserProfile = await ApiService.getUserById(otherUserData.id || otherUserData.user_id);
              if (fullUserProfile) {
                setOtherUserProfile(fullUserProfile);
              } else {
                // 전체 프로필 로드 실패 시 기본 참가자 데이터 사용
                setOtherUserProfile(otherUserData);
              }
            } catch (profileError) {
              console.error("전체 프로필 로드 실패, 기본 데이터 사용:", profileError);
              setOtherUserProfile(otherUserData);
            }
          }
        }
      }
    } catch (error) {
      console.error("상대방 프로필 로드 실패:", error);
    }
  };

  // 사용자의 찜 목록 로드 (하트 상태 표시용)
  const loadUserFavorites = async () => {
    try {
      const userFavorites = await ApiService.getUserFavorites(
        String(currentUser.id)
      );
      const favoriteRoomIds = userFavorites.map((item) => item.room_id);
      setFavorites(favoriteRoomIds);
    } catch (error) {
      console.error("찜 목록 로드 실패:", error);
      setFavorites([]);
    }
  };

  // AsyncStorage에서 읽지 않은 메시지 수 관리
  const updateUnreadCount = async (roomId, increment = true) => {
    try {
      const storedUnreadData = await AsyncStorage.getItem("unreadMessages");
      const unreadData = storedUnreadData ? JSON.parse(storedUnreadData) : {};

      if (increment) {
        unreadData[roomId] = (unreadData[roomId] || 0) + 1;
      } else {
        unreadData[roomId] = 0;
      }

      await AsyncStorage.setItem("unreadMessages", JSON.stringify(unreadData));
    } catch (error) {
      console.error("Error updating unread count:", error);
    }
  };

  const clearUnreadCount = async () => {
    try {
      await updateUnreadCount(actualRoomId, false);
    } catch (error) {
      console.error("Error clearing unread count:", error);
    }
  };

  const startPolling = () => {
    // 3초마다 새 메시지 확인 (읽음 처리 없이)
    pollIntervalRef.current = setInterval(
      loadMessagesWithoutMarkingAsRead,
      3000
    );
  };

  const getOtherUserInfo = (otherUserData) => {
    if (!otherUserData) return "";

    const parts = [];

    // 나이 정보 (age 또는 birth_year로부터 계산)
    if (otherUserData.age) {
      const ageGroup = otherUserData.age < 25 ? "20대 초반" : "20대 중반";
      parts.push(ageGroup);
    } else if (otherUserData.birth_year) {
      const currentYear = new Date().getFullYear();
      const age = currentYear - otherUserData.birth_year;
      const ageGroup = age < 25 ? "20대 초반" : "20대 중반";
      parts.push(ageGroup);
    }

    // 성별 정보
    if (otherUserData.gender) {
      parts.push(otherUserData.gender === "male" ? "남성" : "여성");
    }

    // 학교 정보
    if (otherUserData.school) {
      parts.push(otherUserData.school);
    } else if (otherUserData.university) {
      parts.push(otherUserData.university);
    }

    return parts.join(", ");
  };

  const getOtherUserTags = (otherUserData) => {
    if (!otherUserData) return [];

    const profile = otherUserData.profile || otherUserData;

    // UserProfileScreen과 동일한 로직 사용
    if (!profile || !isProfileComplete(profile)) {
      return []; // 프로필이 완성되지 않았으면 빈 배열 반환
    }

    // UserProfileScreen의 generateSubTags 함수와 동일한 로직 사용
    return generateSubTags(profile);
  };

  // 하우스 룰 카드 보내기 기능
  const handleSendHouseRules = async () => {
    try {
      const houseRuleMessage = `HOUSE_RULES:${JSON.stringify({
        smoking: "흡연 여부: 실내 금연",
        cleaning: "청소 주기: 주 2회 (화, 토)",
        guests: "손님 초대: 사전 협의 필요",
        noise: "소음 기준: 밤 10시 이후 조용히",
        timestamp: new Date().toISOString()
      })}`;

      await ApiService.sendMessage(actualRoomId, houseRuleMessage);
      setShowRulesGuide(false);
      setShowQuickActions(false);
      loadMessages(); // 메시지 새로고침
    } catch (error) {
      console.error("하우스 룰 전송 실패:", error);
      Alert.alert("오류", "하우스 룰 카드 전송에 실패했습니다.");
    }
  };

  // 투표/합의 기능
  const handleStartVoting = () => {
    setShowVotingModal(true);
    setShowRulesGuide(false);
  };

  const createVoting = async () => {
    try {
      if (!votingQuestion.trim()) {
        Alert.alert("오류", "투표 제목을 입력해주세요.");
        return;
      }

      const validOptions = votingOptions.filter(option => option.trim());
      if (validOptions.length < 2) {
        Alert.alert("오류", "선택지를 최소 2개 이상 입력해주세요.");
        return;
      }

      const votingData = {
        question: votingQuestion.trim(),
        options: validOptions.map((text, index) => ({
          id: `option_${index}`,
          text: text.trim(),
          votes: []
        })),
        creator: currentUser.id,
        status: "active",
        timestamp: new Date().toISOString()
      };

      const votingMessage = `VOTING:${JSON.stringify(votingData)}`;
      await ApiService.sendMessage(actualRoomId, votingMessage);

      // 모달 닫기 및 초기화
      setShowVotingModal(false);
      setVotingQuestion("");
      setVotingOptions(["", ""]);
      setShowQuickActions(false);
      loadMessages(); // 메시지 새로고침
    } catch (error) {
      console.error("투표 메시지 전송 실패:", error);
      Alert.alert("오류", "투표를 생성할 수 없습니다.");
    }
  };

  // 분쟁 해결 가이드 팝업
  const handleShowDisputeGuide = () => {
    setShowDisputeModal(true);
    setShowRulesGuide(false);
  };

  const createDisputeGuide = async () => {
    try {
      if (!disputeGuideTitle.trim()) {
        Alert.alert("오류", "가이드 제목을 입력해주세요.");
        return;
      }

      if (!disputeGuideContent.trim()) {
        Alert.alert("오류", "가이드 내용을 입력해주세요.");
        return;
      }

      const guideData = {
        title: disputeGuideTitle.trim(),
        content: disputeGuideContent.trim(),
        creator: currentUser.id,
        timestamp: new Date().toISOString()
      };

      const guideMessage = `DISPUTE_GUIDE:${JSON.stringify(guideData)}`;
      await ApiService.sendMessage(actualRoomId, guideMessage);

      // 모달 닫기 및 초기화
      setShowDisputeModal(false);
      setDisputeGuideTitle("");
      setDisputeGuideContent("");
      setShowQuickActions(false);
      loadMessages(); // 메시지 새로고침
    } catch (error) {
      console.error("가이드 전송 실패:", error);
      Alert.alert("오류", "가이드 전송에 실패했습니다.");
    }
  };

  // 투표 옵션 관리 함수들
  const addVotingOption = () => {
    if (votingOptions.length < 6) {
      setVotingOptions([...votingOptions, ""]);
    }
  };

  const removeVotingOption = (index) => {
    if (votingOptions.length > 2) {
      const newOptions = votingOptions.filter((_, i) => i !== index);
      setVotingOptions(newOptions);
    }
  };

  const updateVotingOption = (index, value) => {
    const newOptions = [...votingOptions];
    newOptions[index] = value;
    setVotingOptions(newOptions);
  };

  // 투표하기 함수
  const handleVote = async (messageId, optionId) => {
    try {
      // 메시지에서 현재 투표 데이터 찾기
      const messageIndex = messages.findIndex(msg => msg.messageId === messageId);
      if (messageIndex === -1) return;

      const message = messages[messageIndex];
      if (message.messageType !== 'voting') return;

      const votingData = JSON.parse(message.text);

      // 이미 투표했는지 확인
      const hasVoted = votingData.options.some(option =>
        option.votes.includes(currentUser.id)
      );

      let updatedOptions;
      if (hasVoted) {
        // 이미 투표한 경우 - 투표 변경
        updatedOptions = votingData.options.map(option => ({
          ...option,
          votes: option.id === optionId
            ? [...option.votes.filter(userId => userId !== currentUser.id), currentUser.id]
            : option.votes.filter(userId => userId !== currentUser.id)
        }));
      } else {
        // 처음 투표하는 경우
        updatedOptions = votingData.options.map(option => ({
          ...option,
          votes: option.id === optionId
            ? [...option.votes, currentUser.id]
            : option.votes
        }));
      }

      // 업데이트된 투표 데이터
      const updatedVotingData = {
        ...votingData,
        options: updatedOptions
      };

      // 로컬 메시지 업데이트
      const updatedMessages = [...messages];
      updatedMessages[messageIndex] = {
        ...message,
        text: JSON.stringify(updatedVotingData)
      };
      setMessages(updatedMessages);

      // 서버에 투표 업데이트 API 호출 (새 메시지가 아닌 업데이트)
      // 실제 구현에서는 투표 업데이트 전용 API를 사용해야 합니다
      // 예: await ApiService.updateVote(messageId, optionId, currentUser.id);

    } catch (error) {
      console.error("투표 실패:", error);
      Alert.alert("오류", "투표에 실패했습니다.");
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    // 한국 시간으로 변환
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
  };

  const sendMessage = async () => {
    if (inputText.trim()) {
      const messageText = inputText.trim();

      try {
        // 입력창 먼저 비우기 (UX 개선)
        setInputText("");

        // 서버에 메시지 전송
        await ApiService.sendMessage(actualRoomId, messageText);

        // 메시지 전송 후 바로 새로고침하여 화면에 반영 (읽음 처리 없이)
        await loadMessagesWithoutMarkingAsRead();

        // 메시지 전송 후 맨 아래로 스크롤
        setTimeout(() => {
          if (flatListRef.current) {
            flatListRef.current.scrollToEnd({ animated: true });
          }
        }, 200);
      } catch (error) {
        console.error("메시지 전송 실패:", error);
        Alert.alert("알림", "메시지 전송에 실패했습니다. 다시 시도해주세요.");
        // 실패 시 입력창에 텍스트 복원
        setInputText(messageText);
      }
    }
  };

  // 관심매물 목록 로딩
  const loadFavoriteRooms = async () => {
    try {
      const favorites = await ApiService.getUserFavorites(
        String(currentUser.id)
      );

      // API 응답 구조에 맞게 데이터 변환 (FavoriteRoomsScreen과 동일)
      const formattedFavorites = favorites.map((item) => ({
        id: item.room_id,
        room_id: item.room_id,
        price_deposit: item.price_deposit,
        price_monthly: item.price_monthly || 0,
        transaction_type: item.transaction_type,
        area: item.area,
        floor: item.floor,
        rooms: item.rooms,
        address: item.address,
        favorite_count: item.favorite_count || 0,
        verified: true,
      }));

      setFavoriteRooms(formattedFavorites);
    } catch (error) {
      console.error("관심매물 로딩 실패:", error);
      Alert.alert("오류", "관심매물을 불러오는데 실패했습니다.");
    }
  };

  // 공통 관심매물 목록 로딩 (클라이언트에서 교집합 계산)
  const loadCommonFavoriteRooms = async () => {
    try {
      if (!otherUserProfile || !otherUserProfile.id) {
        Alert.alert("오류", "상대방 정보를 불러올 수 없습니다.");
        return;
      }

      // 내 찜 목록과 상대방 찜 목록을 각각 가져오기
      const [myFavorites, otherFavorites] = await Promise.all([
        ApiService.getUserFavorites(String(currentUser.id)),
        ApiService.getUserFavorites(String(otherUserProfile.id)),
      ]);

      // 두 응답이 모두 유효한지 확인
      if (
        !myFavorites ||
        !Array.isArray(myFavorites) ||
        !otherFavorites ||
        !Array.isArray(otherFavorites)
      ) {
        console.log(
          "찜 목록 로딩 실패 - myFavorites:",
          myFavorites,
          "otherFavorites:",
          otherFavorites
        );
        setFavoriteRooms([]);
        Alert.alert("오류", "찜 목록을 불러올 수 없습니다.");
        return;
      }

      // 상대방의 찜한 room_id 목록 생성
      const otherFavoriteRoomIds = new Set(
        otherFavorites.map((item) => item.room_id)
      );

      // 내 찜 목록에서 상대방도 찜한 매물만 필터링 (교집합)
      const commonFavorites = myFavorites.filter((item) =>
        otherFavoriteRoomIds.has(item.room_id)
      );

      if (commonFavorites.length === 0) {
        console.log("공통 관심매물이 없습니다");
        setFavoriteRooms([]);
        Alert.alert("알림", "공통 관심매물이 없습니다.");
        return;
      }

      // API 응답 구조에 맞게 데이터 변환
      const formattedCommonFavorites = commonFavorites.map((item) => ({
        id: item.room_id,
        room_id: item.room_id,
        price_deposit: item.price_deposit,
        price_monthly: item.price_monthly || 0,
        transaction_type: item.transaction_type,
        area: item.area,
        floor: item.floor,
        rooms: item.rooms,
        address: item.address,
        favorite_count: item.favorite_count || 0,
        verified: true,
      }));

      console.log(`공통 관심매물 ${formattedCommonFavorites.length}개 발견`);
      setFavoriteRooms(formattedCommonFavorites);
    } catch (error) {
      console.error("공통 관심매물 로딩 실패:", error);
      setFavoriteRooms([]);
      Alert.alert("오류", "공통 관심매물을 불러오는데 실패했습니다.");
    }
  };

  // 매물 선택/해제
  const togglePropertySelection = (roomId) => {
    setSelectedProperties((prev) => {
      const isSelected = prev.includes(roomId);
      if (isSelected) {
        return prev.filter((id) => id !== roomId);
      } else {
        return [...prev, roomId];
      }
    });
  };

  // 선택한 매물 전송
  const sendSelectedProperties = async () => {
    if (selectedProperties.length === 0) return;

    try {
      const selectedRooms = favoriteRooms.filter((room) =>
        selectedProperties.includes(room.room_id)
      );

      for (const room of selectedRooms) {
        // ApiService.shareRoom과 동일한 방식으로 매물 공유
        const response = await ApiService.shareRoom(actualRoomId, room);

        if (response) {
          console.log("매물 전송 성공:", response);
        }
      }

      // 전송 후 상태 초기화 및 메시지 새로고침
      setSelectedProperties([]);
      setShowPropertySelector(false);
      setShowQuickActions(false);
      setCurrentPropertyType("favorites"); // 상태 초기화

      // 메시지 전송 후 바로 새로고침하여 화면에 반영
      await loadMessagesWithoutMarkingAsRead();
    } catch (error) {
      console.error("매물 전송 실패:", error);
      Alert.alert("오류", "매물을 전송하는데 실패했습니다.");
    }
  };

  const handleQuickAction = (actionId) => {
    switch (actionId) {
      case "favorites":
        setCurrentPropertyType("favorites");
        setShowPropertySelector(true);
        setShowQuickActions(false);
        loadFavoriteRooms();
        break;
      case "common_interests":
        setCurrentPropertyType("common");
        setShowPropertySelector(true);
        setShowQuickActions(false);
        loadCommonFavoriteRooms();
        break;
      case "rules":
        setShowQuickActions(false);
        setShowRulesGuide(true);
        break;
      case "payment":
        Alert.alert("알림", "정산/결제 기능 준비 중입니다.");
        // QuickActions를 닫지 않음
        break;
      default:
        setShowQuickActions(false);
        break;
    }
  };

  const renderMessage = ({ item, index }) => {
    const isMe = item.sender === "me";
    const isBot = item.isBot || item.sender === "bot";
    const nextItem = messages[index + 1];
    const prevItem = messages[index - 1];

    // 같은 발신자의 연속 메시지인지 확인
    const isConsecutive = prevItem && prevItem.sender === item.sender;
    const isLastInGroup = !nextItem || nextItem.sender !== item.sender;

    // 발신자가 바뀌는 경우 더 큰 여백 적용
    const senderChanged = prevItem && prevItem.sender !== item.sender;

    // 룸메이트 제안: 텍스트 메시지 다음에 ROOM_CARD가 오는지 확인
    const isTextWithRoomCard =
      item.messageType === "text" &&
      nextItem &&
      nextItem.messageType === "room_card" &&
      nextItem.sender === item.sender;

    // ROOM_CARD가 바로 앞 텍스트 메시지와 함께 표시되어야 하는지 확인
    const isRoomCardWithText =
      item.messageType === "room_card" &&
      prevItem &&
      prevItem.messageType === "text" &&
      prevItem.sender === item.sender;

    // 디버깅용 로그
    if (item.messageType === "text" || item.messageType === "room_card") {
      console.log(`Message ${index}:`, {
        type: item.messageType,
        sender: item.sender,
        isTextWithRoomCard,
        isRoomCardWithText,
        nextItemType: nextItem?.messageType,
        prevItemType: prevItem?.messageType,
      });
    }

    // 텍스트+ROOM_CARD 조합인 경우 ROOM_CARD는 별도 렌더링하지 않음
    if (isRoomCardWithText) {
      return null;
    }

    // 프로필을 보여줄지 결정 (다른 사람의 메시지이고, 그룹의 첫 번째 메시지)
    const showProfile = !isMe && !isConsecutive;

    if (isMe) {
      // 내가 보낸 메시지
      return (
        <View style={[styles.messageContainer, senderChanged && styles.messageContainerWithSpacing]}>
          <View style={styles.myMessageRow}>
            {item.messageType === "room_share" ? (
              <View style={styles.myRoomShareRow}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-end",
                    width: "100%",
                    justifyContent: "flex-end",
                  }}
                >
                  {/* 시간과 읽음 상태 표시 */}
                  <View
                    style={{
                      marginRight: 8,
                      alignSelf: "flex-end",
                      marginBottom: 4,
                      flex: 0,
                    }}
                  >
                    {item.unreadCount > 0 && (
                      <Text style={styles.readStatus}>{item.unreadCount}</Text>
                    )}
                    <Text style={styles.myTimestamp}>
                      {formatTime(item.timestamp)}
                    </Text>
                  </View>

                  <View style={{ flex: 0, flexShrink: 1 }}>
                    {(() => {
                      try {
                        const roomData = JSON.parse(item.text);
                        return (
                          <RoomMessageCard
                            roomData={roomData}
                            onPress={() => {
                              navigation.navigate("RoomDetail", {
                                roomId: roomData.room_id,
                              });
                            }}
                            isFavorited={favorites.includes(roomData.room_id)}
                            onFavoriteToggle={() =>
                              handleFavoriteToggle(roomData.room_id)
                            }
                            maxWidth={410}
                          />
                        );
                      } catch (error) {
                        console.error(
                          "Failed to parse room share data:",
                          error
                        );
                        console.log("Raw text data:", item.text);
                        return (
                          <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>
                              매물 정보를 불러올 수 없습니다
                            </Text>
                          </View>
                        );
                      }
                    })()}
                  </View>
                </View>
              </View>
            ) : item.messageType === "room_card" ? (
              <View style={styles.myRoomShareRow}>
                <View style={{ alignSelf: "flex-end" }}>
                  <View style={styles.roomShareContainer}>
                    {(() => {
                      try {
                        const roomData = JSON.parse(item.text);
                        return <RoommateRoomCard roomData={roomData} />;
                      } catch (error) {
                        console.error("Failed to parse room card data:", error);
                        console.log("Raw text data:", item.text);
                        return (
                          <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>
                              매물 정보를 불러올 수 없습니다
                            </Text>
                          </View>
                        );
                      }
                    })()}
                  </View>

                  {/* 시간과 읽음 상태 표시 */}
                  {isLastInGroup && (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "flex-end",
                        marginTop: 4,
                      }}
                    >
                      {item.unreadCount > 0 && (
                        <Text style={styles.readStatus}>
                          {item.unreadCount}
                        </Text>
                      )}
                      <Text style={styles.myTimestamp}>
                        {formatTime(item.timestamp)}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ) : item.messageType === "user_profile" ? (
              <View style={styles.myRoomShareRow}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-end",
                    width: "100%",
                    justifyContent: "flex-end",
                  }}
                >
                  {/* 시간과 읽음 상태 표시 */}
                  <View
                    style={{
                      marginRight: 8,
                      alignSelf: "flex-end",
                      marginBottom: 4,
                      flex: 0,
                    }}
                  >
                    {item.unreadCount > 0 && (
                      <Text style={styles.readStatus}>{item.unreadCount}</Text>
                    )}
                    <Text style={styles.myTimestamp}>
                      {formatTime(item.timestamp)}
                    </Text>
                  </View>

                  <View style={{ flex: 0, flexShrink: 1 }}>
                    {(() => {
                      try {
                        const userData = JSON.parse(item.text);
                        return (
                          <UserProfileMessageCard
                            userData={userData}
                            alignment="right"
                            isMyMessage={true}
                          />
                        );
                      } catch (error) {
                        console.error(
                          "Failed to parse user profile data:",
                          error
                        );
                        console.log("Raw text data:", item.text);
                        return (
                          <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>
                              프로필 정보를 불러올 수 없습니다
                            </Text>
                          </View>
                        );
                      }
                    })()}
                  </View>
                </View>
              </View>
            ) : item.messageType === "compatibility_message" ? (
              <View style={styles.myRoomShareRow}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-end",
                    width: "100%",
                    justifyContent: "flex-end",
                  }}
                >
                  {/* 시간과 읽음 상태 표시 */}
                  <View
                    style={{
                      marginRight: 8,
                      alignSelf: "flex-end",
                      marginBottom: 4,
                      flex: 0,
                    }}
                  >
                    {item.unreadCount > 0 && (
                      <Text style={styles.readStatus}>{item.unreadCount}</Text>
                    )}
                    <Text style={styles.myTimestamp}>
                      {formatTime(item.timestamp)}
                    </Text>
                  </View>

                  <View style={{ flex: 0, flexShrink: 1 }}>
                    {(() => {
                      try {
                        const compatibilityData = JSON.parse(item.text);
                        return (
                          <CompatibilityMessageCard
                            compatibilityScore={compatibilityData.compatibility_score}
                            message={compatibilityData.message}
                            maxWidth={280}
                          />
                        );
                      } catch (error) {
                        console.error(
                          "Failed to parse compatibility message data:",
                          error
                        );
                        console.log("Raw text data:", item.text);
                        return (
                          <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>
                              궁합 정보를 불러올 수 없습니다
                            </Text>
                          </View>
                        );
                      }
                    })()}
                  </View>
                </View>
              </View>
            ) : item.messageType === "house_rules" ? (
              <View style={styles.myRoomShareRow}>
                <View style={{ alignSelf: "flex-end" }}>
                  <View style={styles.houseRulesContainer}>
                    {(() => {
                      try {
                        const rulesData = JSON.parse(item.text);
                        return (
                          <View style={styles.houseRulesContent}>
                            <View style={styles.houseRulesHeader}>
                              <HomeIcon size={16} color="#333333" />
                              <Text style={styles.houseRulesTitle}>하우스 룰</Text>
                            </View>
                            <Text style={styles.houseRulesItem}>• {rulesData.smoking}</Text>
                            <Text style={styles.houseRulesItem}>• {rulesData.cleaning}</Text>
                            <Text style={styles.houseRulesItem}>• {rulesData.guests}</Text>
                            <Text style={styles.houseRulesItem}>• {rulesData.noise}</Text>
                          </View>
                        );
                      } catch (error) {
                        return (
                          <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>하우스 룰을 불러올 수 없습니다</Text>
                          </View>
                        );
                      }
                    })()}
                  </View>
                </View>
              </View>
            ) : item.messageType === "voting" ? (
              <View style={styles.myRoomShareRow}>
                <View style={{ alignSelf: "flex-end" }}>
                  <View style={styles.votingContainer}>
                    {(() => {
                      try {
                        const votingData = JSON.parse(item.text);
                        return (
                          <View style={styles.votingContent}>
                            <View style={styles.votingHeader}>
                              <VotingIcon size={16} color="#333333" />
                              <Text style={styles.votingTitle}>투표</Text>
                            </View>
                            <Text style={styles.votingQuestion}>{votingData.question}</Text>
                            {votingData.options.map((option) => {
                              const hasUserVoted = option.votes.includes(currentUser.id);
                              return (
                                <TouchableOpacity
                                  key={option.id}
                                  style={[
                                    styles.votingOption,
                                    hasUserVoted && styles.votingOptionSelected
                                  ]}
                                  onPress={() => handleVote(item.messageId, option.id)}
                                >
                                  <Text style={[
                                    styles.votingOptionText,
                                    hasUserVoted && styles.votingOptionTextSelected
                                  ]}>
                                    {option.text} ({option.votes.length}표)
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        );
                      } catch (error) {
                        return (
                          <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>투표를 불러올 수 없습니다</Text>
                          </View>
                        );
                      }
                    })()}
                  </View>
                </View>
              </View>
            ) : item.messageType === "dispute_guide" ? (
              <View style={styles.myRoomShareRow}>
                <View style={{ alignSelf: "flex-end" }}>
                  <View style={styles.disputeGuideContainer}>
                    {(() => {
                      try {
                        const guideData = JSON.parse(item.text);
                        return (
                          <View style={styles.disputeGuideContent}>
                            <View style={styles.disputeGuideHeader}>
                              <ClipboardIcon size={16} color="#333333" />
                              <Text style={styles.disputeGuideTitle}>{guideData.title}</Text>
                            </View>
                            <Text style={styles.disputeGuideContentText}>{guideData.content}</Text>
                          </View>
                        );
                      } catch (error) {
                        return (
                          <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>가이드를 불러올 수 없습니다</Text>
                          </View>
                        );
                      }
                    })()}
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.myMessageBubbleRow}>
                <View style={styles.myMessageInfo}>
                  {item.unreadCount > 0 && (
                    <Text style={styles.readStatus}>{item.unreadCount}</Text>
                  )}
                  <Text style={styles.myTimestamp}>
                    {formatTime(item.timestamp)}
                  </Text>
                </View>

                {/* 텍스트+ROOM_CARD 조합인 경우 */}
                {isTextWithRoomCard ? (
                  <View
                    style={[
                      styles.messageBubble,
                      styles.myBubble,
                      {
                        padding: 0,
                        paddingLeft: 8,
                        paddingRight: 0,
                        backgroundColor: "#ffffff",
                        borderWidth: 1,
                        borderColor: "#e0e0e0",
                        maxWidth: 340,
                        minWidth: 290,
                      },
                    ]}
                  >
                    {/* 텍스트 부분 */}
                    <View
                      style={{
                        paddingHorizontal: 2,
                        paddingVertical: 4,
                        paddingBottom: 8,
                      }}
                    >
                      <Text style={[styles.messageText, { color: "#000000" }]}>
                        {item.text}
                      </Text>
                    </View>

                    {/* 매물 카드 부분 */}
                    <View
                      style={{
                        paddingLeft: 1,
                        paddingRight: 0,
                        paddingBottom: 0,
                      }}
                    >
                      {(() => {
                        try {
                          const roomData = JSON.parse(nextItem.text);
                          return <RoommateRoomCard roomData={roomData} />;
                        } catch (error) {
                          console.error(
                            "Failed to parse room card data:",
                            error
                          );
                          return (
                            <View style={styles.errorContainer}>
                              <Text style={styles.errorText}>
                                매물 정보를 불러올 수 없습니다
                              </Text>
                            </View>
                          );
                        }
                      })()}
                    </View>
                  </View>
                ) : (
                  <View style={[styles.messageBubble, styles.myBubble]}>
                    <Text style={[styles.messageText, styles.myText]}>
                      {item.text}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      );
    } else {
      // 상대방이 보낸 메시지
      return (
        <View style={[styles.messageContainer, senderChanged && styles.messageContainerWithSpacing]}>
          <View style={styles.otherMessageRow}>
            {/* 왼쪽 프로필 영역 */}
            <View style={styles.avatarContainer}>
              {showProfile ? (
                isBot ? (
                  <View style={[styles.avatar, styles.botAvatar]}>
                    <Text style={styles.botInitial}>K</Text>
                  </View>
                ) : (
                  <View
                    style={[
                      styles.avatar,
                      {
                        backgroundColor: "#F8F8F8",
                        borderWidth: 1,
                        borderColor: "#E5E5E5",
                      },
                    ]}
                  >
                    <PersonIcon size={24} color="#000000" />
                  </View>
                )
              ) : (
                <View style={styles.avatarSpacer} />
              )}
            </View>

            <View style={styles.messageContent}>
              {/* 발신자 이름 (첫 번째 메시지에만 표시) */}
              {!isConsecutive && (
                <View style={styles.senderNameRow}>
                  <Text style={styles.senderName}>
                    {item.senderName || (isBot ? "수리봇" : "알 수 없음")}
                  </Text>
                </View>
              )}

              {/* 메시지 버블과 시간 */}
              <View style={styles.otherMessageBubbleRow}>
                {item.messageType === "room_share" ? (
                  <View style={{ flexDirection: "row", alignItems: "flex-end", width: "100%" }}>
                    <View style={{ flex: 0, flexShrink: 1 }}>
                      {(() => {
                        try {
                          const roomData = JSON.parse(item.text);
                          return (
                            <RoomMessageCard
                              roomData={roomData}
                              onPress={() => {
                                navigation.navigate("RoomDetail", {
                                  roomId: roomData.room_id,
                                });
                              }}
                              isFavorited={favorites.includes(roomData.room_id)}
                              onFavoriteToggle={() =>
                                handleFavoriteToggle(roomData.room_id)
                              }
                              maxWidth={410}
                            />
                          );
                        } catch (error) {
                          console.error(
                            "Failed to parse room share data:",
                            error
                          );
                          console.log("Raw text data:", item.text);
                          return (
                            <View style={styles.errorContainer}>
                              <Text style={styles.errorText}>
                                매물 정보를 불러올 수 없습니다
                              </Text>
                            </View>
                          );
                        }
                      })()}
                    </View>

                    {/* 시간 표시 */}
                    <View style={{ marginLeft: 8, alignSelf: "flex-end", marginBottom: 4, flex: 0 }}>
                      <Text style={styles.otherTimestamp}>
                        {formatTime(item.timestamp)}
                      </Text>
                    </View>
                  </View>
                ) : item.messageType === "room_card" ? (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "flex-end",
                      width: "100%",
                    }}
                  >
                    <View style={{ flex: 0, flexShrink: 1 }}>
                      {(() => {
                        try {
                          const roomData = JSON.parse(item.text);
                          return <RoommateRoomCard roomData={roomData} />;
                        } catch (error) {
                          console.error(
                            "Failed to parse room card data:",
                            error
                          );
                          console.log("Raw text data:", item.text);
                          return (
                            <View style={styles.errorContainer}>
                              <Text style={styles.errorText}>
                                매물 정보를 불러올 수 없습니다
                              </Text>
                            </View>
                          );
                        }
                      })()}
                    </View>

                    {/* 시간 표시 */}
                    <View
                      style={{
                        marginLeft: 8,
                        alignSelf: "flex-end",
                        marginBottom: 4,
                        flex: 0,
                      }}
                    >
                      <Text style={styles.otherTimestamp}>
                        {formatTime(item.timestamp)}
                      </Text>
                    </View>
                  </View>
                ) : item.messageType === "user_profile" ? (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "flex-end",
                      width: "100%",
                    }}
                  >
                    <View style={{ flex: 0, flexShrink: 1 }}>
                      {(() => {
                        try {
                          const userData = JSON.parse(item.text);
                          return (
                            <UserProfileMessageCard
                              userData={userData}
                              alignment="left"
                              isMyMessage={false}
                            />
                          );
                        } catch (error) {
                          console.error(
                            "Failed to parse user profile data:",
                            error
                          );
                          console.log("Raw text data:", item.text);
                          return (
                            <View style={styles.errorContainer}>
                              <Text style={styles.errorText}>
                                프로필 정보를 불러올 수 없습니다
                              </Text>
                            </View>
                          );
                        }
                      })()}
                    </View>

                    {/* 시간 표시 */}
                    <View
                      style={{
                        marginLeft: 8,
                        alignSelf: "flex-end",
                        marginBottom: 4,
                        flex: 0,
                      }}
                    >
                      <Text style={styles.otherTimestamp}>
                        {formatTime(item.timestamp)}
                      </Text>
                    </View>
                  </View>
                ) : item.messageType === "compatibility_message" ? (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "flex-end",
                      width: "100%",
                    }}
                  >
                    <View style={{ flex: 0, flexShrink: 1 }}>
                      {(() => {
                        try {
                          const compatibilityData = JSON.parse(item.text);
                          return (
                            <CompatibilityMessageCard
                              compatibilityScore={compatibilityData.compatibility_score}
                              message={compatibilityData.message}
                              maxWidth={280}
                            />
                          );
                        } catch (error) {
                          console.error(
                            "Failed to parse compatibility message data:",
                            error
                          );
                          console.log("Raw text data:", item.text);
                          return (
                            <View style={styles.errorContainer}>
                              <Text style={styles.errorText}>
                                궁합 정보를 불러올 수 없습니다
                              </Text>
                            </View>
                          );
                        }
                      })()}
                    </View>

                    {/* 시간 표시 */}
                    <View
                      style={{
                        marginLeft: 8,
                        alignSelf: "flex-end",
                        marginBottom: 4,
                        flex: 0,
                      }}
                    >
                      <Text style={styles.otherTimestamp}>
                        {formatTime(item.timestamp)}
                      </Text>
                    </View>
                  </View>
                ) : item.messageType === "house_rules" ? (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "flex-end",
                      width: "100%",
                    }}
                  >
                    <View style={{ flex: 0, flexShrink: 1 }}>
                      <View style={styles.houseRulesContainer}>
                        {(() => {
                          try {
                            const rulesData = JSON.parse(item.text);
                            return (
                              <View style={styles.houseRulesContent}>
                                <View style={styles.houseRulesHeader}>
                              <HomeIcon size={16} color="#333333" />
                              <Text style={styles.houseRulesTitle}>하우스 룰</Text>
                            </View>
                                <Text style={styles.houseRulesItem}>• {rulesData.smoking}</Text>
                                <Text style={styles.houseRulesItem}>• {rulesData.cleaning}</Text>
                                <Text style={styles.houseRulesItem}>• {rulesData.guests}</Text>
                                <Text style={styles.houseRulesItem}>• {rulesData.noise}</Text>
                              </View>
                            );
                          } catch (error) {
                            return (
                              <View style={styles.errorContainer}>
                                <Text style={styles.errorText}>하우스 룰을 불러올 수 없습니다</Text>
                              </View>
                            );
                          }
                        })()}
                      </View>
                    </View>

                    {/* 시간 표시 */}
                    <View
                      style={{
                        marginLeft: 8,
                        alignSelf: "flex-end",
                        marginBottom: 4,
                        flex: 0,
                      }}
                    >
                      <Text style={styles.otherTimestamp}>
                        {formatTime(item.timestamp)}
                      </Text>
                    </View>
                  </View>
                ) : item.messageType === "voting" ? (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "flex-end",
                      width: "100%",
                    }}
                  >
                    <View style={{ flex: 0, flexShrink: 1 }}>
                      <View style={styles.votingContainer}>
                        {(() => {
                          try {
                            const votingData = JSON.parse(item.text);
                            return (
                              <View style={styles.votingContent}>
                                <View style={styles.votingHeader}>
                              <VotingIcon size={16} color="#333333" />
                              <Text style={styles.votingTitle}>투표</Text>
                            </View>
                                <Text style={styles.votingQuestion}>{votingData.question}</Text>
                                {votingData.options.map((option) => {
                                  const hasUserVoted = option.votes.includes(currentUser.id);
                                  return (
                                    <TouchableOpacity
                                      key={option.id}
                                      style={[
                                        styles.votingOption,
                                        hasUserVoted && styles.votingOptionSelected
                                      ]}
                                      onPress={() => handleVote(item.messageId, option.id)}
                                    >
                                      <Text style={[
                                        styles.votingOptionText,
                                        hasUserVoted && styles.votingOptionTextSelected
                                      ]}>
                                        {option.text} ({option.votes.length}표)
                                      </Text>
                                    </TouchableOpacity>
                                  );
                                })}
                              </View>
                            );
                          } catch (error) {
                            return (
                              <View style={styles.errorContainer}>
                                <Text style={styles.errorText}>투표를 불러올 수 없습니다</Text>
                              </View>
                            );
                          }
                        })()}
                      </View>
                    </View>

                    {/* 시간 표시 */}
                    <View
                      style={{
                        marginLeft: 8,
                        alignSelf: "flex-end",
                        marginBottom: 4,
                        flex: 0,
                      }}
                    >
                      <Text style={styles.otherTimestamp}>
                        {formatTime(item.timestamp)}
                      </Text>
                    </View>
                  </View>
                ) : item.messageType === "dispute_guide" ? (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "flex-end",
                      width: "100%",
                    }}
                  >
                    <View style={{ flex: 0, flexShrink: 1 }}>
                      <View style={styles.disputeGuideContainer}>
                        {(() => {
                          try {
                            const guideData = JSON.parse(item.text);
                            return (
                              <View style={styles.disputeGuideContent}>
                                <View style={styles.disputeGuideHeader}>
                              <ClipboardIcon size={16} color="#333333" />
                              <Text style={styles.disputeGuideTitle}>{guideData.title}</Text>
                            </View>
                                <Text style={styles.disputeGuideContentText}>{guideData.content}</Text>
                              </View>
                            );
                          } catch (error) {
                            return (
                              <View style={styles.errorContainer}>
                                <Text style={styles.errorText}>가이드를 불러올 수 없습니다</Text>
                              </View>
                            );
                          }
                        })()}
                      </View>
                    </View>

                    {/* 시간 표시 */}
                    <View
                      style={{
                        marginLeft: 8,
                        alignSelf: "flex-end",
                        marginBottom: 4,
                        flex: 0,
                      }}
                    >
                      <Text style={styles.otherTimestamp}>
                        {formatTime(item.timestamp)}
                      </Text>
                    </View>
                  </View>
                ) : isTextWithRoomCard ? (
                  <View
                    style={[
                      styles.messageBubble,
                      styles.otherBubble,
                      {
                        padding: 0,
                        paddingLeft: 8,
                        paddingRight: 0,
                        backgroundColor: "#ffffff",
                        borderWidth: 1,
                        borderColor: "#e0e0e0",
                        maxWidth: 340,
                        minWidth: 290,
                      },
                    ]}
                  >
                    {/* 텍스트 부분 */}
                    <View
                      style={{
                        paddingHorizontal: 2,
                        paddingVertical: 4,
                        paddingBottom: 8,
                      }}
                    >
                      <Text style={[styles.messageText, { color: "#000000" }]}>
                        {item.text}
                      </Text>
                    </View>

                    {/* 매물 카드 부분 */}
                    <View
                      style={{
                        paddingLeft: 1,
                        paddingRight: 0,
                        paddingBottom: 0,
                      }}
                    >
                      {(() => {
                        try {
                          const roomData = JSON.parse(nextItem.text);
                          return <RoommateRoomCard roomData={roomData} />;
                        } catch (error) {
                          console.error(
                            "Failed to parse room card data:",
                            error
                          );
                          return (
                            <View style={styles.errorContainer}>
                              <Text style={styles.errorText}>
                                매물 정보를 불러올 수 없습니다
                              </Text>
                            </View>
                          );
                        }
                      })()}
                    </View>
                  </View>
                ) : (
                  <View style={[styles.messageBubble, styles.otherBubble]}>
                    <Text style={[styles.messageText, styles.otherText]}>
                      {item.text}
                    </Text>
                  </View>
                )}

                {/* 시간 (일반 메시지이고 그룹의 마지막 메시지에만) */}
                {item.messageType !== "room_share" &&
                  item.messageType !== "room_card" &&
                  item.messageType !== "user_profile" &&
                  item.messageType !== "compatibility_message" &&
                  item.messageType !== "house_rules" &&
                  item.messageType !== "voting" &&
                  item.messageType !== "dispute_guide" &&
                  isLastInGroup && (
                    <View style={styles.otherMessageInfo}>
                      <Text style={styles.otherTimestamp}>
                        {formatTime(item.timestamp)}
                      </Text>
                    </View>
                  )}
              </View>
            </View>
          </View>
        </View>
      );
    }
  };

  const EmptyChat = () => (
    <View style={styles.emptyChatContainer}>
      <View style={styles.emptyChatIcon}>
        <Ionicons name="chatbubble-outline" size={40} color="#ccc" />
      </View>
      <Text style={styles.emptyChatText}>대화를 시작해보세요!</Text>
      <Text style={styles.emptyChatSubText}>
        {otherUser?.name || "상대방"}님과의 첫 대화를 나눠보세요
      </Text>
    </View>
  );

  return (
    <View style={styles.outerContainer}>
      <SafeAreaView style={styles.topSafeArea} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              if (showPropertySelector) {
                setShowPropertySelector(false);
                setSelectedProperties([]);
              } else {
                navigation.goBack();
              }
            }}
            style={styles.backButton}
          >
            <Svg width="21" height="24" viewBox="0 0 21 24" fill="none">
              <Path
                d="M19 13.5C19.8284 13.5 20.5 12.8284 20.5 12C20.5 11.1716 19.8284 10.5 19 10.5V12V13.5ZM0.939341 10.9393C0.353554 11.5251 0.353554 12.4749 0.939341 13.0607L10.4853 22.6066C11.0711 23.1924 12.0208 23.1924 12.6066 22.6066C13.1924 22.0208 13.1924 21.0711 12.6066 20.4853L4.12132 12L12.6066 3.51472C13.1924 2.92893 13.1924 1.97919 12.6066 1.3934C12.0208 0.807611 11.0711 0.807611 10.4853 1.3934L0.939341 10.9393ZM19 12V10.5L2 10.5V12V13.5L19 13.5V12Z"
                fill="#494949"
              />
            </Svg>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.userInfo, showUserProfile && styles.userInfoExpanded]}
            onPress={() => {
              if (showUserProfile) {
                // 닫기 애니메이션
                Animated.timing(expandAnimation, {
                  toValue: 0,
                  duration: 300,
                  useNativeDriver: false,
                }).start(() => {
                  setShowUserProfile(false);
                });
              } else {
                // 열기 애니메이션
                setShowUserProfile(true);
                Animated.timing(expandAnimation, {
                  toValue: 1,
                  duration: 300,
                  useNativeDriver: false,
                }).start();
              }
            }}
          >
            {isEditingName ? (
              <View style={styles.nameEditContainer}>
                <TextInput
                  style={styles.nameEditInput}
                  value={editingName}
                  onChangeText={setEditingName}
                  onSubmitEditing={() => {
                    setDisplayName(editingName);
                    setIsEditingName(false);
                  }}
                  onBlur={() => {
                    setDisplayName(editingName);
                    setIsEditingName(false);
                  }}
                  autoFocus
                  maxLength={20}
                />
              </View>
            ) : (
              <View style={styles.userNameContainer}>
                <Text style={styles.userName}>
                  {displayName}
                </Text>
                {showUserProfile && (
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => {
                      setEditingName(displayName);
                      setIsEditingName(true);
                    }}
                  >
                    <View style={styles.editIconContainer}>
                      <Svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <Path
                          d="M1.00959 10.9368L1.36368 8.50894C1.38526 8.35027 1.45759 8.20269 1.57076 8.08894L8.43134 1.21902C8.52015 1.12893 8.63071 1.06328 8.75231 1.02844C8.87392 0.99359 9.00247 0.990719 9.12551 1.0201C9.75533 1.19421 10.3262 1.53569 10.7775 2.00827C11.2488 2.46266 11.5879 3.03645 11.7587 3.66844C11.7881 3.79148 11.7852 3.92002 11.7503 4.04163C11.7155 4.16324 11.6499 4.2738 11.5598 4.3626L4.69159 11.2238C4.57768 11.3366 4.42998 11.4092 4.27101 11.4303L1.84376 11.7844C1.7291 11.8011 1.61212 11.7905 1.50229 11.7536C1.39246 11.7167 1.29289 11.6544 1.21164 11.5718C1.13039 11.4891 1.06976 11.3885 1.03465 11.2781C0.999548 11.1677 0.990963 11.0505 1.00959 10.9362M7.13343 2.52569L10.2618 5.6541"
                          stroke="white"
                          strokeWidth="0.875"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Svg>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuButton}>
            {showUserProfile ? (
              <AlarmIcon size={26} />
            ) : (
              <PhoneIcon size={28} />
            )}
          </TouchableOpacity>
        </View>


        {/* 채팅 메시지 리스트 */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={[
            styles.messagesContainer,
            messages.length === 0 && styles.emptyMessagesContainer,
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            !loading && messages.length === 0 ? EmptyChat : null
          }
          onScrollBeginDrag={() => {
            Keyboard.dismiss();
            if (showQuickActions) {
              setShowQuickActions(false);
            }
          }}
          ListFooterComponent={
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => {
                Keyboard.dismiss();
                if (showQuickActions) {
                  setShowQuickActions(false);
                }
              }}
              style={{ height: 5, width: "100%" }}
            />
          }
          disableScrollViewPanResponder={false}
          scrollEventThrottle={1}
          decelerationRate={0}
          snapToAlignment="start"
          snapToEnd={false}
          pagingEnabled={false}
        />

        {/* 하단 영역 - 조건부 렌더링 */}
        {showRulesGuide ? (
          <View style={styles.propertySection}>
            {/* 규칙/가이드 헤더 */}
            <View style={styles.propertyHeader}>
              <TouchableOpacity
                onPress={() => {
                  setShowRulesGuide(false);
                  setShowQuickActions(true); // QuickActions 메뉴로 돌아가기
                }}
                style={styles.propertyBackButton}
              >
                <Ionicons name="arrow-back" size={24} color="#000" />
              </TouchableOpacity>

              <Text style={styles.propertyHeaderTitle}>규칙/가이드</Text>

              <View style={styles.propertySendContainer}>
                {/* Empty space for alignment */}
              </View>
            </View>

            {/* 규칙/가이드 기능 버튼들 */}
            <ScrollView style={styles.rulesContent} showsVerticalScrollIndicator={false}>
              <View style={styles.rulesSection}>
                <Text style={styles.rulesSectionTitle}>기본 규칙/가이드 & 분쟁 조정 지원</Text>
                <Text style={styles.rulesDescription}>
                  채팅 속에서 바로 룸메이트 간 기본 규칙을 확인하거나 합의할 수 있는 기능이에요.
                </Text>

                {/* 하우스 룰 카드 보내기 */}
                <TouchableOpacity
                  style={styles.ruleActionButton}
                  onPress={() => {
                    // 하우스 룰 카드 전송 기능
                    handleSendHouseRules();
                  }}
                >
                  <View style={styles.ruleActionContent}>
                    <Text style={styles.ruleActionIcon}>🏠</Text>
                    <View style={styles.ruleActionText}>
                      <Text style={styles.ruleActionTitle}>하우스 룰 카드 보내기</Text>
                      <Text style={styles.ruleActionDescription}>흡연 여부, 청소 주기, 손님 초대, 소음 기준</Text>
                    </View>
                    <Text style={styles.ruleActionArrow}>›</Text>
                  </View>
                </TouchableOpacity>

                {/* 투표/합의 기능 */}
                <TouchableOpacity
                  style={styles.ruleActionButton}
                  onPress={() => {
                    // 투표/합의 기능
                    handleStartVoting();
                  }}
                >
                  <View style={styles.ruleActionContent}>
                    <Text style={styles.ruleActionIcon}>⚖️</Text>
                    <View style={styles.ruleActionText}>
                      <Text style={styles.ruleActionTitle}>투표/합의 기능</Text>
                      <Text style={styles.ruleActionDescription}>공용 냉장고 정리 주기, 청소 요일 정하기</Text>
                    </View>
                    <Text style={styles.ruleActionArrow}>›</Text>
                  </View>
                </TouchableOpacity>

                {/* 가이드 호출 */}
                <TouchableOpacity
                  style={styles.ruleActionButton}
                  onPress={() => {
                    // 분쟁 해결 가이드 팝업
                    handleShowDisputeGuide();
                  }}
                >
                  <View style={styles.ruleActionContent}>
                    <Text style={styles.ruleActionIcon}>📝</Text>
                    <View style={styles.ruleActionText}>
                      <Text style={styles.ruleActionTitle}>분쟁 해결 가이드</Text>
                      <Text style={styles.ruleActionDescription}>자주 발생하는 분쟁 사례와 해결 방법</Text>
                    </View>
                    <Text style={styles.ruleActionArrow}>›</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        ) : showPropertySelector ? (
          <View style={styles.propertySection}>
            {/* 관심매물 헤더 */}
            <View style={styles.propertyHeader}>
              <TouchableOpacity
                onPress={() => {
                  setShowPropertySelector(false);
                  setSelectedProperties([]);
                  setCurrentPropertyType("favorites"); // 상태 초기화
                  setShowQuickActions(true); // QuickActions 메뉴로 돌아가기
                }}
                style={styles.propertyBackButton}
              >
                <Ionicons name="arrow-back" size={24} color="#000" />
              </TouchableOpacity>

              <Text style={styles.propertyHeaderTitle}>
                {currentPropertyType === "favorites"
                  ? "관심 매물"
                  : "공통 관심"}
              </Text>

              <View style={styles.propertySendContainer}>
                <TouchableOpacity
                  style={[
                    styles.propertySendButton,
                    selectedProperties.length === 0 &&
                      styles.propertySendButtonDisabled,
                  ]}
                  onPress={sendSelectedProperties}
                  disabled={selectedProperties.length === 0}
                >
                  <Text
                    style={[
                      styles.propertySendText,
                      selectedProperties.length === 0 &&
                        styles.propertySendTextDisabled,
                    ]}
                  >
                    전송
                  </Text>
                </TouchableOpacity>
                {selectedProperties.length > 0 && (
                  <Text style={styles.propertyCountText}>
                    {selectedProperties.length}
                  </Text>
                )}
              </View>
            </View>

            {/* 관심매물 리스트 */}
            <FlatList
              data={favoriteRooms}
              keyExtractor={(item) => item.room_id.toString()}
              renderItem={({ item }) => {
                const priceText = `${item.transaction_type} ${utilFormatPrice(
                  item.price_deposit,
                  item.transaction_type,
                  item.price_monthly,
                  item.room_id
                )}`;
                const subInfoText = `${utilGetRoomType(
                  item.area,
                  item.rooms
                )} | ${utilFormatArea(item.area)} | ${utilFormatFloor(
                  item.floor
                )}`;
                const addressText = `관리비 ${formatMaintenanceCost(
                  item.area
                )}원 | ${getNearestStation(item.address)}`;

                return (
                  <TouchableOpacity
                    style={[
                      styles.chatRoomCard,
                      selectedProperties.includes(item.room_id) &&
                        styles.chatRoomCardSelected,
                    ]}
                    onPress={() => togglePropertySelection(item.room_id)}
                    activeOpacity={0.8}
                  >
                    {/* 상단 섹션: 이미지 + 텍스트 정보 + 찜 버튼 */}
                    <View style={styles.chatRoomTopSection}>
                      {/* 이미지 */}
                      <Image
                        source={{ uri: getRoomImage(item.room_id) }}
                        style={styles.chatRoomImage}
                      />

                      {/* 텍스트 정보 */}
                      <View style={styles.chatRoomTextInfo}>
                        <Text style={styles.chatRoomPrice}>{priceText}</Text>
                        <Text style={styles.chatRoomSubInfo}>
                          {subInfoText}
                        </Text>
                        <Text style={styles.chatRoomAddress}>
                          {addressText}
                        </Text>
                        {/* 집주인 인증 배지 */}
                        {item.verified && (
                          <View style={styles.chatVerificationBadge}>
                            <Ionicons
                              name="checkmark-circle"
                              size={10}
                              color="#fff"
                            />
                            <Text style={styles.chatVerificationText}>
                              집주인 인증
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* 찜 하트와 개수 */}
                      <View style={styles.chatHeartContainer}>
                        <FavoriteButton
                          isFavorited={true}
                          onPress={() => {}}
                          size={22}
                          heartSize={11}
                        />
                        <Text style={styles.chatHeartCount}>
                          {item.favorite_count || 0}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }}
              style={styles.propertyList}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.favoriteListContainer}
            />
          </View>
        ) : (
          <>
            {/* 입력 영역 */}
            <View
              style={[
                styles.inputContainer,
                showQuickActions && {
                  marginBottom: -33,
                  zIndex: 10,
                  elevation: 10,
                },
              ]}
            >
              <View style={styles.inputOuterWrapper}>
                <TouchableOpacity
                  style={styles.attachButton}
                  onPress={() => {
                    Keyboard.dismiss();
                    setShowQuickActions(!showQuickActions);
                  }}
                >
                  <PlusIcon
                    size={48}
                    backgroundColor="#D9D9D9"
                    iconColor="#595959"
                  />
                </TouchableOpacity>

                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder="메시지를 입력하세요"
                    placeholderTextColor="#B3B3B3"
                    multiline
                    maxLength={1000}
                    onFocus={() => {
                      setShowQuickActions(false);
                    }}
                    onPressIn={() => {
                      if (showQuickActions) {
                        setShowQuickActions(false);
                      }
                    }}
                  />
                </View>

                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    inputText.trim() ? styles.sendButtonActive : null,
                  ]}
                  onPress={sendMessage}
                  disabled={!inputText.trim()}
                >
                  <SendIcon
                    size={20}
                    color={inputText.trim() ? "#00E1A0" : "#8C8C8C"}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* QuickActions */}
            <QuickActions
              visible={showQuickActions}
              onActionPress={handleQuickAction}
              height={keyboardHeight}
            />
          </>
        )}
      </KeyboardAvoidingView>

      {/* 확장된 유저 프로필 오버레이 */}
      {showUserProfile && (
        <View style={styles.expandedUserProfileOverlay}>
          {/* 블러 배경 - 클릭 시 닫힘 */}
          <TouchableOpacity
            style={styles.blurBackground}
            onPress={() => {
              Animated.timing(expandAnimation, {
                toValue: 0,
                duration: 300,
                useNativeDriver: false,
              }).start(() => {
                setShowUserProfile(false);
              });
            }}
            activeOpacity={1}
          />
          {/* 확장된 프로필 영역 */}
          <Animated.View style={[
            styles.expandedUserProfile,
            {
              height: expandAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 240],
              }),
              opacity: expandAnimation,
              overflow: 'hidden',
            }
          ]}>
            <View style={styles.userProfileContent}>
              {/* 기본 정보 */}
              <Text style={styles.expandedUserInfo}>
                {(() => {
                  if (!otherUserProfile) return '';

                  const info = [];

                  // UserProfileScreen과 동일한 나이 계산 로직
                  const getAgeGroup = (age) => {
                    if (!age) return '';
                    if (age >= 19 && age <= 23) return '20대 초반';
                    if (age >= 24 && age <= 27) return '20대 중반';
                    if (age >= 28 && age <= 30) return '20대 후반';
                    if (age >= 31 && age <= 35) return '30대 초반';
                    if (age >= 36 && age <= 39) return '30대 후반';
                    return `${Math.floor(age / 10)}0대`;
                  };

                  const userAge = otherUserProfile.profile?.age || otherUserProfile.age;
                  const ageGroup = getAgeGroup(userAge);
                  if (ageGroup) info.push(ageGroup);

                  // 성별
                  const getGenderText = (gender) => {
                    if (gender === 'male') return '남성';
                    if (gender === 'female') return '여성';
                    return '';
                  };

                  const genderText = getGenderText(otherUserProfile.gender);
                  if (genderText) info.push(genderText);

                  // UserProfileScreen과 동일한 학교 이름 추출 로직
                  const getSchoolNameFromEmail = (schoolEmail) => {
                    if (!schoolEmail) return '';

                    const domain = schoolEmail.split('@')[1];
                    if (!domain) return '';

                    const schoolPatterns = {
                      'snu.ac.kr': '서울대학교',
                      'korea.ac.kr': '고려대학교',
                      'yonsei.ac.kr': '연세대학교',
                      'kaist.ac.kr': '카이스트',
                      'postech.ac.kr': '포스텍',
                      'seoul.ac.kr': '서울시립대학교',
                      'hanyang.ac.kr': '한양대학교',
                      'cau.ac.kr': '중앙대학교',
                      'konkuk.ac.kr': '건국대학교',
                      'dankook.ac.kr': '단국대학교',
                    };

                    if (schoolPatterns[domain]) {
                      return schoolPatterns[domain];
                    }

                    let schoolName = domain
                      .replace('.ac.kr', '')
                      .replace('.edu', '')
                      .replace('university', '')
                      .replace('univ', '')
                      .replace('.', '');

                    if (schoolName && schoolName.length > 0) {
                      return schoolName.charAt(0).toUpperCase() + schoolName.slice(1) + '대학교';
                    }

                    return '';
                  };

                  const schoolText = getSchoolNameFromEmail(otherUserProfile.school_email);
                  if (schoolText) info.push(schoolText);

                  return info.join(', ');
                })()}
              </Text>

              {/* 말풍선 영역 - UserProfileScreen과 동일한 디자인 */}
              <View style={styles.speechBubbleContainer}>
                {/* 위쪽 삼각형 꼬리 (UserProfileScreen과 반대 방향) */}
                <View style={styles.speechBubbleTriangleTop} />
                {/* 말풍선 본체 */}
                <View style={styles.speechBubbleBody}>
                  <Text style={styles.speechBubbleText}>
                    {otherUserProfile?.user_info?.bio || otherUserProfile?.bio || "안녕하세요!"}
                  </Text>
                </View>
              </View>

              {/* 태그 영역 (말풍선 아래에 별도 표시) */}
              <View style={styles.expandedUserTags}>
                {getOtherUserTags(otherUserProfile).map((tag, index) => (
                  <View key={index} style={styles.expandedUserTag}>
                    <Text style={styles.expandedUserTagText}>{tag}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={styles.expandedDetailButton}
                onPress={() => {
                  setShowUserProfile(false);
                  navigation.navigate('MainTabs', {
                    screen: '홈',
                    params: {
                      screen: 'UserProfile',
                      params: {
                        userId: otherUser?.id,
                        roomId: null
                      }
                    }
                  });
                }}
              >
                <Text style={styles.expandedDetailButtonText}>정보 더보기</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      )}

      {/* 투표 생성 모달 */}
      <Modal
        visible={showVotingModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowVotingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowVotingModal(false)}
          >
            <View style={styles.votingModalContainer}>
              <TouchableOpacity activeOpacity={1}>
                <View style={styles.votingModalContent}>
                  <View style={styles.votingModalHeader}>
                    <Text style={styles.votingModalTitle}>투표 만들기</Text>
                    <TouchableOpacity
                      onPress={() => setShowVotingModal(false)}
                      style={styles.modalCloseButton}
                    >
                      <Text style={styles.modalCloseButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  <TextInput
                    style={styles.votingQuestionInput}
                    placeholder="투표 제목을 입력하세요"
                    value={votingQuestion}
                    onChangeText={setVotingQuestion}
                    multiline={true}
                    maxLength={100}
                  />

                  <Text style={styles.votingOptionsLabel}>선택지</Text>
                  <ScrollView style={styles.votingOptionsContainer}>
                    {votingOptions.map((option, index) => (
                      <View key={index} style={styles.votingOptionRow}>
                        <TextInput
                          style={styles.votingOptionInput}
                          placeholder={`선택지 ${index + 1}`}
                          value={option}
                          onChangeText={(value) => updateVotingOption(index, value)}
                          maxLength={50}
                        />
                        {votingOptions.length > 2 && (
                          <TouchableOpacity
                            onPress={() => removeVotingOption(index)}
                            style={styles.removeOptionButton}
                          >
                            <Text style={styles.removeOptionButtonText}>-</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}

                    {votingOptions.length < 6 && (
                      <TouchableOpacity
                        onPress={addVotingOption}
                        style={styles.addOptionButton}
                      >
                        <Text style={styles.addOptionButtonText}>+ 선택지 추가</Text>
                      </TouchableOpacity>
                    )}
                  </ScrollView>

                  <View style={styles.votingModalButtons}>
                    <TouchableOpacity
                      onPress={() => setShowVotingModal(false)}
                      style={styles.votingCancelButton}
                    >
                      <Text style={styles.votingCancelButtonText}>취소</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={createVoting}
                      style={styles.votingCreateButton}
                    >
                      <Text style={styles.votingCreateButtonText}>투표 만들기</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* 분쟁 해결 가이드 작성 모달 */}
      <Modal
        visible={showDisputeModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDisputeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowDisputeModal(false)}
          >
            <View style={styles.disputeModalContainer}>
              <TouchableOpacity activeOpacity={1}>
                <View style={styles.disputeModalContent}>
                  <View style={styles.disputeModalHeader}>
                    <Text style={styles.disputeModalTitle}>가이드 작성</Text>
                    <TouchableOpacity
                      onPress={() => setShowDisputeModal(false)}
                      style={styles.modalCloseButton}
                    >
                      <Text style={styles.modalCloseButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  <TextInput
                    style={styles.disputeTitleInput}
                    placeholder="가이드 제목을 입력하세요"
                    value={disputeGuideTitle}
                    onChangeText={setDisputeGuideTitle}
                    maxLength={50}
                  />

                  <TextInput
                    style={styles.disputeContentInput}
                    placeholder="가이드 내용을 입력하세요"
                    value={disputeGuideContent}
                    onChangeText={setDisputeGuideContent}
                    multiline={true}
                    textAlignVertical="top"
                    maxLength={500}
                  />

                  <View style={styles.disputeModalButtons}>
                    <TouchableOpacity
                      onPress={() => setShowDisputeModal(false)}
                      style={styles.disputeCancelButton}
                    >
                      <Text style={styles.disputeCancelButtonText}>취소</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={createDisputeGuide}
                      style={styles.disputeCreateButton}
                    >
                      <Text style={styles.disputeCreateButtonText}>가이드 보내기</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>

      <SafeAreaView style={styles.bottomSafeArea} />
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: "#F2F2F2",
  },
  topSafeArea: {
    backgroundColor: "#F2F2F2",
  },
  bottomSafeArea: {
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    backgroundColor: "#F2F2F2",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F2F2F2",
    justifyContent: "space-between",
  },
  userInfo: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#F2F2F2",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#CCCCCC",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    minWidth: 120,
  },
  userInfoExpanded: {
    borderWidth: 0,
    borderColor: "transparent",
  },
  userNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  editButton: {
    marginLeft: 8,
  },
  editIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
  },
  nameEditContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  nameEditInput: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    textAlign: "center",
    minWidth: 100,
    backgroundColor: "transparent",
  },
  userName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    textAlign: "center",
    fontFamily: "Pretendard",
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    paddingTop: 16,
    paddingBottom: 4,
    paddingHorizontal: 16,
  },
  messageContainer: {
    marginBottom: 0, // 메시지 간격 줄임 (픽셀 조정 가능)
  },
  messageContainerWithSpacing: {
    marginTop: 16, // 발신자가 바뀔 때 추가 여백
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  myMessageRow: {
    justifyContent: "flex-end",
  },
  otherMessageRow: {
    justifyContent: "flex-start",
  },
  avatarContainer: {
    width: 50,
    marginRight: 2,
    alignItems: "flex-start",
  },
  avatarSpacer: {
    width: 50,
    height: 40,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  botAvatar: {
    backgroundColor: "#45DCB1",
  },
  botInitial: {
    color: "#FFFFFF",
    fontSize: 28,
    fontFamily: "Aquire",
    fontWeight: "700",
  },
  messageContent: {
    flex: 1,
  },
  senderNameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 3,
  },
  senderName: {
    color: "#667085",
    fontSize: 13,
    fontFamily: "Pretendard",
    fontWeight: "500",
  },
  messageBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    maxWidth: 280,
  },
  myBubble: {
    backgroundColor: "#CDCDCD",
    alignSelf: "flex-end",
    borderWidth: 1,
    borderColor: "#CDCDCD",
  },
  otherBubble: {
    backgroundColor: "#FFFFFF",
    borderWidth: 0.5,
    borderColor: "#E0E0E0",
  },
  messageText: {
    fontSize: 15.7,
    lineHeight: 21,
    fontFamily: "Pretendard",
    fontWeight: "400",
  },
  myText: {
    color: "#000000",
  },
  otherText: {
    color: "#000000",
  },
  myMessageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "flex-end",
    width: "100%",
  },
  otherMessageRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "flex-start",
    width: "100%",
  },
  myMessageBubbleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "flex-end",
    marginBottom: 4,
  },
  otherMessageBubbleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "flex-start",
    marginBottom: 4,
  },
  myMessageInfo: {
    alignItems: "flex-end",
    justifyContent: "flex-end",
    marginRight: 6,
    marginBottom: 2,
  },
  myRoomShareMessageInfo: {
    alignItems: "flex-end",
    justifyContent: "flex-end",
    marginRight: 5,
    marginTop: 5,
  },
  otherMessageInfo: {
    alignItems: "flex-start",
    justifyContent: "flex-end",
    marginLeft: 6,
    marginBottom: 2,
  },
  readStatus: {
    fontSize: 11,
    color: "#FF6600",
    fontFamily: "Pretendard",
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 2,
  },
  myTimestamp: {
    fontSize: 10,
    color: "#999999",
    fontFamily: "Pretendard",
  },
  otherTimestamp: {
    fontSize: 10,
    color: "#999999",
    fontFamily: "Pretendard",
  },
  profileCard: {
    marginTop: 16,
    marginLeft: 53,
    backgroundColor: "#F8F8F8",
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    padding: 12,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  profileAvatar: {
    width: 68,
    height: 68,
    backgroundColor: "#D9D9D9",
    borderRadius: 34,
    marginRight: 12,
  },
  profileContent: {
    flex: 1,
  },
  profileHeader: {
    marginBottom: 9,
  },
  profileName: {
    color: "#474747",
    fontSize: 15,
    fontFamily: "Pretendard",
    fontWeight: "600",
    marginBottom: 9,
  },
  profileTags: {
    flexDirection: "row",
    gap: 5,
  },
  tag: {
    backgroundColor: "#E2E2E2",
    borderRadius: 9,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  tagText: {
    color: "#343434",
    fontSize: 11,
    fontFamily: "Pretendard",
    fontWeight: "300",
    opacity: 0.8,
  },
  profileInfo: {
    color: "#343434",
    fontSize: 13,
    fontFamily: "Pretendard",
    fontWeight: "500",
    opacity: 0.8,
    marginBottom: 4,
  },
  profileQuote: {
    color: "#343434",
    fontSize: 13,
    fontFamily: "Pretendard",
    fontWeight: "300",
    opacity: 0.8,
  },
  inputContainer: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 10 : 20,
    borderTopWidth: 0,
  },
  inputOuterWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: "#F2F2F2",
    borderRadius: 24,
    borderWidth: 1.058,
    borderColor: "#D9D9D9",
    paddingHorizontal: 16,
    paddingVertical: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    height: 48,
  },
  textInput: {
    minHeight: 32,
    maxHeight: 120,
    backgroundColor: "transparent",
    borderRadius: 0,
    borderWidth: 0,
    paddingHorizontal: 0,
    paddingVertical: 8,
    fontSize: 16,
    fontFamily: "Pretendard",
    fontWeight: "400",
    lineHeight: 20,
    color: "#000000",
    textAlignVertical: "center",
  },
  sendButton: {
    width: 48,
    height: 48,
    backgroundColor: "#E5E5EA",
    borderRadius: 24,
    borderWidth: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonActive: {
    backgroundColor: "#000000",
    transform: [{ scale: 1.05 }],
  },
  attachButton: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  menuButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyChatContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyChatIcon: {
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyChatText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#999",
    marginBottom: 8,
  },
  emptyChatSubText: {
    fontSize: 14,
    color: "#bbb",
    textAlign: "center",
  },
  emptyMessagesContainer: {
    flex: 1,
    justifyContent: "center",
  },
  myRoomShareRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "flex-end",
    marginBottom: 4,
    marginLeft: 0, // 매물 정보와 시간 정보를 함께 오른쪽으로 이동 (픽셀 조정 가능)
  },
  roomShareContainer: {
    backgroundColor: "transparent",
    borderRadius: 0,
    paddingHorizontal: 0,
    paddingVertical: 4,
    marginVertical: 0,
    width: "100%",
    maxWidth: 380,
  },
  errorContainer: {
    backgroundColor: "#ffebee",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ffcdd2",
  },
  errorText: {
    color: "#c62828",
    fontSize: 12,
    textAlign: "center",
  },
  roomShareWithTimeContainer: {
    position: "relative",
    width: "100%",
    maxWidth: 300,
  },
  roomShareTimeOverlay: {
    position: "absolute",
    bottom: -15,
    right: 5,
  },
  roomShareTimeOverlayOther: {
    position: "absolute",
    bottom: 20,
    left: 100,
  },

  // 관심매물 섹션 스타일
  propertySection: {
    backgroundColor: "#F2F2F2",
    maxHeight: 400, // 적절한 높이 제한
    flex: 1, // 남은 공간을 모두 차지
  },
  propertyHeader: {
    height: 60,
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  propertyBackButton: {
    padding: 8,
    marginLeft: -8,
  },
  propertyHeaderTitle: {
    fontSize: 18,
    fontFamily: "Pretendard",
    fontWeight: "600",
    color: "#000",
  },
  propertySendContainer: {
    position: "relative",
    alignItems: "center",
  },
  propertyCountText: {
    position: "absolute",
    right: 32,
    top: 7,
    fontSize: 16,
    fontFamily: "Pretendard",
    fontWeight: "600",
    color: "#000",
  },
  propertySendButton: {
    padding: 8,
    marginRight: -8,
  },
  propertySendButtonDisabled: {
    opacity: 0.3,
  },
  propertySendText: {
    fontSize: 16,
    fontFamily: "Pretendard",
    fontWeight: "600",
    color: "#000",
  },
  propertySendTextDisabled: {
    color: "#999",
  },
  propertyList: {
    flex: 1, // 남은 공간을 모두 차지
    backgroundColor: "#F2F2F2", // 배경색 명시
  },
  favoriteListContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: "#F2F2F2", // 배경색 명시
  },
  // 채팅방 매물 카드 스타일 (가로로 꽉 차게)
  chatRoomCard: {
    backgroundColor: "#ffffff",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "transparent",
    width: "100%",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  chatRoomCardSelected: {
    backgroundColor: "rgba(16, 181, 133, 0.08)",
    borderColor: "#10B585",
  },
  chatRoomTopSection: {
    flexDirection: "row",
    marginBottom: 0,
    alignItems: "flex-start",
  },
  chatRoomImage: {
    width: 90,
    height: 90,
    borderRadius: 10,
    marginRight: 15,
  },
  chatRoomTextInfo: {
    flex: 1,
    marginRight: 15,
    justifyContent: "space-between",
  },
  chatRoomPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 5,
  },
  chatRoomSubInfo: {
    fontSize: 12,
    color: "#666666",
    marginBottom: 3,
  },
  chatRoomAddress: {
    fontSize: 12,
    color: "#666666",
    marginBottom: 8,
  },
  chatVerificationBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#595959",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  chatVerificationText: {
    fontSize: 10,
    color: "#fff",
    marginLeft: 4,
    fontWeight: "600",
  },
  chatHeartContainer: {
    alignItems: "center",
    justifyContent: "flex-start",
    minWidth: 30,
  },
  chatHeartCount: {
    fontSize: 11,
    color: "#999",
    fontWeight: "500",
    marginTop: 4,
    textAlign: "center",
  },

  // Room Share 스타일 (기존 공유하기용)
  roomShareCard: {
    backgroundColor: "#ffffff",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "transparent",
    width: "100%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  roomShareTopSection: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "flex-start",
  },
  roomShareImage: {
    width: 90,
    height: 90,
    borderRadius: 10,
    marginRight: 15,
  },
  roomShareTextInfo: {
    flex: 1,
    marginRight: 15,
    justifyContent: "space-between",
  },
  roomSharePrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 5,
  },
  roomShareSubInfo: {
    fontSize: 12,
    color: "#666666",
    marginBottom: 3,
  },
  roomShareAddress: {
    fontSize: 12,
    color: "#666666",
    marginBottom: 8,
  },
  roomShareVerificationBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#595959",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  roomShareVerificationText: {
    fontSize: 10,
    color: "#fff",
    marginLeft: 4,
    fontWeight: "600",
  },
  roomShareHeartContainer: {
    alignItems: "center",
    justifyContent: "flex-start",
    minWidth: 30,
  },
  roomShareHeartCount: {
    fontSize: 11,
    color: "#999",
    fontWeight: "500",
    marginTop: 4,
    textAlign: "center",
  },
  roomShareButtonSection: {
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 12,
    marginTop: 0,
  },
  roomShareCheckButton: {
    backgroundColor: "#10B585",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  roomShareCheckButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Pretendard",
  },

  // 확장된 유저 프로필 오버레이 스타일
  expandedUserProfileOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "flex-start",
    zIndex: 1000,
  },
  blurBackground: {
    position: "absolute",
    top: Platform.OS === "ios" ? 44 + 76 : 76, // 헤더 아래부터 시작
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.60)",
  },
  expandedUserProfile: {
    backgroundColor: "#F2F2F2",
    marginTop: Platform.OS === "ios" ? 44 + 76 : 76, // 헤더 아래쪽에 위치
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  userProfileContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
    alignItems: "center",
  },
  expandedUserInfo: {
    fontSize: 14,
    color: "#333333",
    textAlign: "center",
    marginBottom: 4,
    fontWeight: "500",
  },
  speechBubbleContainer: {
    alignItems: "center",
    marginVertical: 8,
  },
  speechBubbleTriangleTop: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#10B585",
    marginBottom: -1,
  },
  speechBubbleBody: {
    backgroundColor: "#10B585",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    position: "relative",
    minWidth: 140,
  },
  speechBubbleText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  expandedUserTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginVertical: 8,
    marginBottom: 27,
    gap: 6,
  },
  expandedUserTag: {
    backgroundColor: "#E8E8E8",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  expandedUserTagText: {
    fontSize: 14,
    color: "#666666",
    fontWeight: "500",
  },
  expandedDetailButton: {
    alignItems: "center",
    paddingVertical: 0,
  },
  expandedDetailButtonText: {
    color: "#000000",
    fontSize: 13,
    textDecorationLine: "underline",
  },
  // 규칙/가이드 모달 스타일
  rulesContent: {
    flex: 1,
    backgroundColor: "#F2F2F2",
    paddingHorizontal: 20,
  },
  rulesSection: {
    paddingVertical: 16,
  },
  rulesSectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333333",
    marginBottom: 12,
  },
  rulesDescription: {
    fontSize: 14,
    color: "#666666",
    lineHeight: 20,
    marginBottom: 16,
  },
  rulesSubtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 12,
  },
  ruleItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  ruleItemIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  ruleItemContent: {
    flex: 1,
  },
  ruleItemTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 4,
  },
  ruleItemDescription: {
    fontSize: 14,
    color: "#666666",
    lineHeight: 20,
  },
  rulesNote: {
    fontSize: 14,
    color: "#10B585",
    fontWeight: "500",
    marginTop: 8,
    paddingLeft: 8,
  },
  // 규칙/가이드 액션 버튼 스타일
  ruleActionButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  ruleActionContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  ruleActionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  ruleActionText: {
    flex: 1,
  },
  ruleActionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
    marginBottom: 4,
  },
  ruleActionDescription: {
    fontSize: 14,
    color: "#666666",
    lineHeight: 20,
  },
  ruleActionArrow: {
    fontSize: 20,
    color: "#CCCCCC",
    marginLeft: 8,
  },
  // 새로운 메시지 타입 스타일들
  houseRulesContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    maxWidth: 280,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  houseRulesContent: {
    gap: 8,
  },
  houseRulesHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  houseRulesTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
  },
  houseRulesItem: {
    fontSize: 14,
    color: "#666666",
    lineHeight: 20,
  },
  votingContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    maxWidth: 280,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  votingContent: {
    gap: 8,
  },
  votingHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  votingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
  },
  votingQuestion: {
    fontSize: 15,
    color: "#333333",
    marginBottom: 12,
    fontWeight: "500",
  },
  votingOption: {
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    padding: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  votingOptionText: {
    fontSize: 14,
    color: "#495057",
    textAlign: "center",
  },
  votingOptionSelected: {
    backgroundColor: "#10B585",
    borderColor: "#10B585",
  },
  votingOptionTextSelected: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  disputeGuideContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    maxWidth: 280,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  disputeGuideContent: {
    gap: 12,
  },
  disputeGuideHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  disputeGuideTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333333",
  },
  disputeGuideItem: {
    marginBottom: 8,
  },
  disputeGuideIssue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#495057",
    marginBottom: 4,
  },
  disputeGuideSolution: {
    fontSize: 14,
    color: "#666666",
    lineHeight: 20,
    paddingLeft: 8,
  },
  disputeGuideContentText: {
    fontSize: 14,
    color: "#666666",
    lineHeight: 20,
    marginTop: 8,
  },

  // 모달 공통 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBackdrop: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalCloseButton: {
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 15,
  },
  modalCloseButtonText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
  },

  // 투표 모달 스타일
  votingModalContainer: {
    width: "100%",
    maxWidth: 400,
  },
  votingModalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    maxHeight: "97%",
  },
  votingModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  votingModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  votingQuestionInput: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
    minHeight: 50,
    textAlignVertical: "top",
  },
  votingOptionsLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  votingOptionsContainer: {
    maxHeight: 400,
    marginBottom: 20,
  },
  votingOptionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  votingOptionInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginRight: 8,
    minHeight: 50,
  },
  removeOptionButton: {
    width: 36,
    height: 36,
    backgroundColor: "#ff4757",
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  removeOptionButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  addOptionButton: {
    borderWidth: 1,
    borderColor: "#10B585",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    backgroundColor: "#f8fffe",
  },
  addOptionButtonText: {
    color: "#10B585",
    fontSize: 14,
    fontWeight: "600",
  },
  votingModalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  votingCancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
  },
  votingCancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  votingCreateButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: "#10B585",
    alignItems: "center",
  },
  votingCreateButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  // 분쟁 해결 가이드 모달 스타일
  disputeModalContainer: {
    width: "100%",
    maxWidth: 400,
  },
  disputeModalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    minHeight: 450,
    maxHeight: "90%",
  },
  disputeModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  disputeModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  disputeTitleInput: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    minHeight: 50,
  },
  disputeContentInput: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    minHeight: 200,
    maxHeight: 300,
    marginBottom: 20,
    textAlignVertical: "top",
  },
  disputeModalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  disputeCancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
  },
  disputeCancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  disputeCreateButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: "#10B585",
    alignItems: "center",
  },
  disputeCreateButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
