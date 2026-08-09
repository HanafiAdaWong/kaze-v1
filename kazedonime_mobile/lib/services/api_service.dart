import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'dart:convert';

class ApiService {
  static final Dio _dio = Dio(BaseOptions(
    connectTimeout: const Duration(seconds: 30),
    receiveTimeout: const Duration(seconds: 30),
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  ));

  static const String _sankaBase = 'https://www.sankavollerei.com/anime';

  /// Proxy RAW AllOrigins untuk menembus CORS di Web (Chrome)
  static String _wrapUrl(String path) {
    final target = '$_sankaBase$path';
    if (kIsWeb) {
      // Menggunakan /raw agar mendapatkan data murni tanpa wrapper JSON tambahan
      return 'https://api.allorigins.win/raw?url=${Uri.encodeFull(target)}';
    }
    return target;
  }

  static dynamic _processResponse(Response res) {
    try {
      var data = res.data;
      if (data is String) {
        data = jsonDecode(data);
      }

      // Ambil field 'data' jika ada pembungkusnya (Struktur standar Sanka)
      if (data is Map && data['data'] != null) return data['data'];
      return data;
    } catch (e) {
      debugPrint('JSON Decode Error: $e');
      return null;
    }
  }

  static Future<dynamic> getWatchHome() async {
    try {
      final res = await _dio.get(_wrapUrl('/home'));
      return _processResponse(res);
    } catch (e) {
      return null;
    }
  }

  static Future<dynamic> getDonghuaHome() async {
    try {
      final res = await _dio.get(_wrapUrl('/donghua/home'));
      return _processResponse(res);
    } catch (e) {
      return null;
    }
  }

  static Future<dynamic> getGenres() async {
    try {
      final res = await _dio.get(_wrapUrl('/genre'));
      return _processResponse(res);
    } catch (e) {
      return null;
    }
  }

  static Future<dynamic> getAnimeByGenre(String genreId) async {
    try {
      final res = await _dio.get(_wrapUrl('/genre/$genreId'));
      return _processResponse(res);
    } catch (e) {
      return null;
    }
  }

  static Future<dynamic> searchAnime(String query) async {
    try {
      final res = await _dio.get(_wrapUrl('/search/${Uri.encodeComponent(query)}'));
      return _processResponse(res);
    } catch (e) {
      return null;
    }
  }

  static Future<dynamic> searchDonghua(String query) async {
    try {
      final res = await _dio.get(_wrapUrl('/donghua/search/${Uri.encodeComponent(query)}'));
      return _processResponse(res);
    } catch (e) {
      return null;
    }
  }

  static Future<dynamic> getWatchAnimeDetail(String animeId) async {
    try {
      final res = await _dio.get(_wrapUrl('/anime/$animeId'));
      return _processResponse(res);
    } catch (e) {
      return null;
    }
  }

  static Future<dynamic> getEpisodeDetail(String episodeId) async {
    try {
      final res = await _dio.get(_wrapUrl('/episode/$episodeId'));
      return _processResponse(res);
    } catch (e) {
      return null;
    }
  }

  static Future<dynamic> getServerUrl(String serverId) async {
    try {
      final res = await _dio.get(_wrapUrl('/server/$serverId'));
      return _processResponse(res);
    } catch (e) {
      return null;
    }
  }

  static Future<dynamic> getDonghuaDetail(String slug) async {
    try {
      final res = await _dio.get(_wrapUrl('/donghua/detail/$slug'));
      return _processResponse(res);
    } catch (e) {
      return null;
    }
  }

  static Future<dynamic> getDonghuaEpisode(String slug) async {
    try {
      final res = await _dio.get(_wrapUrl('/donghua/episode/$slug'));
      return _processResponse(res);
    } catch (e) {
      return null;
    }
  }

  static String getDonghuaStreamUrl(String slug) => '$_sankaBase/donghua/episode/$slug';
  static String getStreamUrl(String slug) => '$_sankaBase/episode/$slug';
}
