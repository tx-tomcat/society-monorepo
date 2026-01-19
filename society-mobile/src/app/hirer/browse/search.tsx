/* eslint-disable max-lines-per-function */
import { FlashList } from '@shopify/flash-list';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard, Pressable, StyleSheet, TextInput } from 'react-native';

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
  Clock,
  MapPin,
  Search,
  ShieldCheck,
  Star,
  X,
} from '@/components/ui/icons';

type Companion = {
  id: string;
  name: string;
  image: string;
  rating: number;
  reviewCount: number;
  hourlyRate: number;
  location: string;
  isVerified: boolean;
};

const RECENT_SEARCHES = [
  'Wedding companion',
  'Business event',
  'District 1',
  'Tết celebration',
];

const MOCK_COMPANIONS: Companion[] = [
  {
    id: '1',
    name: 'Minh Anh',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    rating: 4.9,
    reviewCount: 127,
    hourlyRate: 500000,
    location: 'District 1, HCMC',
    isVerified: true,
  },
  {
    id: '2',
    name: 'Thu Hương',
    image: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400',
    rating: 4.8,
    reviewCount: 98,
    hourlyRate: 450000,
    location: 'District 3, HCMC',
    isVerified: true,
  },
  {
    id: '3',
    name: 'Ngọc Trâm',
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400',
    rating: 5.0,
    reviewCount: 64,
    hourlyRate: 600000,
    location: 'District 7, HCMC',
    isVerified: true,
  },
  {
    id: '4',
    name: 'Hoàng Yến',
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400',
    rating: 4.7,
    reviewCount: 45,
    hourlyRate: 350000,
    location: 'Bình Thạnh',
    isVerified: true,
  },
];

function SearchResultItem({
  companion,
  onPress,
}: {
  companion: Companion;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="mx-4 mb-3 flex-row items-center gap-3 rounded-xl bg-white p-3"
    >
      <Image
        source={{ uri: companion.image }}
        className="size-14 rounded-xl"
        contentFit="cover"
      />
      <View className="flex-1">
        <View className="flex-row items-center gap-1">
          <Text style={styles.name} className="text-base text-midnight">
            {companion.name}
          </Text>
          {companion.isVerified && (
            <ShieldCheck color={colors.teal[400]} width={16} height={16} />
          )}
        </View>
        <View className="mt-1 flex-row items-center gap-2">
          <View className="flex-row items-center gap-1">
            <Star color={colors.yellow[400]} width={12} height={12} />
            <Text className="text-xs font-medium text-midnight">
              {companion.rating}
            </Text>
          </View>
          <View className="flex-row items-center gap-1">
            <MapPin color={colors.text.tertiary} width={12} height={12} />
            <Text className="text-xs text-text-tertiary">
              {companion.location}
            </Text>
          </View>
        </View>
      </View>
      <Text style={styles.price} className="text-sm text-rose-400">
        {companion.hourlyRate.toLocaleString('vi-VN')}đ
      </Text>
    </Pressable>
  );
}

export default function SearchScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<Companion[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const inputRef = React.useRef<TextInput>(null);

  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  React.useEffect(() => {
    if (query.length > 0) {
      setIsSearching(true);
      // Simulate search with debounce
      const timer = setTimeout(() => {
        const filtered = MOCK_COMPANIONS.filter(
          (c) =>
            c.name.toLowerCase().includes(query.toLowerCase()) ||
            c.location.toLowerCase().includes(query.toLowerCase())
        );
        setResults(filtered);
        setIsSearching(false);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setResults([]);
      setIsSearching(false);
    }
  }, [query]);

  const handleBack = React.useCallback(() => {
    Keyboard.dismiss();
    router.back();
  }, [router]);

  const handleClear = React.useCallback(() => {
    setQuery('');
    inputRef.current?.focus();
  }, []);

  const handleRecentSearch = React.useCallback((search: string) => {
    setQuery(search);
  }, []);

  const handleCompanionPress = React.useCallback(
    (companion: Companion) => {
      router.push(`/hirer/companion/${companion.id}` as Href);
    },
    [router]
  );

  const renderResult = React.useCallback(
    ({ item }: { item: Companion }) => (
      <SearchResultItem
        companion={item}
        onPress={() => handleCompanionPress(item)}
      />
    ),
    [handleCompanionPress]
  );

  return (
    <View className="flex-1 bg-warmwhite">
      <FocusAwareStatusBar />

      <SafeAreaView edges={['top']}>
        {/* Search Header */}
        <View className="flex-row items-center gap-3 px-4 py-3">
          <Pressable
            onPress={handleBack}
            className="size-10 items-center justify-center"
          >
            <ArrowLeft color={colors.midnight.DEFAULT} width={24} height={24} />
          </Pressable>

          <View className="flex-1 flex-row items-center gap-2 rounded-xl bg-white px-4 py-3">
            <Search color={colors.text.tertiary} width={20} height={20} />
            <TextInput
              ref={inputRef}
              value={query}
              onChangeText={setQuery}
              placeholder={t('hirer.search.placeholder')}
              placeholderTextColor={colors.text.tertiary}
              style={[styles.input, { color: colors.midnight.DEFAULT }]}
              className="flex-1 text-base"
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {query.length > 0 && (
              <Pressable onPress={handleClear}>
                <X color={colors.text.tertiary} width={18} height={18} />
              </Pressable>
            )}
          </View>
        </View>
      </SafeAreaView>

      {/* Content */}
      {query.length === 0 ? (
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 300 }}
          className="px-4 pt-4"
        >
          <Text
            style={styles.sectionTitle}
            className="mb-3 text-base text-midnight"
          >
            {t('hirer.search.recent')}
          </Text>
          {RECENT_SEARCHES.map((search, index) => (
            <Pressable
              key={search}
              onPress={() => handleRecentSearch(search)}
              className="mb-2 flex-row items-center gap-3 rounded-xl bg-white px-4 py-3"
            >
              <Clock color={colors.text.tertiary} width={18} height={18} />
              <Text className="flex-1 text-base text-text-secondary">
                {search}
              </Text>
            </Pressable>
          ))}
        </MotiView>
      ) : (
        <View className="flex-1 pt-2">
          {isSearching ? (
            <View className="items-center py-8">
              <Text className="text-text-tertiary">
                {t('hirer.search.searching')}
              </Text>
            </View>
          ) : results.length > 0 ? (
            <>
              <Text className="mb-3 px-4 text-sm text-text-tertiary">
                {results.length} {t('hirer.search.results_found')}
              </Text>
              <FlashList
                data={results}
                renderItem={renderResult}
                estimatedItemSize={80}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
              />
            </>
          ) : (
            <View className="items-center px-8 py-12">
              <View className="mb-4 size-16 items-center justify-center rounded-full bg-softpink">
                <Search color={colors.rose[400]} width={28} height={28} />
              </View>
              <Text
                style={styles.emptyTitle}
                className="text-center text-lg text-midnight"
              >
                {t('hirer.search.no_results')}
              </Text>
              <Text className="mt-2 text-center text-sm text-text-tertiary">
                {t('hirer.search.try_different')}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    fontFamily: 'Urbanist_400Regular',
  },
  sectionTitle: {
    fontFamily: 'Urbanist_600SemiBold',
  },
  name: {
    fontFamily: 'Urbanist_600SemiBold',
  },
  price: {
    fontFamily: 'Urbanist_600SemiBold',
  },
  emptyTitle: {
    fontFamily: 'Urbanist_700Bold',
  },
});
