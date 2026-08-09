import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../models/anime_card_model.dart';
import '../widgets/anime_card.dart';
import 'anime_detail_page.dart';
import 'search_page.dart';
import 'genre_page.dart';
import 'donghua_page.dart';
import 'package:flutter/foundation.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  List<AnimeCardModel> _ongoingAnime = [];
  List<AnimeCardModel> _donghuaAnime = [];
  bool _loading = true;
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    if (!mounted) return;
    setState(() => _loading = true);
    try {
      final results = await Future.wait([
        ApiService.getWatchHome().catchError((e) {
          debugPrint('Error Home: $e');
          return null;
        }),
        ApiService.getDonghuaHome().catchError((e) {
          debugPrint('Error Donghua: $e');
          return null;
        }),
      ]);

      final watchHome = results[0];
      final donghuaHome = results[1];

      if (mounted) {
        setState(() {
          // Ongoing Anime
          if (watchHome != null && watchHome is Map) {
            final ongoing = watchHome['ongoing'];
            if (ongoing != null && ongoing['animeList'] is List) {
              final List list = ongoing['animeList'];
              _ongoingAnime = list.map((e) => AnimeCardModel.fromSanka(e)).toList();
            }
          }

          // Donghua
          if (donghuaHome != null) {
            List? list;
            if (donghuaHome is List) {
              list = donghuaHome;
            } else if (donghuaHome is Map) {
              list = donghuaHome['latest_release'] ?? donghuaHome['data'];
            }
            if (list != null) {
              _donghuaAnime = list.map((e) => AnimeCardModel.fromSanka(e)).toList();
            }
          }
          _loading = false;
        });
      }
    } catch (e) {
      debugPrint('Home fetch data error: $e');
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0F),
      body: RefreshIndicator(
        onRefresh: _fetchData,
        color: const Color(0xFF3B82F6),
        backgroundColor: const Color(0xFF18181B),
        child: CustomScrollView(
          slivers: [
            _buildNavbar(),
            _buildHero(),
            if (_loading)
              const SliverFillRemaining(child: Center(child: CircularProgressIndicator(color: Color(0xFF3B82F6))))
            else if (_ongoingAnime.isEmpty && _donghuaAnime.isEmpty)
              SliverFillRemaining(
                child: Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text('Data tidak ditemukan', style: TextStyle(color: Colors.white38)),
                      const SizedBox(height: 12),
                      ElevatedButton(onPressed: _fetchData, child: const Text('Coba Lagi')),
                    ],
                  ),
                ),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.only(bottom: 100),
                sliver: SliverList(
                  delegate: SliverChildListDelegate([
                    if (_ongoingAnime.isNotEmpty)
                      _buildSection('Sedang', 'Tayang', _ongoingAnime, 'anime'),
                    if (_donghuaAnime.isNotEmpty)
                      _buildSection('Donghua', 'Terbaru', _donghuaAnime, 'donghua'),
                    _buildShortcutGrid(),
                  ]),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildNavbar() {
    return SliverAppBar(
      floating: true,
      backgroundColor: const Color(0xFF0A0A0F).withOpacity(0.9),
      elevation: 0,
      titleSpacing: 16,
      title: Row(
        children: [
          Container(
            width: 32, height: 32,
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              color: Color(0xFF3B82F6),
              image: DecorationImage(image: NetworkImage('https://github.com/harukashi.png'), fit: BoxFit.cover),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Container(
              height: 38,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.05),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.white.withOpacity(0.1)),
              ),
              child: TextField(
                controller: _searchController,
                style: const TextStyle(fontSize: 13, color: Colors.white),
                decoration: const InputDecoration(
                  hintText: 'Cari anime...',
                  hintStyle: TextStyle(color: Colors.white24, fontSize: 13),
                  prefixIcon: Icon(LucideIcons.search, size: 16, color: Colors.white24),
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.symmetric(vertical: 9),
                ),
                onSubmitted: (v) {
                  if (v.isNotEmpty) Navigator.push(context, MaterialPageRoute(builder: (_) => SearchPage(initialQuery: v)));
                },
              ),
            ),
          ),
          const SizedBox(width: 12),
          _btnMasuk(),
        ],
      ),
    );
  }

  Widget _btnMasuk() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFF3B82F6),
        borderRadius: BorderRadius.circular(6),
      ),
      child: const Row(
        children: [
          Icon(LucideIcons.logIn, size: 14, color: Colors.white),
          SizedBox(width: 4),
          Text('Masuk', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white)),
        ],
      ),
    );
  }

  Widget _buildHero() {
    return SliverToBoxAdapter(
      child: Stack(
        children: [
          Container(
            height: 440,
            width: double.infinity,
            foregroundDecoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  const Color(0xFF0A0A0F).withOpacity(0.3),
                  const Color(0xFF0A0A0F).withOpacity(0.8),
                  const Color(0xFF0A0A0F),
                ],
              ),
            ),
            child: Image.network(
              'https://images.unsplash.com/photo-1578632738908-4521c726eebf?q=80&w=2070&auto=format&fit=crop',
              fit: BoxFit.cover,
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 60, 24, 40),
            child: Column(
              children: [
                _badgeHero(),
                const SizedBox(height: 24),
                RichText(
                  textAlign: TextAlign.center,
                  text: TextSpan(
                    style: GoogleFonts.inter(fontSize: 34, fontWeight: FontWeight.w900, color: Colors.white, height: 1.1),
                    children: const [
                      TextSpan(text: 'Nonton Anime\n'),
                      TextSpan(text: 'Sub Indo Gratis', style: TextStyle(color: Color(0xFF3B82F6))),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Temukan ribuan judul anime, streaming langsung, cek sinopsis, dan ikuti perkembangan terbaru.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.white70, fontSize: 13, height: 1.6),
                ),
                const SizedBox(height: 32),
                _searchHero(),
                const SizedBox(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    _heroAction('Nonton Anime', LucideIcons.play, const Color(0xFF3B82F6), true),
                    const SizedBox(width: 12),
                    _heroAction('Anime Ongoing', LucideIcons.trendingUp, Colors.white.withOpacity(0.05), false),
                  ],
                ),
                const SizedBox(height: 12),
                _heroAction('Donghua', LucideIcons.clapperboard, Colors.white.withOpacity(0.05), false),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _badgeHero() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFF3B82F6).withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFF3B82F6).withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(LucideIcons.sparkles, size: 12, color: Color(0xFF3B82F6)),
          const SizedBox(width: 8),
          Text(
            'Selamat datang di Kazedonime',
            style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: const Color(0xFF3B82F6)),
          ),
        ],
      ),
    );
  }

  Widget _searchHero() {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF18181B).withOpacity(0.8),
        borderRadius: BorderRadius.circular(30),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
      ),
      child: Row(
        children: [
          const SizedBox(width: 18),
          const Icon(LucideIcons.search, size: 18, color: Colors.white24),
          Expanded(
            child: TextField(
              style: const TextStyle(fontSize: 14, color: Colors.white),
              decoration: const InputDecoration(
                hintText: 'Cari anime untuk ditonton...',
                hintStyle: TextStyle(color: Colors.white24),
                border: InputBorder.none,
                contentPadding: EdgeInsets.symmetric(vertical: 16, horizontal: 12),
              ),
              onSubmitted: (v) {
                if (v.isNotEmpty) Navigator.push(context, MaterialPageRoute(builder: (_) => SearchPage(initialQuery: v)));
              },
            ),
          ),
          GestureDetector(
            onTap: () {
              if (_searchController.text.isNotEmpty) {
                Navigator.push(context, MaterialPageRoute(builder: (_) => SearchPage(initialQuery: _searchController.text)));
              }
            },
            child: Container(
              margin: const EdgeInsets.all(5),
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              decoration: BoxDecoration(
                color: const Color(0xFF3B82F6),
                borderRadius: BorderRadius.circular(25),
              ),
              child: const Text('Cari', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.white)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _heroAction(String label, IconData icon, Color color, bool isPrimary) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(30),
        border: Border.all(color: Colors.white.withOpacity(0.08)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: Colors.white),
          const SizedBox(width: 8),
          Text(label, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.white)),
        ],
      ),
    );
  }

  Widget _buildSection(String title, String accent, List<AnimeCardModel> items, String type) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                RichText(
                  text: TextSpan(
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Colors.white),
                    children: [
                      TextSpan(text: '$title '),
                      TextSpan(text: accent, style: const TextStyle(color: Color(0xFF3B82F6))),
                    ],
                  ),
                ),
                const Icon(LucideIcons.chevronRight, size: 20, color: Colors.white24),
              ],
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            height: 250,
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              scrollDirection: Axis.horizontal,
              itemCount: items.length,
              separatorBuilder: (_, __) => const SizedBox(width: 14),
              itemBuilder: (context, index) => SizedBox(
                width: 150,
                child: AnimeCard(
                  anime: items[index],
                  onTap: () => _openDetail(items[index], type),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildShortcutGrid() {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Jelajahi Lebih Jauh', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
          const SizedBox(height: 20),
          GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: 2,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 2.4,
            children: [
              _shortcutItem('Ongoing', 'Tayang', const Color(0xFF3B82F6), LucideIcons.trendingUp),
              _shortcutItem('Donghua', 'China', const Color(0xFF10B981), LucideIcons.clapperboard),
              _shortcutItem('Genre', 'Kategori', const Color(0xFFF59E0B), LucideIcons.tag),
              _shortcutItem('Profil', 'User', const Color(0xFF6366F1), LucideIcons.user),
            ],
          ),
        ],
      ),
    );
  }

  Widget _shortcutItem(String title, String sub, Color color, IconData icon) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF12121A),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      padding: const EdgeInsets.all(12),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: 12),
          Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              Text(sub, style: const TextStyle(color: Colors.white24, fontSize: 11)),
            ],
          )
        ],
      ),
    );
  }

  void _openDetail(AnimeCardModel anime, String type) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => AnimeDetailPage(
          animeId: anime.slug ?? anime.id.toString(),
          title: anime.title,
          poster: anime.poster,
          type: type,
        ),
      ),
    );
  }
}
