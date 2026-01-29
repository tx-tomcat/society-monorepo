import { MotiView } from 'moti';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
} from 'react-native';

import { colors, Text, View } from '@/components/ui';
import { ChevronDown, Search, X } from '@/components/ui/icons';

export type Occasion = {
  id: string;
  name: string;
  emoji?: string;
};

type OccasionSelectorProps = {
  occasions: Occasion[];
  selectedOccasion: string | null;
  onSelect: (id: string) => void;
  isLoading?: boolean;
  label?: string;
  required?: boolean;
};

/**
 * Premium occasion selector with search and elegant selection display
 * Designed for handling large lists (10-20+ occasions) while maintaining luxury feel
 */
export function OccasionSelector({
  occasions,
  selectedOccasion,
  onSelect,
  isLoading = false,
  label,
  required = false,
}: OccasionSelectorProps) {
  const { t } = useTranslation();
  const scrollRef = React.useRef<ScrollView>(null);
  const searchInputRef = React.useRef<TextInput>(null);
  const [isExpanded, setIsExpanded] = React.useState(!selectedOccasion);
  const [searchQuery, setSearchQuery] = React.useState('');

  // Find selected occasion details
  const selectedOccasionData = React.useMemo(
    () => occasions.find((o) => o.id === selectedOccasion),
    [occasions, selectedOccasion]
  );

  // Filter occasions based on search query
  const filteredOccasions = React.useMemo(() => {
    if (!searchQuery.trim()) return occasions;
    const query = searchQuery.toLowerCase().trim();
    return occasions.filter(
      (o) =>
        o.name.toLowerCase().includes(query) ||
        (o.emoji && o.emoji.includes(query))
    );
  }, [occasions, searchQuery]);

  // Handle selection with animation
  const handleSelect = React.useCallback(
    (id: string) => {
      onSelect(id);
      setSearchQuery('');
      // Collapse after selection for cleaner UX
      setTimeout(() => setIsExpanded(false), 150);
    },
    [onSelect]
  );

  // Toggle expanded state
  const toggleExpanded = React.useCallback(() => {
    setIsExpanded((prev) => {
      const newState = !prev;
      // Focus search input when expanding
      if (newState) {
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
      return newState;
    });
    setSearchQuery('');
  }, []);

  // Clear search
  const clearSearch = React.useCallback(() => {
    setSearchQuery('');
    searchInputRef.current?.focus();
  }, []);

  // Loading state
  if (isLoading && occasions.length === 0) {
    return (
      <View className="px-4 pt-6">
        {label && (
          <Text className="mb-3 font-urbanist-semibold text-base text-midnight">
            {label}
            {required && ' *'}
          </Text>
        )}
        <View className="flex-row items-center gap-3 rounded-2xl bg-white p-4">
          <View className="size-12 items-center justify-center rounded-xl bg-softpink">
            <ActivityIndicator size="small" color={colors.rose[400]} />
          </View>
          <Text className="text-sm text-text-tertiary">{t('common.loading')}</Text>
        </View>
      </View>
    );
  }

  // Empty state
  if (occasions.length === 0) {
    return (
      <View className="px-4 pt-6">
        {label && (
          <Text className="mb-3 font-urbanist-semibold text-base text-midnight">
            {label}
            {required && ' *'}
          </Text>
        )}
        <View className="rounded-2xl bg-white p-4">
          <Text className="text-sm text-text-tertiary">
            {t('hirer.booking.no_occasions')}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="pt-6">
      {/* Section Label */}
      {label && (
        <Text className="mb-3 px-4 font-urbanist-semibold text-base text-midnight">
          {label}
          {required && ' *'}
        </Text>
      )}

      {/* Selected Occasion Preview (when collapsed) */}
      {selectedOccasionData && !isExpanded && (
        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="mx-4"
        >
          <Pressable
            onPress={toggleExpanded}
            className="flex-row items-center justify-between rounded-2xl bg-white p-4"
            style={styles.selectedCard}
          >
            {/* Selected occasion display */}
            <View className="flex-1 flex-row items-center gap-3">
              <View className="size-12 items-center justify-center rounded-xl bg-rose-400/10">
                <Text className="text-2xl">
                  {selectedOccasionData.emoji || '📅'}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-xs uppercase tracking-wider text-rose-400">
                  {t('hirer.booking.selected')}
                </Text>
                <Text className="font-urbanist-semibold text-base text-midnight">
                  {selectedOccasionData.name}
                </Text>
              </View>
            </View>

            {/* Change button */}
            <View className="flex-row items-center gap-1">
              <Text className="text-sm font-medium text-teal-400">
                {t('common.change')}
              </Text>
              <MotiView
                animate={{ rotate: isExpanded ? '180deg' : '0deg' }}
                transition={{ type: 'timing', duration: 200 }}
              >
                <ChevronDown color={colors.teal[400]} width={16} height={16} />
              </MotiView>
            </View>
          </Pressable>
        </MotiView>
      )}

      {/* Occasion Grid (expanded or no selection) */}
      {(isExpanded || !selectedOccasion) && (
        <MotiView
          from={{ opacity: 0, translateY: -10 }}
          animate={{ opacity: 1, translateY: 0 }}
          exit={{ opacity: 0, translateY: -10 }}
          transition={{ type: 'timing', duration: 250 }}
        >
          {/* Search Input */}
          <View className="mx-4 mb-3">
            <View
              className="flex-row items-center gap-2 rounded-xl bg-white px-3 py-2.5"
              style={styles.searchContainer}
            >
              <Search color={colors.text.tertiary} width={18} height={18} />
              <TextInput
                ref={searchInputRef}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={t('hirer.booking.search_occasion')}
                placeholderTextColor={colors.text.tertiary}
                style={styles.searchInput}
                className="flex-1 py-1 text-sm"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <Pressable
                  onPress={clearSearch}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <View className="size-5 items-center justify-center rounded-full bg-text-tertiary/20">
                    <X color={colors.text.tertiary} width={12} height={12} />
                  </View>
                </Pressable>
              )}
            </View>
          </View>

          {/* No results state */}
          {filteredOccasions.length === 0 && searchQuery.length > 0 && (
            <View className="mx-4 items-center rounded-xl bg-white/50 py-6">
              <Text className="text-2xl">🔍</Text>
              <Text className="mt-2 text-sm text-text-tertiary">
                {t('hirer.booking.no_search_results')}
              </Text>
              <Pressable onPress={clearSearch} className="mt-2">
                <Text className="text-sm font-medium text-teal-400">
                  {t('common.clear_search')}
                </Text>
              </Pressable>
            </View>
          )}

          {/* Horizontal scroll for occasions */}
          {filteredOccasions.length > 0 && (
            <ScrollView
              ref={scrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              decelerationRate="fast"
              snapToAlignment="start"
              keyboardShouldPersistTaps="handled"
            >
              {filteredOccasions.map((occasion, index) => {
                const isSelected = selectedOccasion === occasion.id;

                return (
                  <MotiView
                    key={occasion.id}
                    from={{ opacity: 0, translateY: 10 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{
                      type: 'timing',
                      duration: 300,
                      delay: index * 30,
                    }}
                  >
                    <Pressable
                      onPress={() => handleSelect(occasion.id)}
                      style={[
                        styles.occasionCard,
                        isSelected && styles.occasionCardSelected,
                      ]}
                    >
                      {/* Emoji container with gradient background */}
                      <View
                        style={[
                          styles.emojiContainer,
                          isSelected && styles.emojiContainerSelected,
                        ]}
                      >
                        <Text className="text-2xl">{occasion.emoji || '📅'}</Text>
                      </View>

                      {/* Name */}
                      <Text
                        className={`mt-2 text-center text-xs font-medium ${
                          isSelected ? 'text-rose-400' : 'text-text-secondary'
                        }`}
                        numberOfLines={2}
                      >
                        {occasion.name}
                      </Text>

                      {/* Selection indicator */}
                      {isSelected && (
                        <MotiView
                          from={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', damping: 15, stiffness: 400 }}
                          style={styles.checkIndicator}
                        >
                          <View className="size-full items-center justify-center rounded-full bg-rose-400">
                            <Text className="text-xs text-white">✓</Text>
                          </View>
                        </MotiView>
                      )}
                    </Pressable>
                  </MotiView>
                );
              })}
            </ScrollView>
          )}

          {/* Collapse button when expanded with selection */}
          {selectedOccasion && isExpanded && (
            <Pressable
              onPress={toggleExpanded}
              className="mx-4 mt-3 flex-row items-center justify-center gap-1 rounded-xl bg-white/50 py-2"
            >
              <Text className="text-xs font-medium text-text-tertiary">
                {t('common.collapse')}
              </Text>
              <MotiView
                animate={{ rotate: '180deg' }}
                transition={{ type: 'timing', duration: 200 }}
              >
                <ChevronDown color={colors.text.tertiary} width={12} height={12} />
              </MotiView>
            </Pressable>
          )}
        </MotiView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  selectedCard: {
    shadowColor: colors.rose[400],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  searchContainer: {
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  searchInput: {
    fontFamily: 'Urbanist_400Regular',
    color: colors.midnight.DEFAULT,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 4,
  },
  occasionCard: {
    width: 88,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: colors.white,
    position: 'relative',
  },
  occasionCardSelected: {
    backgroundColor: colors.rose[50],
    borderWidth: 1.5,
    borderColor: colors.rose[400],
  },
  emojiContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.softpink.DEFAULT,
  },
  emojiContainerSelected: {
    backgroundColor: colors.rose[100],
  },
  checkIndicator: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
  },
});
