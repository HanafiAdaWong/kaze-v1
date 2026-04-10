class AnimeCardModel {
  final int? id;
  final String? slug;
  final String? seriesSlug;
  final String title;
  final String poster;
  final String? status;
  final String? type;
  final String? currentEpisode;

  AnimeCardModel({
    this.id,
    this.slug,
    this.seriesSlug,
    required this.title,
    required this.poster,
    this.status,
    this.type,
    this.currentEpisode,
  });

  factory AnimeCardModel.fromJikan(Map<String, dynamic> json) {
    // Try to get the best available image URL
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
    );
  }

  factory AnimeCardModel.fromSanka(Map<String, dynamic> json, {String? typeOverride}) {
    String title = json['title'] ?? '';
    String slug = (json['slug'] ?? '').toString();
    if (slug.endsWith('/')) {
      slug = slug.substring(0, slug.length - 1);
    }

    // Try to get title from slug if empty (common in some Drachin sources)
    if (title.isEmpty && slug.isNotEmpty) {
      title = slug.replaceFirst(RegExp(r'^\d+-'), '').split('-').map((word) {
        if (word.isEmpty) return '';
        return word[0].toUpperCase() + word.substring(1);
      }).join(' ');
    }

    // Advanced Target Slug Resolution (for detail page navigation)
    String targetSlug = json['animeId'] ?? json['parent_slug'] ?? json['series_slug'] ?? slug;
    
    if (targetSlug == slug && slug.contains('-episode-')) {
      // Reconstruct series slug from episode slug: series-title-episode-123 -> series-title
      targetSlug = slug.split('-episode-')[0];
    }

    return AnimeCardModel(
      slug: targetSlug, // This will be used as the primary ID for DetailPage
      seriesSlug: targetSlug,
      title: title,
      poster: json['poster'] ?? '',
      status: json['status'],
      type: typeOverride ?? json['type'],
      currentEpisode: json['current_episode'] ?? json['episode_info'],
    );
  }
}
