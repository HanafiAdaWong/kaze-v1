import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter/foundation.dart';
import '../services/api_service.dart';

// Conditional imports for Web
import 'video_player_web.dart' if (dart.library.io) 'video_player_mobile.dart';

class VideoPlayerPage extends StatefulWidget {
  final String url;
  final String? title;
  final String? type;
  final String? animeId;
  final List? episodes;
  final int? currentIndex;
  final dynamic animeDetail;

  const VideoPlayerPage({
    super.key,
    required this.url,
    this.title,
    this.type,
    this.animeId,
    this.episodes,
    this.currentIndex,
    this.animeDetail,
  });

  @override
  State<VideoPlayerPage> createState() => _VideoPlayerPageState();
}

class _VideoPlayerPageState extends State<VideoPlayerPage> {
  late String _currentUrl;
  late String _currentTitle;
  late int _currentIndex;

  String? _streamUrl;
  bool _loading = true;
  String? _error;
  bool _isDirectVideo = false;
  
  List<Map<String, String>> _serversList = [];
  String? _currentServerName;

  @override
  void initState() {
    super.initState();
    _currentUrl = widget.url;
    _currentTitle = widget.title ?? 'Video Player';
    _currentIndex = widget.currentIndex ?? 0;
    _resolveStream();
  }

  Future<void> _resolveStream() async {
    if (!mounted) return;
    setState(() { _loading = true; _error = null; _serversList = []; });

    String? resolvedUrl;
    bool directVideo = false;

    try {
      if (_currentUrl.contains('sankavollerei.com')) {
        final slug = _currentUrl.split('/episode/').last.split('?').first;

        if (widget.type == 'donghua') {
          final raw = await ApiService.getDonghuaEpisode(slug);
          _extractDonghuaServers(raw);
          if (_serversList.isNotEmpty) {
            resolvedUrl = _serversList.first['url'];
            _currentServerName = _serversList.first['name'];
          }
        } else {
          // Anime (Otakudesu/Samehadaku)
          final data = await ApiService.getEpisodeDetail(slug);
          resolvedUrl = await _extractAnimeStreamUrl(data);
        }
      } else {
        resolvedUrl = _currentUrl;
      }
    } catch (e) {
      debugPrint('[Player] Error: $e');
      _error = 'Gagal memuat video. Pastikan koneksi stabil atau coba server lain.';
    }

    if (!mounted) return;
    setState(() {
      _streamUrl = resolvedUrl;
      _isDirectVideo = directVideo;
      _loading = false;
    });
  }

  void _extractDonghuaServers(dynamic data) {
    _serversList.clear();
    if (data == null || data['streaming'] == null) return;
    final s = data['streaming'];
    if (s['servers'] is List) {
      for (var srv in s['servers']) {
        _serversList.add({
          'name': srv['name']?.toString() ?? 'Server',
          'url': srv['url']?.toString() ?? ''
        });
      }
    }
  }

  Future<String?> _extractAnimeStreamUrl(dynamic data) async {
    if (data == null) return null;

    _serversList.clear();
    final qualities = data['server']?['qualities'];
    if (qualities is List && qualities.isNotEmpty) {
      for (var q in qualities) {
        final qName = q['title']?.toString() ?? 'HD';
        final srvs = q['serverList'];
        if (srvs is List) {
          for (var s in srvs) {
            final sName = s['name']?.toString() ?? 'Default';
            _serversList.add({
              'name': '$qName - $sName',
              'serverId': s['serverId']?.toString() ?? ''
            });
          }
        }
      }
    }

    // Prioritaskan default streaming URL jika ada (biasanya 360p/direct)
    if (data['defaultStreamingUrl'] != null) return data['defaultStreamingUrl'];

    // Jika tidak ada default, ambil server pertama yang tersedia
    if (_serversList.isNotEmpty) {
      final firstSrv = _serversList.first;
      if (firstSrv['serverId'] != null) {
        final srvData = await ApiService.getServerUrl(firstSrv['serverId']!);
        _currentServerName = firstSrv['name'];
        return srvData?['url'];
      }
    }

    return null;
  }

