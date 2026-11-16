import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import '../core/config/app_config.dart';
import '../core/network/api_client.dart';
import '../models/conversation_model.dart';
import '../models/message_model.dart';
import 'auth_provider.dart';

class ChatState {
  final List<ConversationModel> conversations;
  final List<MessageModel> activeMessages;
  final bool isLoading;
  final String? error;

  ChatState({
    this.conversations = const [],
    this.activeMessages = const [],
    this.isLoading = false,
    this.error,
  });

  ChatState copyWith({
    List<ConversationModel>? conversations,
    List<MessageModel>? activeMessages,
    bool? isLoading,
    String? error,
  }) {
    return ChatState(
      conversations: conversations ?? this.conversations,
      activeMessages: activeMessages ?? this.activeMessages,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class ChatNotifier extends StateNotifier<ChatState> {
  final Ref ref;
  WebSocketChannel? _channel;
  bool _isDisposed = false;

  ChatNotifier(this.ref) : super(ChatState()) {
    _initWebSocket();
  }

  void _initWebSocket() {
    if (_isDisposed) return;
    final authState = ref.read(authProvider);
    if (!authState.isAuthenticated || authState.token == null) return;

    try {
      final uri = Uri.parse(AppConfig.wsUrl);
      _channel = WebSocketChannel.connect(uri);

      // Authenticate socket connection with secure JWT
      _channel?.sink.add(jsonEncode({
        'type': 'auth',
        'token': authState.token,
      }));

      _channel?.stream.listen(
        (event) {
          try {
            final data = jsonDecode(event.toString());
            if (data['type'] == 'message_received' || data['type'] == 'message_sent') {
              final newMsg = MessageModel.fromJson(data['message']);
              state = state.copyWith(
                activeMessages: [...state.activeMessages, newMsg],
              );
              fetchConversations();
            }
          } catch (_) {}
        },
        onDone: () {
          // Reconnect after delay if not disposed and user is still logged in
          if (!_isDisposed && ref.read(authProvider).isAuthenticated) {
            Future.delayed(const Duration(seconds: 3), _initWebSocket);
          }
        },
        onError: (_) {
          if (!_isDisposed && ref.read(authProvider).isAuthenticated) {
            Future.delayed(const Duration(seconds: 3), _initWebSocket);
          }
        },
      );
    } catch (_) {
      if (!_isDisposed && ref.read(authProvider).isAuthenticated) {
        Future.delayed(const Duration(seconds: 3), _initWebSocket);
      }
    }
  }

  @override
  void dispose() {
    _isDisposed = true;
    _channel?.sink.close();
    super.dispose();
  }

  Future<void> fetchConversations() async {
    try {
      state = state.copyWith(isLoading: true);
      final res = await apiClient.dio.get('/chat/conversations');
      final list = (res.data['conversations'] as List? ?? [])
          .map((e) => ConversationModel.fromJson(e))
          .toList();
      state = state.copyWith(conversations: list, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> fetchMessages(String peerId) async {
    try {
      state = state.copyWith(isLoading: true);
      final res = await apiClient.dio.get('/chat/messages/$peerId');
      final list = (res.data['messages'] as List? ?? [])
          .map((e) => MessageModel.fromJson(e))
          .toList();
      state = state.copyWith(activeMessages: list, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<bool> sendMessage(String peerId, String content, {String? listingId}) async {
    try {
      // Send through socket if connected, or REST fallback
      if (_channel != null) {
        _channel?.sink.add(jsonEncode({
          'type': 'send_message',
          'receiver_id': peerId,
          'content': content,
          'listing_id': listingId,
        }));
      } else {
        final res = await apiClient.dio.post('/chat/messages', data: {
          'receiver_id': peerId,
          'content': content,
          'listing_id': listingId,
        });
        final msg = MessageModel.fromJson(res.data['message']);
        state = state.copyWith(activeMessages: [...state.activeMessages, msg]);
      }
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<bool> sendRentalInquiry(String listingId, {String? message}) async {
    try {
      await apiClient.dio.post('/chat/inquiry', data: {
        'listing_id': listingId,
        'initial_message': message,
      });
      await fetchConversations();
      return true;
    } catch (_) {
      return false;
    }
  }
}

final chatProvider = StateNotifierProvider<ChatNotifier, ChatState>((ref) {
  return ChatNotifier(ref);
});
