import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/theme/app_colors.dart';
import '../providers/listings_provider.dart';
import '../providers/location_provider.dart';

class CityItem {
  final String name;
  final String state;
  final IconData icon;

  const CityItem(this.name, this.state, {this.icon = Icons.location_city_rounded});
}

const List<CityItem> popularCities = [
  CityItem('Delhi NCR', 'Gurgaon, Noida, New Delhi', icon: Icons.apartment_rounded),
  CityItem('Bengaluru', 'Karnataka', icon: Icons.domain_rounded),
  CityItem('Mumbai', 'Maharashtra', icon: Icons.location_city_rounded),
  CityItem('Hyderabad', 'Telangana', icon: Icons.hub_rounded),
  CityItem('Pune', 'Maharashtra', icon: Icons.school_rounded),
  CityItem('Chennai', 'Tamil Nadu', icon: Icons.beach_access_rounded),
  CityItem('Kolkata', 'West Bengal', icon: Icons.account_balance_rounded),
  CityItem('Ahmedabad', 'Gujarat', icon: Icons.business_center_rounded),
  CityItem('Jaipur', 'Rajasthan', icon: Icons.fort_rounded),
  CityItem('Chandigarh', 'Punjab & Haryana', icon: Icons.park_rounded),
];

void showLocationPickerSheet(BuildContext context) {
  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (ctx) => const LocationPickerSheet(),
  );
}

class LocationPickerSheet extends ConsumerStatefulWidget {
  const LocationPickerSheet({super.key});

  @override
  ConsumerState<LocationPickerSheet> createState() => _LocationPickerSheetState();
}

