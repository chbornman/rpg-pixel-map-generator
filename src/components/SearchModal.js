import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  Text,
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MagnifyingGlassIcon, XMarkIcon, MapPinIcon } from 'react-native-heroicons/outline';

const GOOGLE_PLACES_API_KEY = 'AIzaSyB6aNCUOKa4-i-QYocrdlCOmBtlPcudDCY';

const SearchModal = ({ visible, onClose, onSelectLocation }) => {
  const [searchText, setSearchText] = useState('');
  const [predictions, setPredictions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Debounce search
  useEffect(() => {
    if (!searchText.trim()) {
      setPredictions([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      searchPlaces(searchText);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchText]);

  const searchPlaces = async (query) => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
          query
        )}&key=${GOOGLE_PLACES_API_KEY}`
      );
      const data = await response.json();

      if (data.predictions) {
        setPredictions(data.predictions);
      }
    } catch (error) {
      console.error('Error searching places:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPlaceDetails = async (placeId) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry,name,formatted_address&key=${GOOGLE_PLACES_API_KEY}`
      );
      const data = await response.json();

      if (data.result && data.result.geometry) {
        const { location } = data.result.geometry;
        const locationData = {
          latitude: location.lat,
          longitude: location.lng,
          name: data.result.name,
          address: data.result.formatted_address,
        };

        onSelectLocation(locationData);
        handleClose();
      }
    } catch (error) {
      console.error('Error getting place details:', error);
    }
  };

  const handleClose = () => {
    setSearchText('');
    setPredictions([]);
    onClose();
  };

  const renderPrediction = ({ item }) => (
    <TouchableOpacity
      style={styles.predictionItem}
      onPress={() => getPlaceDetails(item.place_id)}
    >
      <MapPinIcon size={20} color="#6B7280" strokeWidth={2} />
      <View style={styles.predictionText}>
        <Text style={styles.predictionMain}>{item.structured_formatting.main_text}</Text>
        <Text style={styles.predictionSecondary}>
          {item.structured_formatting.secondary_text}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />

        <View style={styles.searchContainer}>
          <View style={styles.searchHeader}>
            <View style={styles.searchInputContainer}>
              <MagnifyingGlassIcon size={20} color="#9CA3AF" strokeWidth={2} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search for a location..."
                placeholderTextColor="#9CA3AF"
                value={searchText}
                onChangeText={setSearchText}
                autoFocus={true}
                returnKeyType="search"
              />
              {isLoading && <ActivityIndicator size="small" color="#3B82F6" />}
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <XMarkIcon size={24} color="#6B7280" strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {predictions.length > 0 && (
            <FlatList
              data={predictions}
              renderItem={renderPrediction}
              keyExtractor={(item) => item.place_id}
              style={styles.predictionsList}
              keyboardShouldPersistTaps="handled"
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    flex: 1,
  },
  searchContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    maxHeight: '70%',
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  predictionsList: {
    maxHeight: 400,
  },
  predictionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  predictionText: {
    flex: 1,
  },
  predictionMain: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  predictionSecondary: {
    fontSize: 13,
    color: '#6B7280',
  },
});

export default SearchModal;
