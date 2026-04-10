import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
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
    if (_searchController.text.isEmpty) return;
    setState(() {
      _loading = true;
      _results = [];
    });
    
    try {
      final query = _searchController.text;
      
      final searches = await Future.wait([
        ApiService.searchAnime(query).catchError((e) => {'data': []}),
        ApiService.searchDrachin(query).catchError((e) => []),
        ApiService.searchDonghua(query).catchError((e) => []),
      ]);

      final animeRaw = searches[0];
      final drachinRaw = searches[1];
      final donghuaRaw = searches[2];

      List<AnimeCardModel> combined = [];

      // Process Anime (Now from Sanka)
      if (animeRaw is List) {
        combined.addAll(animeRaw.map((e) => AnimeCardModel.fromSanka(e, typeOverride: 'anime')));
      }
      if (drachinRaw is List) {
        combined.addAll(drachinRaw.map((e) => AnimeCardModel.fromSanka(e, typeOverride: 'drachin')));
      }
      if (donghuaRaw is List) {
        combined.addAll(donghuaRaw.map((e) => AnimeCardModel.fromSanka(e, typeOverride: 'donghua')));
      }

      setState(() => _results = combined);
    } catch (e) {
      debugPrint('Search error: $e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: TextField(
          controller: _searchController,
          decoration: const InputDecoration(
            hintText: 'Cari anime, drachin, atau donghua...',
            border: InputBorder.none,
            prefixIcon: Icon(LucideIcons.search, size: 20),
          ),
          onSubmitted: (_) => _handleSearch(),
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _results.isEmpty
              ? const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(LucideIcons.searchX, size: 60, color: Colors.white10),
                      SizedBox(height: 16),
                      Text('Tidak ada hasil ditemukan.', style: TextStyle(color: Colors.white30)),
                    ],
                  ),
                )
              : GridView.builder(
                  padding: const EdgeInsets.all(16),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    childAspectRatio: 0.6,
                    crossAxisSpacing: 16,
                    mainAxisSpacing: 16,
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
