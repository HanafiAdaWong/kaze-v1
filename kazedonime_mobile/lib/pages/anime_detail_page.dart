import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:lucide_icons/lucide_icons.dart';
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
      if (widget.type == 'drachin') {
        json = await ApiService.getDrachinDetail(widget.animeId);
      } else if (widget.type == 'donghua') {
        json = await ApiService.getDonghuaDetail(widget.animeId);
      } else {
        // Anime (Otakudesu) - response has { data: { ... }, pagination: { ... } }
        final res = await ApiService.getWatchAnimeDetail(widget.animeId);
        // _extractData already handles the 'data' unwrapping in ApiService
        json = res;
      }

      if (mounted) setState(() => _detail = json);
    } catch (e) {
      debugPrint('[DetailPage] Fetch Error: $e');
      if (mounted) setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  List _getEpisodes() {
    if (_detail == null) return [];
    // Anime (Otakudesu): episodeList
    // Donghua: episodes_list
    // Drachin: episodes
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
      // Handle synopsis: { paragraphs: ["..."] }
      if (value['paragraphs'] is List && (value['paragraphs'] as List).isNotEmpty) {
        return value['paragraphs'][0].toString();
      }
      // Handle score: { value: "8.5" }
      if (value['value'] != null) return value['value'].toString();
    }
    return value.toString();
  }

  @override
  Widget build(BuildContext context) {
    final posterUrl = proxyImageUrl(widget.poster);
    final episodes = _getEpisodes();
    final title = _s(_detail?['title'] ?? _detail?['english'] ?? _detail?['synonyms'], widget.title);
    final synopsis = _s(_detail?['synopsis'] ?? _detail?['description'], 'Belum ada sinopsis.');

    return Scaffold(
      backgroundColor: const Color(0xFF09090B),
      body: CustomScrollView(
        slivers: [
          // Hero poster
          SliverAppBar(
            expandedHeight: 380,
            pinned: true,
            leading: IconButton(
              icon: const Icon(LucideIcons.arrowLeft, color: Colors.white),
              onPressed: () => Navigator.pop(context),
            ),
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  Image.network(
                    posterUrl,
                    fit: BoxFit.cover,
                    errorBuilder: (c, e, s) => Container(color: const Color(0xFF1a1a2e)),
                  ),
                  Container(
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [Colors.transparent, Color(0xFF09090B)],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Content
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Metadata badges
                  Row(
                    children: [
                      if (_detail?['score'] != null) ...[
                        const Icon(LucideIcons.star, size: 16, color: Colors.amber),
                        const SizedBox(width: 6),
                        Text(_s(_detail['score'], 'N/A'),
                          style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
                        const SizedBox(width: 16),
                      ],
                      const Icon(LucideIcons.playCircle, size: 16, color: Colors.white70),
                      const SizedBox(width: 6),
                      Text('${episodes.length} Episode',
                        style: const TextStyle(color: Colors.white70)),
                    ],
                  ),

                  const SizedBox(height: 16),

                  // Title
                  Text(title,
                    style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),

                  const SizedBox(height: 12),

                  // Synopsis
                  Text(synopsis,
                    style: const TextStyle(color: Colors.white54, height: 1.6, fontSize: 14)),

                  const SizedBox(height: 28),

                  // Episode header
                  const Text('Daftar Episode',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white)),

                  const SizedBox(height: 12),

                  // Loading / Error / Episode List
                  if (_loading)
                    const Center(child: Padding(
                      padding: EdgeInsets.all(24),
                      child: CircularProgressIndicator(color: Color(0xFFA855F7)),
                    ))
                  else if (_error != null)
                    Padding(
                      padding: const EdgeInsets.all(16),
                      child: Text('Error: $_error', style: const TextStyle(color: Colors.redAccent)),
                    )
                  else
                    _buildEpisodeList(episodes),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEpisodeList(List episodes) {
    if (episodes.isEmpty) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 20),
        child: Center(child: Text('Episode belum tersedia.', style: TextStyle(color: Colors.white30))),
      );
    }

    return ListView.separated(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: episodes.length,
      separatorBuilder: (_, __) => const Divider(color: Colors.white10, height: 1),
      itemBuilder: (context, index) {
        final ep = episodes[index];
        // Otakudesu: ep.eps, ep.episodeId
        // Donghua: ep.episode, ep.slug
        // Drachin: ep.title, ep.bookId, ep.index
        final String epTitle = _s(
          ep['eps'] ?? ep['episode'] ?? ep['title'],
          'Episode ${index + 1}',
        );

        return ListTile(
          contentPadding: EdgeInsets.zero,
          leading: Container(
            width: 36, height: 36,
            decoration: BoxDecoration(
              color: const Color(0xFFA855F7).withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Center(
              child: Text('${index + 1}',
                style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFFA855F7))),
            ),
          ),
          title: Text(epTitle, style: const TextStyle(fontSize: 14, color: Colors.white)),
          trailing: const Icon(LucideIcons.playCircle, size: 20, color: Colors.white24),
          onTap: () => _playEpisode(ep, epTitle, index),
        );
      },
    );
  }

  void _playEpisode(Map ep, String epTitle, int index) {
    if (widget.type == 'drachin') {
      // Drachin: use getDrachinEpisode(slug, index) → videos map
      final epIndex = _s(ep['index'] ?? ep['episode_index'], '${index + 1}');
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (_) => VideoPlayerPage(
            url: '', // Not used for drachin
            title: epTitle,
            drachinSlug: widget.animeId, // The series slug
            drachinIndex: epIndex,
          ),
        ),
      );
      return;
    }

    String streamUrl = '';
    if (widget.type == 'donghua') {
      final slug = _s(ep['slug'] ?? ep['episodeId'], '');
      streamUrl = ApiService.getDonghuaStreamUrl(slug);
    } else {
      // Anime (Otakudesu)
      final slug = _s(ep['episodeId'] ?? ep['slug'], '');
      streamUrl = ApiService.getStreamUrl(slug);
    }

    if (streamUrl.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Slug episode tidak ditemukan.')),
      );
      return;
    }

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => VideoPlayerPage(url: streamUrl, title: epTitle),
      ),
    );
  }
}
