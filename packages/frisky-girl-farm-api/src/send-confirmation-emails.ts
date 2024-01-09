import type { AWSFactory } from './build-app';
import type { Location } from './sheets/locations-sheet';
import type { User } from './types';

/**
 * Send confirmation emails to a set of users, customized by their location.
 * This uses our SES template and configuration set
 */
export default async function sendConfirmationEmails(
  awsFactory: AWSFactory,
  users: ReadonlyArray<User>,
  locations: ReadonlyArray<Location>,
) {
  // Split the users into chunks of 50 -- the maximum number of destinations
  // SES will let us send to at once
  let userChunks = [];
  for (let i = 0; i < users.length; i += 50) {
    userChunks.push(users.slice(i, i + 50));
  }

  // Build a map from location name to pickup instructions
  let pickupInstructionsByLocation: Record<string, string> = {};
  for (let location of locations) {
    pickupInstructionsByLocation[location.name] = location.pickupInstructions;
  }

  // Send the email, filling in the location-specific pickup instructions as
  // template replacement data
  let aws = awsFactory();
  let ses = new aws.SES();

  let failedSends = [];
  for (let chunk of userChunks) {
    try {
      let { Status: statuses } = await ses
        .sendBulkTemplatedEmail({
          Source: 'friskygirlfarm@gmail.com',
          Template: 'order_confirmation',
          ConfigurationSetName: 'default',
          Destinations: chunk.map((user) => ({
            Destination: {
              ToAddresses: [user.email],
            },
            ReplacementTemplateData: JSON.stringify({
              pickupInstructions: pickupInstructionsByLocation[user.location],
            }),
          })),
          DefaultTemplateData: JSON.stringify({
            pickupInstructions:
              'Please contact Ashley and Ellen for pickup instructions.',
          }),
        })
        .promise();

      for (let i = 0; i < statuses.length; i++) {
        let status = statuses[i];
        if (status.Status !== 'Success') {
          let email = chunk[i].email;
          console.error(
            'Failed to send to user',
            email,
            JSON.stringify(status),
          );
          failedSends.push(email);
        }
      }
    } catch (e) {
      console.error('Failed to send bulk templated email', e);
      failedSends.push(...chunk.map((user) => user.email));
    }
  }

  return failedSends;
}
