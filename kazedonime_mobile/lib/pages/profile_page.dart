import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../services/supabase_service.dart';
import 'auth_page.dart';

class ProfilePage extends StatelessWidget {
  const ProfilePage({super.key});

  @override
  Widget build(BuildContext context) {
    final user = SupabaseService.client.auth.currentUser;

    if (user == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Profil')),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(LucideIcons.userX, size: 64, color: Colors.white24),
              const SizedBox(height: 16),
              const Text('Masuk untuk melihat profil', style: TextStyle(color: Colors.white60)),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AuthPage())),
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFA855F7)),
                child: const Text('Login / Register', style: TextStyle(color: Colors.white)),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Profil Saya'),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.logOut, size: 20),
            onPressed: () => SupabaseService.signOut(),
          ),
        ],
      ),
      body: StreamBuilder<Map<String, dynamic>>(
        stream: SupabaseService.streamProfile(user.id),
        builder: (context, snapshot) {
          if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());
          
          final profile = snapshot.data!;
          final xp = profile['xp'] as int? ?? 0;
          final level = (xp / 100).floor() + 1;
          final subXP = xp % 100;

          return ListView(
            padding: const EdgeInsets.all(24),
            children: [
              Center(
                child: Stack(
                  alignment: Alignment.bottomRight,
                  children: [
                    CircleAvatar(
                      radius: 50,
                      backgroundColor: const Color(0xFFA855F7).withOpacity(0.2),
                      child: Text(user.email![0].toUpperCase(), style: const TextStyle(fontSize: 40, fontWeight: FontWeight.bold, color: Color(0xFFA855F7))),
                    ),
                    const CircleAvatar(
                      radius: 14,
                      backgroundColor: Colors.green,
                      child: Icon(LucideIcons.check, size: 16, color: Colors.white),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              Center(
                child: Text(user.email!, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              ),
              const SizedBox(height: 32),
              
              // Level Card
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: const Color(0xFF18181B),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.white10),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Level Akun', style: TextStyle(fontWeight: FontWeight.bold)),
                        Text('Lvl $level', style: const TextStyle(color: Color(0xFFA855F7), fontWeight: FontWeight.bold)),
                      ],
                    ),
                    const SizedBox(height: 12),
                    LinearProgressIndicator(
                      value: subXP / 100,
                      backgroundColor: Colors.black,
                      color: const Color(0xFFA855F7),
                      minHeight: 8,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('$xp XP Total', style: const TextStyle(fontSize: 12, color: Colors.white60)),
                        Text('${100 - subXP} XP ke Lvl ${level + 1}', style: const TextStyle(fontSize: 12, color: Colors.white60)),
                      ],
                    ),
                  ],
                ),
              ),
              
              const SizedBox(height: 16),
              _buildStatTile(LucideIcons.playCircle, 'Tontonan', '241 Terakhir'),
              _buildStatTile(LucideIcons.flame, 'Win Streak', '12 Hari'),
              _buildStatTile(LucideIcons.shield, 'Badge', 'VIP Pioneer'),
            ],
          );
        },
      ),
    );
  }

  Widget _buildStatTile(IconData icon, String title, String value) {
    return ListTile(
      leading: Icon(icon, color: const Color(0xFFA855F7)),
      title: Text(title, style: const TextStyle(fontSize: 15)),
      trailing: Text(value, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white60)),
    );
  }
}
