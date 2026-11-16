import 'package:flutter/material.dart';

class AmbientBackground extends StatelessWidget {
  final Widget child;

  const AmbientBackground({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Color(0xFF060B18), // Deep Cosmic Space Black
            Color(0xFF09142B), // Deep Midnight Sapphire
            Color(0xFF070D1F), // Interstellar Blue
          ],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ),
      ),
      child: Stack(
        children: [
          // 1. Official SkipIt Electric Blue Fluid Nebula (Top Right)
          Positioned(
            top: -90,
            right: -70,
            child: Container(
              width: 370,
              height: 370,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    const Color(0xFF0044FF).withOpacity(0.42), // Official #0044FF
                    const Color(0xFF160078).withOpacity(0.20), // Official #160078
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),

          // 2. Cosmic Cyan & Electric Glow Nebula (Mid Left)
          Positioned(
            top: 240,
            left: -100,
            child: Container(
              width: 340,
              height: 340,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    const Color(0xFF00C6FF).withOpacity(0.26),
                    const Color(0xFF0044FF).withOpacity(0.14),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),

          // 3. Official SkipIt Deep Midnight Navy Nebula (Bottom Right)
          Positioned(
            bottom: -60,
            right: -60,
            child: Container(
              width: 330,
              height: 330,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    const Color(0xFF160078).withOpacity(0.45), // Official #160078
                    const Color(0xFF0044FF).withOpacity(0.16),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),

          // 4. Subtle Ambient Star Glow (Center)
          Positioned(
            top: 130,
            right: 80,
            child: Container(
              width: 140,
              height: 140,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    const Color(0xFF38BDF8).withOpacity(0.16),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),

          // Main Screen Content
          Positioned.fill(child: child),
        ],
      ),
    );
  }
}
