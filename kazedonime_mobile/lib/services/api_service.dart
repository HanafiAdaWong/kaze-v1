import 'package:dio/dio.dart';

class ApiService {
  static final Dio _dio = Dio(BaseOptions(
    connectTimeout: const Duration(seconds: 20),
    receiveTimeout: const Duration(seconds: 20),
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'application/json',
    },
  ));

  static const String _jikanBase = 'https://api.jikan.moe/v4';
  static const String _sankaBase = 'https://www.sankavollerei.com/anime';

  static dynamic _extractData(Response res) {
    final body = res.data;
    if (body is Map && body['data'] != null) return body['data'];
    return body;
  }

  // ============================================
  // Anime & Search
  // ============================================

  static Future<Map<String, dynamic>> getTopAnime({int page = 1, String filter = ''}) async {
    final response = await _dio.get('$_jikanBase/top/anime', queryParameters: {
      'page': page,
      'limit': 24,
      'sfw': true,
      if (filter.isNotEmpty) 'filter': filter,
    });
    return response.data;
  }

  static Future<dynamic> searchAnime(String query, {int page = 1}) async {
    final response = await _dio.get('$_sankaBase/search/${Uri.encodeComponent(query)}', queryParameters: {
      'page': page,
    });
    final data = _extractData(response);
    return data is Map ? (data['animeList'] ?? []) : [];
  }

  static Future<Map<String, dynamic>> getAnimeDetail(int id) async {
    final response = await _dio.get('$_jikanBase/anime/$id');
    return response.data['data'];
  }

  // ============================================
  // Streaming (Resilient Parsing)
  // ============================================

  static Future<dynamic> getWatchHome() async {
    final response = await _dio.get('$_sankaBase/home');
    return _extractData(response);
  }

  static Future<dynamic> getWatchAnimeDetail(String animeId) async {
    final response = await _dio.get('$_sankaBase/anime/$animeId');
    return _extractData(response);
  }

  static Future<dynamic> getEpisodeDetail(String episodeId) async {
    final response = await _dio.get('$_sankaBase/episode/$episodeId');
    return _extractData(response);
  }

  static Future<dynamic> getServerUrl(String serverId) async {
    final response = await _dio.get('$_sankaBase/server/$serverId');
    return _extractData(response);
  }

  // ============================================
  // Drachin (Drama China)
  // ============================================

  static Future<dynamic> getDrachinHome() async {
    final response = await _dio.get('$_sankaBase/drachin/home');
    return _extractData(response);
  }

  static Future<dynamic> getDrachinDetail(String slug) async {
    final response = await _dio.get('$_sankaBase/drachin/detail/$slug');
    return _extractData(response);
  }

  static Future<dynamic> getDrachinEpisode(String slug, String index) async {
    final response = await _dio.get('$_sankaBase/drachin/episode/$slug', queryParameters: {'index': index});
    return _extractData(response);
  }

  static Future<dynamic> getDrachinStream(String id, String episode) async {
    final response = await _dio.get('$_sankaBase/drachin/watch/$id/$episode');
    return _extractData(response);
  }

  static Future<dynamic> searchDrachin(String query, {int page = 1}) async {
    final response = await _dio.get('$_sankaBase/drachin/search/${Uri.encodeComponent(query)}', queryParameters: {'page': page});
    return _extractData(response);
  }

  static String getDramaboxStreamUrl(String bookId, int index) {
    return '$_sankaBase/dramabox/stream?bookId=$bookId&episode=$index';
  }

  // ============================================
  // Donghua
  // ============================================

  static Future<dynamic> getDonghuaHome() async {
    final response = await _dio.get('$_sankaBase/donghua/home');
    return _extractData(response);
  }

  static Future<dynamic> getDonghuaDetail(String slug) async {
    final response = await _dio.get('$_sankaBase/donghua/detail/$slug');
    return _extractData(response);
  }

  static Future<dynamic> searchDonghua(String query) async {
    final response = await _dio.get('$_sankaBase/donghua/search/${Uri.encodeComponent(query)}');
    return _extractData(response);
  }

  static Future<dynamic> getDonghuaEpisode(String slug) async {
    final response = await _dio.get('$_sankaBase/donghua/episode/$slug');
    return _extractData(response);
  }

  static String getDonghuaStreamUrl(String slug) {
    return '$_sankaBase/donghua/episode/$slug';
  }

  static String getStreamUrl(String slug) {
    return '$_sankaBase/episode/$slug';
  }
}
