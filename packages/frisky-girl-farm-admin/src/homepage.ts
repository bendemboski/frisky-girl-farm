/**
 * Our homepage trigger function
 *
 * @returns the homepage card
 */
function onHomepage() {
  return createHomepageCard();
}

const friskyGirlLogo =
  'https://static.wixstatic.com/media/9a6d40_54160342452f4503af1bac600299f659~mv2.jpg/v1/fill/w_342,h_344,al_c,q_80,usm_0.66_1.00_0.01/frisky%20girl%20farm.webp';

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
        CardService.newImage().setImageUrl(friskyGirlLogo)
      )
    )
    .addSection(
      CardService.newCardSection()
        .addWidget(
          CardService.newTextButton()
            .setText('Prepare new week')
            .setOnClickAction(
              CardService.newAction().setFunctionName(prepareNewWeek.name)
            )
        )
        .addWidget(
          CardService.newTextParagraph().setText(
            'Create a new sheet to prepare to open orders'
          )
        )
    )
    .addSection(
      CardService.newCardSection()
        .addWidget(
          CardService.newTextButton()
            .setText('Open orders')
            .setOnClickAction(
              CardService.newAction().setFunctionName(openOrders.name)
            )
        )
        .addWidget(
          CardService.newTextParagraph().setText(
            'Open ordering on the web site'
          )
        )
    )
    .addSection(
      CardService.newCardSection()
        .addWidget(
          CardService.newTextButton()
            .setText('Close orders')
            .setOnClickAction(
              CardService.newAction().setFunctionName(closeOrders.name)
            )
        )
        .addWidget(
          CardService.newTextParagraph().setText(
            'Close ordering on the web site'
          )
        )
    )
    .addSection(
      CardService.newCardSection()
        .addWidget(
          CardService.newTextButton()
            .setText('Generate harvest lists')
            .setOnClickAction(
              CardService.newAction().setFunctionName(generateHarvestLists.name)
            )
        )
        .addWidget(
          CardService.newTextParagraph().setText(
            'Generate a harvest list from the currently-active orders sheet'
          )
        )
    )
    .addSection(
      CardService.newCardSection()
        .addWidget(
          CardService.newTextButton()
            .setText('Send confirmation emails')
            .setOnClickAction(
              CardService.newAction().setFunctionName(
                sendConfirmationEmails.name
              )
            )
        )
        .addWidget(
          CardService.newTextParagraph().setText(
            'Send confirmation emails to all users that have ordered anything on the currently-active orders sheet'
          )
        )
    )
    .build();
}
