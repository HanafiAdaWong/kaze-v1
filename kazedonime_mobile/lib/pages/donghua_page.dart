import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:google_fonts/google_fonts.dart';
import '../services/api_service.dart';
import '../models/anime_card_model.dart';
import '../widgets/anime_card.dart';
import 'anime_detail_page.dart';

class DonghuaPage extends StatefulWidget {
  const DonghuaPage({super.key});

  @override
  State<DonghuaPage> createState() => _DonghuaPageState();
}

class _DonghuaPageState extends State<DonghuaPage> {
  List<AnimeCardModel> _donghuaList = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    setState(() => _loading = true);
    final data = await ApiService.getDonghuaHome();
    if (mounted) {
      setState(() {
        if (data != null) {
          final List? list = data['latest_release'] ?? (data is List ? data : null);
          if (list != null) {
            _donghuaList = list.map((e) => AnimeCardModel.fromSanka(e)).toList();
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
        title: Text('Donghua Terbaru', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
      ),
      body: RefreshIndicator(
        onRefresh: _fetchData,
        color: const Color(0xFF3B82F6),
        child: _loading
            ? const Center(child: CircularProgressIndicator(color: Color(0xFF3B82F6)))
            : _donghuaList.isEmpty
                ? const Center(child: Text('Data tidak tersedia', style: TextStyle(color: Colors.white38)))
                : GridView.builder(
                    padding: const EdgeInsets.all(16),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      childAspectRatio: 0.6,
                      crossAxisSpacing: 16,
                      mainAxisSpacing: 16,
                    ),
                    itemCount: _donghuaList.length,
                    itemBuilder: (context, index) => AnimeCard(
                      anime: _donghuaList[index],
                      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => AnimeDetailPage(
                        animeId: _donghuaList[index].slug ?? '',
                        title: _donghuaList[index].title,
                        poster: _donghuaList[index].poster,
                        type: 'donghua',
                      ))),
                    ),
                  ),
      ),
    );
  }
}
