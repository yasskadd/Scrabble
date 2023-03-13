import 'dart:async';

import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:get_it/get_it.dart';
import 'package:mobile/domain/classes/snackbar-factory.dart';
import 'package:mobile/domain/services/auth-service.dart';
import 'package:mobile/screens/menu-screen.dart';
import 'package:provider/provider.dart';

class SignInState extends ChangeNotifier {
  bool formsValid = false;

  void updateValidity(bool validity) {
    formsValid = validity;
    notifyListeners();
  }

  bool isValid() {
    return formsValid;
  }
}

class Login extends StatelessWidget {
  const Login({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => SignInState(),
      child: ContainerLogin(),
    );
  }
}

class ContainerLogin extends StatefulWidget {
  const ContainerLogin({super.key});

  @override
  State<ContainerLogin> createState() => _ContainerLoginState();
}

class _ContainerLoginState extends State<ContainerLogin> {
  final _formKey = GlobalKey<FormState>();
  final usernameController = TextEditingController();
  final passwordController = TextEditingController();

  final authService = GetIt.I.get<AuthService>();
  late final StreamSubscription loginSub;
  late final StreamSubscription errorSub;

  // SnackBars (Might be better to put all of them in one place)

  void _signInUser() {
    authService.connectUser(usernameController.text, passwordController.text);
  }

  @override
  void initState() {
    super.initState();

    loginSub = authService.notifyLogin.stream.listen((event) {
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBarFactory.greenSnack("Connection réussite!"));
      Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(
              builder: (context) =>
                  const MenuScreen(title: "Page de connection")),
          (route) => false);
    });
    errorSub = authService.notifyError.stream.listen((event) {
      ScaffoldMessenger.of(context)
          .showSnackBar(SnackBarFactory.redSnack("Echec lors de la connexion!"));
    });
  }

  @override
  dispose() {
    loginSub.cancel();
    errorSub.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    var signinState = context.watch<SignInState>();
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(8.0),
        child: Column(
          children: [
            Text(
              "Connexion",
              style:
                  DefaultTextStyle.of(context).style.apply(fontSizeFactor: 2.0),
            ),
            const SizedBox(
              height: 16,
            ),
            Form(
                key: _formKey,
                child: Column(
                  children: [
                    UsernameInput(
                      formKey: _formKey,
                      controller: usernameController,
                    ),
                    const SizedBox(height: 16),
                    PasswordInput(
                      formKey: _formKey,
                      controller: passwordController,
                    ),
                  ],
                )),
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: signinState.isValid()
                  ? () {
                      if (_formKey.currentState!.validate()) {
                        _signInUser();
                      }
                    }
                  : null,
              child: Text('Sign in'),
            )
          ],
        ),
      ),
    );
  }
}

class PasswordInput extends StatelessWidget {
  const PasswordInput({
    Key? key,
    required this.formKey,
    required this.controller,
  }) : super(key: key);

  final GlobalKey<FormState> formKey;
  final TextEditingController controller;

  @override
  Widget build(BuildContext context) {
    var signinState = context.watch<SignInState>();

    return TextFormField(
      controller: controller,
      obscureText: true,
      enableSuggestions: false,
      autocorrect: false,
      validator: (value) {
        if (value == null || value.isEmpty || value.trim() == '') {
          return 'Entrez un mot de passe';
        }
        return null;
      },
      onChanged: (_) =>
          {signinState.updateValidity(formKey.currentState!.validate())},
      onFieldSubmitted: (String _) {
        signinState.updateValidity(formKey.currentState!.validate());
      },
      decoration: const InputDecoration(
        hintText: "Mot de passe",
      ),
    );
  }
}

class UsernameInput extends StatelessWidget {
  const UsernameInput({
    Key? key,
    required this.formKey,
    required this.controller,
  }) : super(key: key);

  final GlobalKey<FormState> formKey;
  final TextEditingController controller;

  @override
  Widget build(BuildContext context) {
    var signinState = context.watch<SignInState>();

    return TextFormField(
      controller: controller,
      autocorrect: false,
      validator: (value) {
        if (value == null || value.isEmpty || value.trim() == '') {
          return "Entrer un nom d'utilisateur";
        }
        return null;
      },
      onFieldSubmitted: (String _) {
        signinState.updateValidity(formKey.currentState!.validate());
      },
      onChanged: (_) =>
          {signinState.updateValidity(formKey.currentState!.validate())},
      decoration: const InputDecoration(
        hintText: "Nom d'utilisateur",
      ),
    );
  }
}
