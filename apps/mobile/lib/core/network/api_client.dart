import 'dart:async';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/app_config.dart';

class ApiClient {
  late final Dio dio;

  ApiClient() {
    dio = Dio(
      BaseOptions(
        baseUrl: AppConfig.apiBaseUrl,
        connectTimeout: AppConfig.connectTimeout,
        receiveTimeout: AppConfig.receiveTimeout,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final prefs = await SharedPreferences.getInstance();
          final token = prefs.getString('skipit_token');
          if (token != null && token.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          return handler.next(options);
        },
        onError: (DioException e, handler) async {
          // Automatic retry for transient connection drops or ADB tunnel re-establishment
          if (e.type == DioExceptionType.connectionError ||
              e.type == DioExceptionType.connectionTimeout) {
            final retries = (e.requestOptions.extra['retry_count'] as int?) ?? 0;
            if (retries < 2) {
              await Future.delayed(Duration(milliseconds: 600 * (retries + 1)));
              final retryOptions = e.requestOptions;
              retryOptions.extra['retry_count'] = retries + 1;
              try {
                final response = await dio.fetch(retryOptions);
                return handler.resolve(response);
              } catch (_) {
                // Let it fall through to handler.next
              }
            }
          }
          return handler.next(e);
        },
      ),
    );
  }
}

final apiClient = ApiClient();
