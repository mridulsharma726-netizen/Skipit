import 'user_model.dart';
import 'listing_model.dart';
import 'message_model.dart';

class ConversationModel {
  final String id;
  final UserModel peer;
  final MessageModel? lastMessage;
  final int unreadCount;
  final ListingModel? listing;
  final DateTime updatedAt;

  ConversationModel({
    required this.id,
    required this.peer,
    this.lastMessage,
    this.unreadCount = 0,
    this.listing,
    required this.updatedAt,
  });

  factory ConversationModel.fromJson(Map<String, dynamic> json) {
    return ConversationModel(
      id: json['id'] ?? '',
      peer: UserModel.fromJson(json['peer'] ?? {}),
      lastMessage: json['last_message'] != null ? MessageModel.fromJson(json['last_message']) : null,
      unreadCount: json['unread_count'] ?? 0,
      listing: json['listing'] != null ? ListingModel.fromJson(json['listing']) : null,
      updatedAt: json['updated_at'] != null ? DateTime.parse(json['updated_at']) : DateTime.now(),
    );
  }
}
