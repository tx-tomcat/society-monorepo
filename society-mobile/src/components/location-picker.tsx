import * as Location from 'expo-location';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Keyboard,
  Modal,
  Pressable,
  TextInput,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { Button, colors, SafeAreaView, Text, View } from '@/components/ui';
import { ArrowLeft, MapPin, Search, X } from '@/components/ui/icons';

type LocationData = {
  address: string;
  latitude: number;
  longitude: number;
};

type LocationPickerProps = {
  visible: boolean;
  onClose: () => void;
  onSelect: (location: LocationData) => void;
  initialLocation?: LocationData;
};

type NominatimResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address: {
    house_number?: string;
    road?: string;
    suburb?: string;
    city?: string;
    state?: string;
    country?: string;
  };
};

const DEFAULT_REGION = {
  latitude: 10.8231, // Ho Chi Minh City
  longitude: 106.6297,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

export function LocationPicker({
  visible,
  onClose,
  onSelect,
  initialLocation,
}: LocationPickerProps) {
  const { t } = useTranslation();
  const mapRef = React.useRef<MapView>(null);

  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [selectedLocation, setSelectedLocation] = React.useState<LocationData | null>(
    initialLocation || null
  );
  const [region, setRegion] = React.useState({
    ...DEFAULT_REGION,
    ...(initialLocation && {
      latitude: initialLocation.latitude,
      longitude: initialLocation.longitude,
    }),
  });
  const [isLoadingLocation, setIsLoadingLocation] = React.useState(false);

  // Get current location on mount
  React.useEffect(() => {
    if (visible && !initialLocation) {
      getCurrentLocation();
    }
  }, [visible, initialLocation]);

  const getCurrentLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setIsLoadingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 500);

      // Reverse geocode to get address
      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (address) {
        const formattedAddress = formatAddress(address);
        setSelectedLocation({
          address: formattedAddress,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    } catch {
      // Silently fail - user can still select location manually
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const formatAddress = (address: Location.LocationGeocodedAddress): string => {
    const parts = [
      address.streetNumber,
      address.street,
      address.district,
      address.city,
      address.region,
    ].filter(Boolean);
    return parts.join(', ') || address.name || '';
  };

  // Search places using Nominatim (OpenStreetMap)
  const searchPlaces = React.useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Use Nominatim API (free, no API key needed)
      // Bias towards Vietnam with viewbox parameter
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(query)}&` +
        `format=json&` +
        `addressdetails=1&` +
        `limit=5&` +
        `countrycodes=vn&` +
        `viewbox=102.14,8.18,109.46,23.39&` + // Vietnam bounding box
        `bounded=0`,
        {
          headers: {
            'Accept-Language': 'vi,en',
            'User-Agent': 'HiremeApp/1.0',
          },
        }
      );
      const data = await response.json();
      setSearchResults(data || []);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        searchPlaces(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 500); // Slightly longer debounce for Nominatim rate limits

    return () => clearTimeout(timer);
  }, [searchQuery, searchPlaces]);

  // Select a place from search results
  const selectPlace = (result: NominatimResult) => {
    Keyboard.dismiss();
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);

    // Format a cleaner address from the result
    const addressParts = [];
    if (result.address.house_number) addressParts.push(result.address.house_number);
    if (result.address.road) addressParts.push(result.address.road);
    if (result.address.suburb) addressParts.push(result.address.suburb);
    if (result.address.city) addressParts.push(result.address.city);

    const formattedAddress =
      addressParts.length > 0 ? addressParts.join(', ') : result.display_name.split(',').slice(0, 3).join(',');

    setSearchQuery(formattedAddress);
    setSearchResults([]);

    const newRegion = {
      latitude: lat,
      longitude: lng,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    };

    setRegion(newRegion);
    setSelectedLocation({
      address: formattedAddress,
      latitude: lat,
      longitude: lng,
    });
    mapRef.current?.animateToRegion(newRegion, 500);
  };

  // Handle map press to select location
  const handleMapPress = async (event: {
    nativeEvent: { coordinate: { latitude: number; longitude: number } };
  }) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;

    setSelectedLocation({
      address: t('hirer.booking.loading_address'),
      latitude,
      longitude,
    });

    // Reverse geocode using expo-location (uses device's native geocoding)
    try {
      const [address] = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (address) {
        const formattedAddress = formatAddress(address);
        setSelectedLocation({
          address: formattedAddress,
          latitude,
          longitude,
        });
        setSearchQuery(formattedAddress);
      }
    } catch {
      // Keep coordinates even if geocoding fails
      setSelectedLocation({
        address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        latitude,
        longitude,
      });
    }
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onSelect(selectedLocation);
      onClose();
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setSearchResults([]);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <View className="flex-1 bg-warmwhite">
        <SafeAreaView edges={['top']}>
          {/* Header */}
          <View className="flex-row items-center gap-3 border-b border-border-light px-4 py-3">
            <Pressable
              onPress={handleClose}
              className="size-10 items-center justify-center"
            >
              <ArrowLeft color={colors.midnight.DEFAULT} width={24} height={24} />
            </Pressable>
            <Text className="flex-1 font-urbanist-bold text-xl text-midnight">
              {t('hirer.booking.select_location')}
            </Text>
          </View>

          {/* Search Input */}
          <View className="px-4 py-3">
            <View className="flex-row items-center rounded-xl bg-white px-4">
              <Search color={colors.text.tertiary} width={20} height={20} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={t('hirer.booking.search_location')}
                placeholderTextColor={colors.text.tertiary}
                style={{
                  fontFamily: 'Urbanist_400Regular',
                  color: colors.midnight.DEFAULT,
                }}
                className="ml-2 flex-1 py-3 text-base"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <Pressable onPress={() => setSearchQuery('')}>
                  <X color={colors.text.tertiary} width={20} height={20} />
                </Pressable>
              )}
            </View>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <View className="absolute left-4 right-4 top-16 z-10 rounded-xl bg-white shadow-lg">
                {searchResults.map((result, index) => (
                  <Pressable
                    key={result.place_id}
                    onPress={() => selectPlace(result)}
                    className={`flex-row items-center gap-3 px-4 py-3 ${index < searchResults.length - 1
                        ? 'border-b border-border-light'
                        : ''
                      }`}
                  >
                    <MapPin color={colors.rose[400]} width={20} height={20} />
                    <View className="flex-1">
                      <Text
                        className="font-urbanist-medium text-sm text-midnight"
                        numberOfLines={1}
                      >
                        {result.address.road ||
                          result.display_name.split(',')[0]}
                      </Text>
                      <Text
                        className="text-xs text-text-tertiary"
                        numberOfLines={1}
                      >
                        {result.address.suburb || result.address.city},{' '}
                        {result.address.state || result.address.country}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}

            {isSearching && (
              <View className="absolute left-4 right-4 top-16 z-10 items-center rounded-xl bg-white py-4">
                <ActivityIndicator color={colors.rose[400]} size="small" />
              </View>
            )}
          </View>
        </SafeAreaView>

        {/* Map - Uses Apple Maps on iOS, default maps on Android */}
        <View className="flex-1">
          {isLoadingLocation ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator color={colors.rose[400]} size="large" />
              <Text className="mt-2 text-text-secondary">
                {t('hirer.booking.getting_location')}
              </Text>
            </View>
          ) : (
            <MapView
              ref={mapRef}
              style={{ flex: 1 }}
              initialRegion={region}
              onPress={handleMapPress}
              showsUserLocation
              showsMyLocationButton
            >
              {selectedLocation && (
                <Marker
                  coordinate={{
                    latitude: selectedLocation.latitude,
                    longitude: selectedLocation.longitude,
                  }}
                  title={t('hirer.booking.selected_location')}
                  description={selectedLocation.address}
                />
              )}
            </MapView>
          )}

          {/* Current Location Button */}
          <Pressable
            onPress={getCurrentLocation}
            className="absolute bottom-32 right-4 size-12 items-center justify-center rounded-full bg-white shadow-md"
          >
            <MapPin color={colors.rose[400]} width={24} height={24} />
          </Pressable>
        </View>

        {/* Selected Location Info & Confirm Button */}
        <SafeAreaView
          edges={['bottom']}
          className="border-t border-border-light bg-white"
        >
          <View className="p-4">
            {selectedLocation && (
              <View className="mb-3 flex-row items-start gap-3 rounded-xl bg-lavender-900/10 p-3">
                <MapPin color={colors.rose[400]} width={20} height={20} />
                <Text className="flex-1 text-sm text-midnight" numberOfLines={2}>
                  {selectedLocation.address}
                </Text>
              </View>
            )}
            <Button
              label={t('hirer.booking.confirm_location')}
              onPress={handleConfirm}
              disabled={!selectedLocation}
              variant="default"
              size="lg"
            />
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
