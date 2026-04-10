import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:flutter/foundation.dart';

class SupabaseService {
  static final SupabaseClient client = Supabase.instance.client;

  // Initialize Supabase
  static Future<void> initialize() async {
    await Supabase.initialize(
      url: 'https://njmibithreklfiwuajsd.supabase.co',
      anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5qbWliaXRocmVrbGZpd3VhanNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzNDE1MTMsImV4cCI6MjA4NjkxNzUxM30.QYOhqgk2VYm14mj7CMzoAWI0_IOhnLEsMDojInaXieU',
    );
  }

  // Auth Operations
  static Future<AuthResponse> signIn(String email, String password) async {
    return await client.auth.signInWithPassword(email: email, password: password);
  }

  static Future<AuthResponse> signUp(String email, String password) async {
    return await client.auth.signUp(email: email, password: password);
  }

  static Future<void> signInWithGoogle() async {
    await client.auth.signInWithOAuth(
      OAuthProvider.google,
      redirectTo: kIsWeb 
        ? 'https://kazedonime-v1.vercel.app' 
        : 'com.kazedonime.mobile://login-callback/',
    );
  }

  static Future<void> signOut() async {
    await client.auth.signOut();
  }

  // User Stats (XP)
  static Future<void> addXP(String userId, int amount) async {
    try {
      final response = await client
          .from('profiles')
          .select('xp')
          .eq('id', userId)
          .single();

      final currentXP = response['xp'] as int? ?? 0;

      await client.from('profiles').update({
        'xp': currentXP + amount,
      }).eq('id', userId);
    } catch (e) {
      print('Error adding XP: $e');
    }
  }

  // Profile data
  static Stream<Map<String, dynamic>> streamProfile(String userId) {
    return client
        .from('profiles')
        .stream(primaryKey: ['id'])
        .eq('id', userId)
        .map((data) => data.first);
  }
}
