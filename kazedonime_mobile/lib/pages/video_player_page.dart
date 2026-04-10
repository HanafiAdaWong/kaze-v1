import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:flutter/foundation.dart';
import '../services/api_service.dart';

// Conditional imports for Web
import 'video_player_web.dart' if (dart.library.io) 'video_player_mobile.dart';

class VideoPlayerPage extends StatefulWidget {
  final String url;
  final String? title;
  // For drachin: pass slug and index separately
  final String? drachinSlug;
  final String? drachinIndex;

  const VideoPlayerPage({
    super.key,
    required this.url,
    this.title,
    this.drachinSlug,
    this.drachinIndex,
  });

  @override
  State<VideoPlayerPage> createState() => _VideoPlayerPageState();
}

class _VideoPlayerPageState extends State<VideoPlayerPage> {
  String? _streamUrl;
  bool _loading = true;
  String? _error;
  bool _isDirectVideo = false; // true for drachin (uses <video> tag, not iframe)
  
  List<Map<String, String>> _serversList = [];
  String? _currentServerName;

  @override
  void initState() {
    super.initState();
    _resolveStream();
  }

  Future<void> _resolveStream() async {
    if (!mounted) return;
    setState(() { _loading = true; _error = null; });

    String? resolvedUrl;
    bool directVideo = false;

    try {
      // ===== DRACHIN (Drama China) =====
      if (widget.drachinSlug != null && widget.drachinIndex != null) {
        debugPrint('[Player] Drachin: slug=${widget.drachinSlug}, index=${widget.drachinIndex}');
        final data = await ApiService.getDrachinEpisode(widget.drachinSlug!, widget.drachinIndex!);
        
        if (data != null && data['videos'] != null && data['videos'] is Map) {
          final videos = data['videos'] as Map;
          // Pick highest resolution available
          final keys = videos.keys.toList();
          keys.sort((a, b) => (int.tryParse(b.toString()) ?? 0).compareTo(int.tryParse(a.toString()) ?? 0));
          if (keys.isNotEmpty) {
            resolvedUrl = videos[keys.first]?.toString();
            directVideo = true;
            debugPrint('[Player] Drachin video: ${keys.first}p → $resolvedUrl');
          }
        }
      }
      // ===== SANKA API URLs =====
      else if (widget.url.contains('sankavollerei.com')) {
        final url = widget.url;

        // --- DONGHUA EPISODE ---
        if (url.contains('/donghua/episode/')) {
          final slug = _slug(url, '/donghua/episode/');
          debugPrint('[Player] Donghua: $slug');
          final raw = await ApiService.getDonghuaEpisode(slug);
          _extractDonghuaServers(raw);
          if (_serversList.isNotEmpty) {
            resolvedUrl = _serversList.first['url'];
            _currentServerName = _serversList.first['name'];
          }
        }
        // --- ANIME EPISODE ---
        else if (url.contains('/episode/')) {
          final slug = _slug(url, '/episode/');
          debugPrint('[Player] Anime: $slug');
          final data = await ApiService.getEpisodeDetail(slug);
          resolvedUrl = await _extractAnimeStreamUrl(data);
        }
        // --- DRAMABOX STREAM (fallback) ---
        else if (url.contains('/dramabox/stream')) {
          resolvedUrl = url; // Direct redirect URL
        }
      }
      // ===== NON-SANKA URL (direct video/iframe) =====
      else {
        resolvedUrl = widget.url;
      }
    } catch (e) {
      debugPrint('[Player] Error: $e');
      _error = 'Gagal memuat video: $e';
    }

    if (!mounted) return;

    if (resolvedUrl == null || resolvedUrl.isEmpty) {
      setState(() { _loading = false; _error ??= 'Server video tidak tersedia untuk episode ini.'; });
      return;
    }

    // Safety: never load raw API JSON into iframe
    if (!directVideo && resolvedUrl.contains('sankavollerei.com/anime/')) {
      setState(() { _loading = false; _error = 'Server video tidak merespons.'; });
      return;
    }

    debugPrint('[Player] Playing: $resolvedUrl (direct=$directVideo)');
    setState(() {
      _streamUrl = resolvedUrl;
      _isDirectVideo = directVideo;
      _loading = false;
    });
  }

  String _slug(String url, String pattern) {
    return url.split(pattern).last.split('?').first.split('#').first;
  }

  /// Extract Donghua alternative servers
  void _extractDonghuaServers(dynamic data) {
    _serversList.clear();
    if (data == null) return;
    final streaming = data['streaming'];
    if (streaming == null) return;

    if (streaming['servers'] is List) {
      for (var srv in streaming['servers']) {
        if (srv is Map && srv['url'] != null) {
          _serversList.add({
            'name': srv['name']?.toString() ?? 'Server',
            'url': srv['url'].toString()
          });
        }
      }
    }
    
    if (_serversList.isEmpty && streaming['main_url'] != null) {
      final m = streaming['main_url'];
      if (m is Map && m['url'] != null) {
        _serversList.add({'name': 'Premium', 'url': m['url'].toString()});
      }
    }
  }

