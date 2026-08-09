import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/foundation.dart';
import 'package:lucide_icons/lucide_icons.dart';
import '../models/anime_card_model.dart';

/// Proxy gambar global untuk menghindari CORS dan Hotlink block di Web (Chrome)
String proxyImageUrl(String url) {
  if (url.isEmpty) return 'https://placehold.co/600x400/18181B/white?text=No+Image';
  if (!kIsWeb) return url;

  // Hapus protokol agar tidak double https://
  final cleanUrl = url.replaceFirst(RegExp(r'^https?://'), '');

  // Gunakan images.weserv.nl yang sangat stabil untuk bypass hotlink protection
  return 'https://images.weserv.nl/?url=${Uri.encodeComponent(url)}&w=600';
}

class AnimeCard extends StatelessWidget {
  final AnimeCardModel anime;
  final VoidCallback? onTap;

  const AnimeCard({super.key, required this.anime, this.onTap});

  @override
  Widget build(BuildContext context) {
    final posterUrl = proxyImageUrl(anime.poster);

    return GestureDetector(
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AspectRatio(
            aspectRatio: 2 / 3,
            child: Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.white.withOpacity(0.06)),
                color: const Color(0xFF18181B),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(9),
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    _buildImage(posterUrl),

                    // Badge Episode (Biru sesuai website)
                    if (anime.currentEpisode != null)
                      Positioned(
                        top: 8, left: 8,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: const Color(0xFF3B82F6),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(LucideIcons.play, size: 10, color: Colors.white),
                              const SizedBox(width: 4),
                              Text(
                                'Ep ${anime.currentEpisode}',
                                style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.white),
                              ),
                            ],
                          ),
                        ),
                      ),

                    Positioned.fill(
                      child: Container(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [Colors.transparent, Colors.black.withOpacity(0.5)],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 10),
          Text(
            anime.title,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              height: 1.3,
              color: Color(0xFFEAEAF0),
            ),
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
        errorBuilder: (ctx, err, st) => const Center(child: Icon(LucideIcons.image, color: Colors.white10)),
      );
    }
    return CachedNetworkImage(
      imageUrl: url,
      fit: BoxFit.cover,
      placeholder: (ctx, url) => Container(color: const Color(0xFF18181B)),
      errorWidget: (ctx, url, err) => const Center(child: Icon(LucideIcons.image, color: Colors.white10)),
    );
  }
}