class _LocationPickerSheetState extends ConsumerState<LocationPickerSheet> {
  final _searchCtrl = TextEditingController();
  String _filter = '';

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  void _onCityChosen(String cityName, {String? subtitle}) {
    ref.read(locationProvider.notifier).selectLocation(cityName, subtitle: subtitle);
    ref.read(listingsProvider.notifier).searchListings(location: cityName);
    Navigator.pop(context);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: const Color(0xFF0F2454),
        content: Text(
          'Location updated to $cityName',
          style: const TextStyle(color: AppColors.accent, fontWeight: FontWeight.bold),
        ),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  void _onAutoDetect() async {
    final success = await ref.read(locationProvider.notifier).autoDetectLocation();
    if (mounted) {
      if (success) {
        final loc = ref.read(locationProvider).selectedCity;
        ref.read(listingsProvider.notifier).searchListings(location: loc);
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFF0F2454),
            content: Text(
              'Location detected: $loc',
              style: const TextStyle(color: AppColors.accent, fontWeight: FontWeight.bold),
            ),
            duration: const Duration(seconds: 2),
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            backgroundColor: Color(0xFF7F1D1D),
            content: Text('Could not auto-detect location. Please pick a city manually.'),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final locState = ref.watch(locationProvider);
    final filteredCities = popularCities.where((c) {
      return c.name.toLowerCase().contains(_filter.toLowerCase()) ||
          c.state.toLowerCase().contains(_filter.toLowerCase());
    }).toList();

    return BackdropFilter(
      filter: ImageFilter.blur(sigmaX: 22, sigmaY: 22),
      child: Container(
        height: MediaQuery.of(context).size.height * 0.78,
        decoration: const BoxDecoration(
          color: Color(0xFA091226), // Cosmic Deep Space Blue
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          border: Border(
            top: BorderSide(color: Color(0x4D38BDF8), width: 1.5),
          ),
        ),
        child: Column(
          children: [
            const SizedBox(height: 12),
            Center(
              child: Container(
                width: 44,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.textMuted.withOpacity(0.4),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Sheet Header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: const [
                      Icon(Icons.location_on_rounded, color: AppColors.accent, size: 22),
                      SizedBox(width: 8),
                      Text(
                        'Select Your Location',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w900,
                          color: AppColors.textPrimary,
                        ),
                      ),
                    ],
                  ),
                  IconButton(
                    icon: const Icon(Icons.close_rounded, color: AppColors.textMuted),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 12),

            // Search Bar for custom city/locality
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: TextField(
                controller: _searchCtrl,
                onChanged: (val) => setState(() => _filter = val.trim()),
                style: const TextStyle(fontSize: 13, color: AppColors.textPrimary),
                decoration: InputDecoration(
                  hintText: 'Search city, state, or area...',
                  hintStyle: const TextStyle(color: AppColors.textMuted, fontSize: 13),
                  prefixIcon: const Icon(Icons.search_rounded, size: 20, color: AppColors.accent),
                  suffixIcon: _filter.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear_rounded, size: 16, color: AppColors.textMuted),
                          onPressed: () {
                            _searchCtrl.clear();
                            setState(() => _filter = '');
                          },
                        )
                      : null,
                  filled: true,
                  fillColor: const Color(0x331E293B),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: const BorderSide(color: Color(0x3338BDF8)),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: const BorderSide(color: Color(0x3338BDF8)),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: const BorderSide(color: AppColors.accent, width: 1.5),
                  ),
                ),
              ),
            ),

            const SizedBox(height: 14),

            // Fast Actions Row: Auto-Detect & All India
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                children: [
                  // Auto-Detect Button
                  Expanded(
                    child: InkWell(
                      onTap: locState.isDetecting ? null : _onAutoDetect,
                      borderRadius: BorderRadius.circular(14),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 10),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF2563EB), Color(0xFF06B6D4)],
                          ),
                          borderRadius: BorderRadius.circular(14),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF06B6D4).withOpacity(0.35),
                              blurRadius: 10,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            if (locState.isDetecting)
                              const SizedBox(
                                width: 16,
                                height: 16,
                                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                              )
                            else
                              const Icon(Icons.my_location_rounded, size: 16, color: Colors.white),
                            const SizedBox(width: 8),
                            const Text(
                              'Auto-Detect',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w800,
                                color: Colors.white,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),

                  // All India (Show All)
                  Expanded(
                    child: InkWell(
                      onTap: () => _onCityChosen('All India', subtitle: 'Nationwide Gear'),
                      borderRadius: BorderRadius.circular(14),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 10),
                        decoration: BoxDecoration(
                          color: locState.selectedCity == 'All India'
                              ? const Color(0x4D38BDF8)
                              : const Color(0x331E293B),
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: locState.selectedCity == 'All India'
                                ? AppColors.accent
                                : const Color(0x3338BDF8),
                            width: 1.2,
                          ),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.public_rounded,
                              size: 16,
                              color: locState.selectedCity == 'All India'
                                  ? AppColors.accent
                                  : AppColors.textSecondary,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              'All India',
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w800,
                                color: locState.selectedCity == 'All India'
                                    ? AppColors.accent
                                    : AppColors.textPrimary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),
            const Divider(color: Color(0x2538BDF8), height: 1),
            const SizedBox(height: 8),

            // Custom search entry if user types an unlisted location
            if (_filter.isNotEmpty && !popularCities.any((c) => c.name.toLowerCase() == _filter.toLowerCase()))
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
                child: InkWell(
                  onTap: () => _onCityChosen(_filter, subtitle: 'Custom Location'),
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: const Color(0x381E3A8A),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.accent.withOpacity(0.5)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.add_location_alt_rounded, color: AppColors.accent, size: 20),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            'Use "$_filter" as location',
                            style: const TextStyle(
                              color: AppColors.accent,
                              fontWeight: FontWeight.w700,
                              fontSize: 13,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

            // Cities List
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                itemCount: filteredCities.length,
                itemBuilder: (context, index) {
                  final city = filteredCities[index];
                  final isSelected = locState.selectedCity.toLowerCase() == city.name.toLowerCase() ||
                      (locState.selectedCity.contains(city.name));

                  return Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    decoration: BoxDecoration(
                      color: isSelected ? const Color(0x401E3A8A) : const Color(0x241E293B),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: isSelected ? AppColors.accent : const Color(0x2438BDF8),
                        width: isSelected ? 1.5 : 1,
                      ),
                    ),
                    child: ListTile(
                      onTap: () => _onCityChosen(city.name, subtitle: city.state),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      leading: CircleAvatar(
                        radius: 18,
                        backgroundColor: isSelected
                            ? AppColors.primary
                            : const Color(0xFF1E293B),
                        child: Icon(
                          city.icon,
                          size: 18,
                          color: isSelected ? Colors.white : AppColors.accent,
                        ),
                      ),
                      title: Text(
                        city.name,
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: isSelected ? FontWeight.w900 : FontWeight.w700,
                          color: isSelected ? Colors.white : AppColors.textPrimary,
                        ),
                      ),
                      subtitle: Text(
                        city.state,
                        style: const TextStyle(
                          fontSize: 11,
                          color: AppColors.textSecondary,
                        ),
                      ),
                      trailing: isSelected
                          ? Container(
                              padding: const EdgeInsets.all(4),
                              decoration: const BoxDecoration(
                                color: AppColors.accent,
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.check_rounded, size: 14, color: Color(0xFF060B18)),
                            )
                          : const Icon(Icons.arrow_forward_ios_rounded, size: 13, color: AppColors.textMuted),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
