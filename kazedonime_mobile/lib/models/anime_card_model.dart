class AnimeCardModel {
  final int? id;
  final String? slug;
  final String? seriesSlug;
  final String title;
  final String poster;
  final String? status;
  final String? type;
  final String? currentEpisode;
  final String? score;

  AnimeCardModel({
    this.id,
    this.slug,
    this.seriesSlug,
    required this.title,
    required this.poster,
    this.status,
    this.type,
    this.currentEpisode,
    this.score,
  });

  factory AnimeCardModel.fromJikan(Map<String, dynamic> json) {
    String posterUrl = '';
    try {
      posterUrl = json['images']?['jpg']?['large_image_url'] ?? 
                 json['images']?['jpg']?['image_url'] ?? 
                 json['images']?['webp']?['image_url'] ?? '';
    } catch (_) {}

    return AnimeCardModel(
      id: json['mal_id'],
      title: json['title'] ?? 'Unknown Title',
      poster: posterUrl,
      status: json['status'],
      type: json['type'],
      score: json['score']?.toString(),
    );
  }

  factory AnimeCardModel.fromSanka(Map<String, dynamic> json, {String? typeOverride}) {
    String title = json['title'] ?? '';
    String slug = (json['slug'] ?? '').toString();
    if (slug.endsWith('/')) {
      slug = slug.substring(0, slug.length - 1);
    }

    if (title.isEmpty && slug.isNotEmpty) {
      title = slug.replaceFirst(RegExp(r'^\d+-'), '').split('-').map((word) {
        if (word.isEmpty) return '';
        return word[0].toUpperCase() + word.substring(1);
      }).join(' ');
    }

    String targetSlug = json['animeId'] ?? json['parent_slug'] ?? json['series_slug'] ?? slug;
    
    if (targetSlug == slug && slug.contains('-episode-')) {
      targetSlug = slug.split('-episode-')[0];
    }

    return AnimeCardModel(
      slug: targetSlug,
      seriesSlug: targetSlug,
      title: title,
      poster: json['poster'] ?? '',
      status: json['status'],
      type: typeOverride ?? json['type'],
      currentEpisode: json['current_episode'] ?? json['episode_info'],
      score: json['score']?.toString(),
    );
  }
}
