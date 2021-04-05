/**
 * Create an ActionResponse that shows a notification
 *
 * @param text the notification text
 * @returns a new action response
 */
function createNotificationResponse(text: string) {
  let notification = CardService.newNotification().setText(text);
  return CardService.newActionResponseBuilder()
    .setNotification(notification)
    .build();
}
