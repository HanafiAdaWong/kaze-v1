import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../services/api_service.dart';
import '../models/anime_card_model.dart';
import '../widgets/anime_card.dart';
import 'anime_detail_page.dart';
import 'search_page.dart';
import 'package:flutter/foundation.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  List<AnimeCardModel> _trendingAnime = [];
  final Map<String, List<AnimeCardModel>> _sections = {
    'Ongoing Anime': [],
    'Drama China': [],
    'Donghua': [],
  };
  bool _loading = true;
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    setState(() => _loading = true);
    try {
      final results = await Future.wait([
        ApiService.getTopAnime().catchError((e) => {'data': []}),
        ApiService.getWatchHome().catchError((e) => null),
        ApiService.getDrachinHome().catchError((e) {
          debugPrint('DEBUG Drachin Error: $e');
          return null;
        }),
        ApiService.getDonghuaHome().catchError((e) => null),
      ]);

      debugPrint('DEBUG DrachinHome Result: ${results[2]}');

      final topAnime = results[0];
      final watchHome = results[1];
      final drachinHome = results[2];
      final donghuaHome = results[3];

      setState(() {
        if (topAnime is Map && topAnime['data'] != null) {
          _trendingAnime = (topAnime['data'] as List)
              .take(10)
              .map((e) => AnimeCardModel.fromJikan(e))
              .toList();
        }

        if (watchHome is Map && watchHome['ongoing'] is List) {
          _sections['Ongoing Anime'] = (watchHome['ongoing'] as List)
              .map((e) => AnimeCardModel.fromSanka(e))
              .toList();
        }

        if (drachinHome is Map) {
          final drachinList = drachinHome['latest'] ?? drachinHome['popular'] ?? [];
          if (drachinList is List) {
            _sections['Drama China'] = drachinList
                .map((e) => AnimeCardModel.fromSanka(e))
                .toList();
          }
        }

        final donghuaList = (donghuaHome is Map) ? (donghuaHome['latest_release'] ?? donghuaHome) : donghuaHome;
        if (donghuaList is List) {
          _sections['Donghua'] = donghuaList
              .map((e) => AnimeCardModel.fromSanka(e))
              .toList();
        }
      });
      
      debugPrint('DEBUG Sections Final: Ongoing=${_sections['Ongoing Anime']?.length}, Drachin=${_sections['Drama China']?.length}, Donghua=${_sections['Donghua']?.length}');
    } catch (e) {
      debugPrint('General home data error: $e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: RefreshIndicator(
        onRefresh: _fetchData,
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: Container(
                padding: const EdgeInsets.fromLTRB(24, 60, 24, 30),
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [Color(0xFF1E1B4B), Color(0xFF09090B)],
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(color: Colors.white.withOpacity(0.05), borderRadius: BorderRadius.circular(20)),
                      child: const Row(mainAxisSize: MainAxisSize.min, children: [
                        Icon(LucideIcons.home, size: 14, color: Color(0xFFA855F7)),
                        SizedBox(width: 8),
                        Text('Sinopsis', style: TextStyle(fontSize: 12, color: Colors.white70)),
                      ]),
                    ),
                    const SizedBox(height: 16),
                    const Text('Jelajahi Dunia', style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold)),
                    const Text('Anime', style: TextStyle(fontSize: 36, fontWeight: FontWeight.bold, color: Color(0xFFA855F7))),
                    const SizedBox(height: 12),
                    const Text('Telusuri ribuan judul anime, baca sinopsis, dan temukan serial favoritmu.', style: TextStyle(color: Colors.white60)),
                    const SizedBox(height: 24),
                    Container(
                      decoration: BoxDecoration(color: Colors.white10, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.white10)),
                      child: TextField(
                        controller: _searchController,
                        onSubmitted: (query) {
                          if (query.isEmpty) return;
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => SearchPage(initialQuery: query),
                            ),
                          );
                        },
                        decoration: const InputDecoration(
                          hintText: 'Cari judul anime...',
                          border: InputBorder.none,
                          prefixIcon: Icon(LucideIcons.search, size: 20, color: Colors.white30),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            if (_trendingAnime.isNotEmpty)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 24),
                        child: Text('🔥 Anime Terbaik Minggu Ini', style: TextStyle(fontSize: 14, color: Colors.white70)),
                      ),
                      const SizedBox(height: 16),
                      SizedBox(
                        height: 200,
                        child: ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 24),
                          scrollDirection: Axis.horizontal,
                          itemCount: _trendingAnime.length,
                          itemBuilder: (context, index) => Container(
                            width: 300,
                            margin: const EdgeInsets.only(right: 16),
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(16),
                              child: Stack(
                                children: [
                                  Image.network(
                                    kIsWeb ? 'https://images.weserv.nl/?url=${Uri.encodeComponent(_trendingAnime[index].poster)}' : _trendingAnime[index].poster,
                                    fit: BoxFit.cover, 
                                    width: 300, 
                                    height: 200,
                                    errorBuilder: (context, error, stackTrace) => Container(color: Colors.white10, child: const Center(child: Icon(LucideIcons.image))),
                                  ),
                                  Container(decoration: BoxDecoration(gradient: LinearGradient(begin: Alignment.topCenter, end: Alignment.bottomCenter, colors: [Colors.transparent, Colors.black.withOpacity(0.8)]))),
                                  Positioned(bottom: 16, left: 16, child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                    Text(_trendingAnime[index].title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                                    const Text('Trending #1', style: TextStyle(color: Color(0xFFA855F7), fontSize: 12)),
                                  ])),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

            if (_loading)
              const SliverToBoxAdapter(child: Center(child: Padding(padding: EdgeInsets.all(50), child: CircularProgressIndicator())))
            else
              SliverList(
                delegate: SliverChildListDelegate([
                  if (_sections['Ongoing Anime']!.isNotEmpty) _buildSection('Ongoing Anime', _sections['Ongoing Anime']!, 'anime'),
                  if (_sections['Drama China']!.isNotEmpty) _buildSection('Drama China', _sections['Drama China']!, 'drachin'),
                  if (_sections['Donghua']!.isNotEmpty) _buildSection('Donghua', _sections['Donghua']!, 'donghua'),
                ]),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildSection(String title, List<AnimeCardModel> items, String sectionType) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              TextButton(onPressed: () {}, child: const Text('Lainnya')),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 240,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: items.length,
              separatorBuilder: (context, index) => const SizedBox(width: 12),
              itemBuilder: (context, index) {
                return SizedBox(
                  width: 150,
                  child: AnimeCard(
                    anime: items[index],
                    onTap: () {
                      final targetId = items[index].slug ?? items[index].id.toString();
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => AnimeDetailPage(
                            animeId: targetId,
                            title: items[index].title,
                            poster: items[index].poster,
                            type: sectionType,
                          ),
                        ),
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
