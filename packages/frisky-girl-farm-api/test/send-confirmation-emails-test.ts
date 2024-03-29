import { describe, beforeEach, afterEach, test, expect } from 'vitest';
import sinon, { SinonStub } from 'sinon';
import sendConfirmationEmails from '../src/send-confirmation-emails';
import type { User } from '../src/types';
import {
  type SendBulkTemplatedEmailRequest,
  type SES,
} from '@aws-sdk/client-ses';

describe('sendConfirmationEmails', function () {
  let sendStub: SinonStub;

  beforeEach(function () {
    sendStub = sinon.stub();
  });

  afterEach(function () {
    sinon.restore();
  });

  class SESStub {
    sendBulkTemplatedEmail(request: SendBulkTemplatedEmailRequest) {
      return sendStub(request);
    }
  }
  const awsFactory = () => ({ ses: new SESStub() as SES });

  const locations = [
    {
      name: 'Wallingford',
      pickupInstructions:
        'Come for the veggies, stay for the neighborhood character',
    },
    {
      name: 'North Bend',
      pickupInstructions: 'Get it before the elk do!',
    },
  ];

  const users = [
    {
      email: 'ashley@friskygirlfarm.com',
      location: 'North Bend',
      name: 'Ashley Wilson',
      balance: 0,
    },
    {
      email: 'ellen@friskygirlfarm.com',
      location: 'Wallingford',
      name: 'Ellen Scheffer',
      balance: 0,
    },
    {
      email: 'herbie@friskygirlfarm.com',
      location: 'North Bend',
      name: 'Herb Dog',
      balance: 9999999,
    },
  ];

  test('works', async function () {
    sendStub.resolves({
      Status: [
        { Status: 'Success' },
        { Status: 'Success' },
        { Status: 'Success' },
      ],
    });

    await expect(
      sendConfirmationEmails(awsFactory, users, locations),
    ).resolves.toEqual([]);
    expect(sendStub.callCount).toEqual(1);
    expect(sendStub.lastCall.args[0].Source).toEqual(
      'friskygirlfarm@gmail.com',
    );
    expect(sendStub.lastCall.args[0].Template).toEqual('order_confirmation');
    expect(sendStub.lastCall.args[0].ConfigurationSetName).toEqual('default');
    expect(sendStub.lastCall.args[0].Destinations).toEqual([
      {
        Destination: { ToAddresses: ['ashley@friskygirlfarm.com'] },
        ReplacementTemplateData: JSON.stringify({
          pickupInstructions: 'Get it before the elk do!',
        }),
      },
      {
        Destination: { ToAddresses: ['ellen@friskygirlfarm.com'] },
        ReplacementTemplateData: JSON.stringify({
          pickupInstructions:
            'Come for the veggies, stay for the neighborhood character',
        }),
      },
      {
        Destination: { ToAddresses: ['herbie@friskygirlfarm.com'] },
        ReplacementTemplateData: JSON.stringify({
          pickupInstructions: 'Get it before the elk do!',
        }),
      },
    ]);
  });

  test('reports individual errors', async function () {
    sendStub.resolves({
      Status: [
        { Status: 'MessageRejected' },
        { Status: 'MessageRejected' },
        { Status: 'Success' },
      ],
    });

    sinon.stub(console, 'error');
    await expect(
      sendConfirmationEmails(awsFactory, users, locations),
    ).resolves.toEqual([
      'ashley@friskygirlfarm.com',
      'ellen@friskygirlfarm.com',
    ]);
  });

  test('reports api errors', async function () {
    sendStub.rejects();

    sinon.stub(console, 'error');
    await expect(
      sendConfirmationEmails(awsFactory, users, locations),
    ).resolves.toEqual([
      'ashley@friskygirlfarm.com',
      'ellen@friskygirlfarm.com',
      'herbie@friskygirlfarm.com',
    ]);
  });

  test('chunks users', async function () {
    let users: User[] = [];
    for (let i = 0; i < 102; i++) {
      users.push({
        email: `user${i}@friskygirlfarm.com`,
        location: i % 2 ? 'Wallingford' : 'North Bend',
        name: `User ${i}`,
        balance: 0,
      });
    }

    sendStub.onFirstCall().resolves({
      Status: users.slice(0, 50).map(() => ({ Status: 'Success' })),
    });
    sendStub.onSecondCall().resolves({
      Status: users.slice(50, 100).map(() => ({ Status: 'Success' })),
    });
    sendStub.onThirdCall().resolves({
      Status: users.slice(100).map(() => ({ Status: 'Success' })),
    });

    await expect(
      sendConfirmationEmails(awsFactory, users, locations),
    ).resolves.toEqual([]);
    expect(sendStub.callCount).toEqual(3);

    expect(sendStub.firstCall.args[0].Source).toEqual(
      'friskygirlfarm@gmail.com',
    );
    expect(sendStub.firstCall.args[0].Template).toEqual('order_confirmation');
    expect(sendStub.firstCall.args[0].ConfigurationSetName).toEqual('default');
    expect(sendStub.firstCall.args[0].Destinations.length).toEqual(50);
    expect(sendStub.firstCall.args[0].Destinations[0]).toEqual({
      Destination: { ToAddresses: ['user0@friskygirlfarm.com'] },
      ReplacementTemplateData: JSON.stringify({
        pickupInstructions: 'Get it before the elk do!',
      }),
    });
    expect(sendStub.firstCall.args[0].Destinations[1]).to.deep.equal({
      Destination: { ToAddresses: ['user1@friskygirlfarm.com'] },
      ReplacementTemplateData: JSON.stringify({
        pickupInstructions:
          'Come for the veggies, stay for the neighborhood character',
      }),
    });
    expect(sendStub.firstCall.args[0].Destinations[48]).to.deep.equal({
      Destination: { ToAddresses: ['user48@friskygirlfarm.com'] },
      ReplacementTemplateData: JSON.stringify({
        pickupInstructions: 'Get it before the elk do!',
      }),
    });
    expect(sendStub.firstCall.args[0].Destinations[49]).to.deep.equal({
      Destination: { ToAddresses: ['user49@friskygirlfarm.com'] },
      ReplacementTemplateData: JSON.stringify({
        pickupInstructions:
          'Come for the veggies, stay for the neighborhood character',
      }),
    });

    expect(sendStub.secondCall.args[0].Source).toEqual(
      'friskygirlfarm@gmail.com',
    );
    expect(sendStub.secondCall.args[0].Template).toEqual('order_confirmation');
    expect(sendStub.secondCall.args[0].ConfigurationSetName).toEqual('default');
    expect(sendStub.secondCall.args[0].Destinations.length).to.equal(50);
    expect(sendStub.secondCall.args[0].Destinations[0]).to.deep.equal({
      Destination: { ToAddresses: ['user50@friskygirlfarm.com'] },
      ReplacementTemplateData: JSON.stringify({
        pickupInstructions: 'Get it before the elk do!',
      }),
    });
    expect(sendStub.secondCall.args[0].Destinations[1]).to.deep.equal({
      Destination: { ToAddresses: ['user51@friskygirlfarm.com'] },
      ReplacementTemplateData: JSON.stringify({
        pickupInstructions:
          'Come for the veggies, stay for the neighborhood character',
      }),
    });
    expect(sendStub.secondCall.args[0].Destinations[48]).to.deep.equal({
      Destination: { ToAddresses: ['user98@friskygirlfarm.com'] },
      ReplacementTemplateData: JSON.stringify({
        pickupInstructions: 'Get it before the elk do!',
      }),
    });
    expect(sendStub.secondCall.args[0].Destinations[49]).to.deep.equal({
      Destination: { ToAddresses: ['user99@friskygirlfarm.com'] },
      ReplacementTemplateData: JSON.stringify({
        pickupInstructions:
          'Come for the veggies, stay for the neighborhood character',
      }),
    });

    expect(sendStub.thirdCall.args[0].Source).toEqual(
      'friskygirlfarm@gmail.com',
    );
    expect(sendStub.thirdCall.args[0].Template).toEqual('order_confirmation');
    expect(sendStub.thirdCall.args[0].ConfigurationSetName).toEqual('default');
    expect(sendStub.thirdCall.args[0].Destinations).toEqual([
      {
        Destination: { ToAddresses: ['user100@friskygirlfarm.com'] },
        ReplacementTemplateData: JSON.stringify({
          pickupInstructions: 'Get it before the elk do!',
        }),
      },
      {
        Destination: { ToAddresses: ['user101@friskygirlfarm.com'] },
        ReplacementTemplateData: JSON.stringify({
          pickupInstructions:
            'Come for the veggies, stay for the neighborhood character',
        }),
      },
    ]);
  });

  test('handles errors when chunking users', async function () {
    let users: User[] = [];
    for (let i = 0; i < 102; i++) {
      users.push({
        email: `user${i}@friskygirlfarm.com`,
        location: i % 2 ? 'Wallingford' : 'North Bend',
        name: `User ${i}`,
        balance: 0,
      });
    }

    sinon.stub(console, 'error');

    sendStub.onFirstCall().resolves({
      Status: users.slice(0, 50).map((_user, i) => ({
        Status: [3, 25].includes(i) ? 'MessageRejected' : 'Success',
      })),
    });
    sendStub.onSecondCall().rejects();
    sendStub.onThirdCall().resolves({
      Status: users.slice(100).map(() => ({ Status: 'Success' })),
    });

    await expect(
      sendConfirmationEmails(awsFactory, users, locations),
    ).resolves.toEqual([
      'user3@friskygirlfarm.com',
      'user25@friskygirlfarm.com',
      ...users
        .slice(50, 100)
        .map((_user, i) => `user${i + 50}@friskygirlfarm.com`),
    ]);
  });
});
