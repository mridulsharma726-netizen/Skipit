import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/ambient_background.dart';
import '../../widgets/glass_container.dart';
import '../../widgets/skipit_brand_mark.dart';

class AuthScreen extends ConsumerStatefulWidget {
  const AuthScreen({super.key});

  @override
  ConsumerState<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends ConsumerState<AuthScreen> {
  bool _isRegister = false;

  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _nameController = TextEditingController();

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _nameController.dispose();
    super.dispose();
  }

  void _triggerGoogleAuth({required String email, String? name}) async {
    final success = await ref.read(authProvider.notifier).signInWithGoogle(
          email: email,
          fullName: name,
          avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=${Uri.encodeComponent(name ?? email)}',
        );

    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: const Color(0xFF0F2454),
          content: Text(
            'Welcome, ${name ?? email.split('@').first}! Signed in with Google.',
            style: const TextStyle(color: AppColors.accent, fontWeight: FontWeight.bold),
          ),
        ),
      );
      context.pop();
    } else if (mounted) {
      final error = ref.read(authProvider).error ?? 'Google Sign-In failed';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: const Color(0xFF7F1D1D),
          content: Text(error, style: const TextStyle(color: Colors.white)),
        ),
      );
    }
  }

  void _showGoogleAccountPicker() {
    final customEmailCtrl = TextEditingController();
    final customNameCtrl = TextEditingController();

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (ctx) => BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
        child: Container(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 24,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
          ),
          decoration: const BoxDecoration(
            color: Color(0xFA0A1128),
            borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
            border: Border(
              top: BorderSide(color: Color(0x4D38BDF8), width: 1.2),
            ),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
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
              Row(
                children: [
                  Container(
                    width: 38,
                    height: 38,
                    decoration: const BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                    ),
                    alignment: Alignment.center,
                    child: const Text(
                      'G',
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF4285F4),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: const [
                      Text(
                        'Sign in with Google',
                        style: TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.w900,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      Text(
                        'Choose an account to continue to SkipIt',
                        style: TextStyle(
                          fontSize: 11,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Account 1: Mridul Sharma (Quick 1-Tap)
              _buildGoogleAccountTile(
                name: 'Mridul Sharma',
                email: 'mridulsharma726@gmail.com',
                initial: 'M',
                onTap: () {
                  Navigator.pop(ctx);
                  _triggerGoogleAuth(
                    email: 'mridulsharma726@gmail.com',
                    name: 'Mridul Sharma',
                  );
                },
              ),
              const SizedBox(height: 10),

              // Account 2: SkipIt Tester
              _buildGoogleAccountTile(
                name: 'SkipIt Beta Tester',
                email: 'skipit.tester@gmail.com',
                initial: 'S',
                onTap: () {
                  Navigator.pop(ctx);
                  _triggerGoogleAuth(
                    email: 'skipit.tester@gmail.com',
                    name: 'SkipIt Beta Tester',
                  );
                },
              ),
              const SizedBox(height: 16),

              const Divider(color: Color(0x2538BDF8)),
              const SizedBox(height: 10),

              // Custom Google Email Input Option
              const Text(
                'Or use another Google email:',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.accent),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: customEmailCtrl,
                keyboardType: TextInputType.emailAddress,
                style: const TextStyle(fontSize: 13, color: AppColors.textPrimary),
                decoration: InputDecoration(
                  hintText: 'yourname@gmail.com',
                  prefixIcon: const Icon(Icons.alternate_email_rounded, size: 18, color: AppColors.accent),
                  filled: true,
                  fillColor: const Color(0x331E293B),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                ),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: customNameCtrl,
                style: const TextStyle(fontSize: 13, color: AppColors.textPrimary),
                decoration: InputDecoration(
                  hintText: 'Full Name (optional)',
                  prefixIcon: const Icon(Icons.badge_rounded, size: 18, color: AppColors.accent),
                  filled: true,
                  fillColor: const Color(0x331E293B),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                ),
              ),
              const SizedBox(height: 14),

              SizedBox(
                width: double.infinity,
                height: 46,
                child: ElevatedButton(
                  onPressed: () {
                    final email = customEmailCtrl.text.trim();
                    final name = customNameCtrl.text.trim();
                    if (email.isEmpty || !email.contains('@')) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Please enter a valid Google email address')),
                      );
                      return;
                    }
                    Navigator.pop(ctx);
                    _triggerGoogleAuth(
                      email: email,
                      name: name.isNotEmpty ? name : null,
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF2563EB),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: const Text(
                    'Continue with this Email',
                    style: TextStyle(fontWeight: FontWeight.w800, color: Colors.white),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildGoogleAccountTile({
    required String name,
    required String email,
    required String initial,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: const Color(0x381E3A8A),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0x3538BDF8), width: 1),
        ),
        child: Row(
          children: [
            CircleAvatar(
              radius: 18,
              backgroundColor: const Color(0xFF2563EB),
              child: Text(
                initial,
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w800,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  Text(
                    email,
                    style: const TextStyle(
                      fontSize: 11,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: AppColors.accent),
          ],
        ),
      ),
    );
  }

  void _handleEmailSubmit() async {
    final email = _emailController.text.trim();
    final pass = _passwordController.text.trim();
    final name = _nameController.text.trim();

    if (email.isEmpty || !email.contains('@')) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid email address')),
      );
      return;
    }

    if (pass.length < 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Password must be at least 6 characters')),
      );
      return;
    }

    bool success;
    if (_isRegister) {
      success = await ref.read(authProvider.notifier).register(
            email,
            pass,
            fullName: name.isNotEmpty ? name : null,
          );
    } else {
      success = await ref.read(authProvider.notifier).login(email, pass);
    }

    if (success && mounted) {
      context.pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.close_rounded, color: AppColors.textPrimary),
          onPressed: () => context.pop(),
        ),
      ),
      body: AmbientBackground(
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              child: GlassContainer(
                level: GlassLevel.premium,
                padding: const EdgeInsets.all(24),
                borderRadius: BorderRadius.circular(28),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Official SkipIt Brand Icon
                    const Center(
                      child: SkipItBrandMark(
                        size: 64,
                        backgroundColor: AppColors.primary,
                        markColor: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 16),
                    const Center(
                      child: Text(
                        'Welcome to SkipIt',
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w900,
                          color: AppColors.textPrimary,
                          letterSpacing: -0.3,
                        ),
                      ),
                    ),
                    const Center(
                      child: Text(
                        'Skip Buying. Rent Smarter. 0% Platform Fee.',
                        style: TextStyle(fontSize: 12, color: AppColors.accent),
                      ),
                    ),
                    const SizedBox(height: 24),

                    if (authState.error != null)
                      Container(
                        padding: const EdgeInsets.all(12),
                        margin: const EdgeInsets.only(bottom: 16),
                        decoration: BoxDecoration(
                          color: AppColors.error.withOpacity(0.18),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppColors.error.withOpacity(0.4)),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.error_outline_rounded, size: 16, color: AppColors.error),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                authState.error!,
                                style: const TextStyle(fontSize: 12, color: Colors.white, fontWeight: FontWeight.w600),
                              ),
                            ),
                          ],
                        ),
                      ),

                    // 1. Prominent Google Sign-In Button (Cosmic Glass)
                    GestureDetector(
                      onTap: authState.isLoading ? null : _showGoogleAccountPicker,
                      child: Container(
                        width: double.infinity,
                        height: 52,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF00C6FF).withOpacity(0.3),
                              blurRadius: 12,
                              offset: const Offset(0, 3),
                            ),
                          ],
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Container(
                              width: 26,
                              height: 26,
                              alignment: Alignment.center,
                              child: const Text(
                                'G',
                                style: TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.w900,
                                  color: Color(0xFF4285F4),
                                ),
                              ),
                            ),
                            const SizedBox(width: 10),
                            const Text(
                              'Continue with Google',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w800,
                                color: Color(0xFF0F172A),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Divider: or continue with email
                    Row(
                      children: [
                        Expanded(child: Container(height: 1, color: const Color(0x3538BDF8))),
                        const Padding(
                          padding: EdgeInsets.symmetric(horizontal: 12),
                          child: Text(
                            'OR WITH EMAIL',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              color: AppColors.accent,
                              letterSpacing: 0.8,
                            ),
                          ),
                        ),
                        Expanded(child: Container(height: 1, color: const Color(0x3538BDF8))),
                      ],
                    ),
                    const SizedBox(height: 20),

                    // 2. Free Email & Password Fields
                    if (_isRegister) ...[
                      const Text(
                        'Full Name',
                        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
                      ),
                      const SizedBox(height: 6),
                      TextField(
                        controller: _nameController,
                        style: const TextStyle(fontSize: 13, color: AppColors.textPrimary),
                        decoration: const InputDecoration(
                          prefixIcon: Icon(Icons.person_rounded, size: 18, color: AppColors.accent),
                          hintText: 'e.g. Rahul Sharma',
                        ),
                      ),
                      const SizedBox(height: 14),
                    ],

                    const Text(
                      'Email Address',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
                    ),
                    const SizedBox(height: 6),
                    TextField(
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                      style: const TextStyle(fontSize: 13, color: AppColors.textPrimary),
                      decoration: const InputDecoration(
                        prefixIcon: Icon(Icons.email_rounded, size: 18, color: AppColors.accent),
                        hintText: 'you@domain.com',
                      ),
                    ),
                    const SizedBox(height: 14),

                    const Text(
                      'Password',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
                    ),
                    const SizedBox(height: 6),
                    TextField(
                      controller: _passwordController,
                      obscureText: true,
                      style: const TextStyle(fontSize: 13, color: AppColors.textPrimary),
                      decoration: const InputDecoration(
                        prefixIcon: Icon(Icons.lock_rounded, size: 18, color: AppColors.accent),
                        hintText: '••••••••',
                      ),
                    ),
                    const SizedBox(height: 20),

                    GestureDetector(
                      onTap: authState.isLoading ? null : _handleEmailSubmit,
                      child: Container(
                        width: double.infinity,
                        height: 50,
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF2563EB), Color(0xFF06B6D4)],
                          ),
                          borderRadius: BorderRadius.circular(16),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF2563EB).withOpacity(0.4),
                              blurRadius: 12,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        alignment: Alignment.center,
                        child: authState.isLoading
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                              )
                            : Text(
                                _isRegister ? 'Create Free Account' : 'Sign In with Email',
                                style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w800),
                              ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Toggle register / login
                    Center(
                      child: GestureDetector(
                        onTap: () => setState(() => _isRegister = !_isRegister),
                        child: Text(
                          _isRegister
                              ? 'Already have an account? Sign In'
                              : "Don't have an account? Create one free",
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: AppColors.accent,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 18),

                    // Security & 0-Cost Notice
                    Container(
                      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
                      decoration: BoxDecoration(
                        color: const Color(0x331E293B),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0x2538BDF8)),
                      ),
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.shield_outlined, size: 14, color: AppColors.accent),
                          SizedBox(width: 6),
                          Text(
                            '100% Free • No SMS Costs • 0% Platform Fees',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
