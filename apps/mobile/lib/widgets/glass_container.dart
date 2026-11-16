import 'dart:ui';
import 'package:flutter/material.dart';
import '../core/theme/app_colors.dart';

enum GlassLevel {
  subtle,   // Glass 1: Secondary pills, subtle chips
  standard, // Glass 2: Content cards, search bars
  premium,  // Glass 3: Highlighted banners, modals
}

class GlassContainer extends StatelessWidget {
  final Widget child;
  final GlassLevel level;
  final double? width;
  final double? height;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final BorderRadius? borderRadius;
  final Color? customColor;
  final Border? customBorder;
  final List<BoxShadow>? customShadow;
  final Gradient? gradient;
  final VoidCallback? onTap;

  const GlassContainer({
    super.key,
    required this.child,
    this.level = GlassLevel.standard,
    this.width,
    this.height,
    this.padding,
    this.margin,
    this.borderRadius,
    this.customColor,
    this.customBorder,
    this.customShadow,
    this.gradient,
    this.onTap,
  });

  double get _blurSigma {
    switch (level) {
      case GlassLevel.subtle:
        return 12.0;
      case GlassLevel.standard:
        return 20.0;
      case GlassLevel.premium:
        return 28.0;
    }
  }

  Color get _surfaceColor {
    if (customColor != null) return customColor!;
    switch (level) {
      case GlassLevel.subtle:
        return const Color(0x380F1E3D); // Translucent Dark Sapphire
      case GlassLevel.standard:
        return const Color(0x520F2454); // Galaxy Glass with Blue Tint
      case GlassLevel.premium:
        return const Color(0x750A1A3E); // Deep Nebula Glass
    }
  }

  @override
  Widget build(BuildContext context) {
    final effectiveRadius = borderRadius ?? BorderRadius.circular(22);

    Widget content = Container(
      width: width,
      height: height,
      padding: padding,
      decoration: BoxDecoration(
        color: gradient == null ? _surfaceColor : null,
        gradient: gradient,
        borderRadius: effectiveRadius,
        border: customBorder ??
            Border.all(
              color: AppColors.glassBorder, // Glowing Celestial Cyan border
              width: 1.2,
            ),
        boxShadow: customShadow ??
            [
              BoxShadow(
                color: const Color(0xFF00C6FF).withOpacity(0.08), // Cyan glow
                blurRadius: 16,
                offset: const Offset(0, 4),
              ),
              BoxShadow(
                color: const Color(0xFF060B18).withOpacity(0.60), // Space shadow
                blurRadius: 20,
                offset: const Offset(0, 8),
              ),
            ],
      ),
      child: child,
    );

    if (onTap != null) {
      content = Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: effectiveRadius,
          onTap: onTap,
          splashColor: AppColors.accent.withOpacity(0.18),
          highlightColor: AppColors.primary.withOpacity(0.10),
          child: content,
        ),
      );
    }

    return Container(
      margin: margin,
      child: ClipRRect(
        borderRadius: effectiveRadius,
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: _blurSigma, sigmaY: _blurSigma),
          child: content,
        ),
      ),
    );
  }
}
