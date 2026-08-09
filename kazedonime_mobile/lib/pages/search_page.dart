import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../models/anime_card_model.dart';
import '../widgets/anime_card.dart';
import 'anime_detail_page.dart';

class SearchPage extends StatefulWidget {
  final String? initialQuery;
  const SearchPage({super.key, this.initialQuery});

  @override
  State<SearchPage> createState() => _SearchPageState();
}

class _SearchPageState extends State<SearchPage> {
  final _searchController = TextEditingController();
  List<AnimeCardModel> _results = [];
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    if (widget.initialQuery != null) {
      _searchController.text = widget.initialQuery!;
      _handleSearch();
    }
  }

  Future<void> _handleSearch() async {
    final query = _searchController.text.trim();
    if (query.isEmpty) return;

    setState(() {
      _loading = true;
      _results = [];
    });
    
    try {
      // PERBAIKAN: Gunakan tipe eksplisit Future<dynamic> untuk menghindari error Iterable
      final searches = await Future.wait<dynamic>(<Future<dynamic>>[
        ApiService.searchAnime(query).catchError((e) => null),
        ApiService.searchDonghua(query).catchError((e) => null),
      ]);

      final animeRaw = searches[0];
      final donghuaRaw = searches[1];

      List<AnimeCardModel> combined = [];

      if (animeRaw != null && animeRaw is Map && animeRaw['animeList'] is List) {
        combined.addAll((animeRaw['animeList'] as List).map((e) => AnimeCardModel.fromSanka(e, typeOverride: 'anime')));
      } else if (animeRaw is List) {
        combined.addAll(animeRaw.map((e) => AnimeCardModel.fromSanka(e, typeOverride: 'anime')));
      }

      if (donghuaRaw != null) {
        List? dList;
        if (donghuaRaw is List) dList = donghuaRaw;
        else if (donghuaRaw is Map) dList = donghuaRaw['data'] ?? donghuaRaw['animeList'];

        if (dList != null) {
          combined.addAll(dList.map((e) => AnimeCardModel.fromSanka(e, typeOverride: 'donghua')));
        }
      }

      if (mounted) setState(() => _results = combined);
    } catch (e) {
      debugPrint('Search error: $e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0F),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0A0A0F),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(LucideIcons.chevronLeft, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: Container(
          height: 42,
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            color: const Color(0xFF18181B),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: Colors.white.withOpacity(0.08)),
          ),
          child: TextField(
            controller: _searchController,
            autofocus: widget.initialQuery == null,
            style: const TextStyle(fontSize: 14, color: Colors.white),
            decoration: const InputDecoration(
              hintText: 'Cari anime atau donghua...',
              hintStyle: TextStyle(color: Colors.white24),
              border: InputBorder.none,
              isDense: true,
              contentPadding: EdgeInsets.symmetric(vertical: 10),
            ),
            onSubmitted: (_) => _handleSearch(),
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(LucideIcons.search, color: Color(0xFF3B82F6), size: 20),
            onPressed: _handleSearch,
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF3B82F6)))
          : _results.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(LucideIcons.search, size: 64, color: Colors.white.withOpacity(0.05)),
                      const SizedBox(height: 16),
                      Text(
                        _searchController.text.isEmpty
                          ? 'Cari anime favoritmu'
                          : 'Tidak ada hasil untuk "${_searchController.text}"',
                        style: const TextStyle(color: Colors.white38),
                      ),
                    ],
                  ),
                )
              : GridView.builder(
                  padding: const EdgeInsets.all(20),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    childAspectRatio: 0.58,
                    crossAxisSpacing: 16,
                    mainAxisSpacing: 20,
                  ),
                  itemCount: _results.length,
                  itemBuilder: (context, index) => AnimeCard(
                    anime: _results[index],
                    onTap: () {
                       final targetId = _results[index].slug ?? _results[index].id.toString();
                       Navigator.push(
                         context,
                         MaterialPageRoute(
                           builder: (_) => AnimeDetailPage(
                             animeId: targetId,
                             title: _results[index].title,
                             poster: _results[index].poster,
                             type: _results[index].type ?? 'anime',
                           ),
                         ),
                       );
                    },
                  ),
                ),
    );
  }
}
