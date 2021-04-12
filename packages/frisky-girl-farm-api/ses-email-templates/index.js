const orderConfirmationLines = [
  'Hello,',
  '',
  'Thank you for your order this week! It is ready for pick up now at your preferred pick up location:',
  '',
  '{{pickupInstructions}}',
  '',
  "Please remember to wear a mask and either use gloves or the hand sanitizer that we've provided when you pick up your order. And please remember to return your bag from last week when you pick up your order.",
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
      '<p><img src="https://static.wixstatic.com/media/9a6d40_54160342452f4503af1bac600299f659~mv2.jpg" width="96" height="96"></p>',
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
