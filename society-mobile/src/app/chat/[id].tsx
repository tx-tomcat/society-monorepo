/* eslint-disable max-lines-per-function */
import { router, useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Pressable, TextInput } from 'react-native';
import {
  GiftedChat,
  type IMessage,
  type InputToolbarProps,
} from 'react-native-gifted-chat';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import {
  colors,
  FocusAwareStatusBar,
  Image,
  SafeAreaView,
  Text,
  View,
} from '@/components/ui';
import {
  ArrowLeft,
  Camera,
  MoreVertical,
  Paperclip,
  Phone,
  Send as SendIcon,
  Smiley,
  Video,
} from '@/components/ui/icons';

// Mock chat data
const MOCK_USER = {
  _id: 1,
  name: 'Andrew',
};

const MOCK_OTHER_USER = {
  _id: 2,
  name: 'Isabella',
  level: 3,
  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80',
  favorability: 86,
};

const MOCK_MESSAGES: IMessage[] = [
  {
    _id: 2,
    text: 'Likewise, Andrew. Your curiosity keeps things interesting 👀',
    createdAt: new Date(2024, 0, 1, 9, 41),
    user: MOCK_OTHER_USER,
  },
  {
    _id: 1,
    text: 'Isabella, you challenge me. In a good way 😄',
    createdAt: new Date(2024, 0, 1, 9, 41),
    user: MOCK_USER,
  },
];

const QUICK_ACTIONS = [
  { id: 'selfie', label: 'Selfie', icon: 'camera' },
  { id: 'quiz', label: 'Quiz' },
  { id: 'topic', label: 'Topic' },
  { id: 'suggestion', label: 'Suggestion' },
];

// Favorability indicator component
function FavorabilityIndicator({ percentage }: { percentage: number }) {
  return (
    <View className="absolute bottom-[200px] right-6 size-[72px]">
      <Svg width={72} height={72} viewBox="0 0 72 72">
        <Defs>
          <LinearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#C9A961" stopOpacity="0.2" />
            <Stop offset="1" stopColor="#C9A961" stopOpacity="0.6" />
          </LinearGradient>
        </Defs>
        {/* Outer circle */}
        <Circle
          cx="36"
          cy="36"
          r="35"
          fill="none"
          stroke="url(#grad1)"
          strokeWidth="2"
        />
        {/* Inner circle */}
        <Circle
          cx="36"
          cy="36"
          r="30"
          fill="none"
          stroke="#C9A961"
          strokeWidth="2"
          opacity="0.6"
        />
        {/* Heart shape */}
        <Circle cx="36" cy="36" r="20" fill="#C9A961" />
        {/* Percentage text */}
        <SvgText
          x="36"
          y="40"
          fontSize="18"
          fontWeight="bold"
          fill="white"
          textAnchor="middle"
        >
          {percentage}%
        </SvgText>
      </Svg>
    </View>
  );
}

