/**
 * Card action function to call into the API to send confirmation emails to all
 * users with orders on the active sheet. Gives an intermediate confirmation
 * prompt so the farmer can double-check before calling the API to send.
 */
function sendConfirmationEmails() {
  let spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let orderSheet = spreadsheet.getActiveSheet();
  if (!isOrderSheet(orderSheet)) {
    return createNotificationResponse(
      'This sheet is not an orders sheet. Please navigate to the orders sheet for which you want to send confirmation emails.',
    );
  }

  // Build a count of users to email for each location
  let byLocation: Record<string, number> = {};
  let groups = groupLocationsByHarvestDay();
  for (let locations of Object.values(groups)) {
    let { users } = getUserOrders(orderSheet, locations);
    for (let { location } of users) {
      byLocation[location] = byLocation[location] || 0;
      byLocation[location] += 1;
    }
  }

  // Build a section showing all the counts by location
  let locationsSection = CardService.newCardSection();
  for (let [location, count] of Object.entries(byLocation)) {
    locationsSection.addWidget(
      CardService.newTextParagraph().setText(`${count} users for ${location}`),
    );
  }

  // Navigate to a card with the confirmation info, and a send button that will
  // invoke `completeSendConfirmationEmails`
  return CardService.newActionResponseBuilder()
    .setNavigation(
      CardService.newNavigation().pushCard(
        CardService.newCardBuilder()
          .setHeader(
            CardService.newCardHeader().setTitle(
              'Send order confirmation emails to:',
            ),
          )
          .addSection(locationsSection)
          .addSection(
            CardService.newCardSection().addWidget(
              CardService.newTextButton()
                .setText('Send')
                .setOnClickAction(
                  CardService.newAction()
                    .setFunctionName(completeSendConfirmationEmails.name)
                    .setParameters({
                      sheetId: orderSheet.getSheetId().toString(),
                    }),
                ),
            ),
          )
          .build(),
      ),
    )
    .build();
}

/**
 * Card action function to confirm sending the confirmation emails, make the
 * call to the API, and pop the confirmation card off of the nav stack
 */
function completeSendConfirmationEmails({
  commonEventObject: {
    parameters: { sheetId },
  },
}: any) {
  let response = UrlFetchApp.fetch(
    'https://uh7v0bgk40.execute-api.us-west-2.amazonaws.com/prod/admin/confirmation-emails',
    {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({ sheetId: parseInt(sheetId, 10) }),
      muteHttpExceptions: true,
    },
  );

  let message;
  let code = response.getResponseCode();
  if (code === 200) {
    let { failedSends } = JSON.parse(response.getContentText());
    if (failedSends.length === 0) {
      message = 'Confirmation emails sent!';
    } else {
      return CardService.newActionResponseBuilder()
        .setNavigation(
          CardService.newNavigation().updateCard(buildErrorCard(failedSends)),
        )
        .build();
    }
  } else {
    message = `Failed to send emails. code=${code} body=${response.getContentText()} args=${JSON.stringify(
      Array.from(arguments),
    )}`;
  }

  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification().setText(message))
    .setNavigation(CardService.newNavigation().popCard())
    .build();
}

function buildErrorCard(failedSends: string[]) {
  let builder = CardService.newCardBuilder();

  builder.addSection(
    CardService.newCardSection()
      .addWidget(
        CardService.newTextParagraph().setText(
          `${failedSends.length} emails failed to send -- tell Ben!`,
        ),
      )
      .addWidget(CardService.newTextParagraph().setText('Emails that failed:')),
  );

  let emailsSection = CardService.newCardSection();
  for (let email of failedSends) {
    emailsSection.addWidget(CardService.newTextParagraph().setText(email));
  }
  builder.addSection(emailsSection);
  return builder.build();
}
