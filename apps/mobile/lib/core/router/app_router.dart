import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../models/conversation_model.dart';
import '../../models/listing_model.dart';
import '../../screens/auth/auth_screen.dart';
import '../../screens/chat/chat_detail_screen.dart';
import '../../screens/chat/conversations_screen.dart';
import '../../screens/explore/explore_screen.dart';
import '../../screens/home/home_screen.dart';
import '../../screens/listings/create_listing_screen.dart';
import '../../screens/listings/listing_detail_screen.dart';
import '../../screens/profile/profile_screen.dart';
import '../../screens/splash/splash_screen.dart';
import '../../widgets/floating_glass_bottom_nav.dart';

final GlobalKey<NavigatorState> _rootNavigatorKey = GlobalKey<NavigatorState>();

final appRouter = GoRouter(
  navigatorKey: _rootNavigatorKey,
  initialLocation: '/',
  routes: [
    GoRoute(
      path: '/',
      builder: (context, state) => const SplashScreen(),
    ),
    GoRoute(
      path: '/auth',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) => const AuthScreen(),
    ),
    GoRoute(
      path: '/listing/:id',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) {
        final id = state.pathParameters['id'] ?? '';
        final listing = state.extra as ListingModel?;
        return ListingDetailScreen(listingId: id, initialListing: listing);
      },
    ),
    GoRoute(
      path: '/create-listing',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) => const CreateListingScreen(),
    ),
    GoRoute(
      path: '/chat/:peerId',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (context, state) {
        final peerId = state.pathParameters['peerId'] ?? '';
        final conv = state.extra as ConversationModel?;
        return ChatDetailScreen(peerId: peerId, conversation: conv);
      },
    ),

    // Main App Shell with Floating Glass Bottom Navigation Bar
    StatefulShellRoute.indexedStack(
      builder: (context, state, navigationShell) {
        return Scaffold(
          extendBody: true,
          body: navigationShell,
          bottomNavigationBar: FloatingGlassBottomNav(
            currentIndex: navigationShell.currentIndex,
            onTabSelected: (index) {
              navigationShell.goBranch(
                index,
                initialLocation: index == navigationShell.currentIndex,
              );
            },
            onAddPressed: () {
              context.push('/create-listing');
            },
          ),
        );
      },
      branches: [
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/home',
              builder: (context, state) => const HomeScreen(),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/explore',
              builder: (context, state) => const ExploreScreen(),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/chat',
              builder: (context, state) => const ConversationsScreen(),
            ),
          ],
        ),
        StatefulShellBranch(
          routes: [
            GoRoute(
              path: '/profile',
              builder: (context, state) => const ProfileScreen(),
            ),
          ],
        ),
      ],
    ),
  ],
);
