import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../core/theme/app_colors.dart';

class SkipItMarkPainter extends CustomPainter {
  final Color color;

  SkipItMarkPainter({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.fill
      ..isAntiAlias = true;

    // Normalization mapping from our 200x200 space to widget size
    final scale = size.width / 200.0;

    // Offsets to center the mark
    const double ox = -5.0;
    const double oy = 1.0;

    // 1. Quadrant Sector
    // Center of pie is at (115 + ox, 35 + oy)
    final double cx = (115.0 + ox) * scale;
    final double cy = (35.0 + oy) * scale;
    final double radius = 72.0 * scale;

    final path = Path()
      ..moveTo(cx, cy)
      ..lineTo(cx, cy + radius) // Vertical straight right line downwards
      ..arcTo(
        Rect.fromCircle(center: Offset(cx, cy), radius: radius),
        math.pi / 2, // 90 degrees (down)
        math.pi / 2, // Sweep 90 degrees to 180 degrees (left)
        false,
      )
      ..close(); // Closes back to (cx, cy) horizontally along top

    canvas.drawPath(path, paint);

    // 2. Dot 1 (Left Dot)
    final double d1x = (97.0 + ox) * scale;
    final double d1y = (145.0 + oy) * scale;
    final double r = 18.0 * scale;
    canvas.drawCircle(Offset(d1x, d1y), r, paint);

    // 3. Dot 2 (Right Dot)
    final double d2x = (149.0 + ox) * scale;
    final double d2y = (145.0 + oy) * scale;
    canvas.drawCircle(Offset(d2x, d2y), r, paint);
  }

  @override
  bool shouldRepaint(covariant SkipItMarkPainter oldDelegate) => oldDelegate.color != color;
}

class SkipItBrandMark extends StatelessWidget {
  final double size;
  final Color? backgroundColor;
  final Color markColor;
  final bool hasBackground;
  final double? borderRadius;

  const SkipItBrandMark({
    super.key,
    this.size = 38,
    this.backgroundColor = AppColors.primary,
    this.markColor = Colors.white,
    this.hasBackground = true,
    this.borderRadius,
  });

  @override
  Widget build(BuildContext context) {
    final effectiveRadius = borderRadius ?? (size * 0.24);

    Widget mark = SizedBox(
      width: size * 0.72,
      height: size * 0.72,
      child: CustomPaint(
        painter: SkipItMarkPainter(color: markColor),
      ),
    );

    if (!hasBackground) return SizedBox(width: size, height: size, child: Center(child: mark));

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(effectiveRadius),
        boxShadow: [
          BoxShadow(
            color: (backgroundColor ?? AppColors.primary).withOpacity(0.4),
            blurRadius: size * 0.3,
            offset: Offset(0, size * 0.08),
          ),
        ],
      ),
      alignment: Alignment.center,
      child: mark,
    );
  }
}

class SkipItHeaderLogo extends StatelessWidget {
  final double iconSize;
  final double fontSize;
  final Color textColor;
  final bool showWordmark;

  const SkipItHeaderLogo({
    super.key,
    this.iconSize = 36,
    this.fontSize = 20,
    this.textColor = Colors.white,
    this.showWordmark = true,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        SkipItBrandMark(
          size: iconSize,
          backgroundColor: AppColors.primary,
          markColor: Colors.white,
        ),
        if (showWordmark) ...[
          const SizedBox(width: 10),
          Text(
            'skipit',
            style: GoogleFonts.outfit(
              fontSize: fontSize,
              fontWeight: FontWeight.w800,
              color: textColor,
              letterSpacing: -0.5,
              height: 1.1,
            ),
          ),
        ],
      ],
    );
  }
}
