# Notifications System

## Overview

Real-time notification system for alerting users about important events and updates.

## Features

- In-app notifications
- Push notifications
- Email notifications
- WhatsApp notifications
- Notification preferences
- Notification templates
- Bulk notifications

## Technical Implementation

- Firebase Cloud Messaging for push notifications
- WebSockets for real-time in-app notifications
- Email service integration (SendGrid/AWS SES)
- WhatsApp Business API integration
- Notification queue for high throughput

## Data Models

```
NotificationTemplate {
  id: UUID
  tenantId: UUID
  type: String
  name: String
  subject: String
  bodyTemplate: Text
  variables: JSON
  channels: String[] (IN_APP, PUSH, EMAIL, WHATSAPP)
}

Notification {
  id: UUID
  tenantId: UUID
  userId: UUID
  templateId: UUID
  type: String
  title: String
  message: Text
  data: JSON
  status: Enum(PENDING, SENT, DELIVERED, READ, FAILED)
  channel: String
  createdAt: DateTime
  sentAt: DateTime
  readAt: DateTime
}

NotificationPreference {
  id: UUID
  userId: UUID
  tenantId: UUID
  notificationType: String
  channels: JSON
  enabled: Boolean
}

WhatsAppTemplate {
  id: UUID
  tenantId: UUID
  name: String
  whatsappTemplateId: String
  status: Enum(PENDING, APPROVED, REJECTED)
  language: String
  components: JSON
  category: String
  createdAt: DateTime
  updatedAt: DateTime
}
```

## Notification Events

- Low stock alerts
- New orders
- Order status changes
- Shipment updates
- Receiving updates
- System alerts
- User invitations
- Password resets
- Subscription updates

## API Endpoints

- GET /api/notifications
- PUT /api/notifications/:id/read
- PUT /api/notifications/read-all
- GET /api/notification-preferences
- PUT /api/notification-preferences
- GET /api/whatsapp-templates
- POST /api/whatsapp-templates
- PUT /api/whatsapp-templates/:id

## WhatsApp Integration

- WhatsApp Business API integration
- Pre-approved message templates
- Rich message support (text, images, buttons)
- Delivery and read receipts
- Conversation threading
- Reply handling
- User opt-in/opt-out management
- Message template approval workflow
- Fallback to alternative channels if WhatsApp delivery fails
