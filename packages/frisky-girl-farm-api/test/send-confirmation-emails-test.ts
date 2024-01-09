import './support/setup';
import { expect } from 'chai';
import sinon, { SinonStub } from 'sinon';
import sendConfirmationEmails from '../src/send-confirmation-emails';
import type { User } from '../src/types';
import type { SES } from 'aws-sdk';

describe('sendConfirmationEmails', function () {
  let sendStub: SinonStub<
    [SES.Types.SendBulkTemplatedEmailRequest],
    ReturnType<SES['sendBulkTemplatedEmail']>
  >;

  beforeEach(function () {
    sendStub = sinon.stub();
  });

  afterEach(function () {
    sinon.restore();
  });

  class SESStub {
    sendBulkTemplatedEmail(request: SES.Types.SendBulkTemplatedEmailRequest) {
      return { promise: () => sendStub(request) };
    }
  }
  const awsFactory = () =>
    ({ SES: SESStub }) as unknown as typeof import('aws-sdk');

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

  it('works', async function () {
    sendStub.resolves({
      Status: [
        { Status: 'Success' },
        { Status: 'Success' },
        { Status: 'Success' },
      ],
    });

    await expect(
      sendConfirmationEmails(awsFactory, users, locations),
    ).to.eventually.deep.equal([]);
    expect(sendStub).to.have.been.calledOnce;
    expect(sendStub).to.have.been.calledWithMatch({
      Source: 'friskygirlfarm@gmail.com',
      Template: 'order_confirmation',
      ConfigurationSetName: 'default',
      Destinations: [
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
      ],
    });
  });

  it('reports individual errors', async function () {
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
    ).to.eventually.deep.equal([
      'ashley@friskygirlfarm.com',
      'ellen@friskygirlfarm.com',
    ]);
  });

  it('reports api errors', async function () {
    sendStub.rejects();

    sinon.stub(console, 'error');
    await expect(
      sendConfirmationEmails(awsFactory, users, locations),
    ).to.eventually.deep.equal([
      'ashley@friskygirlfarm.com',
      'ellen@friskygirlfarm.com',
      'herbie@friskygirlfarm.com',
    ]);
  });

  it('chunks users', async function () {
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
    ).to.eventually.deep.equal([]);
    expect(sendStub).to.have.been.calledThrice;

    expect(sendStub.firstCall).to.have.been.calledWithMatch({
      Source: 'friskygirlfarm@gmail.com',
      Template: 'order_confirmation',
      ConfigurationSetName: 'default',
    });
    expect(sendStub.firstCall.args[0].Destinations.length).to.equal(50);
    expect(sendStub.firstCall.args[0].Destinations[0]).to.deep.equal({
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

    expect(sendStub.secondCall).to.have.been.calledWithMatch({
      Source: 'friskygirlfarm@gmail.com',
      Template: 'order_confirmation',
      ConfigurationSetName: 'default',
    });
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

    expect(sendStub.thirdCall).to.have.been.calledWithMatch({
      Source: 'friskygirlfarm@gmail.com',
      Template: 'order_confirmation',
      ConfigurationSetName: 'default',
      Destinations: [
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
      ],
    });
  });

  it('handles errors when chunking users', async function () {
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
    ).to.eventually.deep.equal([
      'user3@friskygirlfarm.com',
      'user25@friskygirlfarm.com',
      ...users
        .slice(50, 100)
        .map((_user, i) => `user${i + 50}@friskygirlfarm.com`),
    ]);
  });
});
