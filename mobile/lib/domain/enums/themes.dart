import 'package:flutter/material.dart';


class Themes {
  static get list => ['dark', 'light'];

  static get dark => ThemeData(
    primarySwatch: Colors.red,
    brightness: Brightness.dark,
  );

  static get light => ThemeData(
    primarySwatch: Colors.green,
  );
}