  /// Extract streaming URL from Donghua/generic response (streaming.main_url or streaming.servers)
  String? _extractStreamingUrl(dynamic data) {
    if (data == null) return null;
    final streaming = data['streaming'];
    if (streaming == null) return null;

    if (streaming['main_url'] != null) {
      final m = streaming['main_url'];
      if (m is Map && m['url'] != null) return m['url'].toString();
      if (m is String && m.isNotEmpty) return m;
    }
    if (streaming['servers'] is List && (streaming['servers'] as List).isNotEmpty) {
      final first = (streaming['servers'] as List).first;
      if (first is Map && first['url'] != null) return first['url'].toString();
    }
    return null;
  }

  /// Extract streaming URL from Anime (Otakudesu) response.
  /// Tries BEST quality server first, then falls back to defaultStreamingUrl (360p).
  Future<String?> _extractAnimeStreamUrl(dynamic data) async {
    if (data == null) return null;

    // 1. Try to find the best quality server via server.qualities
    try {
      final qualities = data['server']?['qualities'];
      if (qualities is List && qualities.isNotEmpty) {
        // Sort qualities to prefer higher resolution (720p > 480p > 360p)
        String? bestServerId;
        int bestRes = 0;
        
        for (final q in qualities) {
          final title = q['title']?.toString() ?? '';
          final res = int.tryParse(title.replaceAll(RegExp(r'[^0-9]'), '')) ?? 0;
          final serverList = q['serverList'];
          if (serverList is List && serverList.isNotEmpty && res > bestRes) {
            bestRes = res;
            bestServerId = serverList.first['serverId']?.toString();
          }
        }

        if (bestServerId != null) {
          debugPrint('[Player] Using server $bestServerId (${bestRes}p)');
          try {
            final serverData = await ApiService.getServerUrl(bestServerId);
            if (serverData != null && serverData['url'] != null) {
              return serverData['url'].toString();
            }
          } catch (e) {
            debugPrint('[Player] Server $bestServerId failed: $e');
          }
        }
      }
    } catch (e) {
      debugPrint('[Player] Quality parsing error: $e');
    }

    // 2. Fallback to defaultStreamingUrl
    if (data['defaultStreamingUrl'] != null && data['defaultStreamingUrl'] is String) {
      debugPrint('[Player] Fallback to defaultStreamingUrl');
      return data['defaultStreamingUrl'];
    }

    // 3. Last resort: try streaming.main_url
    return _extractStreamingUrl(data);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          if (_loading)
            const Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  CircularProgressIndicator(color: Color(0xFFA855F7)),
                  SizedBox(height: 16),
                  Text('Menghubungkan ke server...', style: TextStyle(color: Colors.white70)),
                ],
              ),
            )
          else if (_error != null)
            Center(
              child: Padding(
                padding: const EdgeInsets.all(40.0),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(LucideIcons.alertCircle, color: Color(0xFFA855F7), size: 64),
                    const SizedBox(height: 16),
                    Text(_error!, textAlign: TextAlign.center,
                      style: const TextStyle(color: Colors.white70, fontSize: 14, height: 1.5)),
                    const SizedBox(height: 24),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFA855F7),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      onPressed: () => Navigator.pop(context),
                      child: const Text('Kembali'),
                    ),
                  ],
                ),
              ),
            )
          else if (_streamUrl != null)
            Center(
              child: kIsWeb
                ? (_isDirectVideo 
                    ? VideoPlayerWeb(url: _streamUrl!, isDirectVideo: true)
                    : VideoPlayerWeb(url: _streamUrl!))
                : const Text('Platform not supported', style: TextStyle(color: Colors.white)),
            ),

          // Server Selector (if multiple servers available)
          if (_streamUrl != null && _serversList.length > 1)
            Positioned(
              bottom: 20,
              left: 20,
              right: 20,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.8),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.white24),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Jika video diblokir, coba server lain:', 
                      style: TextStyle(color: Colors.white70, fontSize: 12)),
                    const SizedBox(height: 8),
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: _serversList.map((srv) {
                          final isActive = _currentServerName == srv['name'];
                          return Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: ElevatedButton(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: isActive ? const Color(0xFFA855F7) : Colors.white10,
                                foregroundColor: Colors.white,
                                elevation: 0,
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              ),
                              onPressed: () {
                                if (!isActive) {
                                  setState(() {
                                    _streamUrl = null; // force reload iframe
                                  });
                                  Future.delayed(const Duration(milliseconds: 100), () {
                                    if (mounted) {
                                      setState(() {
                                        _streamUrl = srv['url'];
                                        _currentServerName = srv['name'];
                                      });
                                    }
                                  });
                                }
                              },
                              child: Text(srv['name'] ?? 'Server', style: const TextStyle(fontSize: 12)),
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                  ],
                ),
              ),
            ),

          // Back button
          Positioned(
            top: 40, left: 16,
            child: CircleAvatar(
              backgroundColor: Colors.black54,
              child: IconButton(
                icon: const Icon(LucideIcons.chevronLeft, color: Colors.white, size: 22),
                onPressed: () => Navigator.pop(context),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