// Custom Input Toolbar
function CustomInputToolbar(
  props: InputToolbarProps<IMessage> & {
    onSendMessage: (text: string) => void;
  }
) {
  const [inputText, setInputText] = React.useState('');

  const handleSend = () => {
    if (inputText.trim()) {
      props.onSendMessage(inputText.trim());
      setInputText('');
    }
  };

  return (
    <View className="border-t border-neutral-800 bg-neutral-900">
      {/* Quick Actions */}
      <View className="flex-row gap-3 px-6 py-4">
        {QUICK_ACTIONS.map((action) => (
          <Pressable
            key={action.id}
            className="flex-row items-center gap-2 rounded-full border border-neutral-700 px-5 py-2"
          >
            {action.icon === 'camera' && (
              <Camera color={colors.offwhite.DEFAULT} size={16} />
            )}
            <Text
              className="text-base font-semibold leading-[1.6] tracking-[0.2px] text-offwhite"
              style={{ fontFamily: 'Urbanist_600SemiBold' }}
            >
              {action.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Input Area */}
      <View className="flex-row items-center gap-4 px-6 pb-9 pt-6">
        <View className="flex-1 flex-row items-center gap-3 rounded-[10px] border border-neutral-700 bg-neutral-800 px-5 py-[18px]">
          <Smiley color={colors.offwhite.DEFAULT} size={20} />
          <TextInput
            style={{
              fontFamily: 'Urbanist_400Regular',
              fontSize: 18,
              lineHeight: 28.8,
              letterSpacing: 0.2,
              color: colors.offwhite.DEFAULT,
              flex: 1,
            }}
            placeholder="Type a message ..."
            placeholderTextColor={colors.neutral[500]}
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <Paperclip color={colors.offwhite.DEFAULT} size={20} />
        </View>

        {/* Send Button */}
        <Pressable
          className="size-14 items-center justify-center rounded-full bg-gold-400"
          onPress={handleSend}
        >
          <SendIcon color={colors.midnight.DEFAULT} size={28} />
        </Pressable>
      </View>
    </View>
  );
}

export default function ChatScreen() {
  const _id = useLocalSearchParams().id;
  const [messages, setMessages] = React.useState<IMessage[]>(MOCK_MESSAGES);

  const onSend = React.useCallback((newMessages: IMessage[] = []) => {
    setMessages((previousMessages) =>
      GiftedChat.append(previousMessages, newMessages)
    );
  }, []);

  const handleBackPress = React.useCallback(() => {
    router.back();
  }, []);

  return (
    <View className="flex-1 bg-midnight">
      <FocusAwareStatusBar />

      {/* Header */}
      <SafeAreaView edges={['top']}>
        <View className="flex-row items-center gap-3 px-6 py-3">
          {/* Back Button */}
          <Pressable onPress={handleBackPress} testID="back-button">
            <ArrowLeft color={colors.offwhite.DEFAULT} size={28} />
          </Pressable>

          {/* User Info */}
          <View className="flex-1 flex-row items-center gap-3">
            <Image
              source={{ uri: MOCK_OTHER_USER.avatar }}
              className="size-10 rounded-full"
            />
            <View className="flex-row items-center gap-2">
              <Text
                className="text-2xl font-bold leading-[1.4] text-offwhite"
                style={{ fontFamily: 'Urbanist_700Bold', letterSpacing: 0 }}
              >
                {MOCK_OTHER_USER.name}
              </Text>
              <View className="rounded-full border border-gold-400 bg-gold-400/10 px-2.5 py-0.5">
                <Text className="text-xs font-semibold leading-[1.6] tracking-[0.2px] text-gold-400">
                  Lv.{MOCK_OTHER_USER.level}
                </Text>
              </View>
            </View>
          </View>

          {/* Action Icons */}
          <View className="flex-row items-center gap-5">
            <Pressable testID="phone-button">
              <Phone color={colors.offwhite.DEFAULT} size={28} />
            </Pressable>
            <Pressable testID="video-button">
              <Video color={colors.offwhite.DEFAULT} size={28} />
            </Pressable>
            <Pressable testID="more-button">
              <MoreVertical color={colors.offwhite.DEFAULT} size={28} />
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      {/* Chat Messages */}
      <GiftedChat
        messages={messages}
        onSend={(newMessages) => onSend(newMessages)}
        user={MOCK_USER}
        renderInputToolbar={(props) => (
          <CustomInputToolbar
            {...props}
            onSendMessage={(text) => {
              onSend([
                {
                  _id: Math.random().toString(),
                  text,
                  createdAt: new Date(),
                  user: MOCK_USER,
                },
              ]);
            }}
          />
        )}
        minInputToolbarHeight={180}
        bottomOffset={0}
        messagesContainerStyle={{
          paddingHorizontal: 24,
          paddingBottom: 16,
        }}
        renderChatEmpty={() => <View className="flex-1" />}
        renderAvatar={null}
        renderBubble={(props) => {
          const isCurrentUser =
            props.currentMessage?.user._id === MOCK_USER._id;
          return (
            <View
              className={`mb-4 max-w-[300px] rounded-lg px-4 py-3 ${
                isCurrentUser
                  ? 'self-end rounded-tr-sm bg-gold-400'
                  : 'self-start rounded-tl-sm bg-neutral-800'
              }`}
            >
              <Text
                className={`text-lg font-medium leading-[1.6] tracking-[0.2px] ${
                  isCurrentUser ? 'text-midnight' : 'text-offwhite'
                }`}
                style={{ fontFamily: 'Urbanist_500Medium' }}
              >
                {props.currentMessage?.text}
              </Text>
              <Text
                className={`mt-1 self-end text-xs font-medium leading-[1.6] tracking-[0.2px] ${
                  isCurrentUser
                    ? 'text-midnight opacity-70'
                    : 'text-neutral-500'
                }`}
                style={{ fontFamily: 'Urbanist_500Medium' }}
              >
                {new Date(
                  props.currentMessage?.createdAt || new Date()
                ).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          );
        }}
        alwaysShowSend
        textInputProps={{
          style: {
            fontFamily: 'Urbanist_400Regular',
            fontSize: 18,
            lineHeight: 28.8,
            letterSpacing: 0.2,
            color: colors.offwhite.DEFAULT,
            flex: 1,
          },
          placeholder: 'Type a message ...',
          placeholderTextColor: colors.neutral[500],
        }}
      />

      {/* Favorability Indicator */}
      <FavorabilityIndicator percentage={MOCK_OTHER_USER.favorability} />
    </View>
  );
}
