import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../models/anime_card_model.dart';
import '../widgets/anime_card.dart';
import 'anime_detail_page.dart';

class GenrePage extends StatefulWidget {
  const GenrePage({super.key});

  @override
  State<GenrePage> createState() => _GenrePageState();
}

class _GenrePageState extends State<GenrePage> {
  List<dynamic> _genres = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _fetchGenres();
  }

  Future<void> _fetchGenres() async {
    final data = await ApiService.getGenres();
    if (mounted) {
      setState(() {
        _genres = data is List ? data : (data?['genreList'] ?? []);
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0F),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0A0A0F),
        elevation: 0,
        centerTitle: true,
        title: Text('Genre Anime', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 18)),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF3B82F6)))
          : GridView.builder(
              padding: const EdgeInsets.all(20),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                childAspectRatio: 2.8,
                crossAxisSpacing: 12,
                mainAxisSpacing: 12,
              ),
              itemCount: _genres.length,
              itemBuilder: (context, index) {
                final genre = _genres[index];
                final String title = genre['genreName'] ?? genre['title'] ?? 'Unknown';
                final String id = genre['genreId'] ?? genre['slug'] ?? '';

                return GestureDetector(
                  onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => GenreDetailPage(genreId: id, genreTitle: title))),
                  child: Container(
                    decoration: BoxDecoration(
                      color: const Color(0xFF12121A),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.white.withOpacity(0.05)),
                    ),
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: Row(
                      children: [
                        const Icon(LucideIcons.tag, size: 14, color: Color(0xFF3B82F6)),
                        const SizedBox(width: 10),
                        Expanded(child: Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13), maxLines: 1, overflow: TextOverflow.ellipsis)),
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }
}

class GenreDetailPage extends StatefulWidget {
  final String genreId;
  final String genreTitle;
  const GenreDetailPage({super.key, required this.genreId, required this.genreTitle});

  @override
  State<GenreDetailPage> createState() => _GenreDetailPageState();
}

class _GenreDetailPageState extends State<GenreDetailPage> {
  List<AnimeCardModel> _animeList = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    final data = await ApiService.getAnimeByGenre(widget.genreId);
    if (mounted) {
      setState(() {
        if (data != null) {
          final List? list = data['animeList'];
          if (list != null) {
            _animeList = list.map((e) => AnimeCardModel.fromSanka(e)).toList();
          }
        }
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0F),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0A0A0F),
        elevation: 0,
        title: Text(widget.genreTitle, style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF3B82F6)))
          : _animeList.isEmpty
            ? const Center(child: Text('Tidak ada anime ditemukan', style: TextStyle(color: Colors.white38)))
            : GridView.builder(
                padding: const EdgeInsets.all(16),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  childAspectRatio: 0.6,
                  crossAxisSpacing: 16,
                  mainAxisSpacing: 20,
                ),
                itemCount: _animeList.length,
                itemBuilder: (context, index) => AnimeCard(
                  anime: _animeList[index],
                  onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => AnimeDetailPage(
                    animeId: _animeList[index].slug ?? '',
                    title: _animeList[index].title,
                    poster: _animeList[index].poster,
                    type: 'anime',
                  ))),
                ),
              ),
    );
  }
}
