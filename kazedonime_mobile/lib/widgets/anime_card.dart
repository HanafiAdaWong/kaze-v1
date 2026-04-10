import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/foundation.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../models/anime_card_model.dart';

/// Proxy image URL for Flutter Web to bypass CORS/hotlink.
/// Uses WordPress Photon (i0.wp.com) for WordPress URLs, wsrv.nl for others.
String proxyImageUrl(String url) {
  if (!kIsWeb || url.isEmpty) return url;
  
  // Strip protocol for i0.wp.com
  final cleanUrl = url.replaceFirst(RegExp(r'^https?://'), '');
  
  // WordPress sites (otakudesu, anichin) → use Photon CDN
  if (cleanUrl.contains('otakudesu') || 
      cleanUrl.contains('anichin') ||
      cleanUrl.contains('wp-content')) {
    return 'https://i0.wp.com/$cleanUrl';
  }
  
  // All other images → use wsrv.nl
  return 'https://wsrv.nl/?url=${Uri.encodeComponent(url)}&w=300';
}

class AnimeCard extends StatelessWidget {
  final AnimeCardModel anime;
  final VoidCallback? onTap;

  const AnimeCard({super.key, required this.anime, this.onTap});

  String _s(dynamic val, [String fb = '']) {
    if (val == null) return fb;
    if (val is String) return val;
    return val.toString();
  }

  @override
  Widget build(BuildContext context) {
    final posterUrl = proxyImageUrl(anime.poster);

    return GestureDetector(
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Stack(
                fit: StackFit.expand,
                children: [
                  _buildImage(posterUrl),

                  if (anime.status != null && anime.status!.isNotEmpty)
                    Positioned(
                      top: 8, left: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFFA855F7),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          _s(anime.status),
                          style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white),
                        ),
                      ),
                    ),

                  Positioned.fill(
                    child: Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [Colors.transparent, Colors.black.withOpacity(0.85)],
                          stops: const [0.5, 1.0],
                        ),
                      ),
                      alignment: Alignment.bottomCenter,
                      padding: const EdgeInsets.all(10),
                      child: const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(LucideIcons.play, size: 14, color: Color(0xFFA855F7)),
                          SizedBox(width: 6),
                          Text('Tonton', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white)),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            _s(anime.title, 'Tanpa Judul'),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, height: 1.3),
          ),
        ],
      ),
    );
  }

  Widget _buildImage(String url) {
    if (kIsWeb) {
      return Image.network(
        url,
        fit: BoxFit.cover,
        width: double.infinity, height: double.infinity,
        loadingBuilder: (ctx, child, progress) {
          if (progress == null) return child;
          return Container(
            color: const Color(0xFF1a1a2e),
            child: const Center(
              child: SizedBox(width: 24, height: 24,
                child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFFA855F7))),
            ),
          );
        },
        errorBuilder: (ctx, err, st) {
          debugPrint('[AnimeCard] Image error: $url - $err');
          return Container(
            color: const Color(0xFF1a1a2e),
            child: const Center(child: Icon(LucideIcons.image, color: Colors.white10, size: 32)),
          );
        },
      );
    }
    return CachedNetworkImage(
      imageUrl: url,
      fit: BoxFit.cover,
      width: double.infinity, height: double.infinity,
      placeholder: (ctx, url) => Container(color: const Color(0xFF1a1a2e)),
      errorWidget: (ctx, url, err) => const Center(child: Icon(LucideIcons.image)),
    );
  }
}
