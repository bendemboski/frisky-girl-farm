#!/bin/bash

mkdir -p ~/.aws
echo "decrypting credentials..."
openssl aes-256-cbc -K $encrypted_bf8918a92040_key -iv $encrypted_bf8918a92040_iv -in ci/aws-credentials.enc -out ~/.aws/credentials -d
echo "deploying..."
yarn deploy
