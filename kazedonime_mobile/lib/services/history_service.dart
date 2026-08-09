import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class HistoryService {
  static const String _key = 'watch_history';

  static Future<void> addToHistory({
    required String animeId,
    required String title,
    required String poster,
    required String episodeTitle,
    required String type,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    final String? historyRaw = prefs.getString(_key);
    List<dynamic> history = historyRaw != null ? jsonDecode(historyRaw) : [];

    // Hapus jika sudah ada (biar pindah ke atas)
    history.removeWhere((item) => item['animeId'] == animeId);

    // Tambah ke daftar paling depan
    history.insert(0, {
      'animeId': animeId,
      'title': title,
      'poster': poster,
      'episodeTitle': episodeTitle,
      'type': type,
      'timestamp': DateTime.now().millisecondsSinceEpoch,
    });

    // Batasi riwayat maksimal 50 item
    if (history.length > 50) history = history.sublist(0, 50);

    await prefs.setString(_key, jsonEncode(history));
  }

  static Future<List<dynamic>> getHistory() async {
    final prefs = await SharedPreferences.getInstance();
    final String? historyRaw = prefs.getString(_key);
    if (historyRaw == null) return [];
    return jsonDecode(historyRaw);
  }

  static Future<void> clearHistory() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_key);
  }
}
