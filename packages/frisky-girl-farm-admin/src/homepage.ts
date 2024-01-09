/**
 * Our homepage trigger function
 *
 * @returns the homepage card
 */
function onHomepage() {
  return createHomepageCard();
}

const friskyGirlLogo =
  'https://github.com/bendemboski/frisky-girl-farm/blob/13e9440008dbdc6228dc47d5c409da6db9f35c80/assets/logo-344.webp?raw=true';

/**
 * Create our homepage card, including the proper buttons for the state of the
 * spreadsheet
 *
 * @returns the homepage card
 */
function createHomepageCard() {
  return CardService.newCardBuilder()
    .addSection(
      CardService.newCardSection().addWidget(
        CardService.newImage().setImageUrl(friskyGirlLogo),
      ),
    )
    .addSection(
      CardService.newCardSection()
        .addWidget(
          CardService.newTextButton()
            .setText('Prepare new week')
            .setOnClickAction(
              CardService.newAction().setFunctionName(prepareNewWeek.name),
            ),
        )
        .addWidget(
          CardService.newTextParagraph().setText(
            'Create a new sheet to prepare to open orders',
          ),
        ),
    )
    .addSection(
      CardService.newCardSection()
        .addWidget(
          CardService.newTextButton()
            .setText('Open orders')
            .setOnClickAction(
              CardService.newAction().setFunctionName(openOrders.name),
            ),
        )
        .addWidget(
          CardService.newTextParagraph().setText(
            'Open ordering on the web site',
          ),
        ),
    )
    .addSection(
      CardService.newCardSection()
        .addWidget(
          CardService.newTextButton()
            .setText('Close orders')
            .setOnClickAction(
              CardService.newAction().setFunctionName(closeOrders.name),
            ),
        )
        .addWidget(
          CardService.newTextParagraph().setText(
            'Close ordering on the web site',
          ),
        ),
    )
    .addSection(
      CardService.newCardSection()
        .addWidget(
          CardService.newTextButton()
            .setText('Generate harvest lists')
            .setOnClickAction(
              CardService.newAction().setFunctionName(
                generateHarvestLists.name,
              ),
            ),
        )
        .addWidget(
          CardService.newTextParagraph().setText(
            'Generate a harvest list from the currently-active orders sheet',
          ),
        ),
    )
    .addSection(
      CardService.newCardSection()
        .addWidget(
          CardService.newTextButton()
            .setText('Send confirmation emails')
            .setOnClickAction(
              CardService.newAction().setFunctionName(
                sendConfirmationEmails.name,
              ),
            ),
        )
        .addWidget(
          CardService.newTextParagraph().setText(
            'Send confirmation emails to all users that have ordered anything on the currently-active orders sheet',
          ),
        ),
    )
    .build();
}
