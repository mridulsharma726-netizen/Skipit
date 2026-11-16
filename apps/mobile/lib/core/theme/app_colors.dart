import 'package:flutter/material.dart';

class AppColors {
  // Official SkipIt Brand Colors (Design Guide Specifications)
  static const Color primary = Color(0xFF0044FF); // Official SkipIt Electric Blue (#0044FF)
  static const Color brandNavy = Color(0xFF160078); // Official SkipIt Midnight Navy (#160078)
  static const Color silver = Color(0xFFE2E2E2); // Official SkipIt Off-White/Silver (#E2E2E2)

  static const Color primaryLight = Color(0xFF3872FF); // Lighter Electric Tint
  static const Color accent = Color(0xFF38BDF8); // Bright Galaxy Cyan
  static const Color cyanAccent = Color(0xFF00C6FF); // Neon Cyan
  static const Color navy = Color(0xFF160078); // Official Deep Midnight Navy
  static const Color navySurface = Color(0xFF0F1E3D); // Deep Slate Sapphire
  static const Color light = Color(0xFFE2E2E2); // Official Brand Silver

  // Atmosphere & Background Colors (Deep Cosmic Galaxy Space)
  static const Color background = Color(0xFF060B18); // Cosmic Deep Space
  static const Color backgroundSecondary = Color(0xFF0B1428); // Midnight Space Blue

  // Blue Galaxy Gradients
  static const LinearGradient liquidBlueGradient = LinearGradient(
    colors: [Color(0xFF0044FF), Color(0xFF160078)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient galaxyNavyGradient = LinearGradient(
    colors: [Color(0xFF060B18), Color(0xFF160078), Color(0xFF0044FF)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient blueGlassCardGradient = LinearGradient(
    colors: [Color(0x3D1E3A8A), Color(0x220284C7)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient cosmicButtonGradient = LinearGradient(
    colors: [Color(0xFF2563EB), Color(0xFF06B6D4)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  // Glassmorphism Surfaces (Deep Galaxy Sapphire Frosted)
  static const Color glassSurface = Color(0x3D0F1E3D); // Frosted Dark Sapphire Glass
  static const Color glassStrong = Color(0x660F1E3D); // Strong Galaxy Glass
  static const Color glassBlueTint = Color(0x351E3A8A); // 20% Sapphire Blue tint
  static const Color glassLevel1 = Color(0x2B1E293B); // Subtle Glass
  static const Color glassLevel2 = Color(0x421E3A8A); // Standard Glass
  static const Color glassLevel3 = Color(0x5E0F275A); // Premium Galaxy Glass

  // Borders & Glows (Glowing Celestial Cyan & Sapphire)
  static const Color glassBorder = Color(0x4038BDF8); // Glowing Celestial Cyan border
  static const Color glassBorderSubtle = Color(0x2538BDF8);
  static const Color neonBlueGlow = Color(0x552563EB);
  static const Color neonCyanGlow = Color(0x5506B6D4);

  // Typography (Star White & Celestial Slates for High Contrast on Galaxy Dark)
  static const Color textPrimary = Color(0xFFF8FAFC); // Star White
  static const Color textSecondary = Color(0xFFCBD5E1); // Celestial Silver
  static const Color textMuted = Color(0xFF94A3B8); // Muted Cosmic Slate

  // Functional Colors
  static const Color success = Color(0xFF10B981);
  static const Color warning = Color(0xFFF59E0B);
  static const Color error = Color(0xFFEF4444);
  static const Color info = Color(0xFF38BDF8);

  // UI Surfaces & Compatibility
  static const Color surface = Color(0xFF0E172A);
  static const Color surfaceMuted = Color(0xFF1E293B);
  static const Color border = Color(0x3338BDF8);
  static const Color borderSubtle = Color(0x1F38BDF8);
}
