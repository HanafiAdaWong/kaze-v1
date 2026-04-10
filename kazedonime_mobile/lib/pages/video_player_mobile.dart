import 'package:flutter/material.dart';

// Placeholder for native mobile to avoid compilation error for Web-only code
class VideoPlayerWeb extends StatelessWidget {
  final String url;
  const VideoPlayerWeb({super.key, required this.url});

  @override
  Widget build(BuildContext context) {
    return const SizedBox.shrink(); 
  }
}
