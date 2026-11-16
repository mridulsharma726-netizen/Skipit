import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:skipit/main.dart';

void main() {
  testWidgets('SkipIt mobile app boots and displays branding', (WidgetTester tester) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: SkipItMobileApp(),
      ),
    );

    // Initial frame displays splash branding
    expect(find.text('SkipIt'), findsOneWidget);
    expect(find.text('Skip Buying. Rent Smarter.'), findsOneWidget);

    // Settle timer and animations
    await tester.pumpAndSettle(const Duration(seconds: 3));
  });
}
