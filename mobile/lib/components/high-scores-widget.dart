import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:get_it/get_it.dart';
import 'package:mobile/domain/classes/snackbar-factory.dart';
import 'package:mobile/domain/models/high-score-model.dart';
import 'package:mobile/domain/services/http-handler-service.dart';

class HighScores extends StatelessWidget {
  HighScores({
    Key? key,
  }) : super(key: key);

  final HttpHandlerService _httpService = GetIt.I.get<HttpHandlerService>();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final size = MediaQuery.of(context).size;

    return Padding(
      padding: const EdgeInsets.all(8.0),
      child: FutureBuilder(
        future: _httpService.fetchHighScoresRequest(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.done) {
            if (snapshot.hasError) {
              Navigator.of(context).pop();
              ScaffoldMessenger.of(context).showSnackBar(SnackBarFactory.redSnack(
                  "Error while fetching the high scores")); // TODO: Translate
              return SizedBox();
            }
            return IntrinsicHeight(
              child: IntrinsicWidth(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Text(
                      "High Scores",
                      style: theme.textTheme.displayMedium,
                    ),
                    DataTable(
                        columnSpacing: size.width * 0.2,
                        columns: const [
                          DataColumn(
                              label: Text(
                            "Scores",
                            textAlign: TextAlign.center,
                          )),
                          DataColumn(
                              label: Text(
                            "Players",
                            textAlign: TextAlign.center,
                          )),
                        ],
                        rows: (jsonDecode(snapshot.data!.body) as List<dynamic>)
                            .map((e) => HighScore.fromJson(e)) // Transform data to models
                            .map(
                              (e) => DataRow(cells: [
                                DataCell(Text(
                                  "${e.score}",
                                  textAlign: TextAlign.center,
                                )),
                                DataCell(Text(e.username))
                              ]),
                            ) // Transform models to DataRows
                            .toList())
                  ],
                ),
              ),
            );
          }
          return const SizedBox(
              height: 200,
              width: 200,
              child: CircularProgressIndicator());
        },
      ),
    );
  }
}
