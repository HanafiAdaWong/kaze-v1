import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../widgets/anime_card.dart' show proxyImageUrl;
import 'video_player_page.dart';

class AnimeDetailPage extends StatefulWidget {
  final String animeId;
  final String title;
  final String poster;
  final String type;

  const AnimeDetailPage({
    super.key,
    required this.animeId,
    required this.title,
    required this.poster,
    required this.type,
  });

  @override
  State<AnimeDetailPage> createState() => _AnimeDetailPageState();
}

class _AnimeDetailPageState extends State<AnimeDetailPage> {
  dynamic _detail;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchDetail();
  }

  Future<void> _fetchDetail() async {
    if (!mounted) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      dynamic json;
      // Perbaikan: Menghapus pengecekan 'drachin' yang sudah tidak ada
      if (widget.type == 'donghua') {
        json = await ApiService.getDonghuaDetail(widget.animeId);
      } else {
        json = await ApiService.getWatchAnimeDetail(widget.animeId);
      }
      if (mounted) setState(() => _detail = json);
    } catch (e) {
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  List _getEpisodes() {
    if (_detail == null) return [];
    dynamic epList = _detail['episodeList'] ??
        _detail['episodes_list'] ??
        _detail['episode_list'] ??
        _detail['episodes'] ??
        [];
    return epList is List ? epList : [];
  }

  String _s(dynamic value, [String fallback = '']) {
    if (value == null) return fallback;
    if (value is String) return value;
    if (value is Map) {
      if (value['paragraphs'] is List && (value['paragraphs'] as List).isNotEmpty) {
        return value['paragraphs'][0].toString();
      }
      if (value['value'] != null) return value['value'].toString();
    }
    return value.toString();
  }

  @override
  Widget build(BuildContext context) {
    final posterUrl = proxyImageUrl(widget.poster);
    final episodes = _getEpisodes();
    final title = _s(_detail?['title'] ?? _detail?['english'], widget.title);
    final synopsis = _s(_detail?['synopsis'] ?? _detail?['description'], 'Belum ada sinopsis.');

    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0F),
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 420,
            pinned: true,
            backgroundColor: const Color(0xFF0A0A0F),
            leading: IconButton(
              icon: const CircleAvatar(
                backgroundColor: Colors.black45,
                child: Icon(LucideIcons.chevronLeft, color: Colors.white, size: 20),
              ),
              onPressed: () => Navigator.pop(context),
            ),
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  Image.network(posterUrl, fit: BoxFit.cover),
                  BackdropFilter(
                    filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                    child: Container(color: Colors.black.withOpacity(0.5)),
                  ),
                  Container(
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [Colors.transparent, Color(0xFF0A0A0F)],
                        stops: [0.3, 1.0],
                      ),
                    ),
                  ),
                  Column(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      Container(
                        height: 200,
                        width: 140,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: [
                            BoxShadow(
                                color: Colors.black.withOpacity(0.5),
                                blurRadius: 20)
                          ],
                          border: Border.all(color: Colors.white10),
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(11),
                          child: Image.network(posterUrl, fit: BoxFit.cover),
                        ),
                      ),
                      const SizedBox(height: 20),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 24),
                        child: Text(
                          title,
                          textAlign: TextAlign.center,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: GoogleFonts.outfit(
                              fontSize: 22,
                              fontWeight: FontWeight.w800,
                              color: Colors.white),
                        ),
                      ),
                      const SizedBox(height: 12),
                      _buildMetaBadges(episodes.length),
                      const SizedBox(height: 30),
                    ],
                  ),
                ],
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Sinopsis',
                      style: GoogleFonts.outfit(
                          fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  Text(synopsis,
                      style: const TextStyle(
                          color: Colors.white60, height: 1.7, fontSize: 14)),
                  const SizedBox(height: 32),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Daftar Episode',
                          style: GoogleFonts.outfit(
                              fontSize: 18, fontWeight: FontWeight.bold)),
                      Text('${episodes.length} Total',
                          style: const TextStyle(
                              color: Colors.white38, fontSize: 12)),
                    ],
                  ),
                  const SizedBox(height: 16),
                  if (_loading)
                    const Center(
                        child: Padding(
                            padding: EdgeInsets.all(40),
                            child: CircularProgressIndicator(
                                color: Color(0xFF3B82F6))))
                  else if (_error != null)
                    Text('Gagal memuat data: $_error',
                        style: const TextStyle(color: Colors.redAccent))
                  else
                    _buildEpisodeGrid(episodes),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMetaBadges(int epCount) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (_detail?['score'] != null) ...[
          const Icon(LucideIcons.star, size: 14, color: Colors.amber),
          const SizedBox(width: 4),
          Text(_s(_detail['score']),
              style:
                  const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
          const SizedBox(width: 12),
        ],
        const Icon(LucideIcons.playCircle, size: 14, color: Color(0xFF3B82F6)),
        const SizedBox(width: 6),
        Text('$epCount Episode',
            style: const TextStyle(
                color: Colors.white70,
                fontSize: 13,
                fontWeight: FontWeight.w500)),
        const SizedBox(width: 12),
        Text(widget.type.toUpperCase(),
            style: const TextStyle(
                color: Color(0xFF3B82F6),
                fontSize: 11,
                fontWeight: FontWeight.w900,
                letterSpacing: 1)),
      ],
    );
  }

  Widget _buildEpisodeGrid(List episodes) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 5,
        mainAxisSpacing: 10,
        crossAxisSpacing: 10,
      ),
      itemCount: episodes.length,
      itemBuilder: (context, index) {
        final ep = episodes[index];
        return GestureDetector(
          onTap: () => _playEpisode(ep, index, episodes),
          child: Container(
            decoration: BoxDecoration(
              color: const Color(0xFF18181B),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: Colors.white.withOpacity(0.05)),
            ),
            child: Center(
              child: Text('${index + 1}',
                  style: GoogleFonts.outfit(
                      fontWeight: FontWeight.bold, color: Colors.white70)),
            ),
          ),
        );
      },
    );
  }

  void _playEpisode(Map ep, int currentIndex, List allEpisodes) {
    final String epTitle =
        _s(ep['eps'] ?? ep['episode'] ?? ep['title'], 'Episode ${currentIndex + 1}');

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => VideoPlayerPage(
          url: widget.type == 'donghua'
              ? ApiService.getDonghuaStreamUrl(_s(ep['slug'] ?? ep['episodeId']))
              : ApiService.getStreamUrl(_s(ep['episodeId'] ?? ep['slug'])),
          title: epTitle,
          type: widget.type,
          animeId: widget.animeId,
          episodes: allEpisodes,
          currentIndex: currentIndex,
          animeDetail: _detail,
        ),
      ),
    );
  }
}