  void _changeEpisode(int index) {
    if (index < 0 || index >= (widget.episodes?.length ?? 0)) return;
    final ep = widget.episodes![index];

    String nextUrl = '';
    String nextTitle = '';

    if (widget.type == 'donghua') {
      nextUrl = ApiService.getDonghuaStreamUrl(ep['slug'] ?? ep['episodeId'] ?? '');
      nextTitle = ep['episode']?.toString() ?? 'Episode ${index + 1}';
    } else {
      nextUrl = ApiService.getStreamUrl(ep['episodeId'] ?? ep['slug'] ?? '');
      nextTitle = ep['eps']?.toString() ?? 'Episode ${index + 1}';
    }

    setState(() {
      _currentIndex = index;
      _currentUrl = nextUrl;
      _currentTitle = nextTitle;
      _streamUrl = null;
    });
    _resolveStream();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isWide = size.width > 1000;

    return Scaffold(
      backgroundColor: const Color(0xFF0B0A11),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(LucideIcons.chevronLeft, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(_currentTitle, style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold)),
      ),
      body: isWide ? _buildWideLayout() : _buildMobileLayout(),
    );
  }

  Widget _buildWideLayout() {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          flex: 7,
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildPlayerBox(),
                const SizedBox(height: 20),
                _buildUnifiedControls(),
                const SizedBox(height: 20),
                _buildInfoBox(),
              ],
            ),
          ),
        ),
        Container(
          width: 350,
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            border: Border(left: BorderSide(color: Colors.white.withOpacity(0.05))),
          ),
          child: _buildSidebar(),
        ),
      ],
    );
  }

  Widget _buildMobileLayout() {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildPlayerBox(),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildUnifiedControls(),
                const SizedBox(height: 24),
                _buildInfoBox(),
                const SizedBox(height: 32),
                Text('Daftar Episode', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 16),
                _buildEpisodeList(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPlayerBox() {
    return AspectRatio(
      aspectRatio: 16 / 9,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.black,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.white.withOpacity(0.05)),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.5), blurRadius: 30)],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(11),
          child: _loading
            ? const Center(child: CircularProgressIndicator(color: Color(0xFF3B82F6)))
            : _error != null
              ? _buildErrorPlaceholder()
              : _streamUrl == null
                ? const Center(child: Text('Video tidak tersedia'))
                : VideoPlayerWeb(url: _streamUrl!, isDirectVideo: _isDirectVideo),
        ),
      ),
    );
  }

  Widget _buildErrorPlaceholder() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(LucideIcons.alertCircle, color: Colors.white24, size: 48),
          const SizedBox(height: 16),
          Text(_error!, textAlign: TextAlign.center, style: const TextStyle(color: Colors.white70)),
          const SizedBox(height: 20),
          ElevatedButton(
            onPressed: _resolveStream,
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF3B82F6)),
            child: const Text('Coba Lagi'),
          ),
        ],
      ),
    );
  }

  Widget _buildUnifiedControls() {
    final hasNext = _currentIndex < (widget.episodes?.length ?? 0) - 1;
    final hasPrev = _currentIndex > 0;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: const Color(0xFF18181B).withOpacity(0.5),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              _navBtn(LucideIcons.chevronLeft, 'Prev', hasPrev ? () => _changeEpisode(_currentIndex - 1) : null),
              const SizedBox(width: 8),
              _navBtn(LucideIcons.chevronRight, 'Next', hasNext ? () => _changeEpisode(_currentIndex + 1) : null),
            ],
          ),
          if (_serversList.isNotEmpty)
            _navBtn(LucideIcons.layers, 'Server', () => _showServerSheet()),
        ],
      ),
    );
  }

  Widget _navBtn(IconData icon, String label, VoidCallback? onTap) {
    final disabled = onTap == null;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: disabled ? Colors.white.withOpacity(0.02) : Colors.white.withOpacity(0.05),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.white.withOpacity(0.05)),
        ),
        child: Row(
          children: [
            Icon(icon, size: 16, color: disabled ? Colors.white24 : Colors.white70),
            const SizedBox(width: 6),
            Text(label, style: TextStyle(color: disabled ? Colors.white24 : Colors.white70, fontSize: 13, fontWeight: FontWeight.w600)),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoBox() {
    final detail = widget.animeDetail;
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: const Color(0xFF12121A),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(_currentTitle, style: GoogleFonts.inter(fontSize: 20, fontWeight: FontWeight.w700, color: Colors.white)),
          const SizedBox(height: 12),
          Row(
            children: [
              const Icon(LucideIcons.star, size: 14, color: Colors.amber),
              const SizedBox(width: 6),
              Text(detail?['score']?.toString() ?? '?.?', style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white70)),
              const SizedBox(width: 16),
              const Icon(LucideIcons.type, size: 14, color: Color(0xFF3B82F6)),
              const SizedBox(width: 6),
              Text(widget.type?.toUpperCase() ?? 'ANIME', style: const TextStyle(color: Color(0xFF3B82F6), fontWeight: FontWeight.bold, fontSize: 12)),
            ],
          ),
          const SizedBox(height: 20),
          const Divider(color: Colors.white10),
          const SizedBox(height: 20),
          const Text('Tentang Serial:', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
          const SizedBox(height: 8),
          Text(
            detail?['synopsis']?.toString() ?? detail?['description']?.toString() ?? 'Tidak ada deskripsi tambahan.',
            maxLines: 4,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(color: Colors.white54, height: 1.6),
          ),
        ],
      ),
    );
  }

  Widget _buildSidebar() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(LucideIcons.list, size: 18, color: Color(0xFF3B82F6)),
            const SizedBox(width: 10),
            Text('Playlist Episode', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold)),
          ],
        ),
        const SizedBox(height: 20),
        Expanded(child: _buildEpisodeList()),
      ],
    );
  }

  Widget _buildEpisodeList() {
    final episodes = widget.episodes ?? [];
    return ListView.separated(
      shrinkWrap: true,
      physics: const ClampingScrollPhysics(),
      itemCount: episodes.length,
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemBuilder: (context, index) {
        final ep = episodes[index];
        final isActive = _currentIndex == index;
        final String title = ep['eps'] ?? ep['episode'] ?? ep['title'] ?? 'Episode ${index + 1}';

        return GestureDetector(
          onTap: () => _changeEpisode(index),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: isActive ? const Color(0xFF3B82F6).withOpacity(0.1) : const Color(0xFF18181B).withOpacity(0.3),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: isActive ? const Color(0xFF3B82F6).withOpacity(0.4) : Colors.white.withOpacity(0.05)),
            ),
            child: Row(
              children: [
                Container(
                  width: 30,
                  height: 30,
                  decoration: BoxDecoration(
                    color: isActive ? const Color(0xFF3B82F6) : Colors.white.withOpacity(0.05),
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Text('${index + 1}', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: isActive ? Colors.white : Colors.white38)),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(title, maxLines: 1, overflow: TextOverflow.ellipsis,
                    style: TextStyle(color: isActive ? Colors.white : Colors.white70, fontWeight: isActive ? FontWeight.bold : FontWeight.normal)),
                ),
                if (isActive) const Icon(LucideIcons.play, size: 14, color: Color(0xFF3B82F6)),
              ],
            ),
          ),
        );
      },
    );
  }

  void _showServerSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF12121A),
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) {
        return Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Pilih Server Video', style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 20),
              Flexible(
                child: ListView.separated(
                  shrinkWrap: true,
                  itemCount: _serversList.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    final srv = _serversList[index];
                    final isActive = _currentServerName == srv['name'];
                    return ListTile(
                      onTap: () async {
                        Navigator.pop(context);
                        setState(() => _loading = true);

                        String? newUrl;
                        if (srv['serverId'] != null) {
                           final data = await ApiService.getServerUrl(srv['serverId']!);
                           newUrl = data?['url'];
                        } else {
                           newUrl = srv['url'];
                        }

                        setState(() {
                          _streamUrl = newUrl;
                          _currentServerName = srv['name'];
                          _loading = false;
                        });
                      },
                      tileColor: isActive ? const Color(0xFF3B82F6).withOpacity(0.1) : Colors.white.withOpacity(0.03),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      title: Text(srv['name']!, style: TextStyle(color: isActive ? const Color(0xFF3B82F6) : Colors.white70, fontWeight: FontWeight.bold)),
                      trailing: isActive ? const Icon(LucideIcons.check, color: Color(0xFF3B82F6)) : null,
                    );
                  },
                ),
              ),
              const SizedBox(height: 20),
            ],
          ),
        );
      },
    );
  }
}
