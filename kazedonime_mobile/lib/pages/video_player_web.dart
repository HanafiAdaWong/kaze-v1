import 'package:flutter/material.dart';
import 'dart:ui_web' as ui;
import 'dart:html' as html;

class VideoPlayerWeb extends StatelessWidget {
  final String url;
  final bool isDirectVideo;
  
  const VideoPlayerWeb({super.key, required this.url, this.isDirectVideo = false});

  @override
  Widget build(BuildContext context) {
    final viewId = 'vp-${url.hashCode}-${DateTime.now().microsecondsSinceEpoch}';
    
    // ignore: undefined_prefix_text
    ui.platformViewRegistry.registerViewFactory(viewId, (int id) {
      if (isDirectVideo) {
        // Direct video (Drachin) - use <video> tag
        return html.VideoElement()
          ..src = url
          ..controls = true
          ..autoplay = true
          ..style.width = '100%'
          ..style.height = '100%'
          ..style.backgroundColor = 'black'
          ..setAttribute('playsinline', 'true');
      } else {
        // Iframe (Anime/Donghua) - use <iframe> tag
        return html.IFrameElement()
          ..src = url
          ..style.border = 'none'
          ..style.width = '100%'
          ..style.height = '100%'
          ..allowFullscreen = true
          ..attributes['allow'] = 'autoplay; fullscreen; encrypted-media';
      }
    });
    
    return HtmlElementView(viewType: viewId);
  }
}
