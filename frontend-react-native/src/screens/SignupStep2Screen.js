import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SvgXml } from 'react-native-svg';
import { useSignup } from '../contexts/SignupContext';
import VerificationProgressBar from '../components/VerificationProgressBar';

export default function SignupStep2Screen({ navigation }) {
  const { signupData, updateStep2Data } = useSignup();
  const [name, setName] = useState(signupData.name || '');
  const [nationality, setNationality] = useState(signupData.nationality || '내국인');
  const [showNationalityDropdown, setShowNationalityDropdown] = useState(false);
  const [residentNumber1, setResidentNumber1] = useState(signupData.residentNumber1 || '');
  const [residentNumber2, setResidentNumber2] = useState(signupData.residentNumber2 || '');
  const [phoneNumber, setPhoneNumber] = useState(signupData.phoneNumber || '');
  const [carrier, setCarrier] = useState(signupData.carrier || '통신사');
  const [showCarrierDropdown, setShowCarrierDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showVerificationCode, setShowVerificationCode] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerified, setIsVerified] = useState(signupData.phoneVerified || false);

  const residentNumberRef = useRef(null);
  const phoneInputRef = useRef(null);

  const nationalities = ['내국인', '외국인'];
  const carriers = ['SKT', 'KT', 'LG U+'];

  const handleNationalitySelect = (selectedNationality) => {
    setNationality(selectedNationality);
    setShowNationalityDropdown(false);
  };

  const handleCarrierSelect = (selectedCarrier) => {
    setCarrier(selectedCarrier);
    setShowCarrierDropdown(false);
  };

  const formatResidentNumber1 = (value) => {
    const numbers = value.replace(/[^\d]/g, '');
    return numbers.slice(0, 6);
  };

  const formatResidentNumber2 = (value) => {
    const numbers = value.replace(/[^\d]/g, '');
    return numbers.slice(0, 1);
  };

  const formatPhoneNumber = (value) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const handleVerifyPhone = () => {
    if (!name.trim()) {
      Alert.alert('알림', '이름을 입력해주세요.');
      return;
    }
    if (residentNumber1.length !== 6 || residentNumber2.length !== 1) {
      Alert.alert('알림', '주민등록번호를 정확히 입력해주세요.');
      return;
    }
    if (!phoneNumber.trim()) {
      Alert.alert('알림', '전화번호를 입력해주세요.');
      return;
    }
    if (carrier === '통신사') {
      Alert.alert('알림', '통신사를 선택해주세요.');
      return;
    }
    
    setShowVerificationCode(true);
    Alert.alert('인증번호 전송', '인증번호가 전송되었습니다.');
  };

  const handleConfirmVerification = () => {
    if (verificationCode === '0000') {
      setIsVerified(true);
      
      // 2단계 데이터를 Context에 저장
      updateStep2Data({
        name,
        nationality,
        residentNumber1,
        residentNumber2,
        phoneNumber,
        carrier,
        phoneVerified: true,
      });
      
      Alert.alert('인증 완료', '휴대폰 인증이 완료되었습니다!');
    } else {
      Alert.alert('인증 실패', '인증번호가 올바르지 않습니다. (0000을 입력해주세요)');
    }
  };

  const handleNext = () => {
    if (!isVerified) {
      Alert.alert('알림', '휴대폰 인증을 완료해주세요.');
      return;
    }
    
    // 현재 입력된 데이터 저장
    updateStep2Data({
      name,
      nationality,
      residentNumber1,
      residentNumber2,
      phoneNumber,
      carrier,
      phoneVerified: true,
    });
    
    // 신분증 인증으로 이동
    navigation.navigate('IDVerification');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* 헤더 - 로고만 */}
          <View style={styles.headerRow}>
            {/* 왼쪽 여백 */}
            <View style={styles.headerSpacer} />
            
            {/* 로고 */}
            <View style={styles.logoContainer}>
              <SvgXml 
                xml={`<svg width="274" height="44" viewBox="0 0 274 44" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#clip0_628_43827)">
<path d="M180.953 32.947C187.204 32.947 192.272 27.8813 192.272 21.6323C192.272 15.3834 187.204 10.3176 180.953 10.3176C174.701 10.3176 169.633 15.3834 169.633 21.6323C169.633 27.8813 174.701 32.947 180.953 32.947Z" fill="#FC6339"/>
<path d="M133.136 32.947C139.388 32.947 144.456 27.8813 144.456 21.6323C144.456 15.3834 139.388 10.3176 133.136 10.3176C126.884 10.3176 121.816 15.3834 121.816 21.6323C121.816 27.8813 126.884 32.947 133.136 32.947Z" fill="#10B585"/>
<path d="M52.4303 13.9322C51.2679 13.2415 50.3581 12.3485 49.701 11.2029C49.044 10.0741 48.707 8.81054 48.707 7.44589C48.707 6.08123 49.0271 4.9019 49.701 3.77311C50.3581 2.64433 51.2679 1.73456 52.4303 1.09435C53.5928 0.437293 54.8564 0.100342 56.2211 0.100342C57.5857 0.100342 58.765 0.437293 59.8938 1.09435C61.0226 1.7514 61.9492 2.64433 62.6568 3.77311C63.3644 4.9019 63.7182 6.13178 63.7182 7.44589C63.7182 8.76 63.3644 10.0573 62.6568 11.2029C61.9492 12.3317 61.0226 13.2415 59.8938 13.9322C58.765 14.623 57.5352 14.9599 56.2211 14.9599C54.9069 14.9599 53.5928 14.623 52.4303 13.9322ZM52.4303 42.3204C51.2679 41.6296 50.3581 40.7367 49.701 39.5911C49.044 38.4623 48.707 37.1987 48.707 35.8341C48.707 34.4694 49.0271 33.2901 49.701 32.1613C50.3581 31.0325 51.2679 30.1227 52.4303 29.4825C53.5928 28.8255 54.8564 28.5054 56.2211 28.5054C57.5857 28.5054 58.765 28.8255 59.8938 29.4825C61.0226 30.1396 61.9492 31.0325 62.6568 32.1613C63.3644 33.2901 63.7182 34.52 63.7182 35.8341C63.7182 37.1482 63.3644 38.4454 62.6568 39.5911C61.9492 40.7199 61.0226 41.6296 59.8938 42.3204C58.765 43.0111 57.5352 43.3481 56.2211 43.3481C54.9069 43.3481 53.5928 43.0111 52.4303 42.3204Z" fill="black"/>
<path d="M121.521 40.6027C118.269 38.8 115.793 36.256 114.057 32.9876C112.322 29.7191 111.463 25.9453 111.463 21.666C111.463 17.3867 112.322 13.5455 114.057 10.2939C115.776 7.04229 118.269 4.51515 121.521 2.71246C124.772 0.90977 128.614 0 133.078 0C137.543 0 141.367 0.90977 144.636 2.71246C147.904 4.51515 150.415 7.04229 152.133 10.2939C153.851 13.5455 154.727 17.3362 154.727 21.666C154.727 25.9958 153.868 29.7191 152.133 32.9876C150.398 36.256 147.904 38.8 144.636 40.6027C141.367 42.4054 137.509 43.3151 133.078 43.3151C128.647 43.3151 124.772 42.4054 121.521 40.6027ZM136.751 31.1512C137.728 30.2583 138.47 28.9778 138.992 27.3268C139.514 25.6589 139.767 23.7214 139.767 21.5144C139.767 19.3073 139.514 17.4036 138.992 15.7525C138.47 14.1014 137.728 12.8379 136.751 11.9618C135.774 11.0857 134.595 10.6477 133.23 10.6477C131.781 10.6477 130.551 11.0857 129.523 11.9618C128.496 12.8379 127.704 14.0846 127.182 15.7188C126.659 17.353 126.39 19.2736 126.39 21.5144C126.39 23.7551 126.659 25.7431 127.182 27.3773C127.704 29.0115 128.496 30.2751 129.523 31.168C130.551 32.061 131.798 32.499 133.23 32.499C134.595 32.499 135.774 32.061 136.751 31.168V31.1512Z" fill="black"/>
<path d="M169.419 40.6027C166.168 38.8 163.691 36.256 161.956 32.9876C160.221 29.7191 159.361 25.9453 159.361 21.666C159.361 17.3867 160.221 13.5455 161.956 10.2939C163.674 7.04229 166.168 4.51515 169.419 2.71246C172.671 0.90977 176.512 0 180.977 0C185.441 0 189.266 0.90977 192.534 2.71246C195.803 4.51515 198.313 7.04229 200.031 10.2939C201.75 13.5455 202.626 17.3362 202.626 21.666C202.626 25.9958 201.767 29.7191 200.031 32.9876C198.296 36.256 195.803 38.8 192.534 40.6027C189.266 42.4054 185.408 43.3151 180.977 43.3151C176.546 43.3151 172.671 42.4054 169.419 40.6027ZM184.666 31.1512C185.644 30.2583 186.385 28.9778 186.907 27.3268C187.429 25.6589 187.682 23.7214 187.682 21.5144C187.682 19.3073 187.429 17.4036 186.907 15.7525C186.385 14.1014 185.644 12.8379 184.666 11.9618C183.689 11.0857 182.51 10.6477 181.145 10.6477C179.696 10.6477 178.466 11.0857 177.439 11.9618C176.411 12.8379 175.619 14.0846 175.097 15.7188C174.575 17.353 174.305 19.2736 174.305 21.5144C174.305 23.7551 174.575 25.7431 175.097 27.3773C175.619 29.0115 176.411 30.2751 177.439 31.168C178.466 32.061 179.713 32.499 181.145 32.499C182.51 32.499 183.689 32.061 184.666 31.168V31.1512Z" fill="black"/>
<path d="M215.803 0.539123C219.644 0.539123 222.744 3.63908 222.744 7.48033V8.42379H223.131C224.058 5.76187 225.574 3.70647 227.68 2.22388C229.786 0.741294 232.279 0 235.16 0C237.098 0 238.884 0.336952 240.518 1.0277C242.152 1.71845 243.5 2.69561 244.561 3.95918C245.623 5.2396 246.313 6.72219 246.65 8.42379H247.038C247.577 6.72219 248.453 5.2396 249.666 3.95918C250.879 2.67877 252.362 1.70161 254.097 1.0277C255.832 0.336952 257.719 0 259.724 0C262.403 0 264.762 0.572818 266.817 1.7353C268.872 2.89778 270.456 4.54885 271.585 6.70534C272.714 8.86183 273.286 11.3721 273.286 14.2194V35.5821C273.286 39.4233 270.187 42.5233 266.345 42.5233H265.57C261.729 42.5233 258.629 39.4233 258.629 35.5821V17.8247C258.629 15.9378 258.14 14.4721 257.18 13.3938C256.22 12.3324 254.939 11.7933 253.339 11.7933C252.261 11.7933 251.317 12.0292 250.542 12.5009C249.75 12.9726 249.144 13.6802 248.706 14.59C248.268 15.4998 248.049 16.5949 248.049 17.8584V35.5821C248.049 39.4233 244.949 42.5233 241.108 42.5233H240.99C237.148 42.5233 234.048 39.4233 234.048 35.5821V17.7742C234.048 16.5612 233.829 15.4998 233.408 14.59C232.987 13.6802 232.364 12.9726 231.572 12.5009C230.78 12.0292 229.837 11.7933 228.741 11.7933C227.646 11.7933 226.77 12.046 225.978 12.5346C225.187 13.0232 224.58 13.7308 224.142 14.6405C223.704 15.5503 223.485 16.6623 223.485 17.9427V35.5989C223.485 39.4402 220.385 42.5401 216.544 42.5401H215.803C211.961 42.5401 208.861 39.4402 208.861 35.5989V7.48033C208.861 3.63908 211.961 0.539123 215.803 0.539123Z" fill="black"/>
<path d="M138.859 42.5233L119.164 8.42383L138.859 42.5233Z" fill="black"/>
<path d="M94.8017 14.7088C93.3697 13.142 92.1061 12.6029 91.011 12.6029C89.9159 12.6029 89.0398 12.8556 88.248 13.3442C87.4562 13.8328 86.8497 14.5404 86.4116 15.4501C85.9736 16.3599 85.7546 17.4718 85.7546 18.7522V36.4085C85.7546 40.2498 82.6546 43.3497 78.8134 43.3497H78.0721C74.2308 43.3497 71.1309 40.2498 71.1309 36.4085V8.2899C71.1309 4.44865 74.2308 1.34869 78.0721 1.34869C81.9133 1.34869 85.0133 4.44865 85.0133 8.2899V9.23336H85.4008C86.3274 6.57144 87.8437 4.51604 89.9496 3.03345C92.0556 1.55086 94.549 0.80957 97.4299 0.80957C99.3674 0.80957 101.153 1.14652 102.787 1.83727C104.422 2.52802 105.736 3.55573 106.797 4.83614" fill="black"/>
<path d="M100.849 17.6067C105.138 17.6067 108.616 14.1294 108.616 9.83998C108.616 5.55053 105.138 2.07324 100.849 2.07324C96.5593 2.07324 93.082 5.55053 93.082 9.83998C93.082 14.1294 96.5593 17.6067 100.849 17.6067Z" fill="black"/>
<path d="M33.6955 39.2037C36.8777 39.2037 39.4573 36.624 39.4573 33.4418C39.4573 30.2596 36.8777 27.6799 33.6955 27.6799C30.5133 27.6799 27.9336 30.2596 27.9336 33.4418C27.9336 36.624 30.5133 39.2037 33.6955 39.2037Z" fill="black"/>
<path d="M38.3451 36.8286C36.8962 39.1872 34.4533 40.4677 31.5387 41.6133C28.624 42.7589 25.3051 43.3317 21.5649 43.3317C17.1508 43.3317 13.3433 42.4725 10.1086 40.7372C6.87381 39.0019 4.38037 36.5253 2.62822 33.2737C0.876074 30.0222 0 26.1641 0 21.6826C0 17.2011 0.876074 13.5452 2.62822 10.2768C4.38037 7.00835 6.85697 4.48121 10.058 2.69537C13.2422 0.909524 16.9655 0.0166016 21.228 0.0166016C25.4904 0.0166016 29.0452 0.875828 32.162 2.59428C35.2788 4.31274 37.688 6.78933 39.3897 10.0241C41.0913 13.2588 41.3777 15.112 41.7315 18.4479L41.782 19.2228C40.6532 20.7728 37.2669 25.0016 36.0201 25.0016H6.99175C5.74503 25.0016 4.71732 23.9907 4.71732 22.7271V19.0712C4.71732 17.8245 5.72818 16.7968 6.99175 16.7968H25.5578C27.2762 16.7968 28.961 15.2637 28.6577 13.1409C28.6577 13.1409 28.523 12.4838 28.1186 11.9952C27.4279 11.1529 26.4507 10.6811 25.76 10.4621C24.6817 10.142 23.6035 9.93983 21.9356 10.0578C20.6214 10.1588 19.0378 10.5969 17.9595 11.1529C16.8813 11.7088 16.0221 12.4838 15.4155 13.4778C14.809 14.4718 14.4552 15.6006 14.4047 16.8642V25.5238C14.4047 26.9727 14.7079 28.27 15.3145 29.4156C15.921 30.5613 16.797 31.4542 17.9258 32.0607C19.0546 32.6841 20.3687 32.9873 21.8682 32.9873C22.9296 32.9873 23.9067 32.8189 24.7996 32.4987C25.7094 32.1786 26.4339 31.7069 27.1078 31.2015C27.6132 30.8308 28.1186 30.4939 28.4219 30.2243C29.18 29.5673 29.9719 28.9439 30.7637 28.4553" fill="black"/>
<path d="M36.0373 24.9671C39.2195 24.9671 41.7991 22.3874 41.7991 19.2052C41.7991 16.023 39.2195 13.4434 36.0373 13.4434C32.8551 13.4434 30.2754 16.023 30.2754 19.2052C30.2754 22.3874 32.8551 24.9671 36.0373 24.9671Z" fill="black"/>
</g>
<defs>
<clipPath id="clip0_628_43827">
<rect width="273.285" height="43.3488" fill="white"/>
</clipPath>
</defs>
</svg>`}
                width={64.59}
                height={10.25}
              />
            </View>
            
            {/* 오른쪽 여백 (대칭을 위해) */}
            <View style={styles.headerSpacer} />
          </View>

          {/* 진행 상태 표시 */}
          <VerificationProgressBar currentStep={1} />

          {/* 메인 컨텐츠 */}
          <View style={styles.content}>
            {/* 헤더 텍스트 */}
            <View style={styles.headerContainer}>
              <Text style={styles.headerTitle}>휴대폰 인증</Text>
              <Text style={styles.headerSubtitle}>안전한 서비스이용을 위해 본인인증 해주세요.</Text>
            </View>

            {/* 입력 폼 */}
            <View style={styles.formContainer}>
              {/* 이름 입력 */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>이름</Text>
                <View style={styles.nameInputContainer}>
                  <TextInput
                    style={[styles.input, styles.nameInput]}
                    placeholder=""
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                  <View style={styles.nationalityContainer}>
                    <TouchableOpacity 
                      style={styles.nationalityDropdown}
                      onPress={() => setShowNationalityDropdown(!showNationalityDropdown)}
                    >
                      <Text style={styles.nationalityText}>{nationality}</Text>
                      <Ionicons name="chevron-down" size={14} color="#999" />
                    </TouchableOpacity>
                    
                    {showNationalityDropdown && (
                      <View style={styles.nationalityDropdownMenu}>
                        {nationalities.map((item, index) => (
                          <TouchableOpacity
                            key={index}
                            style={styles.dropdownItem}
                            onPress={() => handleNationalitySelect(item)}
                          >
                            <Text style={styles.dropdownItemText}>{item}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              </View>

              {/* 주민등록번호 입력 */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>주민등록번호 앞 7자리</Text>
                <TouchableOpacity 
                  style={styles.residentNumberContainer}
                  onPress={() => residentNumberRef.current?.focus()}
                >
                  <View style={styles.residentNumber1Container}>
                    {[...Array(6)].map((_, index) => (
                      <View key={index} style={[styles.digitInput, residentNumber1.length === index && styles.activeDigit]}>
                        <Text style={styles.digitText}>
                          {residentNumber1[index] || ''}
                        </Text>
                      </View>
                    ))}
                  </View>
                  <View style={styles.dashContainer}>
                    <Text style={styles.dash}>-</Text>
                  </View>
                  <View style={styles.residentNumber2Container}>
                    <View style={[styles.digitInput, residentNumber1.length === 6 && residentNumber2.length === 0 && styles.activeDigit]}>
                      <Text style={styles.digitText}>
                        {residentNumber2[0] || ''}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
                <TextInput
                  ref={residentNumberRef}
                  style={styles.hiddenInput}
                  value={residentNumber1 + residentNumber2}
                  onChangeText={(text) => {
                    const numbers = text.replace(/[^\d]/g, '');
                    if (numbers.length <= 6) {
                      setResidentNumber1(numbers);
                      setResidentNumber2('');
                    } else {
                      setResidentNumber1(numbers.slice(0, 6));
                      setResidentNumber2(numbers.slice(6, 7));
                    }
                  }}
                  keyboardType="numeric"
                  maxLength={7}
                />
              </View>

              {/* 전화번호 입력 */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>전화번호</Text>
                <TouchableOpacity 
                  style={styles.phoneOutlineContainer}
                  onPress={() => phoneInputRef.current?.focus()}
                >
                  <View style={styles.phoneInnerContainer}>
                    <View style={styles.carrierContainer}>
                      <TouchableOpacity 
                        style={styles.carrierButton}
                        onPress={() => setShowCarrierDropdown(!showCarrierDropdown)}
                      >
                        <Text style={[styles.carrierText, carrier === '통신사' && styles.placeholderText]}>
                          {carrier}
                        </Text>
                        <Ionicons name="chevron-down" size={14} color="#3F3F3F" />
                      </TouchableOpacity>
                      
                      {showCarrierDropdown && (
                        <View style={styles.carrierDropdownMenu}>
                          {carriers.map((item, index) => (
                            <TouchableOpacity
                              key={index}
                              style={styles.dropdownItem}
                              onPress={() => handleCarrierSelect(item)}
                            >
                              <Text style={styles.dropdownItemText}>{item}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                    <Text style={[styles.phoneInputPlaceholder, phoneNumber && styles.phoneInputText]}>
                      {phoneNumber || '전화번호를 입력해주세요'}
                    </Text>
                  </View>
                </TouchableOpacity>
                <TextInput
                  ref={phoneInputRef}
                  style={styles.phoneInputHidden}
                  value={phoneNumber}
                  onChangeText={(text) => setPhoneNumber(formatPhoneNumber(text))}
                  keyboardType="phone-pad"
                  maxLength={13}
                />
              </View>

              {/* 인증하기 버튼 */}
              {!showVerificationCode && (
                <TouchableOpacity 
                  style={styles.verifyButton}
                  onPress={handleVerifyPhone}
                >
                  <View style={styles.verifyArrowCircle}>
                    <Ionicons name="arrow-forward" size={35} color="#FFFFFF" />
                  </View>
                  <Text style={styles.verifyButtonText}>인증하기</Text>
                </TouchableOpacity>
              )}

              {/* 인증번호 입력 */}
              {showVerificationCode && (
                <View style={styles.verificationContainer}>
                  <Text style={styles.inputLabel}>인증번호</Text>
                  <View style={styles.verificationInputContainer}>
                    <TextInput
                      style={styles.verificationInput}
                      placeholder="인증번호 4자리를 입력해주세요"
                      value={verificationCode}
                      onChangeText={setVerificationCode}
                      keyboardType="numeric"
                      maxLength={4}
                    />
                    <TouchableOpacity 
                      style={styles.confirmButton}
                      onPress={handleConfirmVerification}
                    >
                      <Text style={styles.confirmButtonText}>확인</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* 다음 버튼 */}
              <TouchableOpacity 
                style={[
                  styles.nextButton,
                  (!isVerified || isLoading) && styles.nextButtonDisabled
                ]}
                onPress={handleNext}
                disabled={!isVerified || isLoading}
              >
                <View style={styles.greenArrowCircle}>
                  <Ionicons name="arrow-forward" size={35} color="#FFFFFF" />
                </View>
                <Text style={styles.nextButtonText}>
                  {isLoading ? '처리중...' : '다음'}
                </Text>
              </TouchableOpacity>

            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 64.59,
    height: 10.25,
  },
  headerSpacer: {
    width: 40,
    height: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 0,
  },
  headerContainer: {
    alignItems: 'flex-start',
    marginBottom: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#0C1421',
    marginBottom: 16.88,
    fontFamily: 'Pretendard',
    lineHeight: 30,
    letterSpacing: 0.24,
  },
  headerSubtitle: {
    fontSize: 15.79,
    color: '#313957',
    fontFamily: 'Pretendard',
    fontWeight: '400',
    lineHeight: 25.26,
    letterSpacing: 0.16,
  },
  formContainer: {
    gap: 26,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 13.68,
    color: '#0C1421',
    fontWeight: '400',
    marginBottom: 8.42,
    fontFamily: 'Pretendard',
    lineHeight: 13.68,
    letterSpacing: 0.14,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 100,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14.73,
    color: '#000000',
    borderWidth: 1.05,
    borderColor: '#000000',
    height: 45,
    fontFamily: 'Pretendard',
    fontWeight: '400',
    lineHeight: 14.73,
    letterSpacing: 0.15,
  },
  nameInput: {
    flex: 1,
    marginRight: 6,
    includeFontPadding: false,
    paddingVertical: 0,
  },
  nameInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nationalityContainer: {
    position: 'relative',
  },
  nationalityDropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 100,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: 105,
    height: 45,
    justifyContent: 'center',
    borderWidth: 1.05,
    borderColor: '#D9D9D9',
  },
  nationalityText: {
    fontSize: 14.73,
    color: '#8F8F8F',
    fontWeight: '400',
    fontFamily: 'Pretendard',
    lineHeight: 14.73,
    letterSpacing: 0.15,
  },
  nationalityDropdownMenu: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 1000,
  },
  dropdown: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    height: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 14,
    color: '#333',
  },
  placeholderText: {
    color: '#999',
  },
  dropdownMenu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginTop: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#333',
  },
  residentNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 45,
  },
  residentNumber1Container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  residentNumber2Container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  digitInput: {
    width: 23,
    height: 45,
    backgroundColor: '#FFFFFF',
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.05,
    borderColor: '#D9D9D9',
    marginHorizontal: 3,
  },
  activeDigit: {
    borderColor: '#000000',
  },
  digitText: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
  },
  dashContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  dash: {
    fontSize: 32,
    color: '#C1C1C1',
    fontWeight: '200',
    fontFamily: 'Pretendard',
    lineHeight: 32,
    letterSpacing: 0.32,
  },
  hiddenInput: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    width: 1,
    height: 1,
    opacity: 0,
  },
  phoneOutlineContainer: {
    width: 380.05,
    height: 44.16,
    borderRadius: 100,
    borderWidth: 1.05,
    borderColor: '#D9D9D9',
    backgroundColor: '#FFFFFF',
    zIndex: 3000,
  },
  phoneInnerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 5,
    paddingRight: 10,
    height: 44.96,
    borderRadius: 100,
    justifyContent: 'flex-start',
    gap: 10,
    zIndex: 3000,
  },
  phoneContainer: {
    flexDirection: 'row',
    gap: 10,
    height: 45,
  },
  carrierContainer: {
    position: 'relative',
    zIndex: 3000,
  },
  carrierButton: {
    backgroundColor: '#EEEEEE',
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    minWidth: 70,
    height: 32,
  },
  carrierText: {
    fontSize: 14.73,
    color: '#3F3F3F',
    fontWeight: '400',
    fontFamily: 'Pretendard',
    lineHeight: 14.73,
    letterSpacing: 0.15,
  },
  carrierDropdownMenu: {
    position: 'absolute',
    top: 35,
    left: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 5000,
    minWidth: 90,
  },
  phoneInputPlaceholder: {
    fontSize: 14.73,
    color: '#8F8F8F',
    fontFamily: 'Pretendard',
    fontWeight: '400',
    lineHeight: 14.73,
    letterSpacing: 0.15,
    flex: 1,
  },
  phoneInputText: {
    color: '#000000',
  },
  phoneInputHidden: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    width: 1,
    height: 1,
    opacity: 0,
  },
  phoneInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 100,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 14.73,
    color: '#8F8F8F',
    borderWidth: 1.05,
    borderColor: '#D9D9D9',
    height: 44.16,
    fontFamily: 'Pretendard',
    fontWeight: '400',
    lineHeight: 14.73,
    letterSpacing: 0.15,
  },
  nextButton: {
    backgroundColor: '#000',
    borderRadius: 40,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 40,
  },
  greenArrowCircle: {
    position: 'absolute',
    right: 6,
    width: 43,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#10B585',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#ADB5BD',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  verifyButton: {
    backgroundColor: '#000',
    borderRadius: 40,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 0,
  },
  verifyArrowCircle: {
    position: 'absolute',
    right: 6,
    width: 43,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#10B585',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  verificationContainer: {
    gap: 8,
    marginTop: 20,
  },
  verificationInputContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  verificationInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 9,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#000',
    borderWidth: 1,
    borderColor: '#D9D9D9',
    height: 45,
  },
  confirmButton: {
    backgroundColor: '#28A745',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});