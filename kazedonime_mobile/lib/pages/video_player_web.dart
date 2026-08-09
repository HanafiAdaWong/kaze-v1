import 'package:flutter/material.dart';
import 'dart:ui_web' as ui;
import 'dart:html' as html;

class VideoPlayerWeb extends StatefulWidget {
  final String url;
  final bool isDirectVideo;
  
  const VideoPlayerWeb({super.key, required this.url, this.isDirectVideo = false});

  @override
  State<VideoPlayerWeb> createState() => _VideoPlayerWebState();
}

class _VideoPlayerWebState extends State<VideoPlayerWeb> {
  late String _viewId;

  @override
  void initState() {
    super.initState();
    _viewId = 'vp-${widget.url.hashCode}';
    
    // ignore: undefined_prefix_text
    ui.platformViewRegistry.registerViewFactory(_viewId, (int id) {
      if (widget.isDirectVideo) {
        return html.VideoElement()
          ..src = widget.url
          ..controls = true
          ..autoplay = true
          ..style.width = '100%'
          ..style.height = '100%'
          ..style.backgroundColor = 'black'
          ..setAttribute('playsinline', 'true');
      } else {
        // PERBAIKAN: Hapus sandbox yang terlalu ketat agar video player Sanka bisa jalan
        return html.IFrameElement()
          ..src = widget.url
          ..style.border = 'none'
          ..style.width = '100%'
          ..style.height = '100%'
          ..allowFullscreen = true
          ..setAttribute('allow', 'autoplay; fullscreen; encrypted-media; picture-in-picture');
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return HtmlElementView(viewType: _viewId, key: ValueKey(widget.url));
  }
}
