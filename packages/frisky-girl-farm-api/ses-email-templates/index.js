const orderConfirmationLines = [
  'Hello,',
  '',
  'Thank you for your order this week! It is ready for pick up now at your preferred pick up location:',
  '',
  '{{pickupInstructions}}',
  '',
  'Please remember to return your CSA bag from last week and if you ordered plant starts or flowers, remember to grab them from beside the fridge.',
  '',
];

module.exports = async () => [
  {
    name: 'order_confirmation',
    subject: 'Your CSA Order is Ready for Pick Up!',
    html: [
      ...orderConfirmationLines.map((line) => `<p>${line}</p>`),
      '<p>Cheers,<br>Ellen and Ashley</p>',
      '<p></p>',
      '<p><img src="https://github.com/bendemboski/frisky-girl-farm/blob/13e9440008dbdc6228dc47d5c409da6db9f35c80/assets/logo-120.png?raw=true" width="96" height="96"></p>',
      '<p><a href="https://www.friskygirlfarm.com/">FriskyGirlFarm.com</a><br><a href="tel:2064808246">206.480.8246</a></p>',
    ].join(''),
    text: [
      ...orderConfirmationLines,
      'Cheers,',
      'Ellen and Ashley',
      '',
      'FriskyGirlFarm.com',
      '206.480.8246',
    ].join('\n'),
  },
];
