import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/network/api_client.dart';
import '../models/category_model.dart';
import '../models/listing_model.dart';

class ListingsState {
  final List<CategoryModel> categories;
  final List<ListingModel> featuredListings;
  final List<ListingModel> searchListings;
  final List<ListingModel> myListings;
  final bool isLoading;
  final String? error;

  ListingsState({
    this.categories = const [],
    this.featuredListings = const [],
    this.searchListings = const [],
    this.myListings = const [],
    this.isLoading = false,
    this.error,
  });

  ListingsState copyWith({
    List<CategoryModel>? categories,
    List<ListingModel>? featuredListings,
    List<ListingModel>? searchListings,
    List<ListingModel>? myListings,
    bool? isLoading,
    String? error,
  }) {
    return ListingsState(
      categories: categories ?? this.categories,
      featuredListings: featuredListings ?? this.featuredListings,
      searchListings: searchListings ?? this.searchListings,
      myListings: myListings ?? this.myListings,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class ListingsNotifier extends StateNotifier<ListingsState> {
  ListingsNotifier() : super(ListingsState()) {
    fetchInitialData();
  }

  Future<void> fetchInitialData({String? location}) async {
    state = state.copyWith(isLoading: true);
    try {
      final locParam = (location != null && location != 'All India' && location != 'All')
          ? '&location=${Uri.encodeComponent(location)}'
          : '';

      final catRes = await apiClient.dio.get('/categories');
      final featRes = await apiClient.dio.get('/listings/featured');
      final recRes = await apiClient.dio.get('/listings?limit=10&sort=recent$locParam');

      final categories = (catRes.data['categories'] as List? ?? [])
          .map((e) => CategoryModel.fromJson(e))
          .toList();

      final featured = (featRes.data['listings'] as List? ?? [])
          .map((e) => ListingModel.fromJson(e))
          .toList();

      final search = (recRes.data['listings'] as List? ?? [])
          .map((e) => ListingModel.fromJson(e))
          .toList();

      state = state.copyWith(
        categories: categories,
        featuredListings: featured,
        searchListings: search,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> searchListings({
    String? q,
    String? category,
    String? condition,
    String? location,
    String? sort = 'recent',
    String? minPrice,
    String? maxPrice,
  }) async {
    state = state.copyWith(isLoading: true);
    try {
      final queryParams = <String, dynamic>{'sort': sort};
      if (q != null && q.isNotEmpty) queryParams['q'] = q;
      if (category != null && category != 'All') queryParams['category'] = category;
      if (condition != null && condition.isNotEmpty) queryParams['condition'] = condition;
      if (location != null && location != 'All India' && location != 'All' && location.isNotEmpty) {
        queryParams['location'] = location;
      }
      if (minPrice != null && minPrice.isNotEmpty) queryParams['min_price'] = minPrice;
      if (maxPrice != null && maxPrice.isNotEmpty) queryParams['max_price'] = maxPrice;

      final res = await apiClient.dio.get('/listings', queryParameters: queryParams);
      final listings = (res.data['listings'] as List? ?? [])
          .map((e) => ListingModel.fromJson(e))
          .toList();

      state = state.copyWith(searchListings: listings, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> fetchMyListings() async {
    try {
      final res = await apiClient.dio.get('/listings/my/all');
      final listings = (res.data['listings'] as List? ?? [])
          .map((e) => ListingModel.fromJson(e))
          .toList();
      state = state.copyWith(myListings: listings);
    } catch (_) {}
  }

  Future<bool> createListing(FormData formData) async {
    try {
      state = state.copyWith(isLoading: true);
      await apiClient.dio.post('/listings', data: formData);
      await fetchInitialData();
      await fetchMyListings();
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      return false;
    }
  }

  Future<void> toggleListingStatus(String id) async {
    try {
      await apiClient.dio.patch('/listings/$id/toggle-status');
      await fetchMyListings();
      await fetchInitialData();
    } catch (_) {}
  }

  Future<void> deleteListing(String id) async {
    try {
      await apiClient.dio.delete('/listings/$id');
      await fetchMyListings();
      await fetchInitialData();
    } catch (_) {}
  }
}

final listingsProvider = StateNotifierProvider<ListingsNotifier, ListingsState>((ref) {
  return ListingsNotifier();
});
